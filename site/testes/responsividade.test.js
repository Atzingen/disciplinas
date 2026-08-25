import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseCss = await readFile(new URL("../assets/base.css", import.meta.url), "utf8");
const experimentCss = await readFile(
  new URL("../assets/experimentos.css", import.meta.url),
  "utf8",
);
const electricFieldCss = await readFile(
  new URL("../assets/campo-eletrico.css", import.meta.url),
  "utf8",
);

test("títulos das áreas permanecem dentro da largura móvel", () => {
  assert.match(
    baseCss,
    /@media\s*\(max-width:\s*560px\)[\s\S]*?h1\s*\{[\s\S]*?font-size:\s*clamp\(3\.25rem,\s*17vw,\s*5rem\)/,
  );
});

test("títulos longos dos experimentos permanecem dentro da largura móvel", () => {
  assert.match(
    experimentCss,
    /@media\s*\(max-width:\s*520px\)[\s\S]*?\.experiment-hero h1\s*\{[\s\S]*?font-size:\s*clamp\(2\.6rem,\s*14vw,\s*4\.7rem\)/,
  );
});

test("lições de campo elétrico contêm títulos e respostas largas no mobile", () => {
  assert.match(
    electricFieldCss,
    /\.field-page \.lesson-title-row h1\s*\{[\s\S]*?overflow-wrap:\s*anywhere/,
  );
  assert.match(
    electricFieldCss,
    /\.field-page \.answer-strip strong\s*\{[\s\S]*?overflow-x:\s*auto/,
  );
  assert.match(
    electricFieldCss,
    /\.field-page \.result-callout strong\s*\{[\s\S]*?overflow-x:\s*auto/,
  );
});

test("relatório Markdown mantém hierarquia contínua na tela e na impressão", () => {
  assert.match(experimentCss, /\.report-document--markdown\s*>\s*h2/);
  assert.match(experimentCss, /\.report-document--markdown\s+\.data-table-wrapper/);
  assert.match(
    experimentCss,
    /@media\s+print[\s\S]*?\.report-document--markdown\s*>\s*h2/,
  );
  assert.match(
    experimentCss,
    /@media\s+print[\s\S]*?body\s*\{[\s\S]*?font-size:\s*12pt/,
  );
  assert.match(experimentCss, /@page\s*\{[\s\S]*?size:\s*A4/);
});
