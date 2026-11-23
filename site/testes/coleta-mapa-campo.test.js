import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { createMarlinLink, lerPosicao } from "../experimentos/09-mapa-campo-espiras/coleta-marlin.js";
import { createSensorLink, lerMedida } from "../experimentos/09-mapa-campo-espiras/coleta-sensor.js";
import {
  cabecalhoCsv, cantosDaGrade, conferirLimites, executarPassada, linhaCsv, paraEixosDaImpressora,
  planejarVarredura, valoresDaFaixa,
} from "../experimentos/09-mapa-campo-espiras/coleta-varredura.js";

test("Marlin: o comando só termina no ok e devolve as linhas antes dele", async () => {
  const enviados = [];
  const marlin = createMarlinLink(async (texto) => enviados.push(texto));
  const resposta = marlin.enviar("M114 ; posição");
  marlin.receber("X:10.00 Y:127.00 Z:145.00 E:0.00 Count X: 800 Y:10160 Z:116000");
  marlin.receber("ok");
  const linhas = await resposta;
  assert.deepEqual(enviados, ["M114\n"]);
  assert.deepEqual(lerPosicao(linhas), { x: 10, y: 127, z: 145 });
});

test("Marlin: segundo comando só é enviado depois do ok do primeiro", async () => {
  const enviados = [];
  const marlin = createMarlinLink(async (texto) => enviados.push(texto.trim()));
  const primeiro = marlin.enviar("G1 X10");
  const segundo = marlin.enviar("M400");
  await Promise.resolve();
  assert.deepEqual(enviados, ["G1 X10"]);
  marlin.receber("ok");
  await primeiro;
  await Promise.resolve();
  assert.deepEqual(enviados, ["G1 X10", "M400"]);
  marlin.receber("ok");
  await segundo;
});

test("Marlin: mensagens de ocupado durante um movimento longo não viram erro de tempo", async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const marlin = createMarlinLink(async () => {}, { prazoMs: 5000 });
    const resposta = marlin.enviar("M400");
    await Promise.resolve();
    for (let i = 0; i < 6; i++) {
      mock.timers.tick(4000);
      marlin.receber("echo:busy: processing");
    }
    marlin.receber("ok");
    assert.deepEqual(await resposta, ["echo:busy: processing", "echo:busy: processing", "echo:busy: processing",
      "echo:busy: processing", "echo:busy: processing", "echo:busy: processing"]);

    const silencio = marlin.enviar("M400");
    await Promise.resolve();
    mock.timers.tick(5001);
    await assert.rejects(silencio, /não respondeu/);
  } finally {
    mock.timers.reset();
  }
});

// Falha que pega: depois de um comando sem resposta, o "ok" atrasado confirmava o comando seguinte
// (um M400 confirmado cedo faz medir com a cabeça andando).
test("Marlin: depois de um comando sem resposta, o ok atrasado não confirma o próximo", async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const enviados = [];
    const marlin = createMarlinLink(async (texto) => enviados.push(texto.trim()), { prazoMs: 1000 });
    const perdido = marlin.enviar("G1 X10");
    const seguinte = marlin.enviar("M400");
    await Promise.resolve();
    mock.timers.tick(1001);
    await assert.rejects(perdido, /não respondeu/);
    await assert.rejects(seguinte, /sincronia/);
    marlin.receber("ok");
    await assert.rejects(marlin.enviar("M400"), /sincronia/);
    assert.deepEqual(enviados, ["G1 X10"], "nada mais é enviado depois da perda de sincronia");
    assert.equal(marlin.foraDeSincronia(), true);
  } finally {
    mock.timers.reset();
  }
});

// Falha que pega: qualquer linha renovava o prazo. Com a porta da ESP32 escolhida como impressora, as leituras
// que ela manda sem parar ("frente_uT:..." a cada 200 ms) mantinham o M114 esperando para sempre.
// O prazo do teste faz a regressão falhar em vez de deixar o teste preso esperando.
test("Marlin: só as mensagens de ocupado renovam o prazo; outras linhas não", { timeout: 2000 }, async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const marlin = createMarlinLink(async () => {}, { prazoMs: 5000 });
    const resposta = marlin.enviar("M114");
    await Promise.resolve();
    for (let i = 0; i < 6; i++) {
      mock.timers.tick(1000);
      marlin.receber("frente_uT:1.20 esquerda_uT:-3.40 cima_uT:20.10 total_uT:20.42");
    }
    await assert.rejects(resposta, /não respondeu a "M114"/);
    assert.equal(marlin.foraDeSincronia(), true);
  } finally {
    mock.timers.reset();
  }
});

test("Marlin: movimento recusado por falta de home rejeita, mesmo com o ok depois", async () => {
  const marlin = createMarlinLink(async () => {});
  const resposta = marlin.enviar("G1 X10 Y10 Z40");
  marlin.receber("echo:Home XYZ First");
  marlin.receber("ok");
  await assert.rejects(resposta, /recusou/);
});

test("Marlin: comando desconhecido ou erro rejeita, mesmo com o ok depois", async () => {
  const marlin = createMarlinLink(async () => {});
  const resposta = marlin.enviar("G1 X99999");
  marlin.receber("echo:Unknown command: \"G1 X99999\"");
  marlin.receber("ok");
  await assert.rejects(resposta, /recusou/);
});

test("sensor: a medida chega já separada por eixo, e erro do sensor rejeita", async () => {
  assert.equal(lerMedida("frente_uT:1.0 esquerda_uT:2.0"), null);
  assert.equal(lerMedida("med,16,1.5,,30.1,0.4,0.4,0.5"), null, "campo vazio não vira zero");
  assert.equal(lerMedida("med,1,1.5,2.0,30.1,0,0,0"), null, "uma leitura só não dá desvio");
  const enviados = [];
  const sensor = createSensorLink(async (texto) => enviados.push(texto));
  const medida = sensor.medir(16);
  sensor.receber("obs: algo");
  sensor.receber("med,16,1.500,-2.250,30.125,0.400,0.410,0.520");
  assert.deepEqual(await medida, { n: 16, frente: 1.5, esquerda: -2.25, cima: 30.125, sFrente: 0.4, sEsquerda: 0.41, sCima: 0.52 });
  assert.deepEqual(enviados, ["r16\n"]);
  const falha = sensor.medir(16);
  sensor.receber("erro,leitura");
  await assert.rejects(falha, /não conseguiu medir/);
});

// Falha que pega: depois do prazo esgotado de um r16, a medida seguinte aceitava a resposta atrasada da
// anterior, que é o campo de outro ponto.
test("sensor: depois de uma medida sem resposta, a resposta atrasada não vale para a seguinte", async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const enviados = [];
    const sensor = createSensorLink(async (texto) => enviados.push(texto));
    const perdida = sensor.medir(16);
    mock.timers.tick(3000 + 16 * 200 + 1);
    await assert.rejects(perdida, /não respondeu/);
    assert.equal(sensor.foraDeSincronia(), true);
    const seguinte = sensor.medir(16);
    sensor.receber("med,16,1.500,-2.250,30.125,0.400,0.410,0.520");
    await assert.rejects(seguinte, /sincronia/);
    assert.deepEqual(enviados, ["r16\n"], "nada mais é pedido à placa depois da perda de sincronia");
  } finally {
    mock.timers.reset();
  }
});

// Falha que pega: campo vazio virava NaN, passava pela conferência e ia para o Marlin como "G1 XNaN".
test("campo vazio ou não numérico é recusado antes de chegar à impressora", () => {
  assert.throws(() => valoresDaFaixa({ min: Number(""), max: NaN, passo: 10 }), /preencha/);
  assert.throws(() => planejarVarredura({ x: { min: 0, max: 10, passo: 10 }, y: { min: 0, max: 0, passo: 1 }, alturas: [] }), /altura/);
  const problemas = conferirLimites([{ tipo: "ponto", x: NaN, y: 0, z: 20 }], { X0: 100, Y0: 100, Z0: 50, h0: 30 });
  assert.ok(problemas.some((p) => /não é número/.test(p)));
});

test("referência visitada a cada N linhas, sempre na primeira e no fim", () => {
  const passos = planejarVarredura({
    x: { min: 0, max: 10, passo: 10 }, y: { min: 0, max: 30, passo: 10 }, alturas: [20],
    referencia: { x: -100, y: -100, z: 150 }, referenciaACadaLinhas: 2,
  });
  const linhasComRef = [];
  passos.forEach((p, i) => { if (p.tipo === "ref" && i + 1 < passos.length) linhasComRef.push(passos[i + 1].y); });
  assert.deepEqual(linhasComRef, [0, 20]);
  assert.equal(passos.at(-1).tipo, "ref");
});

test("faixa inclusiva: de -120 a 120 de 10 em 10 dá 25 valores, com passo fracionário sem perder o último", () => {
  const valores = valoresDaFaixa({ min: -120, max: 120, passo: 10 });
  assert.equal(valores.length, 25);
  assert.equal(valores.at(-1), 120);
  assert.equal(valoresDaFaixa({ min: 0, max: 1, passo: 0.1 }).length, 11);
});

test("plano: zigue-zague, referência no começo de cada linha e no fim, alturas crescentes", () => {
  const passos = planejarVarredura({
    x: { min: 0, max: 20, passo: 10 }, y: { min: 0, max: 10, passo: 10 }, alturas: [50, 20],
    referencia: { x: -100, y: -100, z: 150 },
  });
  const pontos = passos.filter((p) => p.tipo === "ponto");
  assert.equal(pontos.length, 3 * 2 * 2);
  assert.equal(passos.filter((p) => p.tipo === "ref").length, 2 * 2 + 1);
  assert.deepEqual(passos.slice(0, 8).map((p) => p.tipo === "ref" ? "ref" : `${p.x},${p.y},${p.z}`),
    ["ref", "0,0,20", "10,0,20", "20,0,20", "ref", "20,10,20", "10,10,20", "0,10,20"]);
  assert.equal(passos.at(-1).tipo, "ref");
});

test("limites: ponto fora do curso da mesa ou baixo demais é apontado antes de começar", () => {
  const calibracao = { X0: 120, Y0: 120, Z0: 130, h0: 30 };
  const passos = planejarVarredura({ x: { min: -130, max: 0, passo: 130 }, y: { min: 0, max: 0, passo: 1 }, alturas: [10] });
  const problemas = conferirLimites(passos, calibracao, { alturaMinima: 15 });
  assert.ok(problemas.some((p) => p.includes("X = -10.0")));
  assert.ok(problemas.some((p) => p.includes("altura 10 mm")));
});

// Falha que pega: com x de -110 a 115 de 10 em 10, a grade termina em 110, mas os cantos iam ao máximo digitado
// (115); com X0 = 126 isso mandava X 241 a uma impressora de 240 mm de curso.
test("cantos: os da grade de fato percorrida, sem a referência, na menor altura", () => {
  const passos = planejarVarredura({
    x: { min: -110, max: 115, passo: 10 }, y: { min: -110, max: 110, passo: 10 }, alturas: [50, 20],
    referencia: { x: -120, y: -120, z: 180 },
  });
  const cantos = cantosDaGrade(passos);
  assert.deepEqual(cantos.map((c) => [c.x, c.y, c.z]), [[-110, -110, 20], [110, -110, 20], [110, 110, 20], [-110, 110, 20]]);
  assert.deepEqual(conferirLimites(cantos, { X0: 126, Y0: 120, Z0: 100, h0: 30 }), []);
});

test("eixos: a caneta virada leva cada componente para o eixo certo da impressora, com sinal", () => {
  const medida = { frente: 1, esquerda: 2, cima: 3, sFrente: 0.1, sEsquerda: 0.2, sCima: 0.3 };
  assert.deepEqual(paraEixosDaImpressora(medida, { frente: "+Y", esquerda: "-X", cima: "+Z" }),
    { bx: -2, by: 1, bz: 3, sx: 0.2, sy: 0.1, sz: 0.3 });
  assert.throws(() => paraEixosDaImpressora(medida, { frente: "+X", esquerda: "-X", cima: "+Z" }), /Dois eixos/);
});

// Impressora de mentira que guarda a posição e responde ao M114 como o Marlin (posição projetada).
// `recusar` simula a impressora sem home: o movimento não acontece e chega "echo:Home XYZ First".
function marlinFalso({ recusar = false, inicio = { x: 0, y: 0, z: 0 } } = {}) {
  const posicao = { ...inicio };
  const comandos = [];
  let relativo = false;
  return {
    comandos,
    posicao,
    enviar: async (texto) => {
      comandos.push(texto);
      if (texto === "G90") relativo = false;
      if (texto === "G91") relativo = true;
      if (texto === "M114") return [`X:${posicao.x.toFixed(2)} Y:${posicao.y.toFixed(2)} Z:${posicao.z.toFixed(2)} E:0.00 Count X:0 Y:0 Z:0`];
      if (/^G1 /.test(texto) && !recusar) {
        for (const eixo of ["X", "Y", "Z"]) {
          const encontrado = new RegExp(`${eixo}(-?\\d+(?:\\.\\d+)?)`).exec(texto);
          if (encontrado) {
            const chave = eixo.toLowerCase();
            posicao[chave] = relativo ? posicao[chave] + Number(encontrado[1]) : Number(encontrado[1]);
          }
        }
      }
      return [];
    },
  };
}

function sensorFalso(comandos) {
  return {
    medir: async () => {
      comandos?.push("MEDIR");
      return { n: 16, frente: 5, esquerda: 0, cima: -1, sFrente: 0.4, sEsquerda: 0.4, sCima: 0.5 };
    },
  };
}

test("passada: sobe antes do primeiro ponto, espera o movimento e só então mede; parar e retomar", async () => {
  const marlin = marlinFalso({ inicio: { x: 10, y: 10, z: 30 } });
  const sensor = sensorFalso(marlin.comandos);
  const passos = planejarVarredura({ x: { min: -10, max: 10, passo: 10 }, y: { min: 0, max: 0, passo: 1 }, alturas: [20] });
  const registros = [];
  let agora = 1000;
  const comum = {
    passos, passada: "ligada", calibracao: { X0: 100, Y0: 100, Z0: 50, h0: 30 },
    mapeamento: { frente: "+X", esquerda: "+Y", cima: "+Z" }, marlin, sensor, pausaMs: 300, velocidadeMmMin: 3000,
    relogio: () => (agora += 500), aoMedir: (r) => registros.push(r),
  };
  const primeira = await executarPassada({
    ...comum, inicioDaPassadaMs: 1000,
    controle: { parar: () => registros.length >= 2, esperarSePausado: async () => {} },
  });
  assert.deepEqual(primeira, { estado: "parada", proximo: 2 });
  // Cabeça em Z 30, primeiro ponto em Z 40: sobe para 40 antes de andar em XY.
  assert.deepEqual(marlin.comandos.slice(0, 10), [
    "G90", "M400", "M114", "G1 Z40.00 F3000", "G1 X90.00 Y100.00 F3000", "G1 X90.00 Y100.00 Z40.00 F3000",
    "M400", "M114", "G4 P300", "MEDIR",
  ]);
  const segunda = await executarPassada({ ...comum, inicio: 2, inicioDaPassadaMs: 1000 });
  assert.deepEqual(segunda, { estado: "concluida", proximo: 3 });
  assert.deepEqual(registros.map((r) => r.x), [-10, 0, 10]);
  assert.ok(registros[2].t_s > registros[1].t_s, "o tempo continua contando depois de retomar");
  assert.equal(registros[0].bx, 5);
  assert.equal(registros[0].bz, -1);
});

// Falha que pega: impressora reconectada sem home recusa o movimento (e responde "ok"); a passada
// "terminava" medindo sempre no mesmo lugar.
test("passada: movimento recusado interrompe antes de medir no lugar errado", async () => {
  const marlin = marlinFalso({ recusar: true });
  const sensor = sensorFalso();
  const passos = planejarVarredura({ x: { min: 0, max: 10, passo: 10 }, y: { min: 0, max: 0, passo: 1 }, alturas: [20] });
  const registros = [];
  await assert.rejects(executarPassada({
    passos, passada: "desligada", calibracao: { X0: 100, Y0: 100, Z0: 50, h0: 30 },
    mapeamento: { frente: "+X", esquerda: "+Y", cima: "+Z" }, marlin, sensor, aoMedir: (r) => registros.push(r),
  }), /não foi para X 100\.00/);
  assert.equal(registros.length, 0);
});

// Falha que pega: Parar e depois Pausar durante uma medida; a passada esperava a pausa antes de olhar a parada
// e ficava presa esperando um "Continuar" que não vinha.
test("passada: com Parar e depois Pausar durante uma medida, a passada para em vez de esperar a pausa", { timeout: 2000 }, async () => {
  const marlin = marlinFalso();
  const passos = planejarVarredura({ x: { min: 0, max: 20, passo: 10 }, y: { min: 0, max: 0, passo: 1 }, alturas: [20] });
  let pararPedido = false;
  let pausado = false;
  const resultado = await executarPassada({
    passos, passada: "desligada", calibracao: { X0: 100, Y0: 100, Z0: 50, h0: 30 },
    mapeamento: { frente: "+X", esquerda: "+Y", cima: "+Z" }, marlin, sensor: sensorFalso(),
    aoMedir: () => {
      pararPedido = true;
      pausado = true;
    },
    controle: {
      parar: () => pararPedido,
      esperarSePausado: () => (pausado ? new Promise(() => {}) : Promise.resolve()),
    },
  });
  assert.deepEqual(resultado, { estado: "parada", proximo: 1 });
});

test("CSV: cabeçalho com metadados e linhas no formato mapa-campo v1", () => {
  const texto = cabecalhoCsv({ geometria: "circulo", dimensao_mm: 150, voltas: 20, corrente_A: "1.000", observacao: "" }) +
    linhaCsv({ passada: "ligada", tipo: "ponto", t_s: 2.94, x: -120, y: -120, z: 20, bx: 11.0234, by: -14.8, bz: -26.1, sx: 0.43, sy: 0.4, sz: 0.49, n: 16 });
  assert.equal(texto,
    "# formato: mapa-campo v1\n# geometria: circulo\n# dimensao_mm: 150\n# voltas: 20\n# corrente_A: 1.000\n" +
    "passada,tipo,t_s,x_mm,y_mm,z_mm,bx_uT,by_uT,bz_uT,sx_uT,sy_uT,sz_uT,n\n" +
    "ligada,ponto,2.9,-120.0,-120.0,20.0,11.023,-14.800,-26.100,0.430,0.400,0.490,16");
});
