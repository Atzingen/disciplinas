import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { forceSceneAt, solveMeasuredForces } from "../exercicios/halliday-21-18/modelo.js";

test("21.18 recupera as forças e os extremos medidos", () => {
  const solved = solveMeasuredForces(2.014e-23, 2.877e-24);
  assert.equal(solved.forceB, 8.6315e-24);
  assert.equal(solved.forceC, 1.15085e-23);
  assert.ok(Math.abs(solved.chargeRatio - 1.3333140242) < 1e-10);

  const sumConfiguration = forceSceneAt(0, solved.forceB, solved.forceC);
  const transferConfiguration = forceSceneAt(0.5, solved.forceB, solved.forceC);
  const differenceConfiguration = forceSceneAt(1, solved.forceB, solved.forceC);

  assert.ok(Math.abs(sumConfiguration.resultant.x + 2.014e-23) < 1e-35);
  assert.ok(Math.abs(differenceConfiguration.resultant.x + 2.877e-24) < 1e-35);
  assert.equal(sumConfiguration.measured, true);
  assert.equal(sumConfiguration.equation, "F_B + F_C = S");
  assert.equal(transferConfiguration.measured, false);
  assert.equal(transferConfiguration.equation, null);
  assert.equal(differenceConfiguration.measured, true);
  assert.equal(differenceConfiguration.equation, "F_C - F_B = D");
});

test("21.18 publica a mesa de forças e os cinco controles acessíveis", async () => {
  const html = await readFile(
    new URL("../exercicios/halliday-21-18/index.html", import.meta.url),
    "utf8",
  );

  for (const label of ["Reproduzir", "Pausar", "Reiniciar", "Próximo passo", "Velocidade"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-didactic-visualization/);
  assert.match(html, /data-force-locus/);
  assert.match(html, /data-force-readout/);
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
  assert.match(html, /<title(?:\s+id="[^"]+")?>[^<]+<\/title>/);
  assert.match(html, /<desc(?:\s+id="[^"]+")?>[^<]+<\/desc>/);
  assert.match(html, /1,33/);
  assert.match(html, /2,014/);
  assert.match(html, /2,877/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
});
