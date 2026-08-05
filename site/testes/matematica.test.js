import assert from "node:assert/strict";
import test from "node:test";

import {
  MATHJAX_CONFIG,
  MATHJAX_URL,
  MATHJAX_VERSION,
  typesetMath,
} from "../componentes/matematica.js";

test("MathJax usa versão fixa e delimitadores explícitos", () => {
  assert.equal(MATHJAX_VERSION, "4.1.2");
  assert.equal(
    MATHJAX_URL,
    "https://cdn.jsdelivr.net/npm/mathjax@4.1.2/tex-mml-chtml.js",
  );
  assert.deepEqual(MATHJAX_CONFIG.tex.inlineMath, [["\\(", "\\)"]]);
  assert.deepEqual(MATHJAX_CONFIG.tex.displayMath, [["\\[", "\\]"]]);
  assert.equal(MATHJAX_CONFIG.tex.processEscapes, true);
  assert.equal(typeof typesetMath, "function");
});

test("typesetMath é inofensivo fora do navegador", async () => {
  assert.equal(await typesetMath(), false);
});
