import assert from "node:assert/strict";
import test from "node:test";

import {
  createMathRenderScheduler,
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
  assert.deepEqual(MATHJAX_CONFIG.tex.inlineMath, [
    ["\\(", "\\)"],
    ["$", "$"],
  ]);
  assert.deepEqual(MATHJAX_CONFIG.tex.displayMath, [
    ["\\[", "\\]"],
    ["$$", "$$"],
  ]);
  assert.equal(MATHJAX_CONFIG.tex.processEscapes, true);
  assert.equal(typeof typesetMath, "function");
  assert.equal(typeof createMathRenderScheduler, "function");
});

test("typesetMath é inofensivo fora do navegador", async () => {
  assert.equal(await typesetMath(), false);
});

test("agendador recompõe uma vez por quadro visual", async () => {
  const calls = [];
  const callbacks = [];
  const root = { id: "painel-dinamico" };
  const schedule = createMathRenderScheduler(
    async (target) => {
      calls.push(target);
      return true;
    },
    (callback) => {
      callbacks.push(callback);
      return callbacks.length;
    },
  );

  assert.equal(schedule(root), true);
  assert.equal(schedule(root), false);
  assert.equal(callbacks.length, 1);
  assert.equal(calls.length, 0);

  await callbacks[0]();
  assert.deepEqual(calls, [root]);
});
