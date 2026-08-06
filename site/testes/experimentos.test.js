import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let experimentApi = {};
let markdownReportApi = {};

try {
  experimentApi = await import("../experimentos/experimento.js");
} catch {
  experimentApi = {};
}

try {
  markdownReportApi = await import("../componentes/relatorio-markdown.js");
} catch {
  markdownReportApi = {};
}

const experiments = [
  {
    slug: "01-campo-corrente",
    image: "exp-01-oersted-montagem.jpg",
    tabs: 3,
    academicReport: true,
    equations: [/\\frac\{\\mu_0 I\}\{2\\pi r\}/, /\\tan\\varphi/, /\\oint_C/],
  },
  {
    slug: "02-campo-solenoide",
    image: "exp-02-solenoide-montagem.jpg",
    tabs: 3,
    academicReport: true,
    equations: [/B_\{\\mathrm\{ideal\}\}/, /\\frac\{N\}\{\\ell\}/, /\\sqrt\{a\^2/],
  },
  {
    slug: "03-forca-magnetica-motor",
    image: "exp-03-balanco-magnetico.jpg",
    tabs: 3,
    academicReport: true,
    equations: [/d\\vec\{F\}/, /\\vec\{\\tau\}/, /J\\ddot\{\\theta\}/],
  },
  {
    slug: "04-inducao-eletromagnetica",
    image: "exp-04-montagem.jpg",
    tabs: 3,
    academicReport: true,
    equations: [/\\mathcal\{E\}/, /\\frac\{d\\Phi_B\}\{dt\}/, /L\\frac\{di\}\{dt\}/],
  },
];

async function readExperiment(slug, filename) {
  try {
    return await readFile(
      new URL(`../experimentos/${slug}/${filename}`, import.meta.url),
      "utf8",
    );
  } catch {
    return "";
  }
}

function plainText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&minus;|&#8722;/g, "−")
    .replace(/&times;/g, "×")
    .replace(/&middot;/g, "·")
    .replace(/&pi;/g, "π")
    .replace(/&mu;/g, "μ")
    .replace(/\s+/g, " ");
}

function createInteractiveFixture({ withReport = false } = {}) {
  const panels = new Map();
  const makeTab = (controls, selected) => {
    const attributes = new Map([
      ["aria-controls", controls],
      ["aria-selected", String(selected)],
    ]);
    return {
      tabIndex: selected ? 0 : -1,
      getAttribute: (name) => attributes.get(name),
      setAttribute: (name, value) => attributes.set(name, value),
      addEventListener() {},
      removeEventListener() {},
      focus() {},
    };
  };
  const tabs = [
    makeTab("painel-montagem", true),
    makeTab("painel-fundamentos", false),
    makeTab("painel-relatorio", false),
  ];
  for (const tab of tabs) {
    panels.set(`#${tab.getAttribute("aria-controls")}`, { hidden: false });
  }
  const printButton = {
    clickHandler: null,
    addEventListener(type, handler) {
      if (type === "click") this.clickHandler = handler;
    },
  };
  const reportDocument = withReport ? {} : null;
  const root = {
    querySelectorAll(selector) {
      return selector === '[role="tab"]' ? tabs : [];
    },
    querySelector(selector) {
      if (selector === "[data-print-report]") return printButton;
      if (selector === "[data-markdown-report]") return reportDocument;
      return panels.get(selector) ?? null;
    },
  };
  return { root, tabs, panels, printButton, reportDocument };
}

test("ação de imprimir ativa primeiro a aba Relatório", async () => {
  assert.equal(typeof experimentApi.setupExperiment, "function");
  const fixture = createInteractiveFixture();
  let printCalls = 0;

  experimentApi.setupExperiment(fixture.root, () => {
    printCalls += 1;
  });
  const printResult = fixture.printButton.clickHandler();

  assert.equal(typeof printResult?.then, "function");
  await printResult;

  assert.equal(fixture.tabs[2].getAttribute("aria-selected"), "true");
  assert.equal(fixture.panels.get("#painel-relatorio").hidden, false);
  assert.equal(fixture.panels.get("#painel-montagem").hidden, true);
  assert.equal(printCalls, 1);
});

test("ação de imprimir aguarda o relatório Markdown completo", async () => {
  const fixture = createInteractiveFixture({ withReport: true });
  let releaseReport;
  let printCalls = 0;
  const reportReady = new Promise((resolve) => {
    releaseReport = resolve;
  });

  experimentApi.setupExperiment(
    fixture.root,
    () => {
      printCalls += 1;
    },
    () => reportReady,
  );
  const printResult = fixture.printButton.clickHandler();

  await Promise.resolve();
  assert.equal(printCalls, 0);
  releaseReport();
  await printResult;
  assert.equal(printCalls, 1);
});

test("renderização Markdown preserva delimitadores e comandos LaTeX", () => {
  assert.equal(typeof markdownReportApi.renderMarkdownWithMath, "function");
  const source = [
    "## Modelo",
    "",
    "O campo é $B_{T,h}=B_0\\cos\\alpha$.",
    "",
    "$$\\frac{d\\Phi_B}{dt}=-\\mathcal{E}$$",
    "",
    "Também vale \\(\\vec F=q\\vec v\\times\\vec B\\).",
  ].join("\n");
  const parseMarkdown = (markdown) => `<article>${markdown}</article>`;
  const html = markdownReportApi.renderMarkdownWithMath(source, parseMarkdown);

  assert.match(html, /\$B_\{T,h\}=B_0\\cos\\alpha\$/);
  assert.match(html, /\$\$\\frac\{d\\Phi_B\}\{dt\}=-\\mathcal\{E\}\$\$/);
  assert.match(html, /\\\(\\vec F=q\\vec v\\times\\vec B\\\)/);
  assert.doesNotMatch(html, /MATHPLACEHOLDER/);
});

for (const experiment of experiments) {
  test(`${experiment.slug} entrega roteiro avançado e relatório`, async () => {
    const html = await readExperiment(experiment.slug, "index.html");
    const report = await readExperiment(experiment.slug, "relatorio.md");
    const text = plainText(html);
    const reportWords = report
      .replace(/^\|.*$/gm, " ")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    const expectedTabs = experiment.tabs ?? 4;
    assert.equal((html.match(/role="tab"/g) ?? []).length, expectedTabs);
    assert.equal((html.match(/role="tabpanel"/g) ?? []).length, expectedTabs);
    assert.match(text, /Montagem/);
    assert.match(text, /Fundamentação/);
    assert.match(text, /Roteiro e relatório/);
    assert.doesNotMatch(html, /painel-dados|>Dados</);
    assert.match(html, /class="reasoning-sequence"/);
    assert.match(html, /class="report-document"/);
    assert.match(html, /data-markdown-report="\.\/relatorio\.md"/);
    assert.match(html, /\\begin\{aligned\}/);
    assert.match(html, /\\frac\{/);
    assert.match(html, /class="experiment-safety"/);
    assert.match(text, /5–10 s/);
    assert.match(html, /<table\b/);
    assert.match(html, /data-print-report/);
    assert.match(html, new RegExp(experiment.image.replace(".", "\\.")));
    assert.match(html, /<img\b[^>]*alt="[^"]+"/);
    assert.match(text, /Fonte: manual AZEHEB/);
    assert.match(html, /data-active-section="experimentos"/);
    assert.match(html, /experimento\.js/);

    for (const equation of experiment.equations) {
      assert.match(text, equation);
    }

    assert.match(report, /^# /m);
    assert.match(report, /^## Dados brutos/m);
    assert.match(report, /^## Tratamento e análise/m);
    assert.match(report, /^## Discussão/m);
    assert.match(report, /^## Conclusão/m);
    assert.ok(
      reportWords >= 1500,
      experiment.slug + " tem somente " + reportWords + " palavras no relatório",
    );
  });
}

test("04-inducao adota relatório acadêmico contínuo e matemática LaTeX", async () => {
  const html = await readExperiment("04-inducao-eletromagnetica", "index.html");
  const report = await readExperiment("04-inducao-eletromagnetica", "relatorio.md");
  const reportWords = report
    .replace(/\|[^\n]+\|/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  assert.equal((html.match(/role="tab"/g) ?? []).length, 3);
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 3);
  assert.doesNotMatch(html, /painel-dados|>Dados</);
  assert.match(html, /class="reasoning-sequence"/);
  assert.match(html, /class="report-document"/);
  assert.match(html, /\\frac\{d\\Phi_B\}\{dt\}/);
  assert.match(html, /\\begin\{aligned\}/);
  assert.match(report, /^## Dados brutos/m);
  assert.match(report, /^## Tratamento e análise/m);
  assert.match(report, /^## Discussão/m);
  assert.match(report, /\$\$[\s\S]*\\frac[\s\S]*\$\$/);
  assert.ok(reportWords >= 1500, `o relatório tem somente ${reportWords} palavras`);
});
