import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  equilibriumAngleDegrees,
  normalizedForceComponents,
} from "../exercicios/halliday-21-34/modelo.js";
import { handleQuantizedBalanceShortcut } from "../exercicios/halliday-21-34/visualizacao.js";

test("21.34 converte cargas inteiras nos ângulos físicos", () => {
  const angles = [1, 2, 3, 4, 5].map(equilibriumAngleDegrees);

  assert.deepEqual(
    angles.map((value) => Number(value.toFixed(2))),
    [37.47, 50.95, 56.61, 60.0, 62.34],
  );
});

test("21.34 equilibra as componentes normalizadas", () => {
  for (let n = 1; n <= 5; n += 1) {
    const forces = normalizedForceComponents(n);
    assert.ok(Math.abs(forces.verticalPair) < 1e-12);
    assert.ok(Math.abs(forces.horizontalResidual) < 1e-12);
  }
});

test("21.34 publica seletor quantizado, roteiro e SVG acessível", async () => {
  const htmlUrl = new URL(
    "../exercicios/halliday-21-34/index.html",
    import.meta.url,
  );
  const html = await readFile(htmlUrl, "utf8");

  assert.match(html, /data-quantized-balance/);
  const didacticMarkers = html.match(/data-didactic-visualization/g) ?? [];
  const sharedRoots =
    html.match(
      /<article(?=[^>]*data-quantized-balance)(?=[^>]*data-didactic-visualization)[^>]*>/g,
    ) ?? [];
  assert.deepEqual(
    [didacticMarkers.length, sharedRoots.length],
    [1, 1],
    "o único marcador didático deve estar no root da balança",
  );
  assert.match(html, /n\s*=\s*q\/e/);
  for (let n = 1; n <= 5; n += 1) {
    assert.match(html, new RegExp(`data-ion-multiple="${n}"`));
  }
  assert.equal(html.match(/data-ion-multiple=/g)?.length, 5);
  for (const label of [
    "Reproduzir",
    "Pausar",
    "Reiniciar",
    "Próximo passo",
    "Velocidade",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /cos<sup>2<\/sup>/);
  assert.match(html, /cos<sup>3<\/sup>/);
  assert.match(html, /carga do íon = <span data-ion-charge>−1e<\/span>/);
  assert.doesNotMatch(html, /→ q = <span data-ion-charge>−/);
  assert.match(html, /37,47°/);
  assert.match(html, /50,95°/);
  assert.match(html, /56,61°/);
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
});

test("21.34 associa o sinal vertical ao íon correspondente", async () => {
  const htmlUrl = new URL(
    "../exercicios/halliday-21-34/index.html",
    import.meta.url,
  );
  const html = await readFile(htmlUrl, "utf8");

  assert.match(
    html,
    /<span>íon 3<\/span><strong>−<span data-vertical-one>/,
  );
  assert.match(
    html,
    /<span>íon 4<\/span><strong>\+<span data-vertical-one>/,
  );
});

test("21.34 preserva Space nativo em botões descendentes", () => {
  const root = {};
  const button = {};
  let actionCalls = 0;
  let prevented = false;

  const handled = handleQuantizedBalanceShortcut(
    {
      target: button,
      key: " ",
      preventDefault() {
        prevented = true;
      },
    },
    root,
    {
      next: () => {
        actionCalls += 1;
      },
      previous: () => {
        actionCalls += 1;
      },
      reset: () => {
        actionCalls += 1;
      },
      togglePlay: () => {
        actionCalls += 1;
      },
    },
  );

  assert.equal(handled, false);
  assert.equal(prevented, false);
  assert.equal(actionCalls, 0);
});
