import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSitePage(path) {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  } catch {
    return "";
  }
}

function count(html, pattern) {
  return (html.match(pattern) ?? []).length;
}

const sitePages = [
  ["index.html", "./favicon.svg"],
  ["exercicios/index.html", "../favicon.svg"],
  ["exercicios/capitulo-21/index.html", "../../favicon.svg"],
  ["exercicios/halliday-21-13/index.html", "../../favicon.svg"],
  ["exercicios/halliday-21-18/index.html", "../../favicon.svg"],
  ["exercicios/halliday-21-34/index.html", "../../favicon.svg"],
  ["exercicios/halliday-21-42/index.html", "../../favicon.svg"],
  ["experimentos/index.html", "../favicon.svg"],
  ["experimentos/01-campo-corrente/index.html", "../../favicon.svg"],
  ["experimentos/02-campo-solenoide/index.html", "../../favicon.svg"],
  ["experimentos/03-forca-magnetica-motor/index.html", "../../favicon.svg"],
  ["experimentos/04-inducao-eletromagnetica/index.html", "../../favicon.svg"],
  ["simuladores/index.html", "../favicon.svg"],
  ["simuladores/cargas-e-vetores/index.html", "../../favicon.svg"],
];

test("todas as páginas declaram o favicon compartilhado", async () => {
  const icon = await readSitePage("favicon.svg");
  assert.match(icon, /<svg\b/);

  for (const [path, href] of sitePages) {
    const html = await readSitePage(path);
    assert.match(
      html,
      new RegExp(`<link rel="icon" href="${href.replaceAll(".", "\\.")}" type="image/svg\\+xml">`),
      `favicon ausente ou incorreto em ${path}`,
    );
  }
});

test("página inicial oferece as três áreas e o filtro de experimentos", async () => {
  const html = await readSitePage("index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /href="\.\/exercicios\/"/);
  assert.match(html, /href="\.\/experimentos\/"/);
  assert.match(html, /href="\.\/simuladores\/"/);
  assert.match(html, /data-catalog-filter="experimento"/);
  assert.match(html, /data-site-navigation/);
});

test("índice de exercícios encaminha ao capítulo 21", async () => {
  const html = await readSitePage("exercicios/index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /href="\.\/capitulo-21\/"/);
  assert.match(html, /4 exercícios/);
  assert.match(html, /data-active-section="exercicios"/);
});

test("capítulo 21 monta catálogo no escopo correto", async () => {
  const html = await readSitePage("exercicios/capitulo-21/index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /section:\s*"exercicios"/);
  assert.match(html, /chapter:\s*21/);
  assert.match(html, /pathPrefix:\s*"\.\.\/\.\.\/"/);
});

test("índices de experimentos e simulações limitam seus catálogos", async () => {
  const experiments = await readSitePage("experimentos/index.html");
  const simulations = await readSitePage("simuladores/index.html");

  assert.equal(count(experiments, /<h1\b/g), 1);
  assert.equal(count(simulations, /<h1\b/g), 1);
  assert.match(experiments, /section:\s*"experimentos"/);
  assert.match(simulations, /section:\s*"simulacoes"/);
  assert.match(experiments, /pathPrefix:\s*"\.\.\/"/);
  assert.match(simulations, /pathPrefix:\s*"\.\.\/"/);
});

test("cada exercício expõe navegação global e sequência do capítulo", async () => {
  for (const number of [13, 18, 34, 42]) {
    const html = await readSitePage(`exercicios/halliday-21-${number}/index.html`);
    assert.match(html, /data-active-section="exercicios"/);
    assert.match(html, new RegExp(`data-current-id="halliday-21-${number}"`));
    assert.match(html, /data-chapter-url="\.\.\/capitulo-21\/"/);
    assert.match(html, /src="\.\.\/\.\.\/componentes\/navegacao-exercicios\.js"/);
  }
});

test("simulador individual mantém acesso às quatro áreas", async () => {
  const html = await readSitePage("simuladores/cargas-e-vetores/index.html");
  assert.match(html, /data-active-section="simulacoes"/);
  assert.match(html, /navegacao-principal\.js/);
});
