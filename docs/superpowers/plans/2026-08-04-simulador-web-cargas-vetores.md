# Simulador Web de Cargas e Vetores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Publicar um catálogo didático com simulador genérico de forças elétricas, laboratórios de soma e produto escalar e uma página web do exercício Halliday 21.13.

**Architecture:** Um núcleo JavaScript puro calcula vetores e eletrostática, enquanto componentes SVG cuidam apenas do estado de interação e da apresentação. O simulador genérico e o exercício Halliday injetam presets diferentes no mesmo componente; o catálogo é alimentado por um registro JSON.

**Tech Stack:** HTML5, CSS responsivo, JavaScript ES modules, SVG, Node.js 22 test runner, Python HTTP server para validação local e GitHub Pages.

## Global Constraints

- HTML5, CSS e JavaScript em módulos ES, com desenho em SVG.
- Sem framework, empacotador ou etapa de compilação.
- Site estático no GitHub Pages.
- O código py5/Processing existente será preservado.
- O exercício Halliday será um preset do mesmo motor do simulador genérico.
- Até seis cargas-fonte e exatamente uma carga de prova.
- Valores ajustáveis de 0,1 µC a 10,0 µC em passos de 0,1 µC.
- Unidades SI no núcleo; interface em centímetros, microcoulombs e newtons.
- Não limitar artificialmente a força em uma singularidade.
- Todo comportamento calculável novo começa por teste falhando.

---

## Mapa de arquivos

- **package.json:** comandos de teste e servidor local, sem dependências.
- **site/simuladores.json:** registro único do catálogo.
- **site/index.html:** entrada do catálogo.
- **site/assets/base.css:** identidade visual, tipografia, catálogo e elementos comuns.
- **site/assets/simulador.css:** plano, painéis, cargas, vetores e responsividade.
- **site/nucleo/vetores.js:** operações vetoriais puras.
- **site/nucleo/eletrostatica.js:** lei de Coulomb e superposição.
- **site/nucleo/formato.js:** formatação numérica e unidades.
- **site/componentes/catalogo.js:** busca, filtro e cartões.
- **site/componentes/abas.js:** tabs com teclado e ARIA.
- **site/componentes/simulador-cargas.js:** estado, controles e SVG eletrostático.
- **site/componentes/simulador-vetores.js:** soma, paralelogramo, projeção e teoria.
- **site/simuladores/cargas-e-vetores/preset.js:** configuração genérica.
- **site/simuladores/cargas-e-vetores/index.html:** página das quatro abas.
- **site/simuladores/cargas-e-vetores/app.js:** montagem da página genérica.
- **site/exercicios/halliday-21-13/preset.js:** configuração analítica do exercício.
- **site/exercicios/halliday-21-13/index.html:** enunciado, resolução e simulação.
- **site/exercicios/halliday-21-13/app.js:** montagem do preset Halliday.
- **site/testes/*.test.js:** testes do núcleo, presets, catálogo e estado.
- **.github/workflows/pages.yml:** publicação de site/ no GitHub Pages.
- **README.md:** acesso ao site e manutenção do catálogo.

---

### Task 1: Núcleo vetorial

**Files:**
- Create: package.json
- Create: site/testes/vetores.test.js
- Create: site/nucleo/vetores.js

**Interfaces:**
- Produces: add(a, b), subtract(a, b), scale(vector, factor), magnitudeSquared(vector), magnitude(vector), dot(a, b), determinant(a, b), angleBetween(a, b), project(vector, onto), resultantMagnitude(a, b).
- Vector shape: object with finite numeric properties x and y.
- angleBetween returns radians or null when one vector is null.
- project returns null when the target direction is null.

- [ ] **Step 1: Add the dependency-free Node test command**

Create package.json with:

~~~json
{
  "name": "eletromagnetismo-aulas",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test site/testes/*.test.js",
    "serve": "python -m http.server 8000 --directory site"
  }
}
~~~

- [ ] **Step 2: Write failing vector tests**

Cover exact component sums, magnitude of (3,4), dot product, determinant area,
angles 0°, 90° and 180°, projection, null-vector behavior and:

~~~js
assert.ok(
  nearlyEqual(
    resultantMagnitude(a, b) ** 2,
    magnitude(a) ** 2 + magnitude(b) ** 2 + 2 * dot(a, b)
  )
);
~~~

Use a guarded dynamic import so the first run fails with an assertion that the
expected exports are absent, rather than aborting on a missing module.

- [ ] **Step 3: Run the tests and observe the expected failure**

Run: node --test --test-name-pattern="vetor" site/testes/*.test.js

Expected: FAIL because site/nucleo/vetores.js does not yet provide the API.

- [ ] **Step 4: Implement the minimal pure functions**

Use Math.hypot for the module, clamp the cosine to [-1, 1] before Math.acos and
return null for operations whose denominator has magnitude squared at most
Number.EPSILON.

- [ ] **Step 5: Run all vector tests**

Run: npm test

Expected: all vector tests PASS and output contains no warning or error.

- [ ] **Step 6: Commit**

~~~powershell
git add package.json site/nucleo/vetores.js site/testes/vetores.test.js
git commit -m "feat: add tested vector math core"
~~~

---

### Task 2: Núcleo eletrostático e presets

**Files:**
- Create: site/testes/eletrostatica.test.js
- Create: site/testes/presets.test.js
- Create: site/nucleo/eletrostatica.js
- Create: site/simuladores/cargas-e-vetores/preset.js
- Create: site/exercicios/halliday-21-13/preset.js

**Interfaces:**
- Consumes: add, magnitude and scale from site/nucleo/vetores.js.
- Produces: COULOMB_CONSTANT, ElectrostaticSingularityError, forceFromSource(source, testCharge), calculateForceSystem(sources, testCharge).
- Charge shape: id, label, xCm, yCm, magnitudeMicroC, sign and optional vectorColor.
- calculateForceSystem returns individual entries with source and force plus resultant.
- Produces: GENERIC_PRESET, HALLIDAY_PRESET and HALLIDAY_EQUILIBRIUM_X_CM.

- [ ] **Step 1: Write failing Coulomb tests**

Test a known 1 µC by 1 µC pair separated by 1 m, attraction and repulsion,
vertical direction, vector sum of multiple sources, six sources and exact
coincidence throwing ElectrostaticSingularityError with the source id.

- [ ] **Step 2: Verify the Coulomb tests fail for the missing API**

Run: node --test --test-name-pattern="Coulomb|atração|repulsão|singularidade" site/testes/*.test.js

Expected: FAIL because the electrostatic API is absent.

- [ ] **Step 3: Implement SI conversion and Coulomb vector**

Convert cm to m and µC to C. For delta = test position − source position, use:

~~~js
const coefficient =
  COULOMB_CONSTANT * sourceChargeC * testChargeC / (distanceM ** 3);
return scale(deltaM, coefficient);
~~~

Throw only when distanceM is zero. Sum every returned force with add.

- [ ] **Step 4: Verify electrostatic tests pass**

Run: npm test

Expected: vector and electrostatic suites PASS.

- [ ] **Step 5: Write failing preset tests**

Assert the generic preset has two sources and one test charge. Assert
HALLIDAY_EQUILIBRIUM_X_CM equals -10 / (sqrt(3) - 1), that q1 and q2 are 10 cm
apart, and that calculateForceSystem produces resultant magnitude below 1e-10 N
at the equilibrium point.

- [ ] **Step 6: Verify preset tests fail**

Run: node --test --test-name-pattern="preset|Halliday" site/testes/*.test.js

Expected: FAIL because the preset modules are absent.

- [ ] **Step 7: Add both immutable preset objects**

Use Object.freeze at the top level and clone nested values inside the simulator
before interaction. Include viewport {-20, 20, -12, 12} in the generic preset
and {-20, 15, -10, 10} in the Halliday preset.

- [ ] **Step 8: Run all tests and commit**

Run: npm test

Expected: all suites PASS.

~~~powershell
git add site/nucleo/eletrostatica.js site/simuladores/cargas-e-vetores/preset.js site/exercicios/halliday-21-13/preset.js site/testes/eletrostatica.test.js site/testes/presets.test.js
git commit -m "feat: add electrostatic core and lesson presets"
~~~

---

### Task 3: Registro e catálogo

**Files:**
- Create: site/simuladores.json
- Create: site/testes/catalogo.test.js
- Create: site/componentes/catalogo.js
- Create: site/index.html
- Create: site/assets/base.css
- Create: site/.nojekyll

**Interfaces:**
- Produces: normalizeSearchText(text), filterCatalog(items, query, type), loadCatalog(url), mountCatalog(root, options).
- Registry fields: id, title, kind, theme, description, path and tags.
- kind is simulador or resolucao.

- [ ] **Step 1: Write failing catalog tests**

Test accent-insensitive search for “forca”, search by “Halliday” and “21”,
kind filtering, empty query, unique ids, valid kinds and that every registered
path resolves to a planned HTML destination.

- [ ] **Step 2: Verify failure**

Run: node --test --test-name-pattern="catálogo|busca|filtro" site/testes/*.test.js

Expected: FAIL because the registry and filtering API are absent.

- [ ] **Step 3: Implement registry and pure filtering**

Normalize with String.normalize("NFD"), strip combining marks and lowercase.
Search a joined representation of title, theme, description and tags. Apply
kind after text filtering.

- [ ] **Step 4: Verify catalog tests pass**

Run: npm test

Expected: all suites PASS.

- [ ] **Step 5: Build the catalog page**

Add semantic header, search input, three filter buttons, result count, card
grid and a useful load-error state. Cards must be real links and retain the
kind, theme and tags visible to students.

- [ ] **Step 6: Apply the approved visual system**

Define CSS custom properties for the six approved colors, local typography,
visible focus, paper-grid motif, responsive catalog and reduced motion.

- [ ] **Step 7: Serve and smoke-check the catalog**

Run: npm run serve

Open: http://127.0.0.1:8000/

Expected: two catalog cards, working search/filter and no console error.

- [ ] **Step 8: Commit**

~~~powershell
git add site/.nojekyll site/index.html site/simuladores.json site/assets/base.css site/componentes/catalogo.js site/testes/catalogo.test.js
git commit -m "feat: add searchable lesson catalog"
~~~

---

### Task 4: Abas e estado do simulador de cargas

**Files:**
- Create: site/testes/estado-cargas.test.js
- Create: site/componentes/abas.js
- Create: site/componentes/simulador-cargas.js
- Create: site/assets/simulador.css

**Interfaces:**
- Consumes: calculateForceSystem and preset charge shapes.
- Produces from simulador-cargas.js: createSimulatorState(preset), addSource(state), removeSelectedSource(state), moveSelected(state, dxCm, dyCm), setSelectedMagnitude(state, magnitudeMicroC), flipSelectedSign(state), calculateArrowScale(forceSystem, maximumPixels).
- Produces: mountChargeSimulator(root, preset), returning reset(), getState() and destroy().
- Produces from abas.js: setupTabs(root).

- [ ] **Step 1: Write failing state tests**

Test deep cloning of a preset, sequential source labels and colors, maximum of
six, removing only a selected source, protecting the test charge, movement,
clamping magnitude to [0.1, 10], sign inversion and a common positive arrow
scale based on the largest individual/resultant module.

- [ ] **Step 2: Observe the expected failure**

Run: node --test --test-name-pattern="estado|carga|escala" site/testes/*.test.js

Expected: FAIL because the state API is absent.

- [ ] **Step 3: Implement the minimal state functions**

Keep the functions readable and mutate only the explicit state passed to them.
Return booleans for add/remove and the adjusted magnitude for numeric controls.
Never mutate the preset.

- [ ] **Step 4: Verify state tests pass**

Run: npm test

Expected: all suites PASS.

- [ ] **Step 5: Implement accessible tabs**

setupTabs must link each aria-controls id, switch hidden and aria-selected,
support ArrowLeft, ArrowRight, Home and End, and leave one panel visible.

- [ ] **Step 6: Implement the SVG charge component**

Render grid, axes, scale labels, source/test charges, one force arrow per source,
the thick resultant arrow, legend and numerical table. Use pointer capture for
mouse/touch drag. Wire visible controls and the scoped keyboard shortcuts. On
ElectrostaticSingularityError, hide affected vectors and show an instruction.

- [ ] **Step 7: Add responsive and state styles**

Create two-column desktop layout, stacked mobile layout, 44 px controls,
positive/negative fills, numbered force rings, selected outline, dashed helper
lines and reduced-motion behavior.

- [ ] **Step 8: Run all tests and commit**

Run: npm test

Expected: all suites PASS.

~~~powershell
git add site/componentes/abas.js site/componentes/simulador-cargas.js site/assets/simulador.css site/testes/estado-cargas.test.js
git commit -m "feat: add interactive charge force component"
~~~

---

### Task 5: Laboratórios de soma e produto escalar

**Files:**
- Create: site/testes/laboratorio-vetores.test.js
- Create: site/nucleo/formato.js
- Create: site/componentes/simulador-vetores.js
- Create: site/simuladores/cargas-e-vetores/index.html
- Create: site/simuladores/cargas-e-vetores/app.js

**Interfaces:**
- Consumes: vector core, GENERIC_PRESET, setupTabs and mountChargeSimulator.
- Produces: createVectorLabState(initial), calculateVectorMetrics(state), moveVectorEndpoint(state, name, point), mountVectorLabs(roots, initial).
- Metrics: sum, magnitudeA, magnitudeB, magnitudeSum, dot, determinant, angleRadians, projectionBOnA and dotClassification.

- [ ] **Step 1: Write failing metric tests**

Use A=(4,1), B=(1,3) to assert components, modules, sum, dot, determinant,
projection and acute classification. Add perpendicular, obtuse and null-vector
cases.

- [ ] **Step 2: Verify failure**

Run: node --test --test-name-pattern="laboratório|classificação|métricas" site/testes/*.test.js

Expected: FAIL because the vector-lab API is absent.

- [ ] **Step 3: Implement shared state and metrics**

Return “positivo”, “nulo” or “negativo” with tolerance 1e-10. Keep A and B
shared across every vector tab and return null for undefined angle/projection.

- [ ] **Step 4: Verify metric tests pass**

Run: npm test

Expected: all suites PASS.

- [ ] **Step 5: Create the four-tab generic page**

Tabs: Experimento, Soma de vetores, Produto escalar and Teoria guiada. Mount
one charge simulator and one shared vector state feeding the other three
panels. Include breadcrumbs back to the catalog.

- [ ] **Step 6: Render the vector SVGs and live derivation**

Draw draggable A and B, the head-to-tail copy, dashed parallels, shaded
parallelogram, resultant, angle arc and orthogonal projection. Update the
component equations and numeric substitution after every drag. Put the
sine/determinant area warning next to the shaded area.

- [ ] **Step 7: Run tests and browser smoke check**

Run: npm test

Open: http://127.0.0.1:8000/simuladores/cargas-e-vetores/

Expected: four keyboard-accessible tabs; drag and equations update without
console errors.

- [ ] **Step 8: Commit**

~~~powershell
git add site/nucleo/formato.js site/componentes/simulador-vetores.js site/simuladores/cargas-e-vetores/index.html site/simuladores/cargas-e-vetores/app.js site/testes/laboratorio-vetores.test.js
git commit -m "feat: add vector addition and dot product labs"
~~~

---

### Task 6: Página Halliday e documentação

**Files:**
- Create: site/exercicios/halliday-21-13/index.html
- Create: site/exercicios/halliday-21-13/app.js
- Modify: site/testes/presets.test.js
- Modify: README.md

**Interfaces:**
- Consumes: HALLIDAY_PRESET, mountChargeSimulator and setupTabs.
- The page preserves the full mathematical argument already present in
  Força Magnética/Halliday/Capítulo 21/Exercício 13/README.md.

- [ ] **Step 1: Extend the failing preset contract**

Add assertions for the reset label, locked source count and exact theoretical
answer -13.660254... cm, plus existence of the three Halliday tab panels.

- [ ] **Step 2: Verify the new assertions fail**

Run: node --test --test-name-pattern="Halliday" site/testes/*.test.js

Expected: FAIL because the web page and full contract are absent.

- [ ] **Step 3: Build the three-tab Halliday page**

Transcribe enunciado and every resolution step into semantic HTML. Mount the
shared simulator in the third panel, include a “Restaurar equilíbrio” action
and show x ≈ -13,66 cm, y = 0.

- [ ] **Step 4: Update root documentation**

Add the public site address, local npm serve/test commands, site folder
convention and retain the link/instructions for the py5 version.

- [ ] **Step 5: Verify all tests and both pages**

Run: npm test

Open: http://127.0.0.1:8000/exercicios/halliday-21-13/

Expected: three tabs, full solution, equilibrium reset and no console error.

- [ ] **Step 6: Commit**

~~~powershell
git add site/exercicios/halliday-21-13/index.html site/exercicios/halliday-21-13/app.js site/testes/presets.test.js README.md
git commit -m "feat: publish Halliday exercise as web preset"
~~~

---

### Task 7: Publicação e verificação completa

**Files:**
- Create: .github/workflows/pages.yml
- Modify only if a reproduced defect requires it: files covered by Tasks 1–6.

**Interfaces:**
- Publishes the exact site/ directory as the Pages artifact.

- [ ] **Step 1: Confirm current official GitHub Pages action versions**

Check official GitHub documentation or official action repositories. Use the
current supported major versions for checkout, configure-pages,
upload-pages-artifact and deploy-pages.

- [ ] **Step 2: Add the Pages workflow**

Trigger on main and workflow_dispatch. Grant contents:read, pages:write and
id-token:write. Upload site/ and deploy it in the github-pages environment with
concurrency that does not cancel an active deployment.

- [ ] **Step 3: Run fresh automated verification**

Run:

~~~powershell
npm test
python -m unittest discover -s "Força Magnética/Halliday/Capítulo 21/Exercício 13/tests" -v
git diff --check
~~~

Expected: JavaScript and existing Python suites PASS; diff check is clean.

- [ ] **Step 4: Validate real browser behavior**

Start the local server in a hidden process. In desktop and mobile viewports,
exercise catalog search/filter, add six sources, reject a seventh, remove one,
flip signs, adjust values, drag the test charge, use keyboard movement, restore
the preset, drag A/B and inspect every tab. Capture screenshots and verify the
console has no error.

If any defect is found, first add a failing test that reproduces its calculable
behavior, then fix and rerun the full suite.

- [ ] **Step 5: Commit the workflow or QA fixes**

~~~powershell
git add .github/workflows/pages.yml
git commit -m "ci: publish teaching site to GitHub Pages"
~~~

- [ ] **Step 6: Finish the feature branch**

Run the complete verification again, merge the isolated feature branch into
main, and ensure main contains every implementation commit.

- [ ] **Step 7: Push the explicitly authorized delivery**

~~~powershell
git push origin main
~~~

- [ ] **Step 8: Enable and verify Pages**

If Pages is not already configured for GitHub Actions, set build_type to
workflow through the GitHub API. Wait for the Pages workflow to complete.
Verify the deployed commit, request the public URL and navigate through the two
public pages. Do not report completion until the root returns HTTP 200 and the
browser validation succeeds.
