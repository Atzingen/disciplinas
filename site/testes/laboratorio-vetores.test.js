import assert from "node:assert/strict";
import test from "node:test";

let laboratory = {};
let formatting = {};

try {
  laboratory = await import("../componentes/simulador-vetores.js");
} catch {
  laboratory = {};
}

try {
  formatting = await import("../nucleo/formato.js");
} catch {
  formatting = {};
}

const expectedFunctions = [
  "createVectorLabState",
  "calculateVectorMetrics",
  "createVectorReadoutMarkup",
  "moveVectorEndpoint",
  "mountVectorLabs",
];
const apiAvailable = expectedFunctions.every(
  (name) => typeof laboratory[name] === "function",
);

function nearlyEqual(actual, expected, tolerance = 1e-12) {
  return Math.abs(actual - expected) <= tolerance;
}

test("laboratório vetorial e formatadores expõem a API", () => {
  for (const name of expectedFunctions) {
    assert.equal(typeof laboratory[name], "function", name);
  }
  assert.equal(typeof formatting.formatDecimal, "function");
  assert.equal(typeof formatting.formatVector, "function");
  assert.equal(typeof formatting.formatDegrees, "function");
  assert.equal(typeof formatting.formatScientific, "function");
});

test("métricas calculam soma, módulos, produto, área e projeção", { skip: !apiAvailable }, () => {
  const state = laboratory.createVectorLabState({
    a: { x: 4, y: 1 },
    b: { x: 1, y: 3 },
  });
  const metrics = laboratory.calculateVectorMetrics(state);

  assert.deepEqual(metrics.sum, { x: 5, y: 4 });
  assert.ok(nearlyEqual(metrics.magnitudeA, Math.sqrt(17)));
  assert.ok(nearlyEqual(metrics.magnitudeB, Math.sqrt(10)));
  assert.ok(nearlyEqual(metrics.magnitudeSum, Math.sqrt(41)));
  assert.equal(metrics.dot, 7);
  assert.equal(metrics.determinant, 11);
  assert.ok(
    nearlyEqual(metrics.angleRadians, Math.acos(7 / Math.sqrt(170))),
  );
  assert.ok(nearlyEqual(metrics.projectionBOnA.x, 28 / 17));
  assert.ok(nearlyEqual(metrics.projectionBOnA.y, 7 / 17));
  assert.equal(metrics.dotClassification, "positivo");
});

test("classificação distingue produtos nulo e negativo", { skip: !apiAvailable }, () => {
  const perpendicular = laboratory.calculateVectorMetrics(
    laboratory.createVectorLabState({
      a: { x: 1, y: 0 },
      b: { x: 0, y: 2 },
    }),
  );
  const obtuse = laboratory.calculateVectorMetrics(
    laboratory.createVectorLabState({
      a: { x: 1, y: 0 },
      b: { x: -1, y: 1 },
    }),
  );

  assert.equal(perpendicular.dotClassification, "nulo");
  assert.ok(nearlyEqual(perpendicular.angleRadians, Math.PI / 2));
  assert.equal(obtuse.dotClassification, "negativo");
  assert.ok(obtuse.angleRadians > Math.PI / 2);
});

test("vetor nulo torna ângulo e projeção indefinidos", { skip: !apiAvailable }, () => {
  const metrics = laboratory.calculateVectorMetrics(
    laboratory.createVectorLabState({
      a: { x: 0, y: 0 },
      b: { x: 2, y: 3 },
    }),
  );

  assert.equal(metrics.angleRadians, null);
  assert.equal(metrics.projectionBOnA, null);
  assert.equal(metrics.dotClassification, "nulo");
});

test("movimento altera a extremidade e respeita os limites", { skip: !apiAvailable }, () => {
  const state = laboratory.createVectorLabState();

  assert.equal(
    laboratory.moveVectorEndpoint(state, "a", { x: 3.25, y: -2.75 }),
    true,
  );
  assert.deepEqual(state.a, { x: 3.3, y: -2.7 });
  laboratory.moveVectorEndpoint(state, "b", { x: 100, y: -100 });
  assert.deepEqual(state.b, { x: 6, y: -6 });
  assert.equal(
    laboratory.moveVectorEndpoint(state, "c", { x: 1, y: 1 }),
    false,
  );
});

test("leituras vetoriais usam LaTeX para soma, módulo, produto e área", { skip: !apiAvailable }, () => {
  const state = laboratory.createVectorLabState({
    a: { x: 3.7, y: -1.9 },
    b: { x: 1, y: 4.2 },
  });
  const markup = laboratory.createVectorReadoutMarkup(state);
  const combined = markup.sum + markup.dot + markup.theory;

  assert.match(combined, /\\begin\{aligned\}/);
  assert.match(combined, /\\vec\{R\}/);
  assert.match(combined, /\\frac\{/);
  assert.match(combined, /\\cos\\theta/);
  assert.match(combined, /\\lVert\\vec\{R\}\\rVert/);
  assert.match(combined, /\\sin\\theta/);
  assert.doesNotMatch(combined, /class="vector-symbol"/);
  assert.doesNotMatch(combined, /\u20d7/);
});

test("formatação apresenta vírgula, vetores, graus e notação científica", { skip: !apiAvailable }, () => {
  assert.equal(formatting.formatDecimal(1.234, 2), "1,23");
  assert.equal(formatting.formatVector({ x: 1, y: -2 }, 1), "(1,0; −2,0)");
  assert.equal(formatting.formatDegrees(Math.PI / 2, 1), "90,0°");
  assert.equal(formatting.formatDegrees(null), "indefinido");
  assert.equal(formatting.formatScientific(0), "0,00");
  assert.match(formatting.formatScientific(0.00123), /^1,23 × 10/);
});
