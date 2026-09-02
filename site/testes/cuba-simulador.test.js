import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(
  new URL("../simuladores/cuba-eletrolitica/index.html", import.meta.url),
  "utf8",
);
const component = await readFile(
  new URL("../componentes/simulador-potencial.js", import.meta.url),
  "utf8",
);
const css = await readFile(
  new URL("../assets/cuba-simulador.css", import.meta.url),
  "utf8",
);
const experiment = await readFile(
  new URL("../experimentos/06-cuba-eletrolitica/index.html", import.meta.url),
  "utf8",
);
const registry = JSON.parse(
  await readFile(new URL("../materiais.json", import.meta.url), "utf8"),
);

test("simulador é publicado no catálogo e ligado ao experimento", () => {
  const item = registry.find((entry) => entry.id === "cuba-eletrolitica-potencial");

  assert.ok(item);
  assert.equal(item.kind, "simulador");
  assert.equal(item.section, "simulacoes");
  assert.equal(item.discipline, "PRCLFBE");
  assert.equal(item.path, "simuladores/cuba-eletrolitica/");
  assert.match(experiment, /href="\.\.\/\.\.\/simuladores\/cuba-eletrolitica\/"/);
  assert.match(experiment, /Gauss–Seidel/);
});

test("página separa a interação da explicação do método", () => {
  assert.equal((html.match(/role="tab"/g) ?? []).length, 2);
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 2);
  assert.match(html, /data-cuba-potential-simulator/);
  assert.match(html, /Poisson sem fontes livres vira Laplace/);
  assert.match(html, /∇²V = 0/);
  assert.match(html, /∂V\/∂n = 0/);
  assert.match(html, /data-active-section="prclfbe"/);
  assert.match(html, /src="\.\/app\.js"/);
});

test("editor oferece formas, potenciais, movimento e remoção", () => {
  assert.match(component, /data-action="add-circle"/);
  assert.match(component, /data-action="add-rectangle"/);
  assert.match(component, /data-action="remove"/);
  assert.match(component, /data-field="potential-number"/);
  assert.match(component, /data-field="diameter"/);
  assert.match(component, /data-field="width"/);
  assert.match(component, /data-field="height"/);
  assert.match(component, /pointerdown/);
  assert.match(component, /pointermove/);
  assert.match(component, /ArrowLeft/);
  assert.match(component, /Delete/);
});

test("preset reproduz os três cilindros de 0 V, 5 V e 10 V", () => {
  assert.match(component, /label: "E₀"[\s\S]*?potential: 0/);
  assert.match(component, /label: "E₅"[\s\S]*?potential: 5/);
  assert.match(component, /label: "E₁₀"[\s\S]*?potential: 10/);
  assert.ok((component.match(/type: "circle"/g) ?? []).length >= 3);
});

test("cálculo anima a convergência e expõe controles numéricos", () => {
  assert.match(component, /data-action="calculate"/);
  assert.match(component, /data-action="pause"/);
  assert.match(component, /data-action="step"/);
  assert.match(component, /data-setting="resolution"/);
  assert.match(component, /data-setting="omega"/);
  assert.match(component, /data-setting="tolerance"/);
  assert.match(component, /requestAnimationFrame\(runFrame\)/);
  assert.match(component, /relaxGaussSeidel\(solver, sweeps, omega\)/);
  assert.match(component, /result\.lastDelta <= tolerance/);
  assert.match(component, /data-view="contours"/);
});

test("canvas e controles preservam teclado, contraste e layout móvel", () => {
  assert.match(component, /<canvas[\s\S]*?tabindex="0"[\s\S]*?aria-label=/);
  assert.match(component, /role="status" aria-live="polite"/);
  assert.match(css, /\.potential-canvas\s*\{[\s\S]*?touch-action:\s*none/);
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
  assert.match(css, /\.potential-metrics\s*\{[\s\S]*?grid-template-columns:/);
});
