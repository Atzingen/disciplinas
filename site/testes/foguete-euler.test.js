import assert from "node:assert/strict";
import test from "node:test";
import { acceleration, analyticVelocity, integrateRocket, rocketStep } from "../topicos/03-metodo-euler/foguete-modelo.js";

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}

test("Euler reproduz os três passos do foguete mostrados no vídeo", () => {
  const { points, steps } = integrateRocket({ initialVelocity: 0, step: 0.5, finalTime: 1.5, method: "euler" });
  const expected = [0, 10.1, 19.8135175879397, 28.182396569658607];
  points.forEach((point, i) => close(point.v, expected[i]));
  close(steps[0].stages[0].slope, 20.2);
  close(steps[1].stages[0].slope, 19.427035175879396);
});

test("a série analítica preserva a condição inicial e satisfaz a EDO de massa variável", () => {
  for (const initialVelocity of [0, 10, 60]) {
    close(analyticVelocity(0, initialVelocity), initialVelocity);
    for (const t of [0.5, 5, 19]) {
      const delta = 1e-4;
      const velocity = analyticVelocity(t, initialVelocity);
      const derivative = (analyticVelocity(t + delta, initialVelocity) - analyticVelocity(t - delta, initialVelocity)) / (2 * delta);
      close(derivative, acceleration(t, velocity), 1e-6);
    }
  }
  close(analyticVelocity(20, 0), 47.48724048492215, 1e-9);
  close(analyticVelocity(20, 60), 47.48724061383409, 1e-9);
});

test("RK2 e RK4 expõem estados intermediários reais, recalculando massa e inclinação", () => {
  const midpoint = rocketStep(0, 0, 0.5, "rk2");
  assert.equal(midpoint.stages.length, 2);
  close(midpoint.stages[1].t, 0.25);
  close(midpoint.stages[1].v, 5.05);
  close(midpoint.nextVelocity, 0.5 * acceleration(0.25, 5.05));
  const fourth = rocketStep(0, 0, 0.5, "rk4");
  assert.deepEqual(fourth.stages.map(stage => stage.t), [0, 0.25, 0.25, 0.5]);
  close(fourth.stages[2].v, 0.25 * fourth.stages[1].slope);
  close(fourth.stages[3].v, 0.5 * fourth.stages[2].slope);
});

test("reduzir h produz as ordens esperadas de Euler, RK2 e RK4", () => {
  for (const [method, minimumRatio, maximumRatio] of [["euler", 1.8, 2.3], ["rk2", 3.5, 4.6], ["rk4", 13, 20]]) {
    const errors = [0.2, 0.1].map(step => {
      const { points } = integrateRocket({ initialVelocity: 0, step, finalTime: 2, method });
      return Math.abs(points.at(-1).v - analyticVelocity(2, 0));
    });
    const ratio = errors[0] / errors[1];
    assert.ok(ratio > minimumRatio && ratio < maximumRatio, `${method}: razão ${ratio}`);
  }
});

test("o último passo termina no instante escolhido mesmo quando h não o divide", () => {
  const { points, steps } = integrateRocket({ initialVelocity: 15, step: 0.3, finalTime: 1, method: "rk4" });
  close(points.at(-1).t, 1);
  close(steps.at(-1).h, 0.1);
  assert.equal(points.length, 5);
  close(points[0].v, 15);
});

test("os controles rejeitam valores vazios, não finitos ou fora do intervalo explicado", () => {
  const valid = { initialVelocity: 0, step: 0.5, finalTime: 10, method: "euler" };
  for (const change of [{ initialVelocity: NaN }, { initialVelocity: -1 }, { initialVelocity: 61 }, { step: 0 }, { step: 0.01 }, { step: Infinity }, { finalTime: 21 }, { method: "rk45" }]) {
    assert.throws(() => integrateRocket({ ...valid, ...change }), RangeError);
  }
});
