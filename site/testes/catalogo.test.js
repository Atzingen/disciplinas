import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let catalog = {};
let items = [];

try {
  catalog = await import("../componentes/catalogo.js");
} catch {
  catalog = {};
}

try {
  const registryUrl = new URL("../simuladores.json", import.meta.url);
  items = JSON.parse(await readFile(registryUrl, "utf8"));
} catch {
  items = [];
}

const apiAvailable =
  typeof catalog.normalizeSearchText === "function" &&
  typeof catalog.filterCatalog === "function";

test("catálogo expõe busca e possui registro inicial", () => {
  assert.equal(typeof catalog.normalizeSearchText, "function");
  assert.equal(typeof catalog.filterCatalog, "function");
  assert.equal(items.length, 2);
});

test("busca ignora acentos e caixa", { skip: !apiAvailable }, () => {
  assert.equal(catalog.normalizeSearchText("FORÇA Elétrica"), "forca eletrica");
  const matches = catalog.filterCatalog(items, "forca", "todos");
  assert.ok(matches.some((item) => item.id === "cargas-e-vetores"));
});

test("busca encontra livro e capítulo nas etiquetas", { skip: !apiAvailable }, () => {
  const byBook = catalog.filterCatalog(items, "Halliday", "todos");
  const byChapter = catalog.filterCatalog(items, "21", "todos");

  assert.deepEqual(byBook.map((item) => item.id), ["halliday-21-13"]);
  assert.deepEqual(byChapter.map((item) => item.id), ["halliday-21-13"]);
});

test("filtro separa simuladores de resoluções", { skip: !apiAvailable }, () => {
  const simulations = catalog.filterCatalog(items, "", "simulador");
  const solutions = catalog.filterCatalog(items, "", "resolucao");

  assert.deepEqual(simulations.map((item) => item.id), ["cargas-e-vetores"]);
  assert.deepEqual(solutions.map((item) => item.id), ["halliday-21-13"]);
});

test("registro tem ids únicos, tipos válidos e caminhos locais seguros", () => {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const item of items) {
    assert.ok(["simulador", "resolucao"].includes(item.kind));
    assert.ok(item.title.length > 0);
    assert.ok(item.description.length > 0);
    assert.ok(Array.isArray(item.tags) && item.tags.length > 0);
    assert.match(item.path, /^(simuladores|exercicios)\/[a-z0-9-]+\/$/);
    assert.ok(!item.path.includes(".."));
  }
});
