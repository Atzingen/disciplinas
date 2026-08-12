import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { pendulumState } from "../exercicios/halliday-21-42/modelo.js";

test("21.42 preserva carga, ângulo e hipótese de pequeno ângulo", () => {
  const state = pendulumState({
    lengthM: 1.2,
    massKg: 0.01,
    separationM: 0.05,
    gravity: 9.81,
  });

  assert.ok(Math.abs(state.thetaDegrees - 1.1937484) < 1e-6);
  assert.ok(Math.abs(state.approximateChargeC - 2.3843e-8) < 1e-12);
  assert.ok(state.relativeChargeError < 0.0002);
  assert.equal(state.halfSeparationM, 0.025);
});

test("21.42 rejeita dimensões incompatíveis com o pêndulo", () => {
  for (const options of [
    { lengthM: 0, massKg: 0.01, separationM: 0.05, gravity: 9.81 },
    { lengthM: 1.2, massKg: 0, separationM: 0.05, gravity: 9.81 },
    { lengthM: 1.2, massKg: 0.01, separationM: 2.4, gravity: 9.81 },
    { lengthM: 1.2, massKg: 0.01, separationM: 0.05, gravity: 0 },
  ]) {
    assert.throws(() => pendulumState(options), RangeError);
  }
});

test("21.42 publica separação variável, roteiro completo e SVG acessível", async () => {
  const htmlUrl = new URL(
    "../exercicios/halliday-21-42/index.html",
    import.meta.url,
  );
  const html = await readFile(htmlUrl, "utf8");

  assert.match(html, /data-charged-pendulum/);
  assert.match(
    html,
    /<input[^>]+type="range"[^>]+data-separation[^>]+min="1"[^>]+max="20"[^>]+step="0\.5"[^>]+value="5"/,
  );
  assert.match(html, /5,0 cm/);
  assert.match(html, /geometria ampliada; valores numéricos exatos/);
  for (const label of [
    "Reproduzir",
    "Pausar",
    "Reiniciar",
    "Próximo passo",
    "Velocidade",
  ]) {
    assert.match(html, new RegExp(label));
  }
  for (const relation of [
    "x/2",
    "T sen θ = F<sub>e</sub>",
    "T cos θ = mg",
    "tan θ = F<sub>e</sub> / mg",
    "F<sub>e</sub> = kq<sup>2</sup> / x<sup>2</sup>",
    "x<sup>3</sup>",
    "2,38 × 10<sup>−8</sup> C",
    "24 nC",
  ]) {
    assert.match(html, new RegExp(relation));
  }
  assert.match(html, /sen θ ≈ tan θ/);
  assert.equal(
    html.match(/<svg[^>]+role="img"[^>]+aria-labelledby=/g)?.length,
    2,
    "geometria e corpo livre devem ter canvases acessíveis independentes",
  );
  assert.match(
    html,
    /<span>T sen θ = F<sub>e<\/sub>;<\/span>\s*<span>T cos θ = mg<\/span>/,
  );
  assert.doesNotMatch(html, /F<sub>e<\/sub> · T cos θ = mg/);
  assert.match(html, /q = √\(mgx<sup>3<\/sup> \/ \(2Lk\)\)/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
});

test("21.42 mantém erro positivo legível no limite inferior", async () => {
  const { formatRelativeError } = await import(
    "../exercicios/halliday-21-42/visualizacao.js"
  );
  const minimumState = pendulumState({
    lengthM: 1.2,
    massKg: 0.01,
    separationM: 0.01,
    gravity: 9.81,
  });
  const canonicalState = pendulumState({
    lengthM: 1.2,
    massKg: 0.01,
    separationM: 0.05,
    gravity: 9.81,
  });

  assert.ok(minimumState.relativeChargeError > 0);
  assert.equal(formatRelativeError(minimumState.relativeChargeError), "< 0,001%");
  assert.equal(formatRelativeError(canonicalState.relativeChargeError), "0,011%");
});

test("21.42 preserva teclas nativas e aplica atalhos somente no contêiner", async () => {
  const { handleChargedPendulumShortcut } = await import(
    "../exercicios/halliday-21-42/visualizacao.js"
  );
  const root = {};
  const actions = {
    next: 0,
    previous: 0,
    reset: 0,
    togglePlay: 0,
  };
  const callbacks = {
    next: () => {
      actions.next += 1;
    },
    previous: () => {
      actions.previous += 1;
    },
    reset: () => {
      actions.reset += 1;
    },
    togglePlay: () => {
      actions.togglePlay += 1;
    },
  };
  let prevented = false;

  const nativeHandled = handleChargedPendulumShortcut(
    {
      target: { closest: () => ({ tagName: "INPUT" }) },
      key: "ArrowRight",
      preventDefault() {
        prevented = true;
      },
    },
    root,
    callbacks,
  );
  assert.equal(nativeHandled, false);
  assert.equal(prevented, false);
  assert.equal(actions.next, 0);

  const rootHandled = handleChargedPendulumShortcut(
    {
      target: root,
      key: "ArrowRight",
      preventDefault() {
        prevented = true;
      },
    },
    root,
    callbacks,
  );
  assert.equal(rootHandled, true);
  assert.equal(prevented, true);
  assert.equal(actions.next, 1);
});

test("21.42 oferece fallback legível e empilha os painéis no mobile", async () => {
  const htmlUrl = new URL(
    "../exercicios/halliday-21-42/index.html",
    import.meta.url,
  );
  const cssUrl = new URL(
    "../exercicios/halliday-21-42/visualizacao.css",
    import.meta.url,
  );
  const [html, css] = await Promise.all([
    readFile(htmlUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  assert.doesNotMatch(
    html,
    /data-charged-pendulum[^>]+data-enhanced/,
    "o HTML canônico não deve depender da execução do JavaScript",
  );
  assert.match(
    css,
    /\.charged-pendulum\[data-enhanced="true"\] \[data-reveal-step\]/,
  );
  assert.doesNotMatch(
    css,
    /(?:^|\n)\.charged-pendulum \[data-reveal-step\] \{/,
  );
  assert.equal(html.match(/class="charged-pendulum__canvas"/g)?.length, 2);
  assert.match(
    css,
    /@media \(max-width: 620px\)[\s\S]*?\.charged-pendulum__diagram \{[\s\S]*?grid-template-columns: 1fr;/,
  );
  assert.doesNotMatch(css, /min-width:\s*680px/);
});
