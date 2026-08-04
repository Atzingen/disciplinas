import assert from "node:assert/strict";
import test from "node:test";

import { GENERIC_PRESET } from "../simuladores/cargas-e-vetores/preset.js";
import { HALLIDAY_PRESET } from "../exercicios/halliday-21-13/preset.js";

let simulator = {};

try {
  simulator = await import("../componentes/simulador-cargas.js");
} catch {
  simulator = {};
}

const expectedFunctions = [
  "createSimulatorState",
  "addSource",
  "removeSelectedSource",
  "moveSelected",
  "setSelectedMagnitude",
  "flipSelectedSign",
  "calculateArrowScale",
  "mountChargeSimulator",
];
const apiAvailable = expectedFunctions.every(
  (name) => typeof simulator[name] === "function",
);

function genericState() {
  return simulator.createSimulatorState(GENERIC_PRESET);
}

test("simulador de cargas expõe estado, controles e montagem", () => {
  for (const name of expectedFunctions) {
    assert.equal(typeof simulator[name], "function", name);
  }
});

test("estado clona o preset sem permitir mutação da configuração", { skip: !apiAvailable }, () => {
  const state = genericState();
  state.sources[0].xCm = 999;
  state.testCharge.yCm = 999;

  assert.equal(GENERIC_PRESET.sources[0].xCm, -8);
  assert.equal(GENERIC_PRESET.testCharge.yCm, 6);
  assert.equal(state.selectedId, "qt");
});

test("adicionar cria fontes numeradas e respeita o limite seis", { skip: !apiAvailable }, () => {
  const state = genericState();

  assert.equal(simulator.addSource(state), true);
  assert.equal(state.sources[2].id, "q3");
  assert.equal(state.sources[2].label, "q₃");
  assert.ok(state.sources[2].vectorColor);
  assert.equal(state.selectedId, "q3");

  simulator.addSource(state);
  simulator.addSource(state);
  simulator.addSource(state);
  assert.equal(state.sources.length, 6);
  assert.equal(simulator.addSource(state), false);
  assert.equal(state.sources.length, 6);
});

test("seis fontes ativas mantêm cores vetoriais distintas após substituição", { skip: !apiAvailable }, () => {
  const state = genericState();
  while (state.sources.length < 6) {
    simulator.addSource(state);
  }
  state.selectedId = "q2";
  simulator.removeSelectedSource(state);
  simulator.addSource(state);

  const colors = state.sources.map((source) => source.vectorColor);
  assert.equal(new Set(colors).size, colors.length);
});

test("remoção atua somente em fonte selecionada e protege a carga de prova", { skip: !apiAvailable }, () => {
  const state = genericState();
  state.selectedId = "q1";

  assert.equal(simulator.removeSelectedSource(state), true);
  assert.deepEqual(state.sources.map((source) => source.id), ["q2"]);
  assert.equal(state.selectedId, "qt");
  assert.equal(simulator.removeSelectedSource(state), false);
});

test("preset bloqueado preserva posição, módulo e sinal de suas fontes", { skip: !apiAvailable }, () => {
  const state = simulator.createSimulatorState(HALLIDAY_PRESET);
  state.selectedId = "q1";

  assert.equal(simulator.addSource(state), false);
  assert.equal(simulator.removeSelectedSource(state), false);
  assert.equal(simulator.moveSelected(state, 2, 0), false);
  assert.equal(simulator.setSelectedMagnitude(state, 4), 1);
  assert.equal(simulator.flipSelectedSign(state), 1);
  assert.equal(state.sources[0].xCm, 0);
  assert.equal(state.sources[0].magnitudeMicroC, 1);
  assert.equal(state.sources[0].sign, 1);
});

test("movimento desloca e limita a carga selecionada ao plano", { skip: !apiAvailable }, () => {
  const state = genericState();
  state.selectedId = "qt";

  assert.equal(simulator.moveSelected(state, 3, -2), true);
  assert.deepEqual(
    { xCm: state.testCharge.xCm, yCm: state.testCharge.yCm },
    { xCm: 3, yCm: 4 },
  );
  simulator.moveSelected(state, 100, -100);
  assert.equal(state.testCharge.xCm, state.viewport.maxX);
  assert.equal(state.testCharge.yCm, state.viewport.minY);
});

test("módulo é arredondado e limitado entre 0,1 e 10 µC", { skip: !apiAvailable }, () => {
  const state = genericState();

  assert.equal(simulator.setSelectedMagnitude(state, 3.26), 3.3);
  assert.equal(state.testCharge.magnitudeMicroC, 3.3);
  assert.equal(simulator.setSelectedMagnitude(state, 100), 10);
  assert.equal(simulator.setSelectedMagnitude(state, 0), 0.1);
  assert.equal(simulator.setSelectedMagnitude(state, Number.NaN), 0.1);
});

test("troca de sinal atua no item selecionado", { skip: !apiAvailable }, () => {
  const state = genericState();
  assert.equal(state.testCharge.sign, 1);
  assert.equal(simulator.flipSelectedSign(state), -1);
  assert.equal(state.testCharge.sign, -1);
});

test("escala das setas é comum ao maior módulo", { skip: !apiAvailable }, () => {
  const forceSystem = {
    individual: [
      { force: { x: 3, y: 4 } },
      { force: { x: 0, y: 2 } },
    ],
    resultant: { x: 6, y: 8 },
  };

  assert.equal(simulator.calculateArrowScale(forceSystem, 100), 10);
  assert.equal(
    simulator.calculateArrowScale(
      { individual: [], resultant: { x: 0, y: 0 } },
      100,
    ),
    0,
  );
});
