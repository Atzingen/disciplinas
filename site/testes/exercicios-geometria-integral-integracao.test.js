import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const exercises = ["13", "18", "33", "34", "42"];
const evidenceDirectory = new URL(
  "../../docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/",
  import.meta.url,
);

const canonicalAnswers = {
  13: [/-13,66/, /y\s*&=\s*0/],
  18: [/1,33/, /2,014/, /2,877/],
  33: [/1,34 × 10<sup>7<\/sup> C/, /8,35 × 10<sup>25<\/sup> prótons/],
  34: [/37,47°/, /50,95°/, /56,61°/],
  42: [/2,38/, /24\\,\\mathrm\{nC\}/],
};

const commonTouchTargetSelectors = {
  13: ".equilibrium-geometry__controls button",
  18: ".force-locus__controls button",
  33: ".charge-counting__controls button",
  34: ".quantized-balance__controls button",
  42: ".charged-pendulum__controls button",
};

const evidenceDimensions = {
  "21-13-desktop.png": [1440, 1000],
  "21-13-mobile-390x844.png": [390, 844],
  "21-18-desktop.png": [1440, 1000],
  "21-18-mobile-390x844.png": [390, 844],
  "21-33-desktop.png": [1440, 1000],
  "21-33-mobile-390x844.png": [390, 844],
  "21-34-desktop.png": [1440, 1000],
  "21-34-mobile-390x844.png": [390, 844],
  "21-42-desktop.png": [1440, 1450],
  "21-42-mobile-390x844.png": [390, 844],
};

function readPngDimensions(buffer) {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.length >= 24, "o PNG deve conter cabeçalho e dimensões");
  assert.deepEqual(buffer.subarray(0, 8), pngSignature, "a evidência deve ser um PNG válido");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function cssDeclarationsFor(css, selector) {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].split(",").map((entry) => entry.trim());
    if (selectors.includes(selector)) {
      return match[2];
    }
  }
  assert.fail(`regra CSS ausente para ${selector}`);
}

function assertMinimumTouchHeight(css, selector) {
  assert.match(
    cssDeclarationsFor(css, selector),
    /(?:^|;)\s*min-height:\s*44px\s*;/,
    `${selector} deve ter altura mínima de toque de 44 px`,
  );
}

for (const number of exercises) {
  test(`21.${number} cumpre o contrato comum de progressão`, async () => {
    const html = await readFile(
      new URL(`../exercicios/halliday-21-${number}/index.html`, import.meta.url),
      "utf8",
    );
    const css = await readFile(
      new URL(`../exercicios/halliday-21-${number}/visualizacao.css`, import.meta.url),
      "utf8",
    );

    assert.equal((html.match(/data-didactic-visualization/g) ?? []).length, 1);
    for (const label of ["Reproduzir", "Pausar", "Reiniciar", "Próximo passo", "Velocidade"]) {
      assert.match(html, new RegExp(label));
    }
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
    assert.match(html, /<title[^>]*>[^<]+<\/title>/);
    assert.match(html, /<desc[^>]*>[^<]+<\/desc>/);
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assertMinimumTouchHeight(css, commonTouchTargetSelectors[number]);
    if (number === "42") {
      assertMinimumTouchHeight(css, ".charged-pendulum__slider input");
    }

    for (const answer of canonicalAnswers[number]) {
      assert.match(html, answer, `21.${number} deve preservar a resposta canônica`);
    }
  });
}

test("as dez evidências PNG existem, não estão vazias e preservam os viewports", async () => {
  for (const [filename, expectedDimensions] of Object.entries(evidenceDimensions)) {
    const fileUrl = new URL(filename, evidenceDirectory);
    const fileStat = await stat(fileUrl);
    const contents = await readFile(fileUrl);

    assert.ok(fileStat.size > 0, `${filename} não pode estar vazio`);
    assert.deepEqual(
      readPngDimensions(contents),
      expectedDimensions,
      `${filename} deve preservar as dimensões documentadas`,
    );
  }
});

test("o manifesto lista as dez evidências PNG", async () => {
  const manifest = await readFile(new URL("README.md", evidenceDirectory), "utf8");

  for (const filename of Object.keys(evidenceDimensions)) {
    assert.match(manifest, new RegExp(filename.replaceAll(".", "\\.")));
  }
});
