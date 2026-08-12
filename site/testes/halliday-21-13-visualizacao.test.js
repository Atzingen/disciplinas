import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { magnitude } from "../nucleo/vetores.js";
import {
  equilibriumStoryFrames,
  fieldVectorsAt,
} from "../exercicios/halliday-21-13/modelo.js";

test("21.13 termina na única raiz de campo nulo", () => {
  const frames = equilibriumStoryFrames();
  assert.deepEqual(frames.map((frame) => frame.id), [
    "off-axis", "between", "right", "left-far", "left-near", "equilibrium",
  ]);
  assert.ok(magnitude(fieldVectorsAt(-13.660254037844389, 0).resultant) < 1e-10);
});

test("21.13 publica controles acessíveis e preserva o simulador", async () => {
  const html = await readFile(new URL("../exercicios/halliday-21-13/index.html", import.meta.url), "utf8");
  for (const label of ["Reproduzir", "Pausar", "Reiniciar", "Próximo passo", "Velocidade"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-didactic-visualization/);
  assert.match(html, /data-halliday-simulator/);
  assert.match(html, /-13,66/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
});
