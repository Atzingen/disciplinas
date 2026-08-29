import assert from "node:assert/strict";
import test from "node:test";

import {
  createPotentialGrid,
  electricFieldAt,
  electrodesOverlap,
  relaxGaussSeidel,
  samplePotential,
  solveUntil,
  validateElectrodes,
} from "../nucleo/laplace.js";

const parallelPlates = [
  {
    id: "E0",
    type: "rectangle",
    x: 0.02,
    y: 0.5,
    width: 0.04,
    height: 1,
    potential: 0,
  },
  {
    id: "E10",
    type: "rectangle",
    x: 0.98,
    y: 0.5,
    width: 0.04,
    height: 1,
    potential: 10,
  },
];

test("validação detecta formas sobrepostas e eletrodos fora da cuba", () => {
  const circle = {
    id: "C1",
    type: "circle",
    x: 0.5,
    y: 0.5,
    radius: 0.1,
    potential: 0,
  };
  const rectangle = {
    id: "R1",
    type: "rectangle",
    x: 0.52,
    y: 0.5,
    width: 0.2,
    height: 0.2,
    potential: 5,
  };

  assert.equal(electrodesOverlap(circle, rectangle), true);
  assert.match(validateElectrodes([circle, rectangle]).join(" "), /sobrepostos/);
  assert.match(
    validateElectrodes([{ ...circle, id: "C2", y: 0.02 }]).join(" "),
    /ultrapassa a borda/,
  );
});

test("Gauss-Seidel preserva os potenciais impostos nos eletrodos", () => {
  const state = createPotentialGrid({
    width: 31,
    height: 21,
    electrodes: parallelPlates,
  });
  const fixedBefore = state.values.filter((_, index) => state.fixed[index]);

  relaxGaussSeidel(state, 20, 1);

  const fixedAfter = state.values.filter((_, index) => state.fixed[index]);
  assert.deepEqual(fixedAfter, fixedBefore);
  assert.equal(state.iteration, 20);
  assert.ok(Number.isFinite(state.lastDelta));
});

test("placas paralelas convergem para um perfil aproximadamente linear", () => {
  const state = createPotentialGrid({
    width: 31,
    height: 21,
    electrodes: parallelPlates,
  });
  const result = solveUntil(state, {
    tolerance: 1e-7,
    maxIterations: 20_000,
    omega: 1.7,
  });

  assert.equal(result.converged, true);
  assert.ok(Math.abs(samplePotential(state, 0.5, 0.5) - 5) < 0.03);
  assert.ok(Math.abs(samplePotential(state, 0.5, 0.2) - 5) < 0.03);

  const field = electricFieldAt(state, 0.5, 0.5);
  assert.ok(field.x < -6);
  assert.ok(Math.abs(field.y) < 1e-5);
});

test("configuração simétrica de cilindros produz 5 V no centro", () => {
  const state = createPotentialGrid({
    width: 61,
    height: 41,
    electrodes: [
      {
        id: "C0",
        type: "circle",
        x: 0.25,
        y: 0.5,
        radius: 0.08,
        potential: 0,
      },
      {
        id: "C10",
        type: "circle",
        x: 0.75,
        y: 0.5,
        radius: 0.08,
        potential: 10,
      },
    ],
  });
  const result = solveUntil(state, {
    tolerance: 2e-6,
    maxIterations: 20_000,
    omega: 1.75,
  });

  assert.equal(result.converged, true);
  assert.ok(Math.abs(samplePotential(state, 0.5, 0.5) - 5) < 0.04);
});

test("amostragem bilinear interpola a malha sem saltos", () => {
  const state = createPotentialGrid({
    width: 5,
    height: 5,
    electrodes: parallelPlates,
  });
  for (let row = 0; row < state.height; row += 1) {
    for (let column = 0; column < state.width; column += 1) {
      state.values[row * state.width + column] = column + 2 * row;
    }
  }

  assert.equal(samplePotential(state, 0.375, 0.625), 6.5);
  assert.equal(samplePotential(state, -1, -1), 0);
  assert.equal(samplePotential(state, 2, 2), 12);
});

test("solver recusa cálculo sem condições de contorno", () => {
  assert.throws(
    () => createPotentialGrid({ width: 21, height: 15, electrodes: [] }),
    /pelo menos um eletrodo/,
  );
});
