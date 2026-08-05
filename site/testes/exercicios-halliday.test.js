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
    (html.match(/role="tab"/g) ?? []).length,
    3,
    "a página deve oferecer três abas",
  );
  assert.equal(
    (html.match(/role="tabpanel"/g) ?? []).length,
    3,
    "cada aba deve controlar um painel",
  );
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
  assert.match(html, /<title(?:\s+id="[^"]+")?>[^<]+<\/title>/);
  assert.match(html, /<desc(?:\s+id="[^"]+")?>[^<]+<\/desc>/);
  if (exerciseNumber === "13") {
    assert.match(html, /src="\.\/app\.js"/);
  } else {
    assert.match(html, /src="\.\.\/exercicio-estatico\.js"/);
  }
  assert.match(html, new RegExp(`Halliday[^<]*21\\.${exerciseNumber}`));
}

function assertTypesetMathematics(html, exerciseNumber) {
  assert.match(
    html,
    /\\begin\{aligned\}/,
    "o exercício " + exerciseNumber + " deve alinhar deduções em LaTeX",
  );
  assert.match(
    html,
    /\\frac\{/,
    "o exercício " + exerciseNumber + " deve compor frações com \\frac",
  );
  assert.match(
    html,
    /\\vec\{/,
    "o exercício " + exerciseNumber + " deve representar vetores em LaTeX",
  );
  assert.doesNotMatch(html, /μ₀I\/\(2πr\)/);
  assert.doesNotMatch(html, /x<sup>3<\/sup>\s*=/);
  assert.doesNotMatch(html, /1\/\(2 cos<sup>3<\/sup> θ\)/);
  assert.doesNotMatch(html, /class="vector-symbol"/);
}

test("21.13 compõe a solução de equilíbrio com notação matemática", async () => {
  const html = await readExercisePage("halliday-21-13");

  assertAccessibleLessonPage(html, "13");
  assertTypesetMathematics(html, "13");
  assert.match(html, /-13,66/);
  assert.match(html, /y\s*&=\s*0/);
});

test("21.18 publica a razão entre as cargas com diagrama acessível", async () => {
  const html = await readExercisePage("halliday-21-18");

  assertAccessibleLessonPage(html, "18");
  assertTypesetMathematics(html, "18");
  assert.match(html, /1,33/);
  assert.match(html, /2,014/);
  assert.match(html, /2,877/);
});

test("21.34 publica os três menores ângulos possíveis", async () => {
  const html = await readExercisePage("halliday-21-34");

  assertAccessibleLessonPage(html, "34");
  assertTypesetMathematics(html, "34");
  assert.match(html, /37,47°/);
  assert.match(html, /50,95°/);
  assert.match(html, /56,61°/);
  assert.match(html, /\\cos\^3\\theta/);
});

test("21.42 publica a expressão e o módulo da carga", async () => {
  const html = await readExercisePage("halliday-21-42");

  assertAccessibleLessonPage(html, "42");
  assertTypesetMathematics(html, "42");
  assert.match(html, /2,38/);
  assert.match(html, /24\\,\\mathrm\{nC\}/);
  assert.match(html, /x\^3/);
});
