import assert from "node:assert/strict";
import test from "node:test";

import { calculateForceSystem } from "../nucleo/eletrostatica.js";
import { magnitude } from "../nucleo/vetores.js";

let generic = {};
let halliday = {};

try {
  generic = await import("../simuladores/cargas-e-vetores/preset.js");
} catch {
  generic = {};
}

try {
  halliday = await import("../exercicios/halliday-21-13/preset.js");
} catch {
  halliday = {};
}

const apiAvailable =
  generic.GENERIC_PRESET &&
  halliday.HALLIDAY_PRESET &&
  Number.isFinite(halliday.HALLIDAY_EQUILIBRIUM_X_CM);

test("presets genérico e Halliday são exportados", () => {
  assert.equal(typeof generic.GENERIC_PRESET, "object");
  assert.equal(typeof halliday.HALLIDAY_PRESET, "object");
  assert.equal(typeof halliday.HALLIDAY_EQUILIBRIUM_X_CM, "number");
});

test("preset genérico começa com duas fontes e uma carga de prova", { skip: !apiAvailable }, () => {
  assert.equal(generic.GENERIC_PRESET.sources.length, 2);
  assert.equal(generic.GENERIC_PRESET.maxSources, 6);
  assert.equal(generic.GENERIC_PRESET.testCharge.id, "qt");
  assert.equal(generic.GENERIC_PRESET.lockSources, false);
  assert.ok(Object.isFrozen(generic.GENERIC_PRESET));
});

test("preset Halliday preserva cargas, distância e resposta analítica", { skip: !apiAvailable }, () => {
  const [q1, q2] = halliday.HALLIDAY_PRESET.sources;

  assert.equal(q1.magnitudeMicroC * q1.sign, 1);
  assert.equal(q2.magnitudeMicroC * q2.sign, -3);
  assert.equal(q2.xCm - q1.xCm, 10);
  assert.ok(
    Math.abs(
      halliday.HALLIDAY_EQUILIBRIUM_X_CM -
        -10 / (Math.sqrt(3) - 1),
    ) < 1e-12,
  );
  assert.ok(
    Math.abs(
      halliday.HALLIDAY_EQUILIBRIUM_X_CM - -13.660254037844389,
    ) < 1e-12,
  );
});

test("forças do preset Halliday se anulam no ponto teórico", { skip: !apiAvailable }, () => {
  const system = calculateForceSystem(
    halliday.HALLIDAY_PRESET.sources,
    halliday.HALLIDAY_PRESET.testCharge,
  );

  assert.ok(magnitude(system.resultant) < 1e-10);
  assert.ok(
    Math.abs(
      magnitude(system.individual[0].force) -
        magnitude(system.individual[1].force),
    ) < 1e-10,
  );
});

test("preset Halliday fixa as fontes e nomeia a restauração", { skip: !apiAvailable }, () => {
  assert.equal(halliday.HALLIDAY_PRESET.lockSources, true);
  assert.equal(
    halliday.HALLIDAY_PRESET.resetLabel,
    "Restaurar equilíbrio",
  );
  assert.ok(Object.isFrozen(halliday.HALLIDAY_PRESET));
});
