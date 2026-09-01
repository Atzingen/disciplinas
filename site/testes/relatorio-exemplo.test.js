import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reportUrl = new URL(
  "../experimentos/modelo-relatorio/index.html",
  import.meta.url,
);
const experimentUrl = new URL(
  "../experimentos/05-escada-resistores/index.html",
  import.meta.url,
);
const experimentsIndexUrl = new URL("../experimentos/index.html", import.meta.url);
const baseCssUrl = new URL("../assets/base.css", import.meta.url);
const cssUrl = new URL("../assets/relatorio-exemplo.css", import.meta.url);
const scriptUrl = new URL(
  "../componentes/relatorio-exemplo.js",
  import.meta.url,
);
const imageUrls = [
  "../assets/img/relatorio-exemplo/resistores-axiais-evan-amos.jpg",
  "../assets/img/relatorio-exemplo/resistores-potencia-harke.jpg",
  "../assets/img/relatorio-exemplo/resistor-smd-oomlout.jpg",
  "../assets/img/relatorio-exemplo/montagem-varal-placeholder.webp",
].map((path) => new URL(path, import.meta.url));

const [report, experiment, experimentsIndex, baseCss, css, script, ...images] = await Promise.all([
  readFile(reportUrl, "utf8"),
  readFile(experimentUrl, "utf8"),
  readFile(experimentsIndexUrl, "utf8"),
  readFile(baseCssUrl, "utf8"),
  readFile(cssUrl, "utf8"),
  readFile(scriptUrl, "utf8"),
  ...imageUrls.map((url) => readFile(url)),
]);

test("template aparece na entrada de Experimentos e não dentro do Experimento 05", () => {
  const promo = experimentsIndex.indexOf('class="report-template-promo"');
  const catalog = experimentsIndex.indexOf('class="catalog-section catalog-section--area"');
  assert.ok(promo > 0 && promo < catalog);
  assert.match(experimentsIndex, /href="\.\/modelo-relatorio\/"/);
  assert.match(experimentsIndex, /Todos os valores, medições e resultados destacados em amarelo\s+são fictícios/);
  assert.match(experimentsIndex, /demonstrar o formato e o nível de detalhamento esperados/);
  assert.match(baseCss, /\.report-template-promo[\s\S]*?grid-template-columns/);
  assert.match(baseCss, /\.report-template-promo__link[\s\S]*?background:\s*var\(--force-3\)/);

  assert.doesNotMatch(experiment, /modelo-relatorio|relatorio-exemplo|report-template-promo/);
  assert.match(experiment, /data-markdown-report="\.\/relatorio\.md"/);
});

test("template é uma página geral da área e explica o caráter fictício", () => {
  assert.match(report, /<title>Template de relatório preenchido · Experimentos<\/title>/);
  assert.match(report, /href="\.\.\/"[\s\S]*?Experimentos/);
  assert.doesNotMatch(report, /Experimento 05|#painel-relatorio/);
  assert.match(report, /O\s+varal é apenas o tema do exemplo/);
  assert.match(report, /todos os dados experimentais são\s+fictícios/);
});

test("relatório-modelo contém oito páginas e a estrutura acadêmica completa", () => {
  assert.equal((report.match(/class="report-page(?:\s|\")/g) ?? []).length, 8);
  assert.match(report, /CÂMPUS PIRACICABA/);
  assert.match(report, />RESUMO</);
  assert.match(report, /id="introducao"/);
  assert.match(report, /id="referencial-teorico"/);
  assert.match(report, /id="objetivos"/);
  assert.match(report, /id="materiais-metodos"/);
  assert.match(report, /id="resultados"/);
  assert.match(report, /id="discussao"/);
  assert.match(report, /id="conclusao"/);
  assert.match(report, /id="referencias"/);
});

test("capa usa autores genéricos e o resumo permanece em alto nível", () => {
  for (const author of ["ALUNO 1", "ALUNO 2", "ALUNO 3"]) {
    assert.match(report, new RegExp(`<span>${author}</span>`));
  }
  assert.doesNotMatch(report, /ANA CLARA|BRUNO HENRIQUE|CARLA MENDES/);

  const abstract = report.match(
    /<p class="report-abstract">([\s\S]*?)<\/p>/,
  )?.[1];
  assert.ok(abstract);
  assert.match(abstract, /associações de resistores em série e em paralelo/);
  assert.match(abstract, /resultados acompanharam a\s+tendência prevista/);
  assert.doesNotMatch(abstract, /kΩ|30,013|fictíci[oa]/i);
});

test("dados simulados recebem realce amarelo e permanecem coerentes", () => {
  assert.ok((report.match(/class="fictitious-value"/g) ?? []).length >= 20);
  assert.match(css, /--report-highlight:\s*#fff1a8/);
  assert.match(css, /\.fictitious-value[\s\S]*?print-color-adjust:\s*exact/);
  assert.match(report, /30,013 ± 0,006/);
  assert.match(report, /27,3205 kΩ/);
  assert.match(report, /0,0119 kΩ/);
  assert.match(report, /u<sub>B<\/sub> = 0,090 kΩ/);
});

test("introdução explica resistência, série, paralelo e os tipos de resistor", () => {
  assert.ok(report.includes("R=\\rho L/A"));
  assert.ok(report.includes("P=VI=I^2R=V^2/R"));
  assert.match(report, /acrescentar um resistor em série aumenta/);
  assert.match(report, /Um novo ramo oferece outro caminho,[\s\S]*diminui a resistência/);
  assert.match(report, /filme de carbono ou de metal/);
  assert.match(report, /faixas de\s+cores informam valor nominal e tolerância/);
  assert.match(report, /fio enrolado[\s\S]*encapsulados em alumínio[\s\S]*SMD/);
  assert.match(report, /Vishay, \[s\. d\.\]a; Vishay, \[s\. d\.\]b;/);
});

test("referencial constrói quatro degraus, recorrência e limite em LaTeX", () => {
  for (const expression of [
    "R_1 = 2R+R=3R",
    "R_2 = 2R+\\frac{R(3R)}{R+3R}=\\frac{11}{4}R",
    "R_3 = 2R+\\frac{R(11R/4)}{R+11R/4}=\\frac{41}{15}R",
    "R_4 = 2R+\\frac{R(41R/15)}{R+41R/15}=\\frac{153}{56}R",
  ]) {
    assert.ok(report.includes(expression));
  }
  assert.ok(report.includes("\\frac{R\\,R_{N-1}}{R+R_{N-1}}"));
  assert.ok(report.includes("z_1=2R,\\ z_2=R"));
  assert.ok(report.includes("R_\\infty=(1+\\sqrt{3})R"));
  assert.match(report, /obra fornece a equação de autossemelhança e sua\s+solução; ela não apresenta pronto o valor específico deste varal/);
  assert.match(report, /especialização didática/);
  assert.doesNotMatch(report, /class="fraction"/);
  assert.match(script, /import \{ typesetMath \} from "\.\/matematica\.js"/);
  assert.match(script, /await mathReady/);
});

test("fotos têm arquivos locais, créditos e licenças explícitas", () => {
  assert.ok(images.every((image) => image.byteLength > 50_000));
  for (const source of ["Evan-Amos", "Harke", "oomlout"]) {
    assert.match(report, new RegExp(source, "i"));
  }
  assert.match(report, /domínio público/);
  assert.match(report, /CC BY-SA 3\.0/);
  assert.match(report, /CC BY-SA 2\.0/);
  assert.equal(
    (report.match(/href="https:\/\/commons\.wikimedia\.org\/wiki\/File:/g) ?? [])
      .length,
    3,
  );
  assert.match(report, /via Wikimedia Commons\. Acesso em: 1 set\. 2026/);
});

test("objetivos e métodos incluem familiarização segura com a bancada CC", () => {
  assert.match(report, /familiarizar\s+os estudantes com os componentes e\s+instrumentos de circuitos de corrente contínua/);
  assert.match(report, /fonte, multímetro,\s+resistores, jumpers e protoboard/);
  assert.match(report, /fonte\s+foi\s+desligada e\s+desconectada/);
  assert.match(report, /rede[\s\S]*desenergizada/);
});

test("método inclui fotografia-placeholder claramente identificada", () => {
  assert.match(report, /montagem-varal-placeholder\.webp/);
  assert.match(report, /PLACEHOLDER — SUBSTITUIR PELA FOTO DO GRUPO/);
  assert.match(report, /Não\s+representa uma montagem ou observação experimental real/);
  assert.match(report, /substitua esta\s+imagem por uma fotografia própria/);
  assert.match(css, /\.report-placeholder-badge[\s\S]*print-color-adjust:\s*exact/);
});

test("resultados empilham medições, projeção teórica, comparação e gráfico", () => {
  const table1 = report.indexOf("Tabela 1 —");
  const table2 = report.indexOf("Tabela 2 —");
  const table3 = report.indexOf("Tabela 3 —");
  const figure4 = report.indexOf("Figura 4 —");
  assert.ok(table1 < table2 && table2 < table3 && table3 < figure4);
  assert.match(report, /class="report-results-stack"/);
  assert.doesNotMatch(report, /class="report-results-grid"/);
  assert.match(report, /Projeção da convergência para dez degraus/);
  assert.match(report, /<text x="646" y="192">10<\/text>/);
  assert.match(report, /três degraus bastam para observar a aproximação/);
});

test("discussão contempla as principais fontes de erro da montagem", () => {
  assert.match(report, /tolerância dos resistores é uma fonte central de erro/i);
  assert.match(report, /Fios, trilhas internas da protoboard e contatos/);
  assert.match(report, /contato frouxo, terminal oxidado[\s\S]*jumper\s+mal inserido/);
  assert.match(report, /resolução e\s+exatidão do multímetro/i);
});

test("modelo aplica composição A4 e convenções ABNT atuais", () => {
  assert.match(css, /@page\s*{[\s\S]*?size:\s*A4;[\s\S]*?margin:\s*0;/);
  assert.match(css, /padding:\s*30mm 20mm 20mm 30mm/);
  assert.match(css, /font:\s*12pt\/1\.5 Arial/);
  assert.match(report, /NBR 10719:2015/);
  assert.match(report, /NBR 14724:2024/);
  assert.match(report, /NBR 10520:2023/);
  assert.match(report, /NBR 6023:2025/);
  assert.match(report, /\(Halliday; Resnick; Walker, 2023\)/);
  assert.match(report, /\(Ling; Moebs; Sanny, 2016\)/);
});

test("fontes técnicas são citadas no texto e nas referências", () => {
  for (const source of ["FEYNMAN", "FLUKE", "HALLIDAY", "INMETRO", "LING", "VISHAY"]) {
    assert.match(report, new RegExp(source));
  }
  assert.match(report, /feynmanlectures\.caltech\.edu/);
  assert.match(report, /openstax\.org/);
  assert.match(report, /gov\.br\/inmetro/);
});
