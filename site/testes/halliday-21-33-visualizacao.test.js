import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { waterChargeSteps } from "../exercicios/halliday-21-33/modelo.js";
import {
  chargeStationsMarkup,
  presentChargeStep,
} from "../exercicios/halliday-21-33/visualizacao.js";

test("21.33 percorre volume, partículas e carga sem perder a escala", () => {
  const steps = waterChargeSteps();

  assert.deepEqual(
    steps.map((step) => step.id),
    ["volume", "mass", "moles", "molecules", "protons", "charge"],
  );
  assert.equal(steps[1].value, 250);
  assert.ok(Math.abs(steps[2].value - 13.8734739) < 1e-6);
  assert.ok(Math.abs(steps[4].value - 8.35e25) / 8.35e25 < 0.001);
  assert.ok(Math.abs(steps[5].value - 1.34e7) / 1.34e7 < 0.002);
  assert.equal(steps[5].netChargeCoulombs, 0);
});

test("21.33 mantém fatores e unidades no modelo sem markup de apresentação", () => {
  const steps = waterChargeSteps();
  const presentationKeys = [
    "title",
    "displayValue",
    "factorLabel",
    "factorHtml",
    "cancellationHtml",
    "accessibleText",
  ];

  assert.doesNotMatch(JSON.stringify(steps), /<\/?(?:s|sup)>/);
  for (const step of steps) {
    for (const key of presentationKeys) {
      assert.equal(key in step, false, `${key} não pertence ao modelo`);
    }
    assert.equal(typeof step.value, "number");
    assert.equal(typeof step.symbol, "string");
    assert.equal(typeof step.unit.symbol, "string");
    assert.equal(typeof step.unit.power, "number");
  }

  assert.equal(steps[0].factor, null);
  assert.equal(steps[0].cancelledUnit, null);
  assert.deepEqual(steps[1].factor, {
    numerator: { value: 1, unit: { symbol: "g", power: 1 } },
    denominator: { value: 1, unit: { symbol: "cm", power: 3 } },
  });
  assert.deepEqual(steps[3].factor, {
    numerator: {
      value: 6.022e23,
      unit: { symbol: "moléculas", power: 1 },
    },
    denominator: { value: 1, unit: { symbol: "mol", power: 1 } },
  });
  assert.deepEqual(steps[5].cancelledUnit, {
    symbol: "prótons",
    power: 1,
  });
});

test("21.33 deriva valores e fatores renderizados do modelo recebido", () => {
  const steps = waterChargeSteps();
  const changedCharge = {
    ...steps[5],
    value: 2.5e8,
    exponent: Math.log10(2.5e8),
    factor: {
      ...steps[5].factor,
      numerator: {
        ...steps[5].factor.numerator,
        value: 3.204e-19,
      },
    },
  };
  const presentation = presentChargeStep(changedCharge, steps[4]);
  const stations = chargeStationsMarkup([...steps.slice(0, 5), changedCharge]);

  assert.match(presentation.valueHtml, /\+2,50 × 10<sup>8<\/sup> C/);
  assert.match(
    presentation.factorHtml,
    /3,204 × 10<sup>−19<\/sup> C\s*\/\s*1 <s>próton<\/s>/,
  );
  assert.match(presentation.factorHtml, /<s>prótons<\/s>/);
  assert.match(stations, /data-station="charge"/);
  assert.match(stations, /\+2,50 × 10<sup>8<\/sup> C/);
  assert.equal(stations.match(/data-station=/g)?.length, 6);
});

test("21.33 publica a contagem acessível sem substituir o explorador", async () => {
  const htmlUrl = new URL(
    "../exercicios/halliday-21-33/index.html",
    import.meta.url,
  );
  const cssUrl = new URL(
    "../exercicios/halliday-21-33/visualizacao.css",
    import.meta.url,
  );
  const [html, css] = await Promise.all([
    readFile(htmlUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  for (const label of [
    "Reproduzir",
    "Pausar",
    "Reiniciar",
    "Próximo passo",
    "Velocidade",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-didactic-visualization/);
  assert.match(html, /data-substance-explorer/);
  assert.match(html, /data-stations/);
  assert.match(html, /charge-counting__fallback/);
  assert.match(html, /m = ρV/);
  assert.doesNotMatch(html, /data-station="(?:volume|mass|moles|molecules|protons|charge)"/);
  assert.match(html, /logarítmica/i);
  assert.match(html, /ícones simbólicos/i);
  assert.match(html, /\+1,34 × 10<sup>7<\/sup> C/);
  assert.match(html, /−1,34 × 10<sup>7<\/sup> C/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
