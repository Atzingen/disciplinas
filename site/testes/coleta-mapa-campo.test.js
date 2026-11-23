import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { createMarlinLink, lerPosicao } from "../experimentos/09-mapa-campo-espiras/coleta-marlin.js";
import { createSensorLink, lerMedida } from "../experimentos/09-mapa-campo-espiras/coleta-sensor.js";
import {
  cabecalhoCsv, conferirLimites, executarPassada, linhaCsv, paraEixosDaImpressora, planejarVarredura,
  valoresDaFaixa,
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

test("Marlin: comando desconhecido ou erro rejeita, mesmo com o ok depois", async () => {
  const marlin = createMarlinLink(async () => {});
  const resposta = marlin.enviar("G1 X99999");
  marlin.receber("echo:Unknown command: \"G1 X99999\"");
  marlin.receber("ok");
  await assert.rejects(resposta, /recusou/);
});

test("sensor: a medida chega já separada por eixo, e erro do sensor rejeita", async () => {
  assert.equal(lerMedida("frente_uT:1.0 esquerda_uT:2.0"), null);
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

test("eixos: a caneta virada leva cada componente para o eixo certo da impressora, com sinal", () => {
  const medida = { frente: 1, esquerda: 2, cima: 3, sFrente: 0.1, sEsquerda: 0.2, sCima: 0.3 };
  assert.deepEqual(paraEixosDaImpressora(medida, { frente: "+Y", esquerda: "-X", cima: "+Z" }),
    { bx: -2, by: 1, bz: 3, sx: 0.2, sy: 0.1, sz: 0.3 });
  assert.throws(() => paraEixosDaImpressora(medida, { frente: "+X", esquerda: "-X", cima: "+Z" }), /Dois eixos/);
});

test("passada: anda para a posição da impressora, espera o movimento e só então mede; parar e retomar", async () => {
  const comandos = [];
  const marlin = { enviar: async (texto) => { comandos.push(texto); return []; } };
  let medidas = 0;
  const sensor = { medir: async () => { medidas++; comandos.push("MEDIR"); return { n: 16, frente: 5, esquerda: 0, cima: -1, sFrente: 0.4, sEsquerda: 0.4, sCima: 0.5 }; } };
  const passos = planejarVarredura({ x: { min: -10, max: 10, passo: 10 }, y: { min: 0, max: 0, passo: 1 }, alturas: [20] });
  const registros = [];
  let pararDepois = 2;
  let agora = 1000;
  const comum = {
    passos, passada: "ligada", calibracao: { X0: 100, Y0: 100, Z0: 50, h0: 30 },
    mapeamento: { frente: "+X", esquerda: "+Y", cima: "+Z" }, marlin, sensor, pausaMs: 300, velocidadeMmMin: 3000,
    relogio: () => (agora += 500), aoMedir: (r) => registros.push(r),
  };
  const primeira = await executarPassada({
    ...comum, inicioDaPassadaMs: 1000,
    controle: { parar: () => registros.length >= pararDepois, esperarSePausado: async () => {} },
  });
  assert.deepEqual(primeira, { estado: "parada", proximo: 2 });
  assert.deepEqual(comandos.slice(0, 4), ["G1 X90.00 Y100.00 Z40.00 F3000", "M400", "G4 P300", "MEDIR"]);
  const segunda = await executarPassada({ ...comum, inicio: 2, inicioDaPassadaMs: 1000 });
  assert.deepEqual(segunda, { estado: "concluida", proximo: 3 });
  assert.equal(medidas, 3);
  assert.deepEqual(registros.map((r) => r.x), [-10, 0, 10]);
  assert.ok(registros[2].t_s > registros[1].t_s, "o tempo continua contando depois de retomar");
  assert.equal(registros[0].bx, 5);
  assert.equal(registros[0].bz, -1);
});

test("CSV: cabeçalho com metadados e linhas no formato mapa-campo v1", () => {
  const texto = cabecalhoCsv({ geometria: "circulo", dimensao_mm: 150, voltas: 20, corrente_A: "1.000", observacao: "" }) +
    linhaCsv({ passada: "ligada", tipo: "ponto", t_s: 2.94, x: -120, y: -120, z: 20, bx: 11.0234, by: -14.8, bz: -26.1, sx: 0.43, sy: 0.4, sz: 0.49, n: 16 });
  assert.equal(texto,
    "# formato: mapa-campo v1\n# geometria: circulo\n# dimensao_mm: 150\n# voltas: 20\n# corrente_A: 1.000\n" +
    "passada,tipo,t_s,x_mm,y_mm,z_mm,bx_uT,by_uT,bz_uT,sx_uT,sy_uT,sz_uT,n\n" +
    "ligada,ponto,2.9,-120.0,-120.0,20.0,11.023,-14.800,-26.100,0.430,0.400,0.490,16");
});
