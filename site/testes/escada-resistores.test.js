import assert from "node:assert/strict";
import test from "node:test";

import {
  attenuationPerRung,
  convergenceTable,
  INFINITE_LADDER_FACTOR,
  infiniteLadderResistance,
  ladderResistance,
  parallel,
  relativeDeviation,
  resistorsUsed,
  rungVoltages,
} from "../nucleo/escada-resistores.js";

const R = 10_000;

function relativeError(value, expected) {
  return Math.abs(value - expected) / expected;
}

test("a escada infinita converge para (1 + √3)R", () => {
  assert.ok(relativeError(INFINITE_LADDER_FACTOR, 2.7320508) < 1e-6);
  assert.ok(relativeError(infiniteLadderResistance(R), 27_320.508) < 1e-6);
});

test("o limite satisfaz a própria equação de autossemelhança", () => {
  const limite = infiniteLadderResistance(R);

  // acrescentar mais um degrau a uma escada infinita não muda nada
  assert.ok(relativeError(2 * R + parallel(R, limite), limite) < 1e-12);
});

test("os três primeiros degraus têm valores exatos conhecidos", () => {
  assert.ok(relativeError(ladderResistance(1, R), 3 * R) < 1e-12);
  assert.ok(relativeError(ladderResistance(2, R), (11 / 4) * R) < 1e-12);
  assert.ok(relativeError(ladderResistance(3, R), (41 / 15) * R) < 1e-12);
});

test("nove resistores erram menos de 0,05% do valor infinito", () => {
  const limite = infiniteLadderResistance(R);
  const tres = ladderResistance(3, R);

  assert.equal(resistorsUsed(3), 9);
  assert.ok(Math.abs(relativeDeviation(tres, limite)) < 0.0005);
  // e o erro do primeiro degrau ainda é grande o bastante para ser medido
  assert.ok(relativeDeviation(ladderResistance(1, R), limite) > 0.09);
});

test("a convergência é monótona e sempre por cima do limite", () => {
  const tabela = convergenceTable(6, R);
  const limite = infiniteLadderResistance(R);

  assert.equal(tabela.length, 6);
  for (const linha of tabela) {
    assert.ok(linha.resistance > limite, `degrau ${linha.rungs} deve exceder o limite`);
    assert.equal(linha.resistors, linha.rungs * 3);
  }
  for (let i = 1; i < tabela.length; i += 1) {
    assert.ok(
      tabela[i].resistance < tabela[i - 1].resistance,
      "cada degrau aproxima o valor por cima",
    );
  }
});

test("terminar a escada com o próprio limite dispensa os degraus seguintes", () => {
  const limite = infiniteLadderResistance(R);

  for (const degraus of [1, 2, 3, 5]) {
    assert.ok(relativeError(ladderResistance(degraus, R, limite), limite) < 1e-12);
  }
});

test("terminar com um resistor comercial de 27 kΩ já entrega o limite", () => {
  const comercial = ladderResistance(1, R, 27_000);
  const limite = infiniteLadderResistance(R);

  assert.ok(Math.abs(relativeDeviation(comercial, limite)) < 0.001);
});

test("a escada infinita divide a tensão por 2 − √3 a cada degrau", () => {
  assert.ok(relativeError(attenuationPerRung(), 0.2679492) < 1e-6);

  const limite = infiniteLadderResistance(R);
  const tensoes = rungVoltages(4, R, 6, limite);

  for (let i = 1; i < tensoes.length; i += 1) {
    assert.ok(relativeError(tensoes[i] / tensoes[i - 1], attenuationPerRung()) < 1e-9);
  }
});

test("na escada de três degraus as tensões medidas caem cerca de 3,7 vezes", () => {
  const [primeira, segunda, terceira] = rungVoltages(3, R, 6);

  assert.ok(relativeError(primeira, 1.6098) < 1e-3);
  assert.ok(relativeError(segunda, 0.43902) < 1e-3);
  assert.ok(relativeError(terceira, 0.14634) < 1e-3);

  // a truncagem afasta as últimas razões do valor da escada infinita
  assert.ok(relativeError(segunda / primeira, 3 / 11) < 1e-9);
  assert.ok(relativeError(terceira / segunda, 1 / 3) < 1e-9);
});

test("entradas inválidas são recusadas", () => {
  assert.throws(() => ladderResistance(0, R), TypeError);
  assert.throws(() => ladderResistance(1.5, R), TypeError);
  assert.throws(() => ladderResistance(3, -R), TypeError);
  assert.throws(() => infiniteLadderResistance(Number.NaN), TypeError);
  assert.throws(() => rungVoltages(3, R, 0), TypeError);
});

test("resistores medidos um a um reproduzem o caso nominal e detectam dispersão", async () => {
  const { measuredLadderResistance, meanResistance } = await import(
    "../nucleo/escada-resistores.js"
  );

  const nominal = { top: R, bottom: R, shunt: R };
  const tresNominais = measuredLadderResistance([nominal, nominal, nominal]);
  assert.ok(relativeError(tresNominais, ladderResistance(3, R)) < 1e-12);

  // resistores de 5% tortos para o mesmo lado deslocam R_AB na mesma proporção
  const cincoPorCento = { top: 1.05 * R, bottom: 1.05 * R, shunt: 1.05 * R };
  const deslocada = measuredLadderResistance([cincoPorCento, cincoPorCento, cincoPorCento]);
  assert.ok(relativeError(deslocada, 1.05 * ladderResistance(3, R)) < 1e-12);

  // homogeneidade: prever com a média dos medidos equivale a escalar o nominal
  const medidos = [10_120, 9_870, 10_040, 9_960, 10_210, 9_930, 10_080, 9_990, 10_060];
  const media = meanResistance(medidos);
  assert.ok(relativeError(ladderResistance(3, media), (41 / 15) * media) < 1e-12);

  assert.throws(() => measuredLadderResistance([]), TypeError);
  assert.throws(() => meanResistance([R, 0]), TypeError);
});
