import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { fitCoil } from "../experimentos/09-mapa-campo-espiras/ajuste-mapa.js";
import { EXEMPLO, generateExampleCsv } from "../experimentos/09-mapa-campo-espiras/dados-exemplo.js";
import { mergeMapFiles, parseMapFile } from "../experimentos/09-mapa-campo-espiras/formato-mapa.js";
import {
  axisFieldCircle, axisFieldSquare, coilPath, createModel, pathField, segmentField,
} from "../experimentos/09-mapa-campo-espiras/modelo-biot-savart.js";
import { pairPasses, processMap } from "../experimentos/09-mapa-campo-espiras/processamento-mapa.js";

const CABECALHO = "passada,tipo,t_s,x_mm,y_mm,z_mm,bx_uT,by_uT,bz_uT,sx_uT,sy_uT,sz_uT,n";

function linha(passada, tipo, t, [x, y, z], [bx, by, bz], s = 0.4, n = 16) {
  return [passada, tipo, t, x, y, z, bx, by, bz, s, s, s, n].join(",");
}

function arquivo(nome, metadados, linhas) {
  const topo = Object.entries(metadados).map(([chave, valor]) => `# ${chave}: ${valor}`);
  return parseMapFile([...topo, CABECALHO, ...linhas].join("\n"), nome);
}

function closeTo(real, esperado, tolerancia, mensagem) {
  assert.ok(Math.abs(real - esperado) <= tolerancia, `${mensagem}: ${real} ≠ ${esperado} ± ${tolerancia}`);
}

test("leitura separa metadados, comentários e linhas de dados", () => {
  const texto = [
    "﻿# formato: mapa-campo v1",
    "# geometria: Quadrado",
    "# dimensao_mm: 150",
    "# corrente_A: 1.000",
    "# data: 2026-11-24T14:30:00-03:00",
    "# observacao: bobina nova: segunda tentativa",
    "# comentário solto sem chave",
    CABECALHO,
    "# comentário depois do cabeçalho: não é metadado",
    linha("desligada", "ref", 0, [-120, -120, 180], [12.1, -15.3, -28.4]),
    "",
    "ligada,ponto,2.9,-120.0,-120.0,20.0,11.02,-14.80,-26.10,0.43,0.40,0.49,16\r",
  ].join("\n");
  const lido = parseMapFile(texto, "a.csv");

  assert.equal(lido.erro, null);
  assert.deepEqual(lido.avisos, []);
  assert.equal(lido.metadados.geometria, "quadrado");
  assert.equal(lido.metadados.dimensao_mm, 150);
  assert.equal(lido.metadados.corrente_A, 1);
  assert.equal(lido.metadados.data, "2026-11-24T14:30:00-03:00");
  assert.equal(lido.metadados.observacao, "bobina nova: segunda tentativa");
  assert.equal(lido.linhas.length, 2);
  assert.deepEqual(
    [lido.linhas[1].passada, lido.linhas[1].tipo, lido.linhas[1].z_mm, lido.linhas[1].bz_uT, lido.linhas[1].n],
    ["ligada", "ponto", 20, -26.1, 16],
  );
});

test("leitura avisa e ignora linhas defeituosas e rejeita arquivo sem colunas", () => {
  const lido = parseMapFile([
    "# formato: mapa-campo v1",
    CABECALHO,
    linha("ligada", "ponto", 1, [0, 0, 20], [1, 2, 3]),
    "ligada,ponto,2,0,0,30,1,2",
    linha("ligada", "ponto", 3, [0, 0, 40], ["x", 2, 3]),
    linha("meio", "ponto", 4, [0, 0, 50], [1, 2, 3]),
  ].join("\n"), "b.csv");
  assert.equal(lido.linhas.length, 1);
  assert.equal(lido.avisos.length, 3);
  assert.match(lido.avisos[0], /linha 4: 8 campos/);

  const semColuna = parseMapFile("passada,tipo,t_s,x_mm,y_mm,z_mm,bx_uT,by_uT,bz_uT,n\n", "c.csv");
  assert.match(semColuna.erro, /faltam as colunas sx_uT, sy_uT, sz_uT/);
});

test("arquivos separados se juntam, pareiam por posição e apontam pares faltando", () => {
  const meta = { formato: "mapa-campo v1", geometria: "circulo", dimensao_mm: 150, voltas: 20 };
  const desligada = arquivo("desligada.csv", { ...meta, data: "2026-11-24T10:00" }, [
    linha("desligada", "ponto", 0, [0, 0, 20], [10, 20, 30]),
    linha("desligada", "ponto", 3, [10, 0, 20], [10, 20, 30]),
    linha("desligada", "ponto", 6, [20, 0, 20], [10, 20, 30]),
  ]);
  // Mesmas posições com ruído de 0,04 mm e colunas em outra ordem.
  const ligadaTexto = [
    "# formato: mapa-campo v1",
    "# geometria: circulo",
    "# dimensao_mm: 160",
    "# data: 2026-11-24T13:00",
    "tipo,passada,t_s,x_mm,y_mm,z_mm,bx_uT,by_uT,bz_uT,sx_uT,sy_uT,sz_uT,n",
    "ponto,ligada,0,0.04,-0.04,20.03,11,22,63,0.4,0.4,0.4,16",
    "ponto,ligada,3,9.96,0,19.98,12,20,50,0.4,0.4,0.4,16",
    "ponto,ligada,9,30,0,20,10,20,31,0.4,0.4,0.4,16",
  ].join("\n");
  const juntado = mergeMapFiles([desligada, parseMapFile(ligadaTexto, "ligada.csv")]);

  assert.equal(juntado.linhas.length, 6);
  assert.equal(juntado.metadados.dimensao_mm, 150);
  assert.ok(juntado.avisos.some((aviso) => /dimensao_mm.*150.*160/.test(aviso)));
  assert.ok(juntado.avisos.some((aviso) => /mesma ordem/.test(aviso)));
  assert.ok(!juntado.avisos.some((aviso) => /"data"/.test(aviso)), "data pode mudar entre arquivos");

  const pareamento = pairPasses(juntado.linhas);
  assert.deepEqual(pareamento.pares.map((par) => [par.x, par.y, par.z]), [[0, 0, 20], [10, 0, 20]]);
  assert.deepEqual(pareamento.soDesligada.map((ponto) => ponto.x), [20]);
  assert.deepEqual(pareamento.soLigada.map((ponto) => ponto.x), [30]);

  const processado = processMap(juntado.linhas, { corrigirDeriva: false });
  assert.deepEqual(processado.pontos[0].delta.b, [1, 2, 33]);
  closeTo(processado.pontos[0].delta.u[2], Math.sqrt(2) * 0.4 / 4, 1e-12, "incerteza de ΔB");
});

// Sessão contínua: passada desligada e depois ligada, com o tempo de cada
// passada reiniciando em zero e uma deriva linear no tempo absoluto.
function sessionWithDrift({ posicaoDaRefLigada = [-100, -100, 150] } = {}) {
  const bobina = createModel({ geometria: "quadrado", dimensaoMm: 150, voltas: 20, correnteA: 1 });
  const fundo = (x, y, z) => [17 + 0.01 * x, 12 - 0.02 * y, 14 + 0.005 * z];
  const deriva = (t) => [0.002 * t, -0.0015 * t, 0.001 * t];
  const pontos = [];
  for (const z of [20, 60]) for (const y of [-40, 0, 40]) for (const x of [-40, 0, 40]) pontos.push([x, y, z]);
  const linhas = [];
  let tSessao = 0;
  for (const passada of ["desligada", "ligada"]) {
    let t = 0;
    const ref = passada === "ligada" ? posicaoDaRefLigada : [-100, -100, 150];
    const medir = (tipo, posicao) => {
      const base = fundo(...posicao);
      const extra = passada === "ligada" ? bobina(...posicao) : [0, 0, 0];
      const d = deriva(tSessao);
      linhas.push(linha(passada, tipo, t, posicao, base.map((valor, i) => valor + extra[i] + d[i])));
      t += 5;
      tSessao += 5;
    };
    pontos.forEach((posicao, i) => {
      if (i % 3 === 0) medir("ref", ref);
      medir("ponto", posicao);
    });
    medir("ref", ref);
    tSessao += 1800;
  }
  return { linhas: parseMapFile([CABECALHO, ...linhas].join("\n"), "deriva.csv").linhas, bobina };
}

test("correção de deriva faz sumir uma deriva linear sintética", () => {
  const { linhas, bobina } = sessionWithDrift();
  const corrigido = processMap(linhas, { corrigirDeriva: true, campoDaBobina: bobina });
  const cru = processMap(linhas, { corrigirDeriva: false });

  assert.deepEqual(corrigido.deriva.avisos, []);
  let maiorErroCru = 0;
  corrigido.pontos.forEach((ponto, i) => {
    const esperado = bobina(ponto.x, ponto.y, ponto.z);
    for (let eixo = 0; eixo < 3; eixo += 1) {
      closeTo(ponto.delta.b[eixo], esperado[eixo], 1e-9, `ΔB corrigido em ${ponto.chave}`);
      maiorErroCru = Math.max(maiorErroCru, Math.abs(cru.pontos[i].delta.b[eixo] - esperado[eixo]));
    }
  });
  assert.ok(maiorErroCru > 3, `sem correção a deriva deveria aparecer (${maiorErroCru} μT)`);
});

test("referência em posições diferentes corrige só a deriva dentro de cada passada", () => {
  const { linhas, bobina } = sessionWithDrift({ posicaoDaRefLigada: [100, 100, 150] });
  const processado = processMap(linhas, { corrigirDeriva: true, campoDaBobina: bobina });

  assert.ok(processado.deriva.avisos.some((aviso) => /mesma posição/.test(aviso)));
  assert.deepEqual(processado.deriva.salto, [0, 0, 0]);
  // Sem a deriva dentro das passadas, sobra um deslocamento constante.
  const diferencas = processado.pontos.map((ponto) => ponto.delta.b[0] - bobina(ponto.x, ponto.y, ponto.z)[0]);
  const media = diferencas.reduce((soma, valor) => soma + valor, 0) / diferencas.length;
  for (const valor of diferencas) closeTo(valor, media, 1e-9, "deslocamento constante");
});

test("modelo por segmentos reproduz as fórmulas do eixo e os valores de conferência", () => {
  const circulo20 = coilPath("circulo", 200);
  const quadrado20 = coilPath("quadrado", 200);
  closeTo(pathField(quadrado20, 0, 0, 0)[2], 5.657, 5e-4, "quadrado de 20 cm no centro");
  closeTo(pathField(circulo20, 0, 0, 0)[2], 6.283, 5e-4, "círculo de 20 cm no centro");
  closeTo(pathField(coilPath("quadrado", 150), 0, 0, 100)[2], 1.98, 5e-3, "quadrado de 15 cm a 10 cm");
  closeTo(pathField(coilPath("circulo", 150), 0, 0, 100)[2], 1.81, 5e-3, "círculo de 15 cm a 10 cm");

  for (const z of [0, 20, 50, 100, 180]) {
    const quadrado = createModel({ geometria: "quadrado", dimensaoMm: 150, voltas: 20, correnteA: 1 })(0, 0, z);
    const circulo = createModel({ geometria: "circulo", dimensaoMm: 150, voltas: 20, correnteA: 1 })(0, 0, z);
    closeTo(quadrado[2], axisFieldSquare(150, z, 20, 1), 1e-9, `quadrado no eixo, z = ${z}`);
    closeTo(circulo[2], axisFieldCircle(150, z, 20, 1), 1e-4 * circulo[2], `círculo no eixo, z = ${z}`);
    closeTo(Math.hypot(quadrado[0], quadrado[1]), 0, 1e-9, "sem componente horizontal no eixo");
  }

  // Segmento de 2 m ao longo de +x, ponto 10 mm acima do meio: B ao longo de −y,
  // com o módulo do fio finito μ0 I/(4π d) · 2L/√(L² + d²).
  const fio = segmentField([-1000, 0, 0], [1000, 0, 0], [0, 0, 10]);
  const esperadoFio = (1e-7 / 0.01) * (2 * 1000 / Math.hypot(1000, 10)) * 1e6;
  closeTo(fio[1], -esperadoFio, 1e-9, "segmento de 2 m a 1 cm, 1 A");
  closeTo(Math.hypot(fio[0], fio[2]), 0, 1e-12, "campo só ao longo de −y");

  // U com o lado aberto voltado para −Y: o campo é mais forte do lado da base (+Y).
  const u = createModel({ geometria: "u", dimensaoMm: 150, voltas: 1, correnteA: 1 });
  assert.ok(u(0, 60, 20)[2] > 2 * u(0, -60, 20)[2], "lado aberto do U em −Y");
});

function noisyModelData({ geometria, k, centro, ruido, semente = 7 }) {
  let estado = semente;
  const aleatorio = () => {
    estado = (estado * 16807) % 2147483647;
    return estado / 2147483647;
  };
  const gaussiano = () => Math.sqrt(-2 * Math.log(aleatorio())) * Math.cos(2 * Math.PI * aleatorio());
  const verdadeiro = createModel({ geometria, dimensaoMm: 150, voltas: 20, correnteA: 1, k, x0: centro[0], y0: centro[1], z0: centro[2] });
  const pontos = [];
  for (const z of [20, 40, 80, 140]) {
    for (let y = -120; y <= 120; y += 20) {
      for (let x = -120; x <= 120; x += 20) {
        const b = verdadeiro(x, y, z).map((valor) => valor + ruido * gaussiano());
        pontos.push({ x, y, z, delta: { b, u: [ruido, ruido, ruido] } });
      }
    }
  }
  return pontos;
}

test("ajuste recupera k e o centro da bobina a partir de dados com ruído", () => {
  const verdade = { k: 1.02, centro: [3, -2, 1.5] };
  const pontos = noisyModelData({ geometria: "quadrado", ...verdade, ruido: 0.16 });
  const ajuste = fitCoil(pontos, { geometria: "quadrado", dimensaoMm: 150, voltas: 20, correnteA: 1 });

  assert.equal(ajuste.convergiu, true);
  const desvios = {
    k: (ajuste.k - verdade.k) / ajuste.u.k,
    x0: (ajuste.x0 - verdade.centro[0]) / ajuste.u.x0,
    y0: (ajuste.y0 - verdade.centro[1]) / ajuste.u.y0,
    z0: (ajuste.z0 - verdade.centro[2]) / ajuste.u.z0,
  };
  for (const [nome, desvio] of Object.entries(desvios)) {
    assert.ok(Math.abs(desvio) < 4, `${nome} a ${desvio.toFixed(1)} desvios do valor verdadeiro`);
  }
  closeTo(ajuste.k, verdade.k, 0.003, "k");
  closeTo(ajuste.z0, verdade.centro[2], 0.1, "z0");
  closeTo(ajuste.chi2Reduzido, 1, 0.1, "χ²/ν com o ruído declarado");
  closeTo(ajuste.rms, 0.16, 0.02, "resíduo RMS igual ao ruído");
});

test("exemplo sintético atravessa leitura, correção de deriva e ajuste", () => {
  const juntado = mergeMapFiles([parseMapFile(generateExampleCsv(), "exemplo.csv")]);
  assert.deepEqual(juntado.avisos, []);
  let parametros = { geometria: "circulo", dimensaoMm: 150, voltas: 20, correnteA: 1, k: 1, x0: 0, y0: 0, z0: 0 };
  let processado;
  let ajuste;
  for (let rodada = 0; rodada < 2; rodada += 1) {
    processado = processMap(juntado.linhas, { corrigirDeriva: true, campoDaBobina: createModel(parametros) });
    ajuste = fitCoil(processado.pontos, parametros);
    parametros = { ...parametros, k: ajuste.k, x0: ajuste.x0, y0: ajuste.y0, z0: ajuste.z0 };
  }
  assert.equal(processado.pontos.length, 25 * 25 * 6);
  assert.deepEqual(processado.grade.z, EXEMPLO.grade.z);
  closeTo(processado.ruido.porLeitura, EXEMPLO.ruidoPorLeitura, 0.03, "ruído por leitura");
  closeTo(ajuste.k, EXEMPLO.k, 0.002, "k do exemplo");
  closeTo(ajuste.x0, EXEMPLO.x0, 0.05, "x0 do exemplo");
  closeTo(ajuste.y0, EXEMPLO.y0, 0.05, "y0 do exemplo");
  closeTo(ajuste.z0, EXEMPLO.z0, 0.05, "z0 do exemplo");
});

test("página do experimento 09 fixa o three.js e traz as abas e o formato", async () => {
  const html = await readFile(new URL("../experimentos/09-mapa-campo-espiras/index.html", import.meta.url), "utf8");
  const relatorio = await readFile(new URL("../experimentos/09-mapa-campo-espiras/relatorio.md", import.meta.url), "utf8");

  const mapa = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
  const versoes = Object.values(mapa.imports).map((url) => url.match(/three@(\d+\.\d+\.\d+)\//)?.[1]);
  assert.equal(versoes.length, 2);
  assert.ok(versoes[0] && versoes.every((versao) => versao === versoes[0]), "uma só versão exata do three.js");

  for (const painel of ["montagem", "fundamentos", "dados", "visualizacao", "relatorio"]) {
    assert.match(html, new RegExp(`aria-controls="painel-${painel}"`));
    assert.match(html, new RegExp(`id="painel-${painel}"[^>]*role="tabpanel"`));
  }
  assert.match(html, /Formato do arquivo/);
  assert.match(html, /data-mapa-campo/);
  assert.match(html, /visualizador-mapa\.js/);
  assert.match(html, /data-markdown-report="\.\/relatorio\.md"/);
  assert.match(html, /data-print-report/);
  for (const secao of ["Dados brutos", "Tratamento e análise", "Discussão", "Conclusão"]) {
    assert.match(relatorio, new RegExp(`^## ${secao}`, "m"));
  }
});
