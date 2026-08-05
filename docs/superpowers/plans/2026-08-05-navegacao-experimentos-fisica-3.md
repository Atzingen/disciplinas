# Navegação por capítulos e experimentos de Física III Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar o acervo em Exercícios, Experimentos e Simulações, criar navegação escalável por capítulo e publicar quatro roteiros avançados de laboratório baseados no conjunto AZEHEB.

**Architecture:** O catálogo JSON continuará como fonte única de metadados e passará a classificar cada item por área, referência e capítulo. Componentes JavaScript pequenos montarão a navegação principal, a sequência de exercícios e as abas dos experimentos. Depois da infraestrutura comum, quatro agentes trabalharão em pastas exclusivas, um por experimento.

**Tech Stack:** HTML5 semântico, CSS responsivo e de impressão, JavaScript ES modules, Node.js test runner, imagens JPEG extraídas com Poppler, Python/py5 existente e GitHub Pages.

## Global Constraints

- Preservar a identidade visual de caderno de laboratório já publicada.
- Não adicionar framework, empacotador ou dependência JavaScript.
- Manter `site/simuladores.json` como registro único nesta entrega.
- Áreas válidas: `exercicios`, `experimentos` e `simulacoes`.
- Tipos válidos: `resolucao`, `experimento` e `simulador`.
- Exercícios devem informar `reference`, `chapter` e `exerciseNumber`.
- Experimentos devem possuir quatro abas: Montagem, Fundamentos, Dados e Relatório.
- Toda figura do manual deve ter texto alternativo, legenda e crédito à AZEHEB.
- Não publicar o PDF original nem páginas inteiras renderizadas.
- Não usar U+20D7; vetores textuais continuam usando `.vector-symbol`.
- Fórmulas e tabelas podem rolar localmente no celular; a página não pode ter overflow horizontal global.
- O equipamento deve ser energizado por no máximo 5–10 s, seguido de 5–10 s desligado.
- Os quatro agentes editam apenas suas pastas designadas e não fazem commit.
- Toda mudança de comportamento começa por teste falhando e termina com verificação completa.

---

## Mapa de arquivos

### Registro e componentes

- **site/simuladores.json:** nove materiais com área e metadados de capítulo.
- **site/componentes/catalogo.js:** busca e filtragem por tipo, área e capítulo.
- **site/componentes/navegacao-principal.js:** links globais montados a partir do caminho da raiz.
- **site/componentes/navegacao-exercicios.js:** sequência, anterior e próximo dentro do capítulo.
- **site/experimentos/experimento.js:** montagem das quatro abas e ação de impressão.

### Páginas de entrada

- **site/index.html:** seletor das três áreas e catálogo completo.
- **site/exercicios/index.html:** capítulos disponíveis.
- **site/exercicios/capitulo-21/index.html:** quatro exercícios Halliday.
- **site/experimentos/index.html:** quatro roteiros de laboratório.
- **site/simuladores/index.html:** simuladores interativos.

### Conteúdo dos experimentos

- **site/experimentos/01-campo-corrente/{index.html,relatorio.md}**
- **site/experimentos/02-campo-solenoide/{index.html,relatorio.md}**
- **site/experimentos/03-forca-magnetica-motor/{index.html,relatorio.md}**
- **site/experimentos/04-inducao-eletromagnetica/{index.html,relatorio.md}**
- **site/assets/experimentos/azeheb/**: onze imagens e um README de proveniência.

### Estilos e testes

- **site/assets/base.css:** navegação global, entradas de área e capítulos.
- **site/assets/experimentos.css:** roteiro, segurança, teoria, dados, impressão e figuras.
- **site/testes/catalogo.test.js:** esquema e filtros ampliados.
- **site/testes/navegacao.test.js:** links globais e adjacência do capítulo.
- **site/testes/estrutura-site.test.js:** rotas e destinos das páginas de entrada.
- **site/testes/experimentos.test.js:** contrato educacional e matemático das quatro páginas.

---

### Task 1: Metadados e filtros do catálogo

**Files:**

- Modify: `site/testes/catalogo.test.js`
- Modify: `site/componentes/catalogo.js`
- Modify: `site/simuladores.json`

**Interfaces:**

- Produces: `filterCatalog(items, query, type, scope)`.
- `scope` shape: `{ section?: string, chapter?: number, reference?: string }`.
- Produces registry fields: `section`, optional `reference`, `chapter`, `exerciseNumber`.
- Existing calls with three arguments remain valid.

- [ ] **Step 1: Escrever os testes de esquema e escopo que falham**

Adicionar casos com fixtures literais:

```js
const byChapter = catalog.filterCatalog(items, "", "todos", {
  section: "exercicios",
  chapter: 21,
});
assert.deepEqual(byChapter.map((item) => item.id), [
  "halliday-21-13",
  "halliday-21-18",
  "halliday-21-34",
  "halliday-21-42",
]);

const experiments = catalog.filterCatalog(items, "", "experimento", {
  section: "experimentos",
});
assert.equal(experiments.length, 4);
```

Exigir nove itens, três áreas válidas e os campos numéricos dos exercícios.

- [ ] **Step 2: Executar e observar a falha correta**

Run: `node --test site/testes/catalogo.test.js`

Expected: FAIL porque o registro ainda contém cinco itens e `filterCatalog` não
aceita escopo.

- [ ] **Step 3: Implementar a filtragem mínima**

Aplicar escopo antes da busca textual:

```js
const matchesSection = !scope.section || item.section === scope.section;
const matchesChapter = scope.chapter === undefined || item.chapter === scope.chapter;
const matchesReference = !scope.reference || item.reference === scope.reference;
```

Adicionar `experimento` ao rótulo de cartões e à validação do registro.

- [ ] **Step 4: Registrar os quatro experimentos e enriquecer os cinco itens existentes**

Usar exatamente os IDs e caminhos:

```text
experimento-01-campo-corrente       experimentos/01-campo-corrente/
experimento-02-campo-solenoide      experimentos/02-campo-solenoide/
experimento-03-forca-magnetica-motor experimentos/03-forca-magnetica-motor/
experimento-04-inducao-eletromagnetica experimentos/04-inducao-eletromagnetica/
```

- [ ] **Step 5: Rodar os testes do catálogo**

Run: `node --test site/testes/catalogo.test.js`

Expected: todos os casos PASS, incluindo busca sem acentos por `inducao`,
`solenoide` e `capitulo 21`.

- [ ] **Step 6: Commit**

```powershell
git add site/testes/catalogo.test.js site/componentes/catalogo.js site/simuladores.json
git commit -m "feat: organize catalog by teaching area"
```

---

### Task 2: Navegação principal e páginas das áreas

**Files:**

- Create: `site/testes/navegacao.test.js`
- Create: `site/testes/estrutura-site.test.js`
- Create: `site/componentes/navegacao-principal.js`
- Create: `site/exercicios/index.html`
- Create: `site/exercicios/capitulo-21/index.html`
- Create: `site/experimentos/index.html`
- Create: `site/simuladores/index.html`
- Modify: `site/index.html`
- Modify: `site/assets/base.css`

**Interfaces:**

- Produces: `buildMainNavigation(rootPath, activeSection)` returning link data.
- Produces: `mountMainNavigation(root)` using `data-root-path` and
  `data-active-section`.
- Each landing catalog calls `mountCatalog(root, { registryUrl, scope })`.

- [ ] **Step 1: Escrever testes de links e rotas que falham**

Verificar o resultado literal:

```js
assert.deepEqual(buildMainNavigation("../../", "exercicios"), [
  { id: "inicio", label: "Início", href: "../../", current: false },
  { id: "exercicios", label: "Exercícios", href: "../../exercicios/", current: true },
  { id: "experimentos", label: "Experimentos", href: "../../experimentos/", current: false },
  { id: "simulacoes", label: "Simulações", href: "../../simuladores/", current: false },
]);
```

O teste de estrutura deve ler as quatro páginas de entrada e confirmar seus
links principais e um único `h1`.

- [ ] **Step 2: Rodar e confirmar falha por módulo e páginas ausentes**

Run: `node --test site/testes/navegacao.test.js site/testes/estrutura-site.test.js`

- [ ] **Step 3: Implementar o componente global**

Montar um `<nav aria-label="Áreas do acervo">`, usar `aria-current="page"` na
área ativa e não aceitar HTML vindo de dados externos.

- [ ] **Step 4: Criar as três páginas de área e a página do Capítulo 21**

- `exercicios/index.html`: um cartão Halliday/Capítulo 21 com quatro exercícios;
- `exercicios/capitulo-21/index.html`: catálogo com escopo `{section:"exercicios", chapter:21}`;
- `experimentos/index.html`: catálogo com escopo `{section:"experimentos"}`;
- `simuladores/index.html`: catálogo com escopo `{section:"simulacoes"}`.

- [ ] **Step 5: Atualizar a página inicial**

Trocar “Escolha um experimento” por “Explore o acervo”, acrescentar três placas
de área antes do catálogo e adicionar o filtro `Experimentos`.

- [ ] **Step 6: Implementar os estilos responsivos**

Usar a paleta existente. A área ativa deve ser reconhecível por cor e
`aria-current`; em 390 px, a navegação pode rolar internamente sem aumentar a
largura do documento.

- [ ] **Step 7: Rodar os testes e commitar**

Run: `npm test`

```powershell
git add site/index.html site/exercicios/index.html site/exercicios/capitulo-21/index.html site/experimentos/index.html site/simuladores/index.html site/componentes/navegacao-principal.js site/assets/base.css site/testes/navegacao.test.js site/testes/estrutura-site.test.js
git commit -m "feat: add area and chapter navigation"
```

---

### Task 3: Sequência automática dos exercícios

**Files:**

- Create: `site/componentes/navegacao-exercicios.js`
- Modify: `site/testes/navegacao.test.js`
- Modify: `site/exercicios/halliday-21-13/index.html`
- Modify: `site/exercicios/halliday-21-18/index.html`
- Modify: `site/exercicios/halliday-21-34/index.html`
- Modify: `site/exercicios/halliday-21-42/index.html`
- Modify: `site/assets/simulador.css`

**Interfaces:**

- Produces: `chapterSequence(items, reference, chapter)` sorted by
  `exerciseNumber`.
- Produces: `adjacentExercises(sequence, currentId)` returning
  `{ previous, current, next }`, with `null` at each boundary.
- Produces: `mountExerciseNavigation(root)` consuming `data-current-id`,
  `data-registry-url` and `data-chapter-url`.

- [ ] **Step 1: Escrever os testes de ordenação e fronteiras**

```js
assert.equal(adjacentExercises(sequence, "halliday-21-13").previous, null);
assert.equal(adjacentExercises(sequence, "halliday-21-13").next.id, "halliday-21-18");
assert.equal(adjacentExercises(sequence, "halliday-21-42").next, null);
```

- [ ] **Step 2: Rodar e confirmar a falha por API ausente**

Run: `node --test site/testes/navegacao.test.js`

- [ ] **Step 3: Implementar funções puras e montagem**

Renderizar os números 13, 18, 34 e 42 como links, marcar o atual com
`aria-current="page"` e acrescentar anterior/próximo quando existirem.

- [ ] **Step 4: Inserir os pontos de montagem nas quatro páginas**

Cada página recebe:

```html
<div
  data-exercise-navigation
  data-current-id="halliday-21-18"
  data-registry-url="../../simuladores.json"
  data-chapter-url="../capitulo-21/"
></div>
<script type="module" src="../navegacao-exercicios.js"></script>
```

Alterar somente `data-current-id` em cada exercício.

- [ ] **Step 5: Verificar teclado, limites e testes**

Run: `npm test`

- [ ] **Step 6: Commit**

```powershell
git add site/componentes/navegacao-exercicios.js site/testes/navegacao.test.js site/exercicios/halliday-21-13/index.html site/exercicios/halliday-21-18/index.html site/exercicios/halliday-21-34/index.html site/exercicios/halliday-21-42/index.html site/assets/simulador.css
git commit -m "feat: navigate exercises within each chapter"
```

---

### Task 4: Infraestrutura comum e imagens dos experimentos

**Files:**

- Create: `site/testes/experimentos.test.js`
- Create: `site/experimentos/experimento.js`
- Create: `site/assets/experimentos.css`
- Create: `site/assets/experimentos/azeheb/README.md`
- Create: eleven JPEG files under `site/assets/experimentos/azeheb/`

**Interfaces:**

- `experimento.js` mounts `setupTabs(root)` for every `[data-experiment-tabs]`.
- A `[data-print-report]` button activates the Report tab and calls
  `globalThis.print()`.
- Agent pages consume only the shared CSS, JS and prepared image paths.

- [ ] **Step 1: Escrever o contrato que falha para os quatro roteiros**

Para cada slug, exigir:

```js
assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 4);
assert.match(html, /class="experiment-safety"/);
assert.match(html, /Fonte: manual AZEHEB/);
assert.match(html, /<table/);
assert.match(html, /data-print-report/);
```

Adicionar requisitos matemáticos literais por experimento:

- 01: `B(r) = μ₀I/(2πr)` e `tan φ`;
- 02: `B = μ₀nI` e expressão de campo finito;
- 03: `F = BIL sin θ`, `τ = μ × B` e `U = −μ·B`;
- 04: `ε = −N dΦ` e `L di/dt + Ri`.

- [ ] **Step 2: Rodar e observar quatro falhas por páginas ausentes**

Run: `node --test site/testes/experimentos.test.js`

- [ ] **Step 3: Extrair e nomear as imagens**

Usar `pdfimages -j` sobre o PDF local e copiar os objetos já identificados para:

```text
exp-01-oersted-montagem.jpg
exp-02-solenoide-montagem.jpg
exp-02-solenoide-limalha.jpg
exp-02-solenoide-visao-geral.jpg
exp-03-balanco-magnetico.jpg
exp-03-balanco-deslocado.jpg
exp-03-motor-elementar.jpg
exp-03-motor-forcas.jpg
exp-04-montagem.jpg
exp-04-aproximacao.jpg
exp-04-afastamento.jpg
```

- [ ] **Step 4: Documentar proveniência**

O README deve mapear arquivo, página PDF, objeto e legenda, além de registrar a
permissão educacional declarada pelo manual.

- [ ] **Step 5: Implementar JS e CSS comuns**

Adicionar abas, avisos, figuras, tabelas, blocos de derivação, checklist e
`@media print`. Esconder navegação, botões e abas não relacionadas durante a
impressão do relatório.

- [ ] **Step 6: Verificar sintaxe e commitar a infraestrutura**

Run: `node --check site/experimentos/experimento.js`

```powershell
git add site/testes/experimentos.test.js site/experimentos/experimento.js site/assets/experimentos.css site/assets/experimentos/azeheb
git commit -m "feat: add shared physics experiment infrastructure"
```

---

### Task 5: Quatro roteiros em agentes independentes

**Files:**

- Agent 1 owns: `site/experimentos/01-campo-corrente/`
- Agent 2 owns: `site/experimentos/02-campo-solenoide/`
- Agent 3 owns: `site/experimentos/03-forca-magnetica-motor/`
- Agent 4 owns: `site/experimentos/04-inducao-eletromagnetica/`

**Shared contract for all agents:**

- Create `index.html` and `relatorio.md` only inside the assigned folder.
- Do not edit shared files or commit.
- Use four accessible tabs, global navigation mount, source credits and print button.
- Include material, safety, predictions, procedure, theory, data table, uncertainty,
  questions and delivery checklist.
- Do not fabricate measured values.
- State when an amperimeter, ruler or Hall sensor is an optional extension not
  included in the kit.

- [ ] **Step 1: Dispatch Agent 1 — Oersted**

Required derivation sequence:

```text
dB = (μ₀/4π) I(dℓ × r̂)/r²
∮B·dℓ = μ₀I
B(r)2πr = μ₀I
B(r) = μ₀I/(2πr)
tan φ = B_fio/B_T,h
```

Explicitly correct the manual’s `1/r²` statement and derive the optional
uncertainty `σ_B/B` from I and r.

- [ ] **Step 2: Dispatch Agent 2 — solenoide**

Required derivation sequence:

```text
B_ideal = μ₀(N/ℓ)I = μ₀nI
B(z) = (μ₀nI/2)[(z+ℓ/2)/√(a²+(z+ℓ/2)²) − (z−ℓ/2)/√(a²+(z−ℓ/2)²)]
```

Explain the center limit, edge effects and why filings indicate direction but
not field magnitude.

- [ ] **Step 3: Dispatch Agent 3 — força e motor**

Required derivation sequence:

```text
F = qv × B
dF = I dℓ × B
F = BIL sin θ
μ = NIA
τ = μ × B
U = −μ·B
Jθ¨ + bθ˙ = τ_em(θ) − τ_carga
```

Keep Part I and Part II distinct and explain the role of commutation.

- [ ] **Step 4: Dispatch Agent 4 — indução**

Required derivation sequence:

```text
Φ_B = ∫ B·dA
ε = −N dΦ_B/dt
ε = −Nv dΦ_B/dz
L di/dt + Ri = ε(t)
```

Relate direction, pole and speed to the sign and peak of the galvanometer,
without interpreting a stationary magnet as zero field.

- [ ] **Step 5: Review every returned folder**

Check mathematical signs, dimensions, image paths, source attribution, safety,
blank tables, report requirements and file ownership. Reject changes outside the
assigned folder.

- [ ] **Step 6: Run the contract after all four integrations**

Run: `node --test site/testes/experimentos.test.js`

Expected: 4 PASS, no skipped tests.

- [ ] **Step 7: Commit the four folders together**

```powershell
git add site/experimentos/01-campo-corrente site/experimentos/02-campo-solenoide site/experimentos/03-forca-magnetica-motor site/experimentos/04-inducao-eletromagnetica
git commit -m "feat: add four advanced electromagnetism lab guides"
```

---

### Task 6: Integração, validação e publicação

**Files:**

- Modify: `README.md`
- Modify shared files only if integration reveals a tested defect.

- [ ] **Step 1: Atualizar o README**

Documentar as três áreas, o Capítulo 21, os quatro experimentos e o caminho para
impressão dos relatórios.

- [ ] **Step 2: Executar a regressão completa**

Run:

```powershell
npm test
$repoRoot = 'C:\Users\Gustavo\Desktop\dev\Eletromagnetismo-aulas'
$env:PYTHONPATH = "$PWD\simulacao_forcas"
& "$repoRoot\.venv\Scripts\python.exe" -m unittest discover -s tests -v
& "$repoRoot\.venv\Scripts\python.exe" simulacao_forcas\run_py5.py --check
node --check site/componentes/navegacao-principal.js
node --check site/componentes/navegacao-exercicios.js
node --check site/experimentos/experimento.js
git diff --check
```

Os comandos Python devem ser executados dentro de
`Força Magnética/Halliday/Capítulo 21/Exercício 13`.

- [ ] **Step 3: Validar localmente em navegador real**

Verificar início, três áreas, Capítulo 21, quatro exercícios e quatro
experimentos. Em cada experimento, alternar as quatro abas, carregar imagens e
acionar o modo de relatório. Repetir com viewport de 390 px e confirmar
`documentElement.scrollWidth === documentElement.clientWidth`.

- [ ] **Step 4: Revisar o PDF de origem contra as montagens publicadas**

Conferir visualmente que cada fotografia pertence ao experimento correto e que
nenhuma figura foi espelhada, recortada de modo enganoso ou atribuída à etapa
errada.

- [ ] **Step 5: Commit final de documentação**

```powershell
git add README.md
git commit -m "docs: document chapters and physics experiments"
```

- [ ] **Step 6: Push e acompanhar Pages**

```powershell
git push origin main
gh run watch --exit-status
```

- [ ] **Step 7: Verificar a publicação real**

Exigir HTTP 200 para a raiz, três páginas de área, página do Capítulo 21 e os
quatro experimentos. No navegador publicado, confirmar nove cartões, navegação
do capítulo, abas, imagens e ausência de overflow.
