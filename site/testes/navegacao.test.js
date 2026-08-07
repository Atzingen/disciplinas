import assert from "node:assert/strict";
import test from "node:test";

let navigation = {};
let exerciseNavigation = {};

try {
  navigation = await import("../componentes/navegacao-principal.js");
} catch {
  navigation = {};
}

try {
  exerciseNavigation = await import("../componentes/navegacao-exercicios.js");
} catch {
  exerciseNavigation = {};
}

let sectionNavigation = {};

try {
  sectionNavigation = await import("../componentes/navegacao-secoes.js");
} catch {
  sectionNavigation = {};
}

test("navegação principal resolve as quatro áreas a partir da raiz informada", () => {
  assert.equal(typeof navigation.buildMainNavigation, "function");
  assert.deepEqual(navigation.buildMainNavigation("../../", "exercicios"), [
    { id: "inicio", label: "Início", href: "../../", current: false },
    {
      id: "exercicios",
      label: "Exercícios",
      href: "../../exercicios/",
      current: true,
    },
    {
      id: "experimentos",
      label: "Experimentos",
      href: "../../experimentos/",
      current: false,
    },
    {
      id: "simulacoes",
      label: "Simulações",
      href: "../../simuladores/",
      current: false,
    },
  ]);
});

test("somente a área ativa recebe estado atual", () => {
  const links = navigation.buildMainNavigation("../", "experimentos");
  assert.deepEqual(
    links.filter((link) => link.current).map((link) => link.id),
    ["experimentos"],
  );
});

const exerciseFixture = [
  { id: "halliday-21-42", reference: "Halliday", chapter: 21, exerciseNumber: 42 },
  { id: "outra-21-1", reference: "Outra", chapter: 21, exerciseNumber: 1 },
  { id: "halliday-21-13", reference: "Halliday", chapter: 21, exerciseNumber: 13 },
  { id: "halliday-22-1", reference: "Halliday", chapter: 22, exerciseNumber: 1 },
  { id: "halliday-21-34", reference: "Halliday", chapter: 21, exerciseNumber: 34 },
  { id: "halliday-21-18", reference: "Halliday", chapter: 21, exerciseNumber: 18 },
];

test("sequência do capítulo filtra a referência e ordena pelo número", () => {
  assert.equal(typeof exerciseNavigation.chapterSequence, "function");
  const sequence = exerciseNavigation.chapterSequence(exerciseFixture, "Halliday", 21);

  assert.deepEqual(sequence.map((item) => item.id), [
    "halliday-21-13",
    "halliday-21-18",
    "halliday-21-34",
    "halliday-21-42",
  ]);
  assert.equal(exerciseFixture[0].id, "halliday-21-42");
});

test("adjacência respeita as duas fronteiras do capítulo", () => {
  assert.equal(typeof exerciseNavigation.adjacentExercises, "function");
  const sequence = exerciseNavigation.chapterSequence(exerciseFixture, "Halliday", 21);
  const first = exerciseNavigation.adjacentExercises(sequence, "halliday-21-13");
  const middle = exerciseNavigation.adjacentExercises(sequence, "halliday-21-18");
  const last = exerciseNavigation.adjacentExercises(sequence, "halliday-21-42");

  assert.equal(first.previous, null);
  assert.equal(first.current.id, "halliday-21-13");
  assert.equal(first.next.id, "halliday-21-18");
  assert.equal(middle.previous.id, "halliday-21-13");
  assert.equal(middle.next.id, "halliday-21-34");
  assert.equal(last.previous.id, "halliday-21-34");
  assert.equal(last.next, null);
});

test("alternância de tema parte do claro e volta ao claro", () => {
  assert.equal(typeof navigation.nextTheme, "function");
  assert.equal(navigation.nextTheme("claro"), "escuro");
  assert.equal(navigation.nextTheme("escuro"), "claro");
  assert.equal(navigation.nextTheme(undefined), "escuro");
  assert.equal(navigation.THEME_KEY, "tema");
});

test("a seção ativa é a última que já passou pelo topo", () => {
  assert.equal(typeof sectionNavigation.currentSection, "function");

  const secoes = [
    { id: "enunciado", top: 0 },
    { id: "resolucao", top: 900 },
    { id: "substancias", top: 2400 },
  ];

  assert.equal(sectionNavigation.currentSection(secoes, 0), "enunciado");
  assert.equal(sectionNavigation.currentSection(secoes, 880), "enunciado");
  assert.equal(sectionNavigation.currentSection(secoes, 900), "resolucao");
  assert.equal(sectionNavigation.currentSection(secoes, 5000), "substancias");
  assert.equal(sectionNavigation.currentSection([], 10), null);
});
