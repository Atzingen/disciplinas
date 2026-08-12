import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  equilibriumAngleDegrees,
  normalizedForceComponents,
} from "../exercicios/halliday-21-34/modelo.js";
import { handleQuantizedBalanceShortcut } from "../exercicios/halliday-21-34/visualizacao.js";

function numericAttribute(element, name) {
  const value = Number(element.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1]);
  assert.ok(Number.isFinite(value), `${name} ausente ou inválido em ${element}`);
  return value;
}

function fallbackIon(html, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const circle = html.match(
    new RegExp(`<circle[^>]+></circle>\\s*<text[^>]*>−</text>\\s*<text[^>]*>${escapedLabel}</text>`),
  )?.[0].match(/<circle[^>]+>/)?.[0];
  assert.ok(circle, `íon ${label} ausente no fallback`);
  return {
    x: numericAttribute(circle, "cx"),
    y: numericAttribute(circle, "cy"),
  };
}

function fallbackForce(html, label) {
  const line = html.match(
    new RegExp(`<line[^>]+></line>\\s*<text[^>]*>${label}</text>`),
  )?.[0].match(/<line[^>]+>/)?.[0];
  assert.ok(line, `${label} ausente no fallback`);
  return {
    dx: numericAttribute(line, "x2") - numericAttribute(line, "x1"),
    dy: numericAttribute(line, "y2") - numericAttribute(line, "y1"),
  };
}

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

test("21.34 fallback aponta cada força para longe do íon que a repele", async () => {
  const html = await readFile(
    new URL("../exercicios/halliday-21-34/index.html", import.meta.url),
    "utf8",
  );
  const electron = fallbackIon(html, "2 · −e");
  const ion3 = fallbackIon(html, "3 · −q");
  const ion4 = fallbackIon(html, "4 · −q");
  const force3 = fallbackForce(html, "F_3");
  const force4 = fallbackForce(html, "F_4");

  assert.ok(ion3.y < electron.y && ion4.y > electron.y);
  assert.ok(force3.dx < 0 && force3.dy > 0, "F_3 deve apontar para baixo e à esquerda");
  assert.ok(force4.dx < 0 && force4.dy < 0, "F_4 deve apontar para cima e à esquerda");
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
