import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { pendulumState } from "../exercicios/halliday-21-42/modelo.js";

test("21.42 preserva carga, ângulo e hipótese de pequeno ângulo", () => {
  const state = pendulumState({
    lengthM: 1.2,
    massKg: 0.01,
    separationM: 0.05,
    gravity: 9.81,
  });

  assert.ok(Math.abs(state.thetaDegrees - 1.1937484) < 1e-6);
  assert.ok(Math.abs(state.approximateChargeC - 2.3843e-8) < 1e-12);
  assert.ok(state.relativeChargeError < 0.0002);
  assert.equal(state.halfSeparationM, 0.025);
});

test("21.42 rejeita dimensões incompatíveis com o pêndulo", () => {
  for (const options of [
    { lengthM: 0, massKg: 0.01, separationM: 0.05, gravity: 9.81 },
    { lengthM: 1.2, massKg: 0, separationM: 0.05, gravity: 9.81 },
    { lengthM: 1.2, massKg: 0.01, separationM: 2.4, gravity: 9.81 },
    { lengthM: 1.2, massKg: 0.01, separationM: 0.05, gravity: 0 },
  ]) {
    assert.throws(() => pendulumState(options), RangeError);
  }
});

test("21.42 publica separação variável, roteiro completo e SVG acessível", async () => {
  const htmlUrl = new URL(
    "../exercicios/halliday-21-42/index.html",
    import.meta.url,
  );
  const html = await readFile(htmlUrl, "utf8");

  assert.match(html, /data-charged-pendulum/);
  assert.match(
    html,
    /<input[^>]+type="range"[^>]+data-separation[^>]+min="1"[^>]+max="20"[^>]+step="0\.5"[^>]+value="5"/,
  );
  assert.match(html, /5,0 cm/);
  assert.match(html, /geometria ampliada; valores numéricos exatos/);
  for (const label of [
    "Reproduzir",
    "Pausar",
    "Reiniciar",
    "Próximo passo",
    "Velocidade",
  ]) {
    assert.match(html, new RegExp(label));
  }
  for (const relation of [
    "x/2",
    "T sen θ = F<sub>e</sub>",
    "T cos θ = mg",
    "tan θ = F<sub>e</sub> / mg",
    "F<sub>e</sub> = kq<sup>2</sup> / x<sup>2</sup>",
    "x<sup>3</sup>",
    "2,38 × 10<sup>−8</sup> C",
    "24 nC",
  ]) {
    assert.match(html, new RegExp(relation));
  }
  assert.match(html, /sen θ ≈ tan θ/);
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
});
