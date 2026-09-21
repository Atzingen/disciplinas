import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const api = await import("../experimentos/07-carga-descarga-capacitores/explorador-rc.js");

const bancada = { resistenciaOhm: 56e3, capacitanciaFarad: 2200e-6, tensaoVolt: 5 };

test("modelo RC reproduz a solução da equação diferencial para a bancada", () => {
  const modelo = api.modeloRC(bancada);
  const perto = (a, b, tolerancia = 1e-9) => assert.ok(Math.abs(a - b) <= tolerancia, `${a} ≠ ${b}`);

  perto(modelo.tau, 123.2);
  perto(modelo.correnteInicial, 5 / 56e3);
  perto(modelo.cargaFinal, 0.011);
  perto(modelo.energiaFinal, 0.0275);

  perto(modelo.tensaoCarga(0), 0);
  perto(modelo.tensaoDescarga(0), 5);
  perto(modelo.tensaoCarga(modelo.tau), 5 * (1 - Math.exp(-1)));
  perto(modelo.tensaoDescarga(modelo.tau), 5 * Math.exp(-1));
  perto(modelo.tensaoCarga(modelo.tau * Math.LN2), 2.5);
  perto(modelo.tensaoDescarga(modelo.tau * Math.LN2), 2.5);
  perto(modelo.correnteCarga(0) + modelo.correnteDescarga(0), 0);

  for (const t of [0, 10, 100, 500]) {
    perto(modelo.tensaoCarga(t) + modelo.correnteCarga(t) * bancada.resistenciaOhm, 5);
    perto(modelo.tensaoDescarga(t) + modelo.correnteDescarga(t) * bancada.resistenciaOhm, 0);
  }
});

test("amostras cobrem 0 a 5τ com carga e descarga espelhadas", () => {
  const modelo = api.modeloRC(bancada);
  const amostras = api.amostrasRC(modelo, 50);

  assert.equal(amostras.t.length, 51);
  assert.equal(amostras.t[0], 0);
  assert.ok(Math.abs(amostras.fim - 5 * modelo.tau) < 1e-9);
  assert.ok(Math.abs(amostras.t.at(-1) - amostras.fim) < 1e-9);
  for (let k = 0; k < amostras.t.length; k += 1) {
    assert.ok(Math.abs(amostras.vCarga[k] + amostras.vDescarga[k] - 5) < 1e-9);
    assert.ok(Math.abs(amostras.iCarga[k] + amostras.iDescarga[k]) < 1e-12);
  }
  assert.ok(amostras.vCarga.at(-1) > 5 * 0.99);
  assert.ok(amostras.vDescarga.at(-1) < 5 * 0.01);
});

test("formatação em pt-BR escolhe a unidade pela ordem de grandeza", () => {
  assert.equal(api.formatarTempo(0), "0");
  assert.equal(api.formatarTempo(0.5), "500 ms");
  assert.equal(api.formatarTempo(12.34), "12,3 s");
  assert.equal(api.formatarTempo(123.2), "2,05 min");
  assert.equal(api.formatarCorrente(0), "0");
  assert.equal(api.formatarCorrente(5 / 56e3), "89,3 µA");
  assert.equal(api.formatarCorrente(-0.0025), "-2,50 mA");
  assert.equal(api.formatarCarga(0.011), "11,00 mC");
  assert.equal(api.formatarEnergia(0.0275), "27,50 mJ");
});

test("a aba Fundamentos traz a dedução, os tipos de solução e o explorador", async () => {
  const html = await readFile(
    new URL("../experimentos/07-carga-descarga-capacitores/index.html", import.meta.url),
    "utf8",
  );
  const fundamentos = html.slice(html.indexOf('id="painel-fundamentos"'), html.indexOf('id="painel-dados"'));

  assert.match(fundamentos, /Do circuito à equação diferencial/);
  assert.match(fundamentos, /R\\,\\frac\{dQ\}\{dt\} \+ \\frac\{Q\}\{C\} = V_s/);
  assert.match(fundamentos, /Que tipo de equação é essa/);
  assert.match(fundamentos, /\\underbrace\{V_h\(t\)\}/);
  assert.match(fundamentos, /Carga: resolução completa/);
  assert.match(fundamentos, /Descarga: resolução completa/);
  assert.match(fundamentos, /fator integrante/i);
  assert.match(fundamentos, /separação de variáveis/i);
  assert.match(fundamentos, /Energia: metade vira calor/);
  assert.match(fundamentos, /TL;DR: carga e descarga em quatro passos/);
  assert.match(fundamentos, /data-explorador-rc/);
  assert.match(fundamentos, /data-rc-grafico-tensao/);
  assert.match(fundamentos, /data-rc-grafico-corrente/);
  assert.match(html, /explorador-rc\.js/);
});
