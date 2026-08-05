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

test("catálogo expõe busca e registra os nove materiais", () => {
  assert.equal(typeof catalog.normalizeSearchText, "function");
  assert.equal(typeof catalog.filterCatalog, "function");
  assert.equal(items.length, 9);
});

test("busca ignora acentos e caixa", { skip: !apiAvailable }, () => {
  assert.equal(catalog.normalizeSearchText("FORÇA Elétrica"), "forca eletrica");
  const matches = catalog.filterCatalog(items, "forca", "todos");
  assert.ok(matches.some((item) => item.id === "cargas-e-vetores"));
});

test("busca encontra livro e capítulo nas etiquetas", { skip: !apiAvailable }, () => {
  const byBook = catalog.filterCatalog(items, "Halliday", "todos");
  const byChapter = catalog.filterCatalog(items, "capitulo 21", "todos");

  const expected = [
    "halliday-21-13",
    "halliday-21-18",
    "halliday-21-34",
    "halliday-21-42",
  ];
  assert.deepEqual(byBook.map((item) => item.id), expected);
  assert.deepEqual(byChapter.map((item) => item.id), expected);
});

test("escopo combina área e capítulo sem alterar a busca", { skip: !apiAvailable }, () => {
  const chapter = catalog.filterCatalog(items, "", "todos", {
    section: "exercicios",
    chapter: 21,
  });
  const exercise18 = catalog.filterCatalog(items, "21.18", "todos", {
    section: "exercicios",
    chapter: 21,
  });

  assert.deepEqual(chapter.map((item) => item.id), [
    "halliday-21-13",
    "halliday-21-18",
    "halliday-21-34",
    "halliday-21-42",
  ]);
  assert.deepEqual(exercise18.map((item) => item.id), ["halliday-21-18"]);
});

test("escopo por referência exclui exercícios de outros livros", { skip: !apiAvailable }, () => {
  const fixture = [
    ...items,
    {
      id: "outro-21-1",
      title: "Outra referência — capítulo 21",
      kind: "resolucao",
      section: "exercicios",
      reference: "Outro livro",
      chapter: 21,
      exerciseNumber: 1,
      theme: "Teste",
      description: "Item de outra referência.",
      path: "exercicios/outro-21-1/",
      tags: ["capítulo 21"],
    },
  ];

  const matches = catalog.filterCatalog(fixture, "", "todos", {
    section: "exercicios",
    chapter: 21,
    reference: "Halliday",
  });

  assert.deepEqual(matches.map((item) => item.id), [
    "halliday-21-13",
    "halliday-21-18",
    "halliday-21-34",
    "halliday-21-42",
  ]);
});

test("filtro separa simuladores, resoluções e experimentos", { skip: !apiAvailable }, () => {
  const simulations = catalog.filterCatalog(items, "", "simulador");
  const solutions = catalog.filterCatalog(items, "", "resolucao");
  const experiments = catalog.filterCatalog(items, "", "experimento", {
    section: "experimentos",
  });

  assert.deepEqual(simulations.map((item) => item.id), ["cargas-e-vetores"]);
  assert.deepEqual(solutions.map((item) => item.id), [
    "halliday-21-13",
    "halliday-21-18",
    "halliday-21-34",
    "halliday-21-42",
  ]);
  assert.deepEqual(experiments.map((item) => item.id), [
    "experimento-01-campo-corrente",
    "experimento-02-campo-solenoide",
    "experimento-03-forca-magnetica-motor",
    "experimento-04-inducao-eletromagnetica",
  ]);
});

test("busca encontra conceitos dos novos experimentos", { skip: !apiAvailable }, () => {
  const induction = catalog.filterCatalog(items, "inducao", "todos");
  const solenoid = catalog.filterCatalog(items, "solenoide", "todos");

  assert.deepEqual(induction.map((item) => item.id), [
    "experimento-04-inducao-eletromagnetica",
  ]);
  assert.deepEqual(solenoid.map((item) => item.id), [
    "experimento-02-campo-solenoide",
  ]);
});

test("registro fornece os metadados que orientam cada área", () => {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const item of items) {
    assert.ok(["simulador", "resolucao", "experimento"].includes(item.kind));
    assert.ok(["simulacoes", "exercicios", "experimentos"].includes(item.section));
    assert.ok(item.title.length > 0);
    assert.ok(item.description.length > 0);
    assert.ok(Array.isArray(item.tags) && item.tags.length > 0);
    assert.match(item.path, /^(simuladores|exercicios|experimentos)\/[a-z0-9-]+\/$/);
    assert.ok(!item.path.includes(".."));

    if (item.section === "exercicios") {
      assert.equal(item.reference, "Halliday");
      assert.equal(item.chapter, 21);
      assert.equal(typeof item.exerciseNumber, "number");
    }
  }
});
