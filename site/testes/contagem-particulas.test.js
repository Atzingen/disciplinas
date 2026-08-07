import assert from "node:assert/strict";
import test from "node:test";

import {
  AVOGADRO_CONSTANT,
  ELEMENTARY_CHARGE,
  lightningEquivalent,
  positiveChargeChain,
  protonsPerUnit,
} from "../nucleo/contagem-particulas.js";

const AGUA = {
  volumeCm3: 250,
  densityGramsPerCm3: 1.0,
  molarMassGramsPerMol: 18.02,
  protonsPerUnit: 10,
};

function relativeError(value, expected) {
  return Math.abs(value - expected) / expected;
}

test("a molécula de água reúne dez prótons", () => {
  assert.equal(
    protonsPerUnit([
      ["H", 2],
      ["O", 1],
    ]),
    10,
  );
});

test("retículos iônicos e covalentes somam pela proporção da fórmula", () => {
  assert.equal(
    protonsPerUnit([
      ["Si", 1],
      ["O", 2],
    ]),
    30,
  );
  assert.equal(
    protonsPerUnit([
      ["Na", 1],
      ["Cl", 1],
    ]),
    28,
  );
});

test("composição inválida é recusada", () => {
  assert.throws(() => protonsPerUnit([]), TypeError);
  assert.throws(() => protonsPerUnit([["Xx", 1]]), RangeError);
  assert.throws(() => protonsPerUnit([["H", 0]]), TypeError);
});

test("250 cm³ de água contêm cerca de 1,34 × 10⁷ C de carga positiva", () => {
  const chain = positiveChargeChain(AGUA);

  assert.equal(chain.massGrams, 250);
  assert.ok(relativeError(chain.moles, 13.873) < 1e-4);
  assert.ok(relativeError(chain.units, 8.3546e24) < 1e-4);
  assert.ok(relativeError(chain.protonCount, 8.3546e25) < 1e-4);
  assert.ok(relativeError(chain.chargeCoulombs, 1.3384e7) < 1e-4);
});

test("a cadeia é o produto direto das quatro conversões", () => {
  const chain = positiveChargeChain(AGUA);
  const direto =
    ((AGUA.densityGramsPerCm3 * AGUA.volumeCm3) / AGUA.molarMassGramsPerMol) *
    AVOGADRO_CONSTANT *
    AGUA.protonsPerUnit *
    ELEMENTARY_CHARGE;

  assert.ok(relativeError(chain.chargeCoulombs, direto) < 1e-12);
});

test("um gás em CNTP fica três ordens de grandeza abaixo de um líquido", () => {
  const nitrogenio = positiveChargeChain({
    volumeCm3: 250,
    densityGramsPerCm3: 0.001251,
    molarMassGramsPerMol: 28.01,
    protonsPerUnit: 14,
  });
  const agua = positiveChargeChain(AGUA);

  assert.ok(relativeError(nitrogenio.chargeCoulombs, 1.508e4) < 1e-3);
  assert.ok(agua.chargeCoulombs / nitrogenio.chargeCoulombs > 500);
});

test("amostras sem volume, densidade ou massa molar são recusadas", () => {
  assert.throws(() => positiveChargeChain({ ...AGUA, volumeCm3: 0 }), TypeError);
  assert.throws(
    () => positiveChargeChain({ ...AGUA, densityGramsPerCm3: -1 }),
    TypeError,
  );
  assert.throws(
    () => positiveChargeChain({ ...AGUA, molarMassGramsPerMol: Number.NaN }),
    TypeError,
  );
});

test("a carga da amostra equivale a centenas de milhares de relâmpagos", () => {
  const { chargeCoulombs } = positiveChargeChain(AGUA);

  assert.ok(relativeError(lightningEquivalent(chargeCoulombs), 6.692e5) < 1e-3);
});
