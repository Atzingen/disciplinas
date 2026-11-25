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

test("página inicial apresenta as disciplinas e os perfis do professor", async () => {
  const html = await readSitePage("index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /href="\.\/disciplinas\/prcfemg\/"/);
  assert.match(html, /href="\.\/disciplinas\/prclfbe\/"/);
  assert.match(html, /href="\.\/disciplinas\/prccomp\/"/);
  assert.match(html, /href="\.\/simuladores\/"/);
  assert.match(html, /PRCFEMG/);
  assert.match(html, /PRCLFBE/);
  assert.match(html, /PRCCOMP/);
  assert.match(html, /2023\.03\.07-PPC-LIC-Física-PRC-Reformulação\.pdf/);
  assert.doesNotMatch(html, /class="portal-reference/);
  assert.match(html, /id="sobre"/);
  assert.match(html, /https:\/\/atzingen\.dev\//);
  assert.match(html, /lattes\.cnpq\.br\/5173282107514295/);
  assert.match(html, /scholar\.google\.com\/citations\?user=YPUqX9sAAAAJ/);
  assert.match(html, /data-site-navigation/);
});

test("página inicial abre com a apresentação, segue com o professor e fecha com as disciplinas", async () => {
  const html = await readSitePage("index.html");
  const intro = html.indexOf('class="hero portal-hero"');
  const about = html.indexOf('id="sobre"');
  const disciplines = html.indexOf('id="disciplinas"');

  assert.ok(intro > -1 && about > intro && disciplines > about);
  assert.match(html, /disciplinas que leciono no IFSP/);
  assert.match(html, /class="portal-board"/);
});

test("páginas das disciplinas mostram os materiais primeiro e recolhem o PPC", async () => {
  for (const code of ["prcfemg", "prclfbe", "prccomp"]) {
    const html = await readSitePage(`disciplinas/${code}/index.html`);
    const resources = html.indexOf('class="course-resources"');
    const catalog = html.indexOf("data-catalog-root");
    const details = html.indexOf('<details class="course-details"');
    const data = html.indexOf('id="dados-title"');
    const closing = html.indexOf("</details>");

    assert.ok(resources > -1 && catalog > resources, code);
    assert.ok(details > catalog && data > details && closing > data, code);
    assert.doesNotMatch(html, /<details class="course-details"[^>]*\sopen/, code);
    assert.match(html, /Informações do componente no PPC/, code);
  }
});

test("páginas das disciplinas trazem o PPC como cartão lateral", async () => {
  for (const code of ["prcfemg", "prclfbe", "prccomp"]) {
    const html = await readSitePage(`disciplinas/${code}/index.html`);
    assert.match(html, /class="course-facts-layout"/, code);
    assert.match(html, /class="portal-reference portal-reference--course"/, code);
    assert.match(html, /Abrir PPC completo/, code);
    assert.equal(count(html, /<h1\b/g), 1, code);
  }
});

test("cada disciplina possui entrada e catálogo independentes", async () => {
  const electromagnetism = await readSitePage(
    "disciplinas/prcfemg/index.html",
  );
  const laboratory = await readSitePage(
    "disciplinas/prclfbe/index.html",
  );

  assert.equal(count(electromagnetism, /<h1\b/g), 1);
  assert.equal(count(laboratory, /<h1\b/g), 1);
  assert.match(electromagnetism, /scope:\s*\{ discipline: "PRCFEMG" \}/);
  assert.match(laboratory, /scope:\s*\{ discipline: "PRCLFBE" \}/);
  assert.match(electromagnetism, /href="\.\.\/\.\.\/exercicios\/"/);
  assert.match(laboratory, /href="\.\.\/\.\.\/experimentos\/"/);
});

test("páginas das disciplinas reproduzem os dados curriculares do PPC", async () => {
  const electromagnetism = await readSitePage("disciplinas/prcfemg/index.html");
  const laboratory = await readSitePage("disciplinas/prclfbe/index.html");

  assert.match(electromagnetism, /Fundamentos do Eletromagnetismo/);
  assert.match(electromagnetism, /19 tópicos/);
  assert.match(electromagnetism, /Equações de Maxwell/);
  assert.match(electromagnetism, /Bibliografia/);
  assert.match(electromagnetism, /Divergência no documento/);
  assert.match(electromagnetism, /#page=207/);
  assert.match(electromagnetism, /#page=50/);

  assert.match(laboratory, /Laboratório de Física Básica: Eletromagnetismo/);
  assert.match(laboratory, /21 tópicos/);
  assert.match(laboratory, /Transformadores/);
  assert.match(laboratory, /Laboratórios de Física/);
  assert.match(laboratory, /#page=218/);
});

test("PPC está incluído nas referências publicadas", async () => {
  const pdf = await readFile(
    new URL(
      "../referencias/2023.03.07-PPC-LIC-Física-PRC-Reformulação.pdf",
      import.meta.url,
    ),
  );
  const documentation = await readSitePage("referencias/README.md");

  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 2_000_000);
  assert.match(documentation, /PRCFEMG/);
  assert.match(documentation, /PRCLFBE/);
  assert.match(documentation, /PRCCOMP/);
  assert.match(documentation, /e18d8569868752b56d79b604c692a71707ca8a29fab3a1c6192d71c6db5b1fe3/);
});

test("índice de exercícios encaminha aos capítulos 21, 22 e 23", async () => {
  const html = await readSitePage("exercicios/index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /href="\.\/capitulo-21\/"/);
  assert.match(html, /href="\.\/capitulo-22\/"/);
  assert.match(html, /href="\.\/capitulo-23\/"/);
  assert.match(html, /5 exercícios/);
  assert.match(html, /8 resoluções/);
  assert.match(html, /12 exercícios/);
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
  assert.doesNotMatch(simulations, /discipline:\s*"PRC/);
  assert.match(simulations, /showDisciplines:\s*true/);
  assert.match(simulations, /data-catalog-discipline="todas"/);
  assert.match(simulations, /data-catalog-discipline="PRCFEMG"/);
  assert.match(simulations, /data-catalog-discipline="PRCLFBE"/);
  assert.match(simulations, /data-active-section="simulacoes"/);
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

test("PRCFEMG encaminha às aulas e o índice de aulas limita o catálogo", async () => {
  const electromagnetism = await readSitePage("disciplinas/prcfemg/index.html");
  const lessons = await readSitePage("aulas/index.html");

  assert.match(electromagnetism, /class="resource-card" href="\.\.\/\.\.\/aulas\/"/);
  assert.match(electromagnetism, /data-catalog-filter="aula"/);
  assert.equal(count(lessons, /<h1\b/g), 1);
  assert.match(lessons, /scope:\s*\{ section: "aulas", discipline: "PRCFEMG" \}/);
  assert.match(lessons, /pathPrefix:\s*"\.\.\/"/);
  assert.match(lessons, /data-active-section="aulas"/);
  assert.match(lessons, /href="\.\.\/disciplinas\/prcfemg\/"/);
});

test("a aula de Maxwell roda só com os arquivos da própria pasta", async () => {
  const pasta = "aulas/maxwell-ondas/";
  const html = await readSitePage(`${pasta}index.html`);
  const referencias = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)]
    .map((achado) => achado[1])
    .filter((caminho) => !caminho.startsWith("../"));

  assert.ok(referencias.length >= 9, "folhas de estilo e scripts da apresentação");
  for (const caminho of referencias) {
    assert.doesNotMatch(caminho, /^(https?:)?\/\//, caminho);
    const arquivo = await readSitePage(pasta + caminho.replace(/\?.*$/, ""));
    assert.ok(arquivo.length > 0, `arquivo ausente: ${caminho}`);
  }

  const katexCss = await readSitePage(`${pasta}katex/katex.min.css`);
  const fontes = [...katexCss.matchAll(/url\((fonts\/[^)]+\.woff2)\)/g)].map((achado) => achado[1]);
  assert.ok(fontes.length > 0);
  for (const fonte of new Set(fontes)) {
    await assert.doesNotReject(
      readFile(new URL(`../${pasta}katex/${fonte}`, import.meta.url)),
      `fonte ausente: ${fonte}`,
    );
  }

  const animacoes = new Set(
    [...html.matchAll(/data-viz="([a-z0-9]+)"/g)].map((achado) => achado[1]),
  );
  let registradas = "";
  for (const nome of ["viz-b1.js", "viz-b2.js", "viz-b3.js", "viz-b4.js"]) {
    registradas += await readSitePage(pasta + nome);
  }
  assert.ok(animacoes.size > 0);
  for (const animacao of animacoes) {
    assert.ok(registradas.includes(`V.reg("${animacao}"`), `animação sem código: ${animacao}`);
  }

  assert.match(html, /href="\.\.\/\.\.\/disciplinas\/prcfemg\/"/);
  assert.doesNotMatch(html, /data-notas=/);
});

test("simuladores indicam a disciplina à qual pertencem", async () => {
  const charges = await readSitePage("simuladores/cargas-e-vetores/index.html");
  const tank = await readSitePage("simuladores/cuba-eletrolitica/index.html");

  assert.match(charges, /data-active-section="simulacoes"/);
  assert.match(charges, /disciplinas\/prcfemg/);
  assert.match(tank, /data-active-section="simulacoes"/);
  assert.match(tank, /disciplinas\/prclfbe/);
  assert.match(charges, /<a href="\.\.\/">Simulações<\/a>/);
  assert.match(tank, /<a href="\.\.\/">Simulações<\/a>/);
  assert.match(charges, /navegacao-principal\.js/);
  assert.match(tank, /navegacao-principal\.js/);
});

test("cada página restaura o tema escolhido antes de pintar a tela", async () => {
  const paginas = [
    "index.html",
    "disciplinas/prcfemg/index.html",
    "disciplinas/prclfbe/index.html",
    "exercicios/index.html",
    "exercicios/capitulo-21/index.html",
    "exercicios/capitulo-22/index.html",
    "exercicios/capitulo-23/index.html",
    "exercicios/halliday-21-33/index.html",
    "exercicios/halliday-23-29/index.html",
    "experimentos/index.html",
    "experimentos/01-campo-corrente/index.html",
    "experimentos/09-mapa-campo-espiras/index.html",
    "simuladores/index.html",
    "simuladores/cargas-e-vetores/index.html",
    "simuladores/cuba-eletrolitica/index.html",
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
    "experimentos/07-carga-descarga-capacitores/index.html",
    "experimentos/09-mapa-campo-espiras/index.html",
    "simuladores/cargas-e-vetores/index.html",
    "simuladores/cuba-eletrolitica/index.html",
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
