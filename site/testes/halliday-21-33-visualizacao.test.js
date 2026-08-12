import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { waterChargeSteps } from "../exercicios/halliday-21-33/modelo.js";

test("21.33 percorre volume, partículas e carga sem perder a escala", () => {
  const steps = waterChargeSteps();

  assert.deepEqual(
    steps.map((step) => step.id),
    ["volume", "mass", "moles", "molecules", "protons", "charge"],
  );
  assert.equal(steps[1].value, 250);
  assert.ok(Math.abs(steps[2].value - 13.8734739) < 1e-6);
  assert.ok(Math.abs(steps[4].value - 8.35e25) / 8.35e25 < 0.001);
  assert.ok(Math.abs(steps[5].value - 1.34e7) / 1.34e7 < 0.002);
  assert.equal(steps[5].netChargeCoulombs, 0);
});

test("21.33 publica a contagem acessível sem substituir o explorador", async () => {
  const htmlUrl = new URL(
    "../exercicios/halliday-21-33/index.html",
    import.meta.url,
  );
  const cssUrl = new URL(
    "../exercicios/halliday-21-33/visualizacao.css",
    import.meta.url,
  );
  const [html, css] = await Promise.all([
    readFile(htmlUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  for (const label of [
    "Reproduzir",
    "Pausar",
    "Reiniciar",
    "Próximo passo",
    "Velocidade",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-didactic-visualization/);
  assert.match(html, /data-substance-explorer/);
  assert.match(
    html,
    /data-station="volume" data-state="active" aria-current="step"/,
  );
  assert.doesNotMatch(html, /<button[^>]+aria-current/);
  assert.match(html, /logarítmica/i);
  assert.match(html, /ícones simbólicos/i);
  assert.match(html, /\+1,34 × 10<sup>7<\/sup> C/);
  assert.match(html, /−1,34 × 10<sup>7<\/sup> C/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
