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

test("página inicial oferece as três áreas e o filtro de experimentos", async () => {
  const html = await readSitePage("index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /href="\.\/exercicios\/"/);
  assert.match(html, /href="\.\/experimentos\/"/);
  assert.match(html, /href="\.\/simuladores\/"/);
  assert.match(html, /data-catalog-filter="experimento"/);
  assert.match(html, /data-site-navigation/);
});

test("índice de exercícios encaminha aos capítulos 21 e 22", async () => {
  const html = await readSitePage("exercicios/index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /href="\.\/capitulo-21\/"/);
  assert.match(html, /href="\.\/capitulo-22\/"/);
  assert.match(html, /5 exercícios/);
  assert.match(html, /8 resoluções/);
  assert.match(html, /data-active-section="exercicios"/);
});

test("capítulo 22 separa o catálogo temático do catálogo Halliday", async () => {
  const html = await readSitePage("exercicios/capitulo-22/index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /chapter:\s*22/);
  assert.match(html, /reference:\s*"Temático"/);
  assert.match(html, /reference:\s*"Halliday"/);
  assert.match(html, /pathPrefix:\s*"\.\.\/\.\.\/"/);
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
  for (const number of [13, 18, 33, 34, 42]) {
    const html = await readSitePage(`exercicios/halliday-21-${number}/index.html`);
    assert.match(html, /data-active-section="exercicios"/);
    assert.match(html, new RegExp(`data-current-id="halliday-21-${number}"`));
    assert.match(html, /data-chapter-url="\.\.\/capitulo-21\/"/);
    assert.match(html, /src="\.\.\/\.\.\/componentes\/navegacao-exercicios\.js"/);
  }
});

test("os oito materiais de campo elétrico apontam para o capítulo 22", async () => {
  const slugs = [
    "tematico-22-1-anel-eixo-z",
    "tematico-22-2-segmento-anel",
    "tematico-22-3-barra-finita",
    "tematico-22-4-barra-infinita",
    "tematico-22-5-disco-plano-infinito",
    "halliday-22-24",
    "halliday-22-26",
    "halliday-22-28",
  ];

  for (const slug of slugs) {
    const html = await readSitePage(`exercicios/${slug}/index.html`);
    assert.match(html, /data-active-section="exercicios"/, slug);
    assert.match(html, new RegExp(`data-current-id="${slug}"`), slug);
    assert.match(html, /data-chapter-url="\.\.\/capitulo-22\/"/, slug);
    assert.match(html, /data-chapter="22"/, slug);
  }
});

test("simulador individual mantém acesso às quatro áreas", async () => {
  const html = await readSitePage("simuladores/cargas-e-vetores/index.html");
  assert.match(html, /data-active-section="simulacoes"/);
  assert.match(html, /navegacao-principal\.js/);
});

test("cada página restaura o tema escolhido antes de pintar a tela", async () => {
  const paginas = [
    "index.html",
    "exercicios/index.html",
    "exercicios/capitulo-21/index.html",
    "exercicios/capitulo-22/index.html",
    "exercicios/halliday-21-33/index.html",
    "experimentos/index.html",
    "experimentos/01-campo-corrente/index.html",
    "simuladores/index.html",
    "simuladores/cargas-e-vetores/index.html",
  ];

  for (const pagina of paginas) {
    const html = await readSitePage(pagina);
    assert.match(html, /localStorage\.getItem\("tema"\)/, pagina);
    assert.match(html, /dataset\.theme\s*=\s*"escuro"/, pagina);
  }
});

test("o tema claro é o padrão e o escuro depende do atributo", async () => {
  const css = await readSitePage("assets/base.css");

  assert.match(css, /:root\s*\{[\s\S]*?color-scheme:\s*light/);
  assert.match(css, /:root\[data-theme="escuro"\]\s*\{[\s\S]*?color-scheme:\s*dark/);
  assert.doesNotMatch(css, /prefers-color-scheme/);
});

test("o breadcrumb agrupa o capítulo e volta para a lista do capítulo", async () => {
  for (const number of [13, 18, 33, 34, 42]) {
    const html = await readSitePage(`exercicios/halliday-21-${number}/index.html`);
    assert.match(html, /<a href="\.\.\/">Exercícios<\/a>/, `exercício ${number}`);
    assert.match(
      html,
      /<a href="\.\.\/capitulo-21\/">Halliday · Capítulo 21<\/a>/,
      `exercício ${number}`,
    );
    assert.match(html, new RegExp(`aria-current="page">Exercício ${number}<`));
  }
});

test("a barra fixa reúne breadcrumb, áreas e seções do exercício", async () => {
  for (const number of [13, 18, 33, 34, 42]) {
    const html = await readSitePage(`exercicios/halliday-21-${number}/index.html`);
    const barra = html.match(
      /<div class="site-topbar" data-topbar>[\s\S]*?\n  <\/div>/,
    );

    assert.ok(barra, `exercício ${number} precisa da barra fixa`);
    assert.match(barra[0], /class="breadcrumb"/);
    assert.match(barra[0], /data-site-navigation/);
    assert.match(barra[0], /data-section-nav/);
    assert.doesNotMatch(html, /<header class="lesson-header">\s*<div class="lesson-area-navigation"/);
  }
});

test("experimentos e simuladores usam a mesma barra fixa dos exercícios", async () => {
  const paginas = [
    "experimentos/01-campo-corrente/index.html",
    "experimentos/02-campo-solenoide/index.html",
    "experimentos/03-forca-magnetica-motor/index.html",
    "experimentos/04-inducao-eletromagnetica/index.html",
    "experimentos/05-escada-resistores/index.html",
    "experimentos/06-cuba-eletrolitica/index.html",
    "simuladores/cargas-e-vetores/index.html",
  ];

  for (const pagina of paginas) {
    const html = await readSitePage(pagina);
    const barra = html.match(/<div class="site-topbar" data-topbar>[\s\S]*?\n  <\/div>/);

    assert.ok(barra, `${pagina} precisa da barra fixa`);
    assert.match(barra[0], /data-site-navigation/, pagina);
    assert.match(barra[0], /breadcrumb/, pagina);
    assert.match(barra[0], /role="tablist"/, pagina);
    assert.equal((barra[0].match(/role="tab"/g) ?? []).length > 0, true, pagina);
  }
});

test("índices de área fixam o cabeçalho no topo", async () => {
  const css = await readSitePage("assets/base.css");

  assert.match(css, /\.site-header \{[\s\S]*?position: sticky/);
  assert.match(css, /\.site-topbar \{[\s\S]*?position: sticky/);
});
