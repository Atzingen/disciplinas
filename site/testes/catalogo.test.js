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
  const registryUrl = new URL("../materiais.json", import.meta.url);
  items = JSON.parse(await readFile(registryUrl, "utf8"));
} catch {
  items = [];
}

const apiAvailable =
  typeof catalog.normalizeSearchText === "function" &&
  typeof catalog.filterCatalog === "function";

test("catálogo expõe busca e registra os vinte e um materiais", () => {
  assert.equal(typeof catalog.normalizeSearchText, "function");
  assert.equal(typeof catalog.filterCatalog, "function");
  assert.equal(items.length, 21);
});

test("busca ignora acentos e caixa", { skip: !apiAvailable }, () => {
  assert.equal(catalog.normalizeSearchText("FORÇA Elétrica"), "forca eletrica");
  const matches = catalog.filterCatalog(items, "forca", "todos");
  assert.ok(matches.some((item) => item.id === "cargas-e-vetores"));
});

test("caminho do cartão respeita a profundidade da página de catálogo", () => {
  assert.equal(typeof catalog.resolveCatalogPath, "function");
  assert.equal(
    catalog.resolveCatalogPath("experimentos/01-campo-corrente/", "../"),
    "../experimentos/01-campo-corrente/",
  );
  assert.equal(
    catalog.resolveCatalogPath("exercicios/halliday-21-13/", "../../"),
    "../../exercicios/halliday-21-13/",
  );
});

test("busca encontra livro e capítulo nas etiquetas", { skip: !apiAvailable }, () => {
  const byBook = catalog.filterCatalog(items, "Halliday", "todos");
  const byChapter = catalog.filterCatalog(items, "capitulo 21", "todos");

  const expectedChapter21 = [
    "halliday-21-13",
    "halliday-21-18",
    "halliday-21-33",
    "halliday-21-34",
    "halliday-21-42",
  ];
  assert.deepEqual(byBook.map((item) => item.id), [
    ...expectedChapter21,
    "halliday-22-24",
    "halliday-22-26",
    "halliday-22-28",
  ]);
  assert.deepEqual(byChapter.map((item) => item.id), expectedChapter21);
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
    "halliday-21-33",
    "halliday-21-34",
    "halliday-21-42",
  ]);
  assert.deepEqual(exercise18.map((item) => item.id), ["halliday-21-18"]);
});

test("escopo por disciplina mantém teoria e laboratório separados", { skip: !apiAvailable }, () => {
  const electromagnetism = catalog.filterCatalog(items, "", "todos", {
    discipline: "PRCFEMG",
  });
  const laboratory = catalog.filterCatalog(items, "", "todos", {
    discipline: "PRCLFBE",
  });

  assert.equal(electromagnetism.length, 14);
  assert.equal(laboratory.length, 7);
  assert.ok(electromagnetism.every((item) => item.kind !== "experimento"));
  assert.ok(laboratory.some((item) => item.id === "cuba-eletrolitica-potencial"));
  assert.ok(laboratory.every((item) => item.disciplines.includes("PRCLFBE")));
});

test("uma simulação marcada com várias disciplinas aparece em cada uma delas", { skip: !apiAvailable }, () => {
  const shared = [
    { id: "a", kind: "simulador", section: "simulacoes", disciplines: ["PRCFEMG", "PRCLFBE"], title: "a", theme: "", description: "", tags: [] },
    { id: "b", kind: "simulador", section: "simulacoes", disciplines: ["PRCLFBE"], title: "b", theme: "", description: "", tags: [] },
  ];
  const ids = (scope) => catalog.filterCatalog(shared, "", "todos", scope).map((item) => item.id);

  assert.deepEqual(ids({ discipline: "PRCFEMG" }), ["a"]);
  assert.deepEqual(ids({ discipline: "PRCLFBE" }), ["a", "b"]);
  assert.deepEqual(ids({}), ["a", "b"]);
  assert.deepEqual(catalog.itemDisciplines({ discipline: "PRCFEMG" }), ["PRCFEMG"]);
});

test("capítulo 22 mantém sequências temáticas e Halliday separadas", { skip: !apiAvailable }, () => {
  const thematic = catalog.filterCatalog(items, "", "todos", {
    section: "exercicios",
    chapter: 22,
    reference: "Temático",
  });
  const halliday = catalog.filterCatalog(items, "", "todos", {
    section: "exercicios",
    chapter: 22,
    reference: "Halliday",
  });

  assert.deepEqual(thematic.map((item) => item.exerciseNumber), [1, 2, 3, 4, 5]);
  assert.deepEqual(halliday.map((item) => item.exerciseNumber), [24, 26, 28]);
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
    "halliday-21-33",
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

  assert.deepEqual(simulations.map((item) => item.id), [
    "cargas-e-vetores",
    "cuba-eletrolitica-potencial",
  ]);
  assert.deepEqual(solutions.map((item) => item.id), [
    "halliday-21-13",
    "halliday-21-18",
    "halliday-21-33",
    "halliday-21-34",
    "halliday-21-42",
    "tematico-22-1-anel-eixo-z",
    "tematico-22-2-segmento-anel",
    "tematico-22-3-barra-finita",
    "tematico-22-4-barra-infinita",
    "tematico-22-5-disco-plano-infinito",
    "halliday-22-24",
    "halliday-22-26",
    "halliday-22-28",
  ]);
  assert.deepEqual(experiments.map((item) => item.id), [
    "experimento-01-campo-corrente",
    "experimento-02-campo-solenoide",
    "experimento-03-forca-magnetica-motor",
    "experimento-04-inducao-eletromagnetica",
    "experimento-05-escada-resistores",
    "experimento-06-cuba-eletrolitica",
  ]);
});

test("busca encontra conceitos dos novos experimentos", { skip: !apiAvailable }, () => {
  const induction = catalog.filterCatalog(items, "inducao", "todos");
  const solenoid = catalog.filterCatalog(items, "solenoide", "todos");
  const equipotential = catalog.filterCatalog(items, "equipotenciais", "todos");

  assert.deepEqual(induction.map((item) => item.id), [
    "experimento-04-inducao-eletromagnetica",
  ]);
  assert.deepEqual(solenoid.map((item) => item.id), [
    "experimento-02-campo-solenoide",
  ]);
  assert.deepEqual(equipotential.map((item) => item.id), [
    "cuba-eletrolitica-potencial",
    "experimento-06-cuba-eletrolitica",
  ]);
});

test("registro fornece os metadados que orientam cada área", () => {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const item of items) {
    assert.ok(["simulador", "resolucao", "experimento"].includes(item.kind));
    assert.ok(["simulacoes", "exercicios", "experimentos"].includes(item.section));
    assert.ok(Array.isArray(item.disciplines) && item.disciplines.length > 0);
    assert.ok(
      item.disciplines.every((code) => ["PRCFEMG", "PRCLFBE"].includes(code)),
    );
    assert.ok(item.title.length > 0);
    assert.ok(item.description.length > 0);
    assert.ok(Array.isArray(item.tags) && item.tags.length > 0);
    assert.match(item.path, /^(simuladores|exercicios|experimentos)\/[a-z0-9-]+\/$/);
    assert.ok(!item.path.includes(".."));

    if (item.section === "exercicios") {
      assert.ok(["Halliday", "Temático"].includes(item.reference));
      assert.ok([21, 22].includes(item.chapter));
      assert.equal(typeof item.exerciseNumber, "number");
    }
  }
});
