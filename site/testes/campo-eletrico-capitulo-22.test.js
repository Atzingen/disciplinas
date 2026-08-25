import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lessons = [
  {
    slug: "tematico-22-1-anel-eixo-z",
    id: "tematico-22-1-anel-eixo-z",
    label: "Temático 1",
    answer: /Q(?:\\,)?z[\s\S]*\(z\^2\s*\+\s*R\^2\)\^\{3\/2\}/,
  },
  {
    slug: "tematico-22-2-segmento-anel",
    id: "tematico-22-2-segmento-anel",
    label: "Temático 2",
    answer: /-\s*\\frac\{\\lambda\}\{2\\pi\\varepsilon_0\s*R\}/,
  },
  {
    slug: "tematico-22-3-barra-finita",
    id: "tematico-22-3-barra-finita",
    label: "Temático 3",
    answer: /\\sqrt\{L\^2\s*\+\s*z\^2\}/,
  },
  {
    slug: "tematico-22-4-barra-infinita",
    id: "tematico-22-4-barra-infinita",
    label: "Temático 4",
    answer: /\\frac\{\\lambda\}\{2\\pi\\varepsilon_0\s*z\}/,
  },
  {
    slug: "tematico-22-5-disco-plano-infinito",
    id: "tematico-22-5-disco-plano-infinito",
    label: "Temático 5",
    answer: /1\s*-\s*\\frac\{z\}\{\\sqrt\{z\^2\s*\+\s*R\^2\}\}/,
  },
  {
    slug: "halliday-22-24",
    id: "halliday-22-24",
    label: "Halliday 22.24",
    answer: /3(?:\{,\}|,)46\\times10\^\{?7\}?/,
  },
  {
    slug: "halliday-22-26",
    id: "halliday-22-26",
    label: "Halliday 22.26",
    answer: /20(?:\{,\}|,)6[\s\S]*270\^\{?\\circ\}?/,
  },
  {
    slug: "halliday-22-28",
    id: "halliday-22-28",
    label: "Halliday 22.28",
    answer: /1(?:\{,\}|,)70\\,?\\mathrm\{cm\}/,
  },
];

async function readLesson(slug) {
  try {
    return await readFile(
      new URL(`../exercicios/${slug}/index.html`, import.meta.url),
      "utf8",
    );
  } catch {
    return "";
  }
}

for (const lesson of lessons) {
  test(`${lesson.label} publica resolução LaTeX e desenho acessível`, async () => {
    const html = await readLesson(lesson.slug);

    assert.ok(html.length > 0, `${lesson.slug} deve existir`);
    assert.equal((html.match(/class="lesson-section"/g) ?? []).length, 3);
    assert.match(html, /<a href="#enunciado">/);
    assert.match(html, /<a href="#resolucao">/);
    assert.match(html, /<a href="#diagrama">/);
    assert.match(html, /<a href="\.\.\/capitulo-22\/">/);
    assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
    assert.match(html, /<title(?:\s+id="[^"]+")?>[^<]+<\/title>/);
    assert.match(html, /<desc(?:\s+id="[^"]+")?>[^<]+<\/desc>/);
    assert.match(html, /\\begin\{aligned\}/);
    assert.match(html, /\\frac\{/);
    assert.match(html, /\\vec\{E\}/);
    assert.match(html, lesson.answer);
    assert.match(html, new RegExp(`data-current-id="${lesson.id}"`));
    assert.match(html, /data-chapter="22"/);
    assert.match(html, /src="\.\.\/\.\.\/componentes\/navegacao-exercicios\.js"/);
    assert.match(html, /src="\.\.\/exercicio-estatico\.js"/);
  });
}

test("o capítulo 22 separa temáticos e Halliday em catálogos distintos", async () => {
  const html = await readFile(
    new URL("../exercicios/capitulo-22/index.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /id="thematic-title">Exercícios temáticos/);
  assert.match(html, /id="halliday-title">Exercícios do livro/);
  assert.match(html, /reference:\s*"Temático"/);
  assert.match(html, /reference:\s*"Halliday"/);
  assert.equal((html.match(/mountCatalog\(/g) ?? []).length, 2);
});
