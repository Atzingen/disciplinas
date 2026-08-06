import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readExercisePage(slug) {
  try {
    return await readFile(
      new URL(`../exercicios/${slug}/index.html`, import.meta.url),
      "utf8",
    );
  } catch {
    return "";
  }
}

function assertAccessibleLessonPage(html, exerciseNumber) {
  assert.ok(html.length > 0, `a página do exercício ${exerciseNumber} deve existir`);
  assert.equal(
    (html.match(/class="lesson-section"/g) ?? []).length,
    3,
    "enunciado, resolução e apoio ficam na mesma página",
  );
  assert.match(html, /data-section-nav/);
  assert.match(html, /<a href="#enunciado">/);
  assert.match(html, /<a href="#resolucao">/);
  assert.match(html, /<a href="\.\.\/capitulo-21\/">/);
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
  assert.match(html, /<title(?:\s+id="[^"]+")?>[^<]+<\/title>/);
  assert.match(html, /<desc(?:\s+id="[^"]+")?>[^<]+<\/desc>/);
  assert.match(html, /src="\.\.\/exercicio-estatico\.js"/);
  assert.match(html, new RegExp(`Halliday[^<]*21\\.${exerciseNumber}`));
}

test("21.18 publica a razão entre as cargas com diagrama acessível", async () => {
  const html = await readExercisePage("halliday-21-18");

  assertAccessibleLessonPage(html, "18");
  assert.match(html, /1,33/);
  assert.match(html, /2,014 × 10<sup>−23<\/sup> N/);
  assert.match(html, /2,877 × 10<sup>−24<\/sup> N/);
});

test("21.33 publica a carga positiva e o explorador de substâncias", async () => {
  const html = await readExercisePage("halliday-21-33");

  assert.ok(html.length > 0, "a página do exercício 33 deve existir");
  assert.equal((html.match(/class="lesson-section"/g) ?? []).length, 3);
  assert.match(html, /<a href="#substancias">/);
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
  assert.match(html, /Halliday[^<]*21\.33/);
  assert.match(html, /1,34 × 10<sup>7<\/sup> C/);
  assert.match(html, /8,35 × 10<sup>25<\/sup> prótons/);
  assert.match(html, /Z = 2\(1\) \+ 8 = 10/);
  assert.match(html, /data-substance-explorer/);
  assert.match(html, /src="\.\/app\.js"/);
});

test("21.34 publica os três menores ângulos possíveis", async () => {
  const html = await readExercisePage("halliday-21-34");

  assertAccessibleLessonPage(html, "34");
  assert.match(html, /37,47°/);
  assert.match(html, /50,95°/);
  assert.match(html, /56,61°/);
  assert.match(html, /cos<sup>3<\/sup> θ/);
});

test("21.42 publica a expressão e o módulo da carga", async () => {
  const html = await readExercisePage("halliday-21-42");

  assertAccessibleLessonPage(html, "42");
  assert.match(html, /2,38 × 10<sup>−8<\/sup> C/);
  assert.match(html, /24 nC/);
  assert.match(html, /x<sup>3<\/sup>/);
});
