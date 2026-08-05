import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let experimentApi = {};

try {
  experimentApi = await import("../experimentos/experimento.js");
} catch {
  experimentApi = {};
}

const experiments = [
  {
    slug: "01-campo-corrente",
    image: "exp-01-oersted-montagem.jpg",
    equations: [/B\(r\)\s*=\s*μ₀I\/\(2πr\)/, /tan\s*φ\s*=\s*B_fio\/B_T,h/],
  },
  {
    slug: "02-campo-solenoide",
    image: "exp-02-solenoide-montagem.jpg",
    equations: [/B_ideal\s*=\s*μ₀\(N\/ℓ\)I\s*=\s*μ₀nI/, /B\(z\).*z\+ℓ\/2.*z−ℓ\/2/s],
  },
  {
    slug: "03-forca-magnetica-motor",
    image: "exp-03-balanco-magnetico.jpg",
    equations: [/F\s*=\s*BIL\s*sin\s*θ/, /τ\s*=\s*μ\s*×\s*B/, /U\s*=\s*−μ·B/],
  },
  {
    slug: "04-inducao-eletromagnetica",
    image: "exp-04-montagem.jpg",
    equations: [/ε\s*=\s*−N\s*dΦ_B\/dt/, /L\s*di\/dt\s*\+\s*Ri\s*=\s*ε\(t\)/],
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

function createInteractiveFixture() {
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
    makeTab("painel-dados", false),
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
  const root = {
    querySelectorAll(selector) {
      return selector === '[role="tab"]' ? tabs : [];
    },
    querySelector(selector) {
      if (selector === "[data-print-report]") return printButton;
      return panels.get(selector) ?? null;
    },
  };
  return { root, tabs, panels, printButton };
}

test("ação de imprimir ativa primeiro a aba Relatório", () => {
  assert.equal(typeof experimentApi.setupExperiment, "function");
  const fixture = createInteractiveFixture();
  let printCalls = 0;

  experimentApi.setupExperiment(fixture.root, () => {
    printCalls += 1;
  });
  fixture.printButton.clickHandler();

  assert.equal(fixture.tabs[3].getAttribute("aria-selected"), "true");
  assert.equal(fixture.panels.get("#painel-relatorio").hidden, false);
  assert.equal(fixture.panels.get("#painel-montagem").hidden, true);
  assert.equal(printCalls, 1);
});

for (const experiment of experiments) {
  test(`${experiment.slug} entrega roteiro avançado e relatório`, async () => {
    const html = await readExperiment(experiment.slug, "index.html");
    const report = await readExperiment(experiment.slug, "relatorio.md");
    const text = plainText(html);

    assert.equal((html.match(/role="tab"/g) ?? []).length, 4);
    assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 4);
    assert.match(text, /Montagem/);
    assert.match(text, /Fundamentos/);
    assert.match(text, /Dados/);
    assert.match(text, /Relatório/);
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
    assert.match(report, /^## Dados/m);
    assert.match(report, /^## Análise/m);
    assert.match(report, /^## Conclusão/m);
  });
}
