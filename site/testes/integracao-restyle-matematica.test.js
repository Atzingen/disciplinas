import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSiteFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("exercícios preservam a navegação por seções ao receber LaTeX", async () => {
  for (const exercise of [13, 18, 34, 42]) {
    const html = await readSiteFile(
      `exercicios/halliday-21-${exercise}/index.html`,
    );
    const finalSection = exercise === 13 ? "simulacao" : "diagrama";

    assert.match(html, /data-section-nav/);
    assert.match(html, /id="enunciado"/);
    assert.match(html, /id="resolucao"/);
    assert.match(html, new RegExp(`id="${finalSection}"`));
    assert.doesNotMatch(html, /role="tab(?:list|panel)?"/);
    assert.match(html, /\\begin\{aligned\}/);
    assert.match(html, /\\frac\{/);
  }
});

test("relatórios completos usam o contêiner visual da interface atual", async () => {
  const experiments = [
    "01-campo-corrente",
    "02-campo-solenoide",
    "03-forca-magnetica-motor",
    "04-inducao-eletromagnetica",
  ];

  for (const experiment of experiments) {
    const html = await readSiteFile(`experimentos/${experiment}/index.html`);

    assert.match(
      html,
      /class="report-template"[^>]*data-markdown-report="\.\/relatorio\.md"/,
    );
    assert.match(html, /data-print-report/);
    assert.match(html, /src="\.\.\/experimento\.js"/);
  }
});
