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
    tabs: 4,
    equations: [/\\frac\{\\mu_0 I\}\{2\\pi r\}/, /\\tan\\varphi/, /\\oint_C/],
  },
  {
    slug: "02-campo-solenoide",
    image: "exp-02-solenoide-montagem.jpg",
    tabs: 4,
    equations: [/B_\{\\mathrm\{ideal\}\}/, /\\frac\{N\}\{\\ell\}/, /\\sqrt\{a\^2/],
  },
  {
    slug: "03-forca-magnetica-motor",
    image: "exp-03-balanco-magnetico.jpg",
    tabs: 4,
    equations: [/d\\vec/, /\\vec\\tau/, /J\\ddot\{\\theta\}/],
  },
  {
    slug: "04-inducao-eletromagnetica",
    image: "exp-04-montagem.jpg",
    tabs: 4,
    equations: [/\\mathcal\{E\}/, /\\frac\{d\\Phi_B\}\{dt\}/, /L\\frac\{di\}\{dt\}/],
  },
  {
    slug: "05-escada-resistores",
    image: null,
    tabs: 4,
    equations: [
      /\\frac\{R\\,R_\{N-1\}\}\{R \+ R_\{N-1\}\}/,
      /R_\\infty\^2 - 2R\\,R_\\infty - 2R\^2 = 0/,
      /\\left\(1\+\\sqrt\{3\}\\right\)R/,
    ],
  },
  {
    slug: "06-cuba-eletrolitica",
    image: "exp-06-cuba-montagem.jpg",
    imageSource: /Fotografia: acervo da disciplina/,
    tabs: 4,
    equations: [
      /\\nabla\^2V\s*&=\s*0/,
      /E_x\(i,j\)&\\approx-/,
      /\\frac\{V_\{i\+1,j\}\+V_\{i-1,j\}\+V_\{i,j\+1\}\+V_\{i,j-1\}\}\{4\}/,
    ],
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

// Elemento falso com só o que experimento.js e abas.js usam do DOM.
function fakeElement(tagName = "div") {
  const attributes = new Map();
  const listeners = new Map();
  let ownText = "";
  return {
    tagName: tagName.toUpperCase(),
    children: [],
    hidden: false,
    tabIndex: -1,
    focused: false,
    rect: { top: 0, bottom: 0 },
    get textContent() {
      return (
        ownText +
        this.children
          .map((child) => (typeof child === "string" ? child : child.textContent))
          .join("")
      );
    },
    set textContent(value) {
      ownText = String(value);
      this.children = [];
    },
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, String(value)),
    addEventListener(type, handler) {
      listeners.set(type, [...(listeners.get(type) ?? []), handler]);
    },
    removeEventListener() {},
    // Chama os ouvintes na ordem de registro, como o navegador, e devolve o último resultado.
    dispatch(type, event = {}) {
      return (listeners.get(type) ?? [])
        .map((handler) => handler({ preventDefault() {}, ...event }))
        .at(-1);
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    prepend(...nodes) {
      this.children.unshift(...nodes);
    },
    before() {},
    focus() {
      this.focused = true;
    },
    getBoundingClientRect() {
      return this.rect;
    },
  };
}

function descendants(element) {
  return element.children
    .filter((child) => typeof child !== "string")
    .flatMap((child) => [child, ...descendants(child)]);
}

function partLinks(panel) {
  return descendants(panel)
    .filter((element) => element.tagName === "A")
    .map((link) => ({ link, text: link.textContent }));
}

function createInteractiveFixture(t, { withReport = false, hash = "" } = {}) {
  const windowListeners = new Map();
  const created = [];
  // Histórico com pilha de entradas, para simular o voltar do navegador.
  const entries = [{ state: null, hash }];
  let current = 0;
  const fakeWindow = {
    location: { hash },
    pushed: [],
    scrolls: [],
    scrollY: 0,
    history: {
      get state() {
        return entries[current].state;
      },
      pushState(state, _title, address) {
        entries.splice(current + 1, Infinity, { state, hash: address });
        current += 1;
        fakeWindow.pushed.push(address);
        fakeWindow.location.hash = address;
      },
      replaceState(state, _title, address = entries[current].hash) {
        entries[current] = { state, hash: address };
        fakeWindow.location.hash = address;
      },
      back() {
        current -= 1;
        fakeWindow.location.hash = entries[current].hash;
        fakeWindow.dispatch("popstate");
      },
    },
    scrollTo(options) {
      fakeWindow.scrolls.push(options);
    },
    addEventListener(type, handler) {
      windowListeners.set(type, handler);
    },
    dispatch(type) {
      windowListeners.get(type)?.({});
    },
  };
  globalThis.window = fakeWindow;
  globalThis.document = {
    createElement(tagName) {
      const element = fakeElement(tagName);
      created.push(element);
      return element;
    },
  };
  t.after(() => {
    delete globalThis.window;
    delete globalThis.document;
  });

  const names = ["Montagem", "Fundamentos", "Dados", "Relatório"];
  const anchors = ["montagem", "fundamentos", "dados", "relatorio"];
  const tabs = anchors.map((anchor, index) => {
    const tab = fakeElement("button");
    tab.setAttribute("aria-controls", `painel-${anchor}`);
    tab.setAttribute("aria-selected", String(index === 0));
    tab.textContent = names[index];
    return tab;
  });
  const panels = new Map(
    anchors.map((anchor) => [`#painel-${anchor}`, fakeElement("section")]),
  );
  const topbar = fakeElement("div");
  topbar.rect = { top: 0, bottom: 120 };
  const tabList = fakeElement("div");
  const printButton = fakeElement("button");
  const reportDocument = withReport ? {} : null;
  const root = {
    querySelectorAll(selector) {
      return selector === '[role="tab"]' ? tabs : [];
    },
    querySelector(selector) {
      if (selector === "[data-print-report]") return printButton;
      if (selector === "[data-markdown-report]") return reportDocument;
      if (selector === "[data-topbar]") return topbar;
      if (selector === '[role="tablist"]') return tabList;
      return panels.get(selector) ?? null;
    },
  };
  const progress = () =>
    created.find((element) => element.className === "experiment-progress");
  return { root, tabs, panels, printButton, window: fakeWindow, progress };
}

test("ação de imprimir ativa primeiro a aba Relatório", async (t) => {
  assert.equal(typeof experimentApi.setupExperiment, "function");
  const fixture = createInteractiveFixture(t);
  let printCalls = 0;

  experimentApi.setupExperiment(fixture.root, () => {
    printCalls += 1;
  });
  const printResult = fixture.printButton.dispatch("click");

  assert.equal(typeof printResult?.then, "function");
  await printResult;

  assert.equal(fixture.tabs[3].getAttribute("aria-selected"), "true");
  assert.equal(fixture.panels.get("#painel-relatorio").hidden, false);
  assert.equal(fixture.panels.get("#painel-montagem").hidden, true);
  assert.equal(printCalls, 1);
});

test("ação de imprimir aguarda o relatório Markdown completo", async (t) => {
  const fixture = createInteractiveFixture(t, { withReport: true });
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
  const printResult = fixture.printButton.dispatch("click");

  await Promise.resolve();
  assert.equal(printCalls, 0);
  releaseReport();
  await printResult;
  assert.equal(printCalls, 1);
});

test("abrir o experimento com #dados mostra direto a parte Dados", (t) => {
  const fixture = createInteractiveFixture(t, { hash: "#dados" });
  experimentApi.setupExperiment(fixture.root, () => {});

  assert.equal(fixture.tabs[2].getAttribute("aria-selected"), "true");
  assert.equal(fixture.panels.get("#painel-dados").hidden, false);
  assert.equal(fixture.panels.get("#painel-montagem").hidden, true);
  assert.equal(fixture.progress().textContent, "Parte 3 de 4 · Dados");
  assert.equal(fixture.window.scrolls.length, 1);
});

test("a primeira parte só oferece Próxima e a última só Anterior", (t) => {
  const fixture = createInteractiveFixture(t);
  experimentApi.setupExperiment(fixture.root, () => {});

  const first = partLinks(fixture.panels.get("#painel-montagem")).map(({ text }) => text);
  const last = partLinks(fixture.panels.get("#painel-relatorio")).map(({ text }) => text);
  const middle = partLinks(fixture.panels.get("#painel-dados")).map(({ text }) => text);

  assert.deepEqual(first, ["Próxima: Fundamentos→", "Próxima: Fundamentos→"]);
  assert.deepEqual(last, ["←Anterior: Dados", "←Anterior: Dados"]);
  assert.deepEqual(middle, [
    "←Anterior: Fundamentos",
    "Próxima: Relatório→",
    "←Anterior: Fundamentos",
    "Próxima: Relatório→",
  ]);
});

test("Próxima ativa a parte seguinte e o voltar do navegador retorna", (t) => {
  const fixture = createInteractiveFixture(t);
  experimentApi.setupExperiment(fixture.root, () => {});
  const [, { link: next }] = partLinks(fixture.panels.get("#painel-montagem"));

  fixture.window.scrollY = 5100;
  next.dispatch("click");

  assert.equal(fixture.tabs[1].getAttribute("aria-selected"), "true");
  assert.equal(fixture.panels.get("#painel-fundamentos").hidden, false);
  assert.equal(fixture.panels.get("#painel-montagem").hidden, true);
  assert.equal(fixture.panels.get("#painel-fundamentos").focused, true);
  assert.equal(fixture.progress().textContent, "Parte 2 de 4 · Fundamentos");
  assert.deepEqual(fixture.window.pushed, ["#fundamentos"]);

  fixture.window.history.back();

  assert.equal(fixture.tabs[0].getAttribute("aria-selected"), "true");
  assert.equal(fixture.panels.get("#painel-montagem").hidden, false);
  // Volta ao ponto da parte onde o aluno clicou em Próxima.
  assert.deepEqual(fixture.window.scrolls.at(-1), { top: 5100, behavior: "instant" });
});

test("clique na aba empilha o endereço e as setas só o substituem", (t) => {
  const fixture = createInteractiveFixture(t);
  experimentApi.setupExperiment(fixture.root, () => {});

  fixture.tabs[1].dispatch("keydown", { key: "ArrowRight" });
  fixture.tabs[2].dispatch("keydown", { key: "ArrowRight" });
  assert.equal(fixture.window.location.hash, "#relatorio");
  assert.deepEqual(fixture.window.pushed, []);

  fixture.tabs[1].dispatch("click");
  assert.equal(fixture.tabs[1].getAttribute("aria-selected"), "true");
  assert.deepEqual(fixture.window.pushed, ["#fundamentos"]);
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

    assert.equal((html.match(/role="tab"/g) ?? []).length, experiment.tabs);
    assert.equal((html.match(/role="tabpanel"/g) ?? []).length, experiment.tabs);
    assert.match(text, /Montagem/);
    assert.match(text, /Fundamentos/);
    assert.match(text, /Dados/);
    assert.match(text, /Relatório/);
    assert.match(
      html,
      /class="report-template"[^>]*data-markdown-report="\.\/relatorio\.md"/,
    );
    assert.match(html, /class="experiment-safety"/);
    assert.match(text, /5–10 s/);
    assert.match(html, /<table\b/);
    assert.match(html, /data-print-report/);
    if (experiment.image) {
      assert.match(html, new RegExp(experiment.image.replace(".", "\\.")));
      assert.match(html, /<img\b[^>]*alt="[^"]+"/);
      assert.match(text, experiment.imageSource ?? /Fonte: manual AZEHEB/);
    } else {
      assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=|data-escada-resistores-app/);
    }
    assert.match(html, /data-active-section="experimentos"/);
    assert.match(html, /experimento\.js/);
    assert.match(
      html,
      /class="[^"]*math-display[^"]*"/,
      `${experiment.slug} deve renderizar as equações da fundamentação com MathJax`,
    );
    assert.match(html, /\\begin\{aligned\}/);
    assert.match(html, /\\frac\{/);
    assert.doesNotMatch(
      html,
      /<div class="math-block">[^<]*\/[^<]*<\/div>/,
      `${experiment.slug} não deve exibir divisões tipográficas cruas`,
    );

    assert.match(report, /^# /m);
    assert.match(report, /^## Dados brutos/m);
    assert.match(report, /^## Tratamento e análise/m);
    assert.match(report, /^## Discussão/m);
    assert.match(report, /^## Conclusão/m);
    assert.match(report, /\\begin\{aligned\}/);
    assert.match(report, /\\frac\{/);
    for (const equation of experiment.equations) {
      assert.match(report, equation);
    }
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

  assert.equal((html.match(/role="tab"/g) ?? []).length, 4);
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 4);
  assert.match(
    html,
    /class="report-template"[^>]*data-markdown-report="\.\/relatorio\.md"/,
  );
  assert.match(report, /^## Dados brutos/m);
  assert.match(report, /^## Tratamento e análise/m);
  assert.match(report, /^## Discussão/m);
  assert.match(report, /\$\$[\s\S]*\\frac[\s\S]*\$\$/);
  assert.match(report, /\\begin\{aligned\}/);
  assert.ok(reportWords >= 1500, `o relatório tem somente ${reportWords} palavras`);
});
