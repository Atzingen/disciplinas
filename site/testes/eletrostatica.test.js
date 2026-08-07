import assert from "node:assert/strict";
import test from "node:test";

let electrostatics = {};
let chargeSimulator = {};

try {
  electrostatics = await import("../nucleo/eletrostatica.js");
} catch {
  electrostatics = {};
}

try {
  chargeSimulator = await import("../componentes/simulador-cargas.js");
} catch {
  chargeSimulator = {};
}

const apiAvailable =
  typeof electrostatics.forceFromSource === "function" &&
  typeof electrostatics.calculateForceSystem === "function" &&
  typeof electrostatics.ElectrostaticSingularityError === "function";

function charge(
  id,
  xCm,
  yCm,
  magnitudeMicroC = 1,
  sign = 1,
) {
  return { id, label: id, xCm, yCm, magnitudeMicroC, sign };
}

function nearlyEqual(actual, expected, tolerance = 1e-12) {
  return Math.abs(actual - expected) <= tolerance;
}

test("núcleo eletrostático expõe a API de Coulomb", () => {
  assert.equal(typeof electrostatics.COULOMB_CONSTANT, "number");
  assert.equal(typeof electrostatics.forceFromSource, "function");
  assert.equal(typeof electrostatics.calculateForceSystem, "function");
  assert.equal(
    typeof electrostatics.ElectrostaticSingularityError,
    "function",
  );
  assert.equal(typeof chargeSimulator.forceEquationsMarkup, "function");
});

test("Coulomb calcula 1 µC a 1 metro com direção de repulsão", { skip: !apiAvailable }, () => {
  const source = charge("q1", 0, 0);
  const testCharge = charge("qt", 100, 0);
  const force = electrostatics.forceFromSource(source, testCharge);

  assert.ok(
    nearlyEqual(force.x, electrostatics.COULOMB_CONSTANT * 1e-12),
  );
  assert.ok(nearlyEqual(force.y, 0));
});

test("atração entre sinais opostos aponta para a fonte", { skip: !apiAvailable }, () => {
  const source = charge("q1", 0, 0, 2, 1);
  const testCharge = charge("qt", 100, 0, 1, -1);
  const force = electrostatics.forceFromSource(source, testCharge);

  assert.ok(force.x < 0);
  assert.ok(nearlyEqual(force.y, 0));
});

test("repulsão vertical mantém componente horizontal nula", { skip: !apiAvailable }, () => {
  const source = charge("q1", 0, 0);
  const testCharge = charge("qt", 0, 100);
  const force = electrostatics.forceFromSource(source, testCharge);

  assert.ok(nearlyEqual(force.x, 0));
  assert.ok(force.y > 0);
});

test("superposição soma forças individuais e resultante", { skip: !apiAvailable }, () => {
  const sources = [
    charge("q1", -100, 0),
    charge("q2", 100, 0),
  ];
  const system = electrostatics.calculateForceSystem(
    sources,
    charge("qt", 0, 0),
  );

  assert.equal(system.individual.length, 2);
  assert.ok(system.individual[0].force.x > 0);
  assert.ok(system.individual[1].force.x < 0);
  assert.ok(nearlyEqual(system.resultant.x, 0));
  assert.ok(nearlyEqual(system.resultant.y, 0));
});

test("painel dinâmico compõe Coulomb vetorial, componentes e superposição", { skip: !apiAvailable }, () => {
  const state = {
    sources: [
      charge("q1", -100, 0, 2, 1),
      charge("q2", 100, 0, 3, -1),
    ],
    testCharge: charge("qt", 0, 50, 1, 1),
  };
  const forceSystem = electrostatics.calculateForceSystem(
    state.sources,
    state.testCharge,
  );
  const markup = chargeSimulator.forceEquationsMarkup(state, forceSystem);

  assert.match(markup, /\\vec\{F\}_\{i\\to t\}/);
  assert.match(markup, /\\frac\{q_iq_t\}\{\\lVert/);
  assert.match(markup, /\\begin\{aligned\}/);
  assert.match(markup, /\\vec\{F\}_\{\\mathrm\{res\}\}/);
  assert.match(markup, /\\sum_i/);
  assert.match(markup, /\\lVert\\vec\{F\}_\{\\mathrm\{res\}\}\\rVert/);
});

test("superposição aceita seis fontes", { skip: !apiAvailable }, () => {
  const sources = Array.from({ length: 6 }, (_, index) =>
    charge(
      "q" + String(index + 1),
      100 * Math.cos((index * Math.PI) / 3),
      100 * Math.sin((index * Math.PI) / 3),
    ),
  );
  const system = electrostatics.calculateForceSystem(
    sources,
    charge("qt", 0, 0),
  );

  assert.equal(system.individual.length, 6);
  assert.ok(nearlyEqual(system.resultant.x, 0, 1e-11));
  assert.ok(nearlyEqual(system.resultant.y, 0, 1e-11));
});

test("singularidade identifica a fonte coincidente", { skip: !apiAvailable }, () => {
  const source = charge("fonte-coincidente", 2, -3);
  const testCharge = charge("qt", 2, -3);

  assert.throws(
    () => electrostatics.forceFromSource(source, testCharge),
    (error) =>
      error instanceof electrostatics.ElectrostaticSingularityError &&
      error.sourceId === "fonte-coincidente",
  );
});
