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

test("navegação principal resolve o portal e as disciplinas a partir da raiz", () => {
  assert.equal(typeof navigation.buildMainNavigation, "function");
  assert.deepEqual(navigation.buildMainNavigation("../../", "exercicios"), [
    { id: "inicio", label: "Início", href: "../../", current: false },
    {
      id: "disciplinas",
      label: "Disciplinas",
      current: true,
      children: [
        {
          id: "prcfemg",
          label: "PRCFEMG — Fundamentos do Eletromagnetismo",
          href: "../../disciplinas/prcfemg/",
          current: true,
        },
        {
          id: "prclfbe",
          label: "PRCLFBE — Laboratório de Física Básica: Eletromagnetismo",
          href: "../../disciplinas/prclfbe/",
          current: false,
        },
      ],
    },
    {
      id: "simulacoes",
      label: "Simulações",
      href: "../../simuladores/",
      current: false,
    },
    {
      id: "sobre",
      label: "Sobre",
      href: "../../#sobre",
      current: false,
    },
  ]);
});

test("simulações formam uma área própria fora das disciplinas", () => {
  const links = navigation.buildMainNavigation("../", "simulacoes");
  const simulations = links.find((link) => link.id === "simulacoes");
  const disciplines = links.find((link) => link.id === "disciplinas");

  assert.equal(simulations.current, true);
  assert.equal(simulations.href, "../simuladores/");
  assert.equal(disciplines.current, false);
  assert.ok(disciplines.children.every((link) => link.current === false));
});

test("áreas legadas ativam a disciplina correspondente", () => {
  const links = navigation.buildMainNavigation("../", "experimentos");
  const disciplines = links.find((link) => link.id === "disciplinas");
  assert.equal(disciplines.current, true);
  assert.deepEqual(
    disciplines.children.filter((link) => link.current).map((link) => link.id),
    ["prclfbe"],
  );

  const exerciseLinks = navigation.buildMainNavigation("../", "exercicios");
  const exerciseDisciplines = exerciseLinks.find(
    (link) => link.id === "disciplinas",
  );
  assert.deepEqual(
    exerciseDisciplines.children
      .filter((link) => link.current)
      .map((link) => link.id),
    ["prcfemg"],
  );
});

test("disciplinas ocupam um único item expansível na navegação principal", () => {
  const links = navigation.buildMainNavigation("./", "inicio");
  const disciplines = links.find((link) => link.id === "disciplinas");

  assert.deepEqual(links.map((link) => link.id), [
    "inicio",
    "disciplinas",
    "simulacoes",
    "sobre",
  ]);
  assert.equal(disciplines.children.length, 2);
  assert.deepEqual(
    disciplines.children.map((discipline) => discipline.id),
    ["prcfemg", "prclfbe"],
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

test("rótulo da sequência distingue temáticos de exercícios do livro", () => {
  assert.equal(typeof exerciseNavigation.exerciseLabel, "function");
  assert.equal(
    exerciseNavigation.exerciseLabel({ exerciseNumber: 3, seriesLabel: "Temático" }),
    "Temático 3",
  );
  assert.equal(
    exerciseNavigation.exerciseLabel({ exerciseNumber: 24 }),
    "Exercício 24",
  );
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
