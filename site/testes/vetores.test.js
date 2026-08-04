import assert from "node:assert/strict";
import test from "node:test";

let vectors = {};

try {
  vectors = await import("../nucleo/vetores.js");
} catch {
  vectors = {};
}

const expectedFunctions = [
  "add",
  "subtract",
  "scale",
  "magnitudeSquared",
  "magnitude",
  "dot",
  "determinant",
  "angleBetween",
  "project",
  "resultantMagnitude",
];

const apiAvailable = expectedFunctions.every(
  (name) => typeof vectors[name] === "function",
);

function nearlyEqual(actual, expected, tolerance = 1e-12) {
  return Math.abs(actual - expected) <= tolerance;
}

test("núcleo vetorial expõe a API planejada", () => {
  for (const name of expectedFunctions) {
    assert.equal(typeof vectors[name], "function", name);
  }
});

test("vetores somam, subtraem e escalam por componentes", { skip: !apiAvailable }, () => {
  assert.deepEqual(vectors.add({ x: 2, y: -1 }, { x: 4, y: 3 }), {
    x: 6,
    y: 2,
  });
  assert.deepEqual(vectors.subtract({ x: 2, y: -1 }, { x: 4, y: 3 }), {
    x: -2,
    y: -4,
  });
  assert.deepEqual(vectors.scale({ x: 2, y: -1 }, 2.5), {
    x: 5,
    y: -2.5,
  });
});

test("módulo do vetor 3,4 é calculado por Pitágoras", { skip: !apiAvailable }, () => {
  assert.equal(vectors.magnitudeSquared({ x: 3, y: 4 }), 25);
  assert.equal(vectors.magnitude({ x: 3, y: 4 }), 5);
});

test("produto escalar e determinante usam as componentes corretas", { skip: !apiAvailable }, () => {
  const a = { x: 4, y: 1 };
  const b = { x: 1, y: 3 };

  assert.equal(vectors.dot(a, b), 7);
  assert.equal(vectors.determinant(a, b), 11);
});

test("ângulo distingue vetores paralelos, perpendiculares e opostos", { skip: !apiAvailable }, () => {
  const axis = { x: 1, y: 0 };

  assert.ok(nearlyEqual(vectors.angleBetween(axis, { x: 2, y: 0 }), 0));
  assert.ok(
    nearlyEqual(vectors.angleBetween(axis, { x: 0, y: 3 }), Math.PI / 2),
  );
  assert.ok(
    nearlyEqual(vectors.angleBetween(axis, { x: -4, y: 0 }), Math.PI),
  );
});

test("ângulo e projeção ficam indefinidos para direção nula", { skip: !apiAvailable }, () => {
  const zero = { x: 0, y: 0 };

  assert.equal(vectors.angleBetween(zero, { x: 2, y: 1 }), null);
  assert.equal(vectors.project({ x: 2, y: 1 }, zero), null);
});

test("projeção preserva somente a componente na direção escolhida", { skip: !apiAvailable }, () => {
  const projection = vectors.project({ x: 3, y: 4 }, { x: 1, y: 0 });

  assert.deepEqual(projection, { x: 3, y: 0 });
});

test("módulo da soma satisfaz a identidade do produto escalar", { skip: !apiAvailable }, () => {
  const a = { x: 4, y: 1 };
  const b = { x: 1, y: 3 };
  const left = vectors.resultantMagnitude(a, b) ** 2;
  const right =
    vectors.magnitude(a) ** 2 +
    vectors.magnitude(b) ** 2 +
    2 * vectors.dot(a, b);

  assert.ok(nearlyEqual(left, right));
  assert.ok(nearlyEqual(left, vectors.magnitude(vectors.add(a, b)) ** 2));
});

test("operações rejeitam componentes não finitas", { skip: !apiAvailable }, () => {
  assert.throws(
    () => vectors.add({ x: Number.NaN, y: 0 }, { x: 1, y: 1 }),
    TypeError,
  );
});
