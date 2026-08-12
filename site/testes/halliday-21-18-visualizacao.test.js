import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { forceSceneAt, solveMeasuredForces } from "../exercicios/halliday-21-18/modelo.js";
import { mountForceLocus } from "../exercicios/halliday-21-18/visualizacao.js";

function createFakeElement() {
  const attributes = new Map();
  const listeners = new Map();
  return {
    dataset: {},
    disabled: false,
    textContent: "",
    value: "1",
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
  };
}

function createControllableVisualization(t) {
  const originalGlobals = new Map(
    ["document", "matchMedia", "requestAnimationFrame", "cancelAnimationFrame"]
      .map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  const elements = new Map();
  const root = createFakeElement();
  const frames = new Map();
  let frameId = 0;

  root.querySelector = (selector) => {
    if (!elements.has(selector)) {
      elements.set(selector, createFakeElement());
    }
    return elements.get(selector);
  };

  globalThis.document = {
    hidden: false,
    addEventListener() {},
  };
  globalThis.matchMedia = () => ({
    matches: false,
    addEventListener() {},
  });
  globalThis.requestAnimationFrame = (callback) => {
    frameId += 1;
    frames.set(frameId, callback);
    return frameId;
  };
  globalThis.cancelAnimationFrame = (id) => {
    frames.delete(id);
  };

  t.after(() => {
    for (const [key, descriptor] of originalGlobals) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete globalThis[key];
      }
    }
  });

  function runNextFrame(elapsedMs) {
    const entry = frames.entries().next().value;
    if (!entry) {
      return;
    }
    const [id, callback] = entry;
    frames.delete(id);
    callback(globalThis.performance.now() + elapsedMs);
  }

  return {
    controller: mountForceLocus(root),
    element: (selector) => root.querySelector(selector),
    pendingFrames: () => frames.size,
    root,
    runNextFrame,
  };
}

function svgPoint(markup, marker) {
  const element = markup.match(new RegExp(`<circle[^>]*${marker}[^>]*>`))?.[0];
  assert.ok(element, `elemento ${marker} ausente`);
  const x = Number(element.match(/\bcx="([^"]+)"/)?.[1]);
  const y = Number(element.match(/\bcy="([^"]+)"/)?.[1]);
  assert.ok(Number.isFinite(x) && Number.isFinite(y), `coordenadas de ${marker} inválidas`);
  return { x, y };
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

test("21.18 recupera as forças e os extremos medidos", () => {
  const solved = solveMeasuredForces(2.014e-23, 2.877e-24);
  assert.equal(solved.forceB, 8.6315e-24);
  assert.equal(solved.forceC, 1.15085e-23);
  assert.ok(Math.abs(solved.chargeRatio - 1.3333140242) < 1e-10);

  const sumConfiguration = forceSceneAt(0, solved.forceB, solved.forceC);
  const transferConfiguration = forceSceneAt(0.5, solved.forceB, solved.forceC);
  const differenceConfiguration = forceSceneAt(1, solved.forceB, solved.forceC);

  assert.ok(Math.abs(sumConfiguration.resultant.x + 2.014e-23) < 1e-35);
  assert.ok(Math.abs(differenceConfiguration.resultant.x + 2.877e-24) < 1e-35);
  assert.equal(sumConfiguration.measured, true);
  assert.equal(sumConfiguration.equation, "F_B + F_C = S");
  assert.equal(transferConfiguration.measured, false);
  assert.equal(transferConfiguration.equation, null);
  assert.equal(differenceConfiguration.measured, true);
  assert.equal(differenceConfiguration.equation, "F_C - F_B = D");

  for (const scene of [sumConfiguration, differenceConfiguration]) {
    assert.ok(scene.cPosition, "o modelo deve explicitar a posição fixa de C");
    assert.ok(
      Math.abs(Math.hypot(scene.bPosition.x, scene.bPosition.y)
        - Math.hypot(scene.cPosition.x, scene.cPosition.y)) < 1e-12,
      "AB e AC devem ter o mesmo raio nos dois extremos medidos",
    );
  }
});

test("21.18 publica a mesa de forças e os cinco controles acessíveis", async () => {
  const html = await readFile(
    new URL("../exercicios/halliday-21-18/index.html", import.meta.url),
    "utf8",
  );

  for (const label of ["Reproduzir", "Pausar", "Reiniciar", "Próximo passo", "Velocidade"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-didactic-visualization/);
  assert.match(html, /data-force-locus/);
  assert.match(html, /data-force-readout/);
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
  assert.match(html, /<title(?:\s+id="[^"]+")?>[^<]+<\/title>/);
  assert.match(html, /<desc(?:\s+id="[^"]+")?>[^<]+<\/desc>/);
  assert.match(html, /1,33/);
  assert.match(html, /2,014/);
  assert.match(html, /2,877/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
});

test("21.18 mantém duas configurações completas no fallback sem JavaScript", async () => {
  const html = await readFile(
    new URL("../exercicios/halliday-21-18/index.html", import.meta.url),
    "utf8",
  );
  const configurations = [...html.matchAll(
    /<figure[^>]+data-fallback-configuration="([^"]+)"[^>]*>([\s\S]*?)<\/figure>/g,
  )];

  assert.deepEqual(configurations.map((match) => match[1]), ["sum", "difference"]);
  for (const [, , markup] of configurations) {
    assert.match(markup, /data-fallback-b/);
    assert.match(markup, /data-fallback-force-b/);
    assert.match(markup, /data-fallback-force-c/);
    assert.match(markup, /data-fallback-resultant/);

    const a = svgPoint(markup, "data-fallback-a");
    const b = svgPoint(markup, "data-fallback-b");
    const c = svgPoint(markup, "data-fallback-c");
    assert.ok(
      Math.abs(distance(a, b) - distance(a, c)) < 1e-9,
      `fallback deve preservar AB = AC: AB=${distance(a, b)}, AC=${distance(a, c)}`,
    );
  }

  assert.match(
    configurations[0][2],
    /deslocamento gráfico[\s\S]*?esquemático/i,
    "a coincidência física de B e C deve rotular qualquer separação apenas visual",
  );
});

test("21.18 posiciona C no extremo +r do locus interativo", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("../exercicios/halliday-21-18/index.html", import.meta.url), "utf8"),
    readFile(new URL("../exercicios/halliday-21-18/visualizacao.css", import.meta.url), "utf8"),
  ]);
  const a = svgPoint(html, "data-a-charge");
  const b = svgPoint(html, "data-b-charge");
  const c = svgPoint(html, "data-c-charge");

  assert.ok(Math.abs(distance(a, b) - distance(a, c)) < 1e-9);
  assert.deepEqual(c, b, "B e C ocupam fisicamente o mesmo extremo na configuração de soma");
  assert.match(
    html,
    /\\frac\{q_C\}\{q_B\}[\s\S]*?&=\\frac\{F_C\}\{F_B\}[\s\S]*?\\approx1,33/,
  );

  const bLabel = html.match(/<text class="force-locus__label" data-b-label[^>]+>/)?.[0];
  const cLabel = html.match(
    /<g class="force-locus__schematic-offset"[\s\S]*?<text class="force-locus__label"[^>]+>/,
  )?.[0].match(/<text class="force-locus__label"[^>]+>/)?.[0];
  const cOffsetY = Number(
    css.match(
      /\.force-locus__schematic-offset\s*\{[^}]*transform:\s*translate\([^,]+,\s*(-?[\d.]+)px\)/,
    )?.[1],
  );
  assert.ok(bLabel && cLabel && Number.isFinite(cOffsetY));
  const bLabelY = Number(bLabel.match(/\by="([^"]+)"/)?.[1]);
  const cLabelY = Number(cLabel.match(/\by="([^"]+)"/)?.[1]) + cOffsetY;
  assert.ok(
    bLabelY - cLabelY >= 48,
    `rótulos B/C sem folga mobile: separação=${bLabelY - cLabelY}`,
  );
});

test("21.18 separa a resultante e faz o rótulo r acompanhar AB", (t) => {
  const visualization = createControllableVisualization(t);
  const forceB = visualization.element("[data-force-b]");
  const resultant = visualization.element("[data-resultant]");
  const radiusLabel = visualization.element("[data-radius-label]");

  assert.notEqual(resultant.getAttribute("y1"), forceB.getAttribute("y1"));
  const initialLabel = {
    x: Number(radiusLabel.getAttribute("x")),
    y: Number(radiusLabel.getAttribute("y")),
  };
  assert.ok(Number.isFinite(initialLabel.x) && Number.isFinite(initialLabel.y));

  visualization.controller.step();
  visualization.runNextFrame(1000);
  assert.notDeepEqual({
    x: Number(radiusLabel.getAttribute("x")),
    y: Number(radiusLabel.getAttribute("y")),
  }, initialLabel);
});

test("21.18 mantém a resultante intermediária visível e afastada dos componentes", (t) => {
  const visualization = createControllableVisualization(t);

  visualization.controller.step();
  visualization.runNextFrame(1000);
  visualization.controller.step();
  visualization.runNextFrame(1000);

  const forceB = visualization.element("[data-force-b]");
  const forceC = visualization.element("[data-force-c]");
  const resultant = visualization.element("[data-resultant]");
  const resultantLabel = visualization.element("[data-resultant-label]");
  const resultTipY = Number(resultant.getAttribute("y2"));
  const resultLabelY = Number(resultantLabel.getAttribute("y"));
  const componentMaxX = Math.max(
    Number(forceB.getAttribute("x1")),
    Number(forceB.getAttribute("x2")),
    Number(forceC.getAttribute("x1")),
    Number(forceC.getAttribute("x2")),
  );
  const resultMinX = Math.min(
    Number(resultant.getAttribute("x1")),
    Number(resultant.getAttribute("x2")),
  );

  // A fonte mobile mede 28 px e o marker da resultante chega a cerca de 25 px
  // acima da ponta. A margem adicional preserva ambos dentro do viewBox.
  assert.ok(resultTipY - 25 >= 24, `marker sem margem superior: y=${resultTipY}`);
  assert.ok(resultLabelY - 28 >= 24, `rótulo sem margem superior: y=${resultLabelY}`);
  assert.ok(
    resultMinX - componentMaxX >= 24,
    `resultante invade a composição: gap=${resultMinX - componentMaxX}`,
  );
});

test("21.18 mantém o rótulo B associado à carga e fora da resultante", (t) => {
  const visualization = createControllableVisualization(t);
  const bCharge = visualization.element("[data-b-charge]");
  const bLabel = visualization.element("[data-b-label]");
  const resultant = visualization.element("[data-resultant]");

  function distanceToSegment(point, start, end) {
    const segment = { x: end.x - start.x, y: end.y - start.y };
    const lengthSquared = (segment.x ** 2) + (segment.y ** 2);
    const projection = Math.max(0, Math.min(1,
      (((point.x - start.x) * segment.x) + ((point.y - start.y) * segment.y))
      / lengthSquared,
    ));
    return Math.hypot(
      point.x - (start.x + (projection * segment.x)),
      point.y - (start.y + (projection * segment.y)),
    );
  }

  function assertLabelClearance() {
    const progress = Number(visualization.root.dataset.progress);
    const charge = {
      x: Number(bCharge.getAttribute("cx")),
      y: Number(bCharge.getAttribute("cy")),
    };
    // Bounding conservador para a fonte mobile de 28 px, ancorada pela baseline.
    const labelCenter = {
      x: Number(bLabel.getAttribute("x")),
      y: Number(bLabel.getAttribute("y")) - 14,
    };
    const labelRadius = Math.hypot(10, 14);
    const resultStart = {
      x: Number(resultant.getAttribute("x1")),
      y: Number(resultant.getAttribute("y1")),
    };
    const resultEnd = {
      x: Number(resultant.getAttribute("x2")),
      y: Number(resultant.getAttribute("y2")),
    };
    const associationDistance = Math.hypot(
      labelCenter.x - charge.x,
      labelCenter.y - charge.y,
    );
    const resultClearance = distanceToSegment(labelCenter, resultStart, resultEnd)
      - labelRadius
      - 3.5;

    assert.ok(
      resultClearance >= 16,
      `rótulo B invade a resultante em progress=${progress}: clearance=${resultClearance}`,
    );
    assert.ok(
      associationDistance >= 48 && associationDistance <= 80,
      `rótulo B sem associação clara em progress=${progress}: distância=${associationDistance}`,
    );
  }

  assertLabelClearance();
  for (let step = 0; step < 3; step += 1) {
    visualization.controller.step();
    visualization.runNextFrame(1000);
    assertLabelClearance();
  }
});

test("21.18 pausa cancela o RAF e congela B imediatamente", (t) => {
  const visualization = createControllableVisualization(t);

  visualization.controller.step();
  visualization.runNextFrame(100);
  assert.equal(visualization.pendingFrames(), 1);
  const progressAtPause = visualization.root.dataset.progress;

  visualization.controller.pause();
  visualization.runNextFrame(1000);

  assert.equal(visualization.pendingFrames(), 0);
  assert.equal(visualization.root.dataset.progress, progressAtPause);
  assert.equal(visualization.root.dataset.playState, "paused");
});
