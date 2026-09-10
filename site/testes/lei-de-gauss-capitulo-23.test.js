import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lessons = [
  {
    number: 4,
    label: "Halliday 23.4",
    answers: [/-1(?:\{,\}|,)1\\times10\^\{-4\}/],
  },
  {
    number: 5,
    label: "Halliday 23.5",
    answers: [/3(?:\{,\}|,)01\\times10\^\{-9\}/, /\\frac\{e\}\{6\\varepsilon_0\}/],
  },
  {
    number: 9,
    label: "Halliday 23.9",
    answers: [/8(?:\{,\}|,)23\\,?\\mathrm\{N/, /7(?:\{,\}|,)29\\times10\^\{-11\}/],
  },
  {
    number: 11,
    label: "Halliday 23.11",
    answers: [/-2(?:\{,\}|,)83\\times10\^\{-9\}/, /-320/],
  },
  {
    number: 16,
    label: "Halliday 23.16",
    answers: [/b\s*=\s*2(?:\{,\}|,)00\\,?\\mathrm\{N\/\(C\\,m\)\}/],
  },
  {
    number: 24,
    label: "Halliday 23.24",
    answers: [/5(?:\{,\}|,)99\\times10\^\{3\}/, /1(?:\{,\}|,)20\\times10\^\{4\}/],
  },
  {
    number: 27,
    label: "Halliday 23.27",
    answers: [/3(?:\{,\}|,)8\\times10\^\{-8\}\\,?\\mathrm\{C\/m\^2\}/],
  },
  {
    number: 29,
    label: "Halliday 23.29",
    answers: [/0(?:\{,\}|,)214\\,?\\mathrm\{N\/C\}/, /0(?:\{,\}|,)855\\,?\\mathrm\{N\/C\}/, /-3(?:\{,\}|,)40\\times10\^\{-12\}/],
  },
  {
    number: 34,
    label: "Halliday 23.34",
    answers: [/0(?:\{,\}|,)208\\,?\\mathrm\{N\/C\}/, /\\hat\{k\}/],
  },
  {
    number: 45,
    label: "Halliday 23.45",
    answers: [/2(?:\{,\}|,)50\\times10\^\{4\}/, /1(?:\{,\}|,)35\\times10\^\{4\}/],
  },
  {
    number: 49,
    label: "Halliday 23.49",
    answers: [/5(?:\{,\}|,)62\\times10\^\{-2\}/, /0(?:\{,\}|,)112\\,?\\mathrm\{N\/C\}/, /4(?:\{,\}|,)99\\times10\^\{-2\}/, /-5(?:\{,\}|,)00\\,?\\mathrm\{fC\}/],
  },
  {
    number: 52,
    label: "Halliday 23.52",
    answers: [/7(?:\{,\}|,)32\\,?\\mathrm\{N\/C\}/, /12(?:\{,\}|,)1\\,?\\mathrm\{N\/C\}/, /1(?:\{,\}|,)35\\,?\\mathrm\{N\/C\}/],
  },
];

export const chapter23Slugs = lessons.map((lesson) => `halliday-23-${lesson.number}`);

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
  const slug = `halliday-23-${lesson.number}`;

  test(`${lesson.label} publica resolução pela lei de Gauss com desenho acessível`, async () => {
    const html = await readLesson(slug);

    assert.ok(html.length > 0, `${slug} deve existir`);
    assert.equal((html.match(/class="lesson-section"/g) ?? []).length, 3);
    assert.match(html, /data-section-nav/);
    assert.match(html, /<a href="#enunciado">/);
    assert.match(html, /<a href="#resolucao">/);
    assert.match(html, /<a href="#diagrama">/);
    assert.match(html, /<a href="\.\.\/">Exercícios<\/a>/);
    assert.match(html, /<a href="\.\.\/capitulo-23\/">Lei de Gauss · Capítulo 23<\/a>/);
    assert.match(html, new RegExp(`aria-current="page">Exercício ${lesson.number}<`));
    assert.match(html, new RegExp(`Halliday[^<]*23\\.${lesson.number}`));
    assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
    assert.match(html, /<title(?:\s+id="[^"]+")?>[^<]+<\/title>/);
    assert.match(html, /<desc(?:\s+id="[^"]+")?>[^<]+<\/desc>/);
    assert.match(html, /\\begin\{aligned\}/);
    assert.match(html, /\\frac\{/);
    assert.match(html, /\\vec\{E\}/);
    assert.match(html, /\\oint/);
    assert.match(html, /\\varepsilon_0/);
    for (const answer of lesson.answers) {
      assert.match(html, answer, `${slug} deve publicar a resposta ${answer}`);
    }
    assert.match(html, new RegExp(`data-current-id="${slug}"`));
    assert.match(html, /data-chapter-url="\.\.\/capitulo-23\/"/);
    assert.match(html, /data-chapter="23"/);
    assert.match(html, /data-active-section="exercicios"/);
    assert.match(html, /localStorage\.getItem\("tema"\)/);
    assert.match(html, /src="\.\.\/\.\.\/componentes\/navegacao-exercicios\.js"/);
    assert.match(html, /src="\.\.\/exercicio-estatico\.js"/);
  });
}

test("o capítulo 23 monta o catálogo Halliday no escopo correto", async () => {
  const html = await readFile(
    new URL("../exercicios/capitulo-23/index.html", import.meta.url),
    "utf8",
  );

  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /section:\s*"exercicios"/);
  assert.match(html, /chapter:\s*23/);
  assert.match(html, /reference:\s*"Halliday"/);
  assert.match(html, /pathPrefix:\s*"\.\.\/\.\.\/"/);
  assert.match(html, /data-active-section="exercicios"/);
  assert.match(html, /localStorage\.getItem\("tema"\)/);
});

test("o registro lista os doze exercícios do capítulo 23 em ordem crescente", async () => {
  const items = JSON.parse(
    await readFile(new URL("../materiais.json", import.meta.url), "utf8"),
  );
  const chapter = items.filter(
    (item) => item.reference === "Halliday" && item.chapter === 23,
  );

  assert.deepEqual(
    chapter.map((item) => item.exerciseNumber),
    [4, 5, 9, 11, 16, 24, 27, 29, 34, 45, 49, 52],
  );
  assert.deepEqual(chapter.map((item) => item.id), chapter23Slugs);
  for (const item of chapter) {
    assert.equal(item.path, `exercicios/${item.id}/`);
    assert.ok(item.tags.includes(`23.${item.exerciseNumber}`));
  }
});
