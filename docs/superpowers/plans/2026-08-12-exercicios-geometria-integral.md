# Visualizações geométricas dos exercícios Halliday 21 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acrescentar aos cinco exercícios uma explicação matemática animada e acessível, específica para sua geometria, sem alterar as respostas científicas já publicadas.

**Architecture:** Cada exercício recebe modelo matemático puro, SVG, estilos e controlador locais; o HTML mantém uma figura inicial funcional sem JavaScript. Os cinco conjuntos não compartilham arquivos de implementação e podem ser produzidos por implementadores distintos. Uma sexta tarefa, executada depois, toca somente testes e evidências de integração.

**Tech Stack:** HTML5 semântico, CSS responsivo, SVG inline, JavaScript ES modules, Node.js test runner, Python HTTP server e `playwright-cli`; nenhuma nova dependência npm ou framework de runtime.

## Global Constraints

- Preservar integralmente as respostas atuais: 21.13 `(-13,66 cm, 0)`; 21.18 `q_C/q_B ≈ 1,33`; 21.33 `1,34 × 10⁷ C`; 21.34 `37,47°`, `50,95°`, `56,61°`; 21.42 `2,38 × 10⁻⁸ C ≈ 24 nC` e a expressão cúbica publicada.
- Não introduzir integral: nenhum dos cinco enunciados usa distribuição contínua. Usar varredura, locus, cadeia discreta, decomposição vetorial ou aproximação, conforme a especificação.
- Não alterar `site/assets/*.css`, `site/componentes/*.js`, `site/nucleo/*.js`, `site/simuladores.json` ou outro arquivo compartilhado nas tarefas 1–5.
- Cada painel usa `[data-didactic-visualization]`, começa pausado e oferece botões `Reproduzir`, `Pausar`, `Reiniciar`, `Próximo passo`, seletor `Velocidade` com `0,5×`, `1×`, `2×` e status `aria-live="polite"`.
- Cada controlador local produz `play()`, `pause()`, `reset()`, `step()`, `setSpeed(multiplier)` e `getState()`; o root expõe `data-play-state`, `data-step` e `data-motion` para testes sem acoplamento à apresentação.
- Todo SVG interativo tem `role="img"`, `aria-labelledby`, `title`, `desc`, texto que não depende de cor e uma figura inicial cientificamente útil sem JavaScript.
- `prefers-reduced-motion: reduce` desativa interpolação e autoplay; avanço manual continua funcional. A página pausa ao ficar oculta e nunca mantém mais de um temporizador.
- Em 390 × 844 não pode haver overflow horizontal; controles quebram linha, texto permanece legível e alvos interativos têm pelo menos 44 × 44 px.
- Cada tarefa inicia em RED, termina em GREEN, faz validação Playwright real em 1440 × 1000 e 390 × 844 e salva os dois screenshots indicados no ownership.
- Não declarar funcionamento sem verificar teste, HTTP 200, interação, console e screenshots.

---

## Protocolo de execução e ownership

Use cinco subagentes implementadores frescos e distintos, um para cada uma das tarefas 1–5: `implementador-21-13`, `implementador-21-18`, `implementador-21-33`, `implementador-21-34` e `implementador-21-42`. No worktree compartilhado, execute-os sequencialmente para que commits e índice Git não concorram; o código é independente, não a operação de commit. Cada implementador deve receber a advertência de que não está sozinho no repositório e não pode reverter trabalho alheio. A tarefa 6 pertence a um integrador novo, depois dos cinco GREEN.

| Tarefa | Ownership exclusivo |
|---|---|
| 1 · 21.13 | `site/exercicios/halliday-21-13/{index.html,app.js,modelo.js,visualizacao.js,visualizacao.css}`, `site/testes/halliday-21-13-visualizacao.test.js`, screenshots `21-13-*` |
| 2 · 21.18 | `site/exercicios/halliday-21-18/{index.html,app.js,modelo.js,visualizacao.js,visualizacao.css}`, `site/testes/halliday-21-18-visualizacao.test.js`, screenshots `21-18-*` |
| 3 · 21.33 | `site/exercicios/halliday-21-33/{index.html,app.js,modelo.js,visualizacao.js,visualizacao.css}`, `site/testes/halliday-21-33-visualizacao.test.js`, screenshots `21-33-*`; não tocar em `substancias.js` |
| 4 · 21.34 | `site/exercicios/halliday-21-34/{index.html,app.js,modelo.js,visualizacao.js,visualizacao.css}`, `site/testes/halliday-21-34-visualizacao.test.js`, screenshots `21-34-*` |
| 5 · 21.42 | `site/exercicios/halliday-21-42/{index.html,app.js,modelo.js,visualizacao.js,visualizacao.css}`, `site/testes/halliday-21-42-visualizacao.test.js`, screenshots `21-42-*` |
| 6 · integração | `site/testes/exercicios-halliday.test.js`, `site/testes/exercicios-geometria-integral-integracao.test.js`, `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/README.md` |

Todos os screenshots ficam em `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/`. Nenhuma tarefa pode editar arquivo pertencente a outra; o integrador não refatora os módulos locais.

---

### Task 1: Halliday 21.13 — radar de nulidade do campo

**Implementador obrigatório:** subagente fresco `implementador-21-13`.

**Files:**

- Modify: `site/exercicios/halliday-21-13/index.html`
- Modify: `site/exercicios/halliday-21-13/app.js`
- Create: `site/exercicios/halliday-21-13/modelo.js`
- Create: `site/exercicios/halliday-21-13/visualizacao.js`
- Create: `site/exercicios/halliday-21-13/visualizacao.css`
- Create: `site/testes/halliday-21-13-visualizacao.test.js`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-13-desktop.png`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-13-mobile-390x844.png`

**Interfaces:**

- Consumes: `calculateForceSystem(sources, testCharge)` de `site/nucleo/eletrostatica.js`, `magnitude(vector)`/`scale(vector, factor)` de `site/nucleo/vetores.js` e `HALLIDAY_PRESET`/`HALLIDAY_EQUILIBRIUM_X_CM` de `preset.js`.
- Produces: `fieldVectorsAt(xCm, yCm)`, `equilibriumStoryFrames()` e `mountEquilibriumGeometry(root)`; o último retorna o contrato comum de controle.

- [ ] **Step 1: Escrever o teste RED do modelo e do contrato HTML**

Criar o teste com import direto do módulo ainda ausente, leitura do HTML e estas expectativas centrais:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { magnitude } from "../nucleo/vetores.js";
import {
  equilibriumStoryFrames,
  fieldVectorsAt,
} from "../exercicios/halliday-21-13/modelo.js";

test("21.13 termina na única raiz de campo nulo", () => {
  const frames = equilibriumStoryFrames();
  assert.deepEqual(frames.map((frame) => frame.id), [
    "off-axis", "between", "right", "left-far", "left-near", "equilibrium",
  ]);
  assert.ok(magnitude(fieldVectorsAt(-13.660254037844389, 0).resultant) < 1e-10);
});

test("21.13 publica controles acessíveis e preserva o simulador", async () => {
  const html = await readFile(new URL("../exercicios/halliday-21-13/index.html", import.meta.url), "utf8");
  for (const label of ["Reproduzir", "Pausar", "Reiniciar", "Próximo passo", "Velocidade"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /data-didactic-visualization/);
  assert.match(html, /data-halliday-simulator/);
  assert.match(html, /-13,66/);
});
```

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `node --test site/testes/halliday-21-13-visualizacao.test.js`

Expected: FAIL com `ERR_MODULE_NOT_FOUND` para `modelo.js`.

- [ ] **Step 3: Implementar o modelo mínimo da varredura**

Usar a física existente, sem duplicar a lei de Coulomb:

```js
import { calculateForceSystem } from "../../nucleo/eletrostatica.js";
import { scale } from "../../nucleo/vetores.js";
import { HALLIDAY_EQUILIBRIUM_X_CM, HALLIDAY_PRESET } from "./preset.js";

export function fieldVectorsAt(xCm, yCm) {
  const testCharge = {
    ...HALLIDAY_PRESET.testCharge,
    xCm,
    yCm,
  };
  const system = calculateForceSystem(HALLIDAY_PRESET.sources, testCharge);
  const testChargeC = testCharge.sign * testCharge.magnitudeMicroC * 1e-6;
  return {
    individual: system.individual.map((entry) => ({
      sourceId: entry.sourceId,
      field: scale(entry.force, 1 / testChargeC),
    })),
    resultant: scale(system.resultant, 1 / testChargeC),
  };
}

export function equilibriumStoryFrames() {
  return Object.freeze([
    { id: "off-axis", xCm: -13.66, yCm: 5 },
    { id: "between", xCm: 5, yCm: 0 },
    { id: "right", xCm: 15, yCm: 0 },
    { id: "left-far", xCm: -20, yCm: 0 },
    { id: "left-near", xCm: -5, yCm: 0 },
    { id: "equilibrium", xCm: HALLIDAY_EQUILIBRIUM_X_CM, yCm: 0 },
  ]);
}
```

Completar cada frame com título e explicação cientificamente específica; nunca amostrar `(0,0)` ou `(10,0)`.

- [ ] **Step 4: Montar o SVG, os controles e a integração local**

Adicionar `visualizacao.css` no `<head>` e, antes do simulador livre, um painel cujo SVG mostre eixos, cargas, ponto candidato, `E₁`, `E₂`, resultante, barras de módulo e região atual. A escala de setas deve ser comum dentro de cada frame. `visualizacao.js` atualiza somente atributos/texto existentes e mantém o frame inicial no HTML como fallback.

Em `app.js`, montar sem remover os controladores atuais:

```js
const equilibriumGeometry = mountEquilibriumGeometry(
  document.querySelector("[data-didactic-visualization]"),
);

globalThis.lessonControllers = {
  sectionNav,
  chargeSimulator,
  equilibriumGeometry,
};
```

O passo final deve anunciar `x = −13,66 cm`, `y = 0`, `|E₁|/|E₂| = 1` e resultante nula. O CSS local inclui o media query de reduced motion e breakpoint móvel.

- [ ] **Step 5: Executar GREEN direcionado e regressão do 21.13**

Run:

```bash
node --test site/testes/halliday-21-13-visualizacao.test.js
node --test --test-name-pattern="Halliday" site/testes/presets.test.js
node --check site/exercicios/halliday-21-13/modelo.js
node --check site/exercicios/halliday-21-13/visualizacao.js
```

Expected: PASS e checks com exit code 0.

- [ ] **Step 6: Validar de verdade com Playwright e salvar evidência**

Com `npm run serve` ativo em outro terminal, confirmar primeiro HTTP 200 com `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/exercicios/halliday-21-13/`. Depois:

```bash
playwright-cli -s=h2113 open http://127.0.0.1:8000/exercicios/halliday-21-13/
playwright-cli -s=h2113 resize 1440 1000
playwright-cli -s=h2113 run-code "async page => { for (let i = 0; i < 5; i += 1) await page.getByRole('button', {name: 'Próximo passo'}).click(); }"
playwright-cli -s=h2113 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-13-desktop.png
playwright-cli -s=h2113 eval "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
playwright-cli -s=h2113 resize 390 844
playwright-cli -s=h2113 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-13-mobile-390x844.png
playwright-cli -s=h2113 run-code "async page => { await page.emulateMedia({reducedMotion: 'reduce'}); await page.reload(); if ((await page.locator('[data-didactic-visualization]').getAttribute('data-motion')) !== 'reduced') throw new Error('reduced motion ausente'); }"
playwright-cli -s=h2113 console error
playwright-cli -s=h2113 close
```

Também clicar `Reproduzir`, `Pausar`, alterar `Velocidade`, `Reiniciar` e confirmar via snapshot que o status e o passo mudam e retornam a zero. Expected: `true` no overflow, nenhum erro no console e dois PNGs não vazios.

- [ ] **Step 7: Commit atômico**

```bash
git add site/exercicios/halliday-21-13 site/testes/halliday-21-13-visualizacao.test.js docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-13-*.png
git commit -m "feat: explain Halliday 21.13 field equilibrium"
```

---

### Task 2: Halliday 21.18 — mesa de forças e transferência de B

**Implementador obrigatório:** subagente fresco `implementador-21-18`.

**Files:**

- Modify: `site/exercicios/halliday-21-18/index.html`
- Create: `site/exercicios/halliday-21-18/app.js`
- Create: `site/exercicios/halliday-21-18/modelo.js`
- Create: `site/exercicios/halliday-21-18/visualizacao.js`
- Create: `site/exercicios/halliday-21-18/visualizacao.css`
- Create: `site/testes/halliday-21-18-visualizacao.test.js`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-18-desktop.png`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-18-mobile-390x844.png`

**Interfaces:**

- Consumes: somente APIs padrão do navegador e `../exercicio-estatico.js` por import de efeito colateral.
- Produces: `solveMeasuredForces(sumN, differenceN)`, `forceSceneAt(progress, forceB, forceC)` e `mountForceLocus(root)`.

- [ ] **Step 1: Escrever o teste RED das duas configurações**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { forceSceneAt, solveMeasuredForces } from "../exercicios/halliday-21-18/modelo.js";

test("21.18 recupera as forças e os extremos medidos", () => {
  const solved = solveMeasuredForces(2.014e-23, 2.877e-24);
  assert.equal(solved.forceB, 8.6315e-24);
  assert.equal(solved.forceC, 1.15085e-23);
  assert.ok(Math.abs(solved.chargeRatio - 1.3333140242) < 1e-10);
  assert.ok(Math.abs(forceSceneAt(0, solved.forceB, solved.forceC).resultant.x + 2.014e-23) < 1e-35);
  assert.ok(Math.abs(forceSceneAt(1, solved.forceB, solved.forceC).resultant.x + 2.877e-24) < 1e-35);
});
```

Acrescentar leitura do HTML exigindo os cinco controles, `data-force-locus`, `role="img"`, `title`, `desc`, `1,33`, `2,014` e `2,877`.

- [ ] **Step 2: Rodar e confirmar RED**

Run: `node --test site/testes/halliday-21-18-visualizacao.test.js`

Expected: FAIL por ausência de `modelo.js`.

- [ ] **Step 3: Implementar o modelo de soma/diferença e do locus**

```js
export function solveMeasuredForces(sumN, differenceN) {
  if (!(sumN > differenceN && differenceN > 0)) throw new RangeError("As medidas devem satisfazer S > D > 0.");
  const forceB = (sumN - differenceN) / 2;
  const forceC = (sumN + differenceN) / 2;
  return { forceB, forceC, chargeRatio: forceC / forceB };
}

export function forceSceneAt(progress, forceB, forceC) {
  const angle = Math.PI * Math.min(1, Math.max(0, progress));
  const bPosition = { x: Math.cos(angle), y: -Math.sin(angle) };
  const bForce = { x: -forceB * bPosition.x, y: -forceB * bPosition.y };
  const cForce = { x: -forceC, y: 0 };
  return {
    bPosition,
    bForce,
    cForce,
    resultant: { x: bForce.x + cForce.x, y: bForce.y },
  };
}
```

Os estados intermediários devem carregar `measured: false`; apenas progressos 0 e 1 recebem as equações do enunciado.

- [ ] **Step 4: Substituir o diagrama estático por uma mesa de forças progressivamente aprimorada**

Preservar as duas configurações visíveis no HTML inicial. Envolver o SVG com `data-didactic-visualization data-force-locus`, acrescentar circunferência tracejada centrada em A, dimensão `r`, vetores ponta a cauda e painel numérico de `F_B`, `F_C` e resultante. O movimento de B é uma interpolação no semicírculo e deve exibir “trajeto de transferência; configuração não medida” fora dos extremos.

Criar `app.js`:

```js
import "../exercicio-estatico.js";
import { mountForceLocus } from "./visualizacao.js";

globalThis.lessonControllers = {
  forceLocus: mountForceLocus(document.querySelector("[data-force-locus]")),
};
```

No fim de `index.html`, substituir o carregamento direto de `../exercicio-estatico.js` por `./app.js`; o novo módulo já importa o inicializador compartilhado.

Manter todo texto da dedução e o valor `q_C/q_B ≈ 1,33`. Incluir CSS local, controles comuns e passos: soma, módulo fixo, transferência, diferença, isolamento e razão.

- [ ] **Step 5: Rodar GREEN direcionado**

Run:

```bash
node --test site/testes/halliday-21-18-visualizacao.test.js
node --test --test-name-pattern="21.18" site/testes/exercicios-halliday.test.js
node --check site/exercicios/halliday-21-18/modelo.js
node --check site/exercicios/halliday-21-18/visualizacao.js
```

Expected: PASS.

- [ ] **Step 6: Validar locus, controles e responsividade com Playwright**

Confirmar HTTP 200 e executar:

```bash
playwright-cli -s=h2118 open http://127.0.0.1:8000/exercicios/halliday-21-18/
playwright-cli -s=h2118 resize 1440 1000
playwright-cli -s=h2118 run-code "async page => { for (let i = 0; i < 4; i += 1) await page.getByRole('button', {name: 'Próximo passo'}).click(); }"
playwright-cli -s=h2118 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-18-desktop.png
playwright-cli -s=h2118 resize 390 844
playwright-cli -s=h2118 eval "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
playwright-cli -s=h2118 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-18-mobile-390x844.png
playwright-cli -s=h2118 run-code "async page => { await page.emulateMedia({reducedMotion: 'reduce'}); await page.reload(); if ((await page.locator('[data-force-locus]').getAttribute('data-motion')) !== 'reduced') throw new Error('reduced motion ausente'); }"
playwright-cli -s=h2118 console error
playwright-cli -s=h2118 close
```

Exercitar também play/pause/reset/velocidade e conferir que a distância visual de B a A permanece constante durante a transição. Expected: sem overflow, sem erro e screenshots legíveis.

- [ ] **Step 7: Commit atômico**

```bash
git add site/exercicios/halliday-21-18 site/testes/halliday-21-18-visualizacao.test.js docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-18-*.png
git commit -m "feat: animate Halliday 21.18 force composition"
```

---

### Task 3: Halliday 21.33 — cadeia discreta de contagem

**Implementador obrigatório:** subagente fresco `implementador-21-33`.

**Files:**

- Modify: `site/exercicios/halliday-21-33/index.html`
- Modify: `site/exercicios/halliday-21-33/app.js`
- Create: `site/exercicios/halliday-21-33/modelo.js`
- Create: `site/exercicios/halliday-21-33/visualizacao.js`
- Create: `site/exercicios/halliday-21-33/visualizacao.css`
- Create: `site/testes/halliday-21-33-visualizacao.test.js`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-33-desktop.png`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-33-mobile-390x844.png`

**Interfaces:**

- Consumes: `positiveChargeChain(sample)` de `site/nucleo/contagem-particulas.js`; o explorador existente e `substancias.js` permanecem sem alterações.
- Produces: `waterChargeSteps()` e `mountChargeCounting(root)`.

- [ ] **Step 1: Escrever o teste RED da cadeia e da neutralidade**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { waterChargeSteps } from "../exercicios/halliday-21-33/modelo.js";

test("21.33 percorre volume, partículas e carga sem perder a escala", () => {
  const steps = waterChargeSteps();
  assert.deepEqual(steps.map((step) => step.id), ["volume", "mass", "moles", "molecules", "protons", "charge"]);
  assert.equal(steps[1].value, 250);
  assert.ok(Math.abs(steps[2].value - 13.8734739) < 1e-6);
  assert.ok(Math.abs(steps[4].value - 8.35e25) / 8.35e25 < 0.001);
  assert.ok(Math.abs(steps[5].value - 1.34e7) / 1.34e7 < 0.002);
  assert.equal(steps[5].netChargeCoulombs, 0);
});
```

O mesmo teste lê HTML/CSS e exige controles, régua explicitamente `logarítmica`, texto `ícones simbólicos`, `+1,34 × 10⁷ C`, `−1,34 × 10⁷ C`, `data-substance-explorer` e media query reduced motion.

- [ ] **Step 2: Rodar e confirmar RED**

Run: `node --test site/testes/halliday-21-33-visualizacao.test.js`

Expected: FAIL por ausência de `modelo.js`.

- [ ] **Step 3: Construir as seis estações com o núcleo existente**

```js
import { positiveChargeChain } from "../../nucleo/contagem-particulas.js";

export function waterChargeSteps() {
  const chain = positiveChargeChain({
    volumeCm3: 250,
    densityGramsPerCm3: 1,
    molarMassGramsPerMol: 18.02,
    protonsPerUnit: 10,
  });
  return Object.freeze([
    { id: "volume", value: 250, unit: "cm³" },
    { id: "mass", value: chain.massGrams, unit: "g" },
    { id: "moles", value: chain.moles, unit: "mol" },
    { id: "molecules", value: chain.units, unit: "moléculas" },
    { id: "protons", value: chain.protonCount, unit: "prótons" },
    { id: "charge", value: chain.chargeCoulombs, unit: "C", netChargeCoulombs: 0 },
  ]);
}
```

Adicionar a cada passo fator, unidade que entra, unidade cancelada, texto acessível e expoente para a régua; formatar apenas na camada visual.

- [ ] **Step 4: Aprimorar a cadeia existente sem afetar o explorador**

Trocar o SVG estático da cadeia por um painel HTML/SVG inicial que contenha as seis estações. O controlador ativa uma estação por passo, risca a unidade cancelada, desloca o marcador da régua logarítmica e finaliza com barras positiva/negativa iguais. O painel deve dizer que os pontos são ícones simbólicos, não `8,35 × 10²⁵` partículas desenhadas.

Em `app.js`, conservar `sectionNav` e `substanceExplorer` e acrescentar:

```js
const chargeCounting = mountChargeCounting(
  document.querySelector("[data-didactic-visualization]"),
);

globalThis.lessonControllers = {
  sectionNav,
  substanceExplorer,
  chargeCounting,
};
```

Não editar `substancias.js`, `explorador-substancias.js`, `contagem-particulas.js` ou os resultados textuais atuais.

- [ ] **Step 5: Rodar GREEN direcionado e a regressão de contagem**

Run:

```bash
node --test site/testes/halliday-21-33-visualizacao.test.js
node --test site/testes/contagem-particulas.test.js
node --test --test-name-pattern="21.33" site/testes/exercicios-halliday.test.js
node --check site/exercicios/halliday-21-33/modelo.js
node --check site/exercicios/halliday-21-33/visualizacao.js
```

Expected: PASS.

- [ ] **Step 6: Validar escala, neutralidade e mobile com Playwright**

Confirmar HTTP 200 e executar:

```bash
playwright-cli -s=h2133 open http://127.0.0.1:8000/exercicios/halliday-21-33/
playwright-cli -s=h2133 resize 1440 1000
playwright-cli -s=h2133 run-code "async page => { for (let i = 0; i < 5; i += 1) await page.getByRole('button', {name: 'Próximo passo'}).click(); }"
playwright-cli -s=h2133 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-33-desktop.png
playwright-cli -s=h2133 resize 390 844
playwright-cli -s=h2133 eval "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
playwright-cli -s=h2133 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-33-mobile-390x844.png
playwright-cli -s=h2133 run-code "async page => { await page.emulateMedia({reducedMotion: 'reduce'}); await page.reload(); if ((await page.locator('[data-didactic-visualization]').getAttribute('data-motion')) !== 'reduced') throw new Error('reduced motion ausente'); }"
playwright-cli -s=h2133 console error
playwright-cli -s=h2133 close
```

Depois do reset, selecionar também “Nitrogênio” no explorador existente e confirmar que ele ainda recalcula. Expected: resultado da água, saldo zero e explorador preservados.

- [ ] **Step 7: Commit atômico**

```bash
git add site/exercicios/halliday-21-33/index.html site/exercicios/halliday-21-33/app.js site/exercicios/halliday-21-33/modelo.js site/exercicios/halliday-21-33/visualizacao.js site/exercicios/halliday-21-33/visualizacao.css site/testes/halliday-21-33-visualizacao.test.js docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-33-*.png
git commit -m "feat: animate Halliday 21.33 charge counting"
```

---

### Task 4: Halliday 21.34 — decomposição e quantização

**Implementador obrigatório:** subagente fresco `implementador-21-34`.

**Files:**

- Modify: `site/exercicios/halliday-21-34/index.html`
- Create: `site/exercicios/halliday-21-34/app.js`
- Create: `site/exercicios/halliday-21-34/modelo.js`
- Create: `site/exercicios/halliday-21-34/visualizacao.js`
- Create: `site/exercicios/halliday-21-34/visualizacao.css`
- Create: `site/testes/halliday-21-34-visualizacao.test.js`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-34-desktop.png`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-34-mobile-390x844.png`

**Interfaces:**

- Consumes: somente APIs padrão e `../exercicio-estatico.js`.
- Produces: `equilibriumAngleDegrees(n)`, `normalizedForceComponents(n)` e `mountQuantizedBalance(root)`.

- [ ] **Step 1: Escrever o teste RED dos cinco ângulos e do balanço**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  equilibriumAngleDegrees,
  normalizedForceComponents,
} from "../exercicios/halliday-21-34/modelo.js";

test("21.34 converte cargas inteiras nos ângulos físicos", () => {
  const angles = [1, 2, 3, 4, 5].map(equilibriumAngleDegrees);
  assert.deepEqual(angles.map((value) => Number(value.toFixed(2))), [37.47, 50.95, 56.61, 60.00, 62.34]);
  for (let n = 1; n <= 5; n += 1) {
    const forces = normalizedForceComponents(n);
    assert.ok(Math.abs(forces.verticalPair) < 1e-12);
    assert.ok(Math.abs(forces.horizontalResidual) < 1e-12);
  }
});
```

Ler HTML e exigir seletor discreto `n = q/e`, cinco opções, controles comuns, `cos²`, `cos³`, as três respostas e SVG acessível.

- [ ] **Step 2: Rodar e confirmar RED**

Run: `node --test site/testes/halliday-21-34-visualizacao.test.js`

Expected: FAIL por ausência de `modelo.js`.

- [ ] **Step 3: Implementar a geometria normalizada**

```js
function assertIonMultiple(n) {
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new RangeError("n deve ser inteiro entre 1 e 5.");
}

export function equilibriumAngleDegrees(n) {
  assertIonMultiple(n);
  return Math.acos((1 / (2 * n)) ** (1 / 3)) * 180 / Math.PI;
}

export function normalizedForceComponents(n) {
  const theta = equilibriumAngleDegrees(n) * Math.PI / 180;
  const horizontalOne = n * Math.cos(theta) ** 3;
  const verticalOne = n * Math.cos(theta) ** 2 * Math.sin(theta);
  return {
    theta,
    distanceRatio: 1 / Math.cos(theta),
    horizontalOne,
    verticalPair: verticalOne - verticalOne,
    horizontalResidual: 1 - 2 * horizontalOne,
  };
}
```

Normalizar forças por `ke²/R²` e documentar essa escala na visualização.

- [ ] **Step 4: Montar a balança vetorial com seletor quantizado**

Preservar o diagrama como fallback e acrescentar camadas para triângulo `R-r`, força diagonal, projeções `x/y`, barras de cancelamento e leitura `cos² × cos = cos³`. O seletor de `n` usa cinco botões com `aria-pressed`, default `n=1`; não aceitar valor contínuo.

Criar `app.js`:

```js
import "../exercicio-estatico.js";
import { mountQuantizedBalance } from "./visualizacao.js";

globalThis.lessonControllers = {
  quantizedBalance: mountQuantizedBalance(document.querySelector("[data-quantized-balance]")),
};
```

No fim de `index.html`, substituir o carregamento direto de `../exercicio-estatico.js` por `./app.js`; o import de efeito colateral preserva navegação e matemática.

Os seis passos são distância, `cos²`, projeção, cancelamento vertical, balanço horizontal e quantização. Ao mudar `n`, resetar o roteiro no mesmo estado pausado e atualizar todos os números.

- [ ] **Step 5: Rodar GREEN direcionado**

Run:

```bash
node --test site/testes/halliday-21-34-visualizacao.test.js
node --test --test-name-pattern="21.34" site/testes/exercicios-halliday.test.js
node --check site/exercicios/halliday-21-34/modelo.js
node --check site/exercicios/halliday-21-34/visualizacao.js
```

Expected: PASS.

- [ ] **Step 6: Validar `n=3`, projeções e mobile com Playwright**

Confirmar HTTP 200 e executar:

```bash
playwright-cli -s=h2134 open http://127.0.0.1:8000/exercicios/halliday-21-34/
playwright-cli -s=h2134 resize 1440 1000
playwright-cli -s=h2134 run-code "async page => { await page.getByRole('button', {name: '3e'}).click(); for (let i = 0; i < 4; i += 1) await page.getByRole('button', {name: 'Próximo passo'}).click(); }"
playwright-cli -s=h2134 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-34-desktop.png
playwright-cli -s=h2134 resize 390 844
playwright-cli -s=h2134 eval "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
playwright-cli -s=h2134 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-34-mobile-390x844.png
playwright-cli -s=h2134 run-code "async page => { await page.emulateMedia({reducedMotion: 'reduce'}); await page.reload(); if ((await page.locator('[data-quantized-balance]').getAttribute('data-motion')) !== 'reduced') throw new Error('reduced motion ausente'); }"
playwright-cli -s=h2134 console error
playwright-cli -s=h2134 close
```

Conferir por snapshot que `n=3` mostra `56,61°`, componentes verticais iguais/opostas e componentes horizontais somando 1 na escala normalizada. Exercitar play/pause/reset/speed.

- [ ] **Step 7: Commit atômico**

```bash
git add site/exercicios/halliday-21-34 site/testes/halliday-21-34-visualizacao.test.js docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-34-*.png
git commit -m "feat: animate Halliday 21.34 vector balance"
```

---

### Task 5: Halliday 21.42 — pêndulo e aproximação de pequeno ângulo

**Implementador obrigatório:** subagente fresco `implementador-21-42`.

**Files:**

- Modify: `site/exercicios/halliday-21-42/index.html`
- Create: `site/exercicios/halliday-21-42/app.js`
- Create: `site/exercicios/halliday-21-42/modelo.js`
- Create: `site/exercicios/halliday-21-42/visualizacao.js`
- Create: `site/exercicios/halliday-21-42/visualizacao.css`
- Create: `site/testes/halliday-21-42-visualizacao.test.js`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-42-desktop.png`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-42-mobile-390x844.png`

**Interfaces:**

- Consumes: `COULOMB_CONSTANT` de `site/nucleo/eletrostatica.js` e `../exercicio-estatico.js`.
- Produces: `pendulumState(options)` e `mountChargedPendulum(root)`.

- [ ] **Step 1: Escrever o teste RED do caso canônico e da aproximação**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { pendulumState } from "../exercicios/halliday-21-42/modelo.js";

test("21.42 preserva carga, ângulo e hipótese de pequeno ângulo", () => {
  const state = pendulumState({ lengthM: 1.2, massKg: 0.01, separationM: 0.05, gravity: 9.81 });
  assert.ok(Math.abs(state.thetaDegrees - 1.1937484) < 1e-6);
  assert.ok(Math.abs(state.approximateChargeC - 2.3843e-8) < 1e-12);
  assert.ok(state.relativeChargeError < 0.0002);
  assert.equal(state.halfSeparationM, 0.025);
});
```

Ler HTML e exigir range de separação com default `5,0 cm`, aviso “geometria ampliada”, controles comuns, fórmula cúbica, `24 nC` e SVG acessível.

- [ ] **Step 2: Rodar e confirmar RED**

Run: `node --test site/testes/halliday-21-42-visualizacao.test.js`

Expected: FAIL por ausência de `modelo.js`.

- [ ] **Step 3: Implementar cálculo aproximado e comparação exata**

```js
import { COULOMB_CONSTANT } from "../../nucleo/eletrostatica.js";

export function pendulumState({ lengthM, massKg, separationM, gravity = 9.81 }) {
  if (!(lengthM > 0 && massKg > 0 && separationM > 0 && separationM < 2 * lengthM && gravity > 0)) {
    throw new RangeError("Dimensões e massa devem ser positivas, com x < 2L.");
  }
  const halfSeparationM = separationM / 2;
  const theta = Math.asin(halfSeparationM / lengthM);
  const approximateChargeC = Math.sqrt(
    massKg * gravity * separationM ** 3 / (2 * lengthM * COULOMB_CONSTANT),
  );
  const exactChargeC = Math.sqrt(
    Math.tan(theta) * massKg * gravity * separationM ** 2 / COULOMB_CONSTANT,
  );
  return {
    halfSeparationM,
    theta,
    thetaDegrees: theta * 180 / Math.PI,
    approximateChargeC,
    exactChargeC,
    relativeChargeError: Math.abs(exactChargeC - approximateChargeC) / exactChargeC,
  };
}
```

O resultado exibido no caso padrão continua `2,38 × 10⁻⁸ C ≈ 24 nC`; a comparação exata é apenas um calibre da hipótese.

- [ ] **Step 4: Montar pêndulo, corpo livre e controle de separação**

Preservar um SVG inicial com o caso de `5,0 cm`. Adicionar range acessível de `1,0` a `20,0 cm`, passo `0,5 cm`, default `5,0 cm`; qualquer mudança pausa a animação e atualiza `θ`, `q` e erro. O desenho pode ampliar o ângulo para leitura, mas o rótulo “geometria ampliada; valores numéricos exatos” deve permanecer junto ao SVG.

Criar `app.js`:

```js
import "../exercicio-estatico.js";
import { mountChargedPendulum } from "./visualizacao.js";

globalThis.lessonControllers = {
  chargedPendulum: mountChargedPendulum(document.querySelector("[data-charged-pendulum]")),
};
```

No fim de `index.html`, substituir o carregamento direto de `../exercicio-estatico.js` por `./app.js`; o novo módulo mantém a inicialização estática e acrescenta a experiência.

Os passos revelam `x/2`, três forças, componentes de T, eliminação de T, lei de Coulomb, aproximação e resposta. `Reiniciar` deve restaurar simultaneamente o passo 0 e `x=5,0 cm`.

- [ ] **Step 5: Rodar GREEN direcionado**

Run:

```bash
node --test site/testes/halliday-21-42-visualizacao.test.js
node --test --test-name-pattern="21.42" site/testes/exercicios-halliday.test.js
node --check site/exercicios/halliday-21-42/modelo.js
node --check site/exercicios/halliday-21-42/visualizacao.js
```

Expected: PASS.

- [ ] **Step 6: Validar o caso de 5 cm e a leitura móvel com Playwright**

Confirmar HTTP 200 e executar:

```bash
playwright-cli -s=h2142 open http://127.0.0.1:8000/exercicios/halliday-21-42/
playwright-cli -s=h2142 resize 1440 1000
playwright-cli -s=h2142 run-code "async page => { await page.locator('[data-separation]').fill('5'); for (let i = 0; i < 6; i += 1) await page.getByRole('button', {name: 'Próximo passo'}).click(); }"
playwright-cli -s=h2142 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-42-desktop.png
playwright-cli -s=h2142 resize 390 844
playwright-cli -s=h2142 eval "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
playwright-cli -s=h2142 screenshot --filename=docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-42-mobile-390x844.png
playwright-cli -s=h2142 run-code "async page => { await page.emulateMedia({reducedMotion: 'reduce'}); await page.reload(); if ((await page.locator('[data-charged-pendulum]').getAttribute('data-motion')) !== 'reduced') throw new Error('reduced motion ausente'); }"
playwright-cli -s=h2142 console error
playwright-cli -s=h2142 close
```

Conferir no snapshot `x=5,0 cm`, `θ≈1,19°`, `q≈24 nC`, erro abaixo de `0,02%`, aviso de escala e vetores legíveis. Exercitar slider, play/pause/reset/speed e confirmar que reset volta a 5 cm.

- [ ] **Step 7: Commit atômico**

```bash
git add site/exercicios/halliday-21-42 site/testes/halliday-21-42-visualizacao.test.js docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-42-*.png
git commit -m "feat: animate Halliday 21.42 charged pendulum"
```

---

### Task 6: Integração, regressão e evidência cruzada

**Implementador obrigatório:** integrador novo, após os cinco commits GREEN.

**Files:**

- Modify: `site/testes/exercicios-halliday.test.js`
- Create: `site/testes/exercicios-geometria-integral-integracao.test.js`
- Create: `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/README.md`

**Interfaces:**

- Consumes: os cinco painéis locais e os dez screenshots; não altera nenhum arquivo dentro das pastas dos exercícios.
- Produces: contrato cruzado da experiência, manifesto de evidências e resultado de regressão completo.

- [ ] **Step 1: Escrever o teste RED de integração antes de tocar o contrato existente**

Criar `exercicios-geometria-integral-integracao.test.js` para ler as cinco páginas e cinco folhas de estilo:

```js
const exercises = ["13", "18", "33", "34", "42"];

for (const number of exercises) {
  test(`21.${number} cumpre o contrato comum de progressão`, async () => {
    const html = await readFile(new URL(`../exercicios/halliday-21-${number}/index.html`, import.meta.url), "utf8");
    assert.equal((html.match(/data-didactic-visualization/g) ?? []).length, 1);
    for (const label of ["Reproduzir", "Pausar", "Reiniciar", "Próximo passo", "Velocidade"]) {
      assert.match(html, new RegExp(label));
    }
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /<svg[^>]+role="img"[^>]+aria-labelledby=/);
    assert.match(html, /<title[^>]*>[^<]+<\/title>/);
    assert.match(html, /<desc[^>]*>[^<]+<\/desc>/);
  });
}
```

Adicionar verificações das cinco respostas canônicas e das cinco folhas com `@media (prefers-reduced-motion: reduce)` e `min-height: 44px`. O teste deve ainda confirmar que os dez caminhos PNG existem e têm tamanho maior que zero.

Por fim, ler `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/README.md` e exigir que ele liste os dez nomes de screenshot. Esse manifesto ainda não existe e fornece o RED real da integração.

- [ ] **Step 2: Executar RED e identificar apenas lacunas de integração**

Run: `node --test site/testes/exercicios-geometria-integral-integracao.test.js`

Expected: FAIL porque o manifesto `README.md` ainda não existe. Se uma página ou captura também falhar, devolver ao implementador dono; o integrador não edita aquela pasta.

- [ ] **Step 3: Atualizar o teste Halliday compartilhado e criar o manifesto**

Em `exercicios-halliday.test.js`, manter todas as asserções científicas atuais e acrescentar somente a chamada de uma função `assertDidacticProgression(html)` para os cinco casos. Não mudar números nem relaxar regex existentes.

Criar `README.md` com tabela de dez arquivos, viewport, passo capturado e resultado observado:

```markdown
| Exercício | Desktop 1440 × 1000 | Mobile 390 × 844 | Estado capturado |
|---|---|---|---|
| 21.13 | `21-13-desktop.png` | `21-13-mobile-390x844.png` | raiz de campo nulo |
| 21.18 | `21-18-desktop.png` | `21-18-mobile-390x844.png` | configuração (b) e diferença |
| 21.33 | `21-33-desktop.png` | `21-33-mobile-390x844.png` | prótons, carga e neutralidade |
| 21.34 | `21-34-desktop.png` | `21-34-mobile-390x844.png` | n = 3 e balanço vetorial |
| 21.42 | `21-42-desktop.png` | `21-42-mobile-390x844.png` | x = 5 cm e aproximação |
```

Registrar também data, comando de servidor, HTTP 200, reduced motion, teclado, overflow e console; escrever apenas resultados realmente observados.

- [ ] **Step 4: Rodar toda a suíte e validação sintática**

Run:

```bash
npm test
node --check site/exercicios/halliday-21-13/modelo.js
node --check site/exercicios/halliday-21-13/visualizacao.js
node --check site/exercicios/halliday-21-18/modelo.js
node --check site/exercicios/halliday-21-18/visualizacao.js
node --check site/exercicios/halliday-21-33/modelo.js
node --check site/exercicios/halliday-21-33/visualizacao.js
node --check site/exercicios/halliday-21-34/modelo.js
node --check site/exercicios/halliday-21-34/visualizacao.js
node --check site/exercicios/halliday-21-42/modelo.js
node --check site/exercicios/halliday-21-42/visualizacao.js
```

Expected: todos os testes PASS, zero skip novo e todos os checks com exit code 0.

- [ ] **Step 5: Confirmar as cinco rotas por HTTP**

Com `npm run serve` ativo, executar:

```bash
for exercise in 13 18 33 34 42; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8000/exercicios/halliday-21-${exercise}/")
  test "$code" = "200" || exit 1
done
```

Expected: exit code 0 e cinco respostas 200.

- [ ] **Step 6: Rodar smoke Playwright cruzado em desktop, mobile e reduced motion**

```bash
playwright-cli -s=halliday-final open http://127.0.0.1:8000/exercicios/halliday-21-13/
playwright-cli -s=halliday-final run-code "async page => { const numbers = ['13','18','33','34','42']; for (const number of numbers) { await page.setViewportSize({width: 1440, height: 1000}); await page.goto('http://127.0.0.1:8000/exercicios/halliday-21-' + number + '/'); await page.getByRole('button', {name: 'Próximo passo'}).click(); await page.getByRole('button', {name: 'Reproduzir'}).click(); await page.getByRole('button', {name: 'Pausar'}).click(); await page.getByRole('button', {name: 'Reiniciar'}).click(); if (!(await page.locator('[data-didactic-visualization]').isVisible())) throw new Error('painel invisível em ' + number); if ((await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth))) throw new Error('overflow desktop em ' + number); await page.setViewportSize({width: 390, height: 844}); if ((await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth))) throw new Error('overflow mobile em ' + number); } }"
playwright-cli -s=halliday-final run-code "async page => { await page.emulateMedia({reducedMotion: 'reduce'}); for (const number of ['13','18','33','34','42']) { await page.goto('http://127.0.0.1:8000/exercicios/halliday-21-' + number + '/'); if ((await page.locator('[data-didactic-visualization]').getAttribute('data-motion')) !== 'reduced') throw new Error('reduced motion ausente em ' + number); } }"
playwright-cli -s=halliday-final console error
playwright-cli -s=halliday-final close
```

Expected: comandos sem exceção, nenhum erro no console e controles alcançáveis em ambas as larguras. Atualizar o manifesto com o resultado observado.

- [ ] **Step 7: Self-review de escopo e qualidade**

Run:

```bash
rg -n "TBD|TODO|FIXME|placeholder|lorem ipsum" site/exercicios/halliday-21-{13,18,33,34,42} site/testes docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral
git diff --check
git status --short
```

Expected: nenhuma ocorrência de placeholder introduzido, `git diff --check` limpo e status contendo somente arquivos do plano. Confirmar manualmente: respostas inalteradas; nenhuma integral artificial; 21.13 ainda tem simulador; 21.33 ainda tem explorador; nenhum `package.json`, asset, núcleo, componente ou catálogo mudou.

- [ ] **Step 8: Commit final de integração**

```bash
git add site/testes/exercicios-halliday.test.js site/testes/exercicios-geometria-integral-integracao.test.js docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/README.md
git commit -m "test: verify geometric exercise visualizations"
```

Não fazer push sem autorização explícita.
