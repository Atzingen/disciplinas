# Matemática renderizada e relatórios de Física III Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar exercícios, simulações e quatro experimentos em material universitário de Física III, com matemática MathJax corretamente composta e relatórios contínuos de seis a dez páginas.

**Architecture:** Um módulo ES compartilhado configurará e carregará MathJax 4.1.2 e oferecerá uma função de recomposição para conteúdo dinâmico. As páginas experimentais passarão de quatro para três abas e usarão uma estrutura editorial contínua; dados, tratamento, incertezas e discussão ficarão integrados ao roteiro e relatório. O HTML e o Markdown dos relatórios manterão a mesma sequência acadêmica.

**Tech Stack:** HTML5 semântico, CSS responsivo e de impressão, JavaScript ES modules, MathJax 4.1.2 via jsDelivr, Node.js test runner e Markdown matemático compatível com GitHub.

## Global Constraints

- Fixar MathJax em `4.1.2`; não usar URL `latest`.
- Não adicionar framework, empacotador ou dependência npm.
- Em HTML, usar `\(...\)` para matemática em linha e `\[...\]` para equações destacadas.
- Em Markdown, usar `$...$` e `$$...$$` para renderização matemática no GitHub.
- Frações pedagógicas usam `\frac{numerador}{denominador}`; deduções usam `\begin{aligned}`.
- Vetores usam `\vec{}` ou `\boldsymbol{}`; não usar U+20D7.
- Grandezas e unidades ficam separadas por espaço estreito, com unidades em romano, por exemplo `24\,\mathrm{nC}`.
- Números apresentados ao aluno usam vírgula decimal; literais JavaScript continuam usando ponto.
- As páginas experimentais terão exatamente três abas: Montagem, Fundamentação e Roteiro e relatório.
- Não haverá aba Dados independente.
- Cada relatório integrará dados brutos, tratamento, incertezas, gráficos, discussão e conclusão.
- Cada `relatorio.md` deve produzir aproximadamente seis a dez páginas impressas, conforme figuras e tabelas.
- Caixas serão reservadas a segurança, previsão, alerta conceitual e resultado; o restante será fluxo editorial contínuo.
- A energização do equipamento permanece limitada a 5–10 s, seguida de 5–10 s desligado.
- Figuras do manual mantêm texto alternativo, legenda e crédito à AZEHEB.
- Não inventar resultados experimentais nem preencher tabelas com medidas fictícias.
- Todas as mudanças de comportamento começam por teste falhando e terminam com regressão completa.

---

## Mapa de arquivos

### Infraestrutura matemática

- **Criar `site/componentes/matematica.js`:** configuração, carregamento e recomposição MathJax.
- **Criar `site/testes/matematica.test.js`:** versão, delimitadores, segurança e API do componente.
- **Modificar `site/assets/base.css`:** overflow local, estado de carregamento e tipografia matemática comum.

### Infraestrutura experimental

- **Modificar `site/experimentos/experimento.js`:** três abas, impressão e recomposição matemática.
- **Modificar `site/assets/experimentos.css`:** artigo contínuo, sequência numerada, relatório e impressão.
- **Modificar `site/testes/experimentos.test.js`:** novo contrato estrutural, matemático e editorial.

### Conteúdo experimental

- **Modificar `site/experimentos/01-campo-corrente/{index.html,relatorio.md}`.**
- **Modificar `site/experimentos/02-campo-solenoide/{index.html,relatorio.md}`.**
- **Modificar `site/experimentos/03-forca-magnetica-motor/{index.html,relatorio.md}`.**
- **Modificar `site/experimentos/04-inducao-eletromagnetica/{index.html,relatorio.md}`.**

### Exercícios e simulações

- **Modificar `site/exercicios/exercicio-estatico.js` e `site/exercicios/halliday-21-13/app.js`:** carregar matemática.
- **Modificar os quatro `site/exercicios/halliday-21-*/index.html`:** fórmulas e deduções LaTeX.
- **Modificar `site/componentes/simulador-vetores.js`:** leituras MathJax e recomposição dinâmica.
- **Modificar `site/componentes/simulador-cargas.js`:** forças, componentes e resultante em MathJax.
- **Modificar testes de exercícios, vetores e eletrostática:** contrato de notação renderizada.

---

### Task 1: Componente MathJax compartilhado

**Files:**

- Create: `site/componentes/matematica.js`
- Create: `site/testes/matematica.test.js`
- Modify: `site/assets/base.css`

**Interfaces:**

- Produces: `MATHJAX_VERSION: string` equal to `"4.1.2"`.
- Produces: `MATHJAX_URL: string` equal to the pinned jsDelivr component URL.
- Produces: `MATHJAX_CONFIG: Readonly<object>` with TeX delimiters.
- Produces: `mathReady: Promise<object | null>`.
- Produces: `typesetMath(root?: ParentNode): Promise<boolean>`.

- [ ] **Step 1: Escrever os testes que falham**

Criar o teste com estas asserções literais:

```js
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
  assert.equal(typeof typesetMath, "function");
});

test("typesetMath é inofensivo fora do navegador", async () => {
  assert.equal(await typesetMath(), false);
});
```

- [ ] **Step 2: Executar e confirmar a falha por módulo ausente**

Run: `node --test site/testes/matematica.test.js`

Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar o carregador mínimo**

Usar a seguinte forma pública:

```js
export const MATHJAX_VERSION = "4.1.2";
export const MATHJAX_URL =
  "https://cdn.jsdelivr.net/npm/mathjax@4.1.2/tex-mml-chtml.js";
export const MATHJAX_CONFIG = Object.freeze({
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
  },
  chtml: { displayAlign: "center", displayIndent: "0" },
});
```

No navegador, atribuir a configuração a `globalThis.MathJax`, inserir uma única
tag `script[data-eletro-mathjax]` e resolver `mathReady` somente depois de
`globalThis.MathJax.startup.promise`. Em Node, `mathReady` resolve `null`.

`typesetMath(root)` deve limpar e recompor somente `root`, retornando `false`
quando DOM ou MathJax não estiverem disponíveis.

- [ ] **Step 4: Adicionar os estilos matemáticos comuns**

Adicionar a `base.css`:

```css
.math-display {
  margin: 1.5rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}

mjx-container[display="true"] {
  min-width: max-content;
  padding-block: 0.25rem;
}
```

No celular, a rolagem deve ocorrer dentro de `.math-display`, nunca no
documento. No modo de impressão, impedir quebra dentro de uma única equação.

- [ ] **Step 5: Rodar testes e verificação de sintaxe**

Run:

```powershell
node --test site/testes/matematica.test.js
node --check site/componentes/matematica.js
```

Expected: todos os casos PASS e nenhum erro de sintaxe.

- [ ] **Step 6: Commit**

```powershell
git add site/componentes/matematica.js site/testes/matematica.test.js site/assets/base.css
git commit -m "feat: add shared MathJax rendering"
```

---

### Task 2: Estrutura editorial comum dos experimentos

**Files:**

- Modify: `site/experimentos/experimento.js`
- Modify: `site/assets/experimentos.css`
- Modify: `site/testes/experimentos.test.js`

**Interfaces:**

- Consumes: `typesetMath(root)` from Task 1.
- Preserves: `setupExperiment(root, printPage)` returning the tab controller.
- Produces CSS contracts: `.experiment-prose`, `.reasoning-sequence`,
  `.report-section`, `.report-data`, `.semantic-callout`.

- [ ] **Step 1: Alterar a fixture de impressão para três abas**

Na fixture, usar somente:

```js
const tabs = [
  makeTab("painel-montagem", true),
  makeTab("painel-fundamentos", false),
  makeTab("painel-relatorio", false),
];
```

O teste deve exigir que a impressão ative `tabs[2]`, esconda montagem e
fundamentação e chame `printPage()` uma vez.

- [ ] **Step 2: Rodar o teste e confirmar a falha de índice**

Run: `node --test --test-name-pattern="imprimir" site/testes/experimentos.test.js`

Expected: FAIL porque o teste antigo e o índice do relatório ainda pressupõem
quatro abas.

- [ ] **Step 3: Integrar a matemática ao controlador**

Importar `typesetMath` e chamar `await typesetMath(root)` depois de ativar a aba
de relatório e antes de `printPage()`. Preservar navegação por teclado de
`setupTabs` e localizar o relatório por `aria-controls`, nunca por índice fixo.

- [ ] **Step 4: Substituir a grade de cartões por fluxo editorial**

Implementar no CSS:

```css
.experiment-prose,
.report-document {
  width: min(100%, 52rem);
  margin-inline: auto;
}

.reasoning-step,
.report-section {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr);
  gap: 1rem;
  padding-block: 1.75rem;
  border-top: 1px solid var(--line);
}
```

Em até 620 px, recolher a numeração para cima do texto. Manter `.experiment-safety`,
`.prediction-box` e `.uncertainty-box` como chamadas semânticas. Remover o uso
visual de `.experiment-grid`, `.report-grid`, `.lab-card`, `.theory-card` e
`.report-card` nas páginas novas sem apagar seletores necessários durante a
transição.

- [ ] **Step 5: Corrigir o contrato de impressão**

No `@media print`, esconder navegação, lista de abas, botões e os dois painéis
que não sejam `#painel-relatorio`. Imprimir o relatório em branco, sem sombras,
com tabelas repetindo cabeçalhos e sem cortar figuras ou equações.

- [ ] **Step 6: Rodar a regressão do componente e commitar**

Run:

```powershell
node --test --test-name-pattern="imprimir" site/testes/experimentos.test.js
node --check site/experimentos/experimento.js
```

```powershell
git add site/experimentos/experimento.js site/assets/experimentos.css site/testes/experimentos.test.js
git commit -m "refactor: establish academic experiment layout"
```

---

### Task 3: Experimento 4 como padrão de referência

**Files:**

- Modify: `site/experimentos/04-inducao-eletromagnetica/index.html`
- Modify: `site/experimentos/04-inducao-eletromagnetica/relatorio.md`
- Modify: `site/testes/experimentos.test.js`

**Interfaces:**

- Consumes: three-tab shell and continuous classes from Task 2.
- Produces: canonical report sequence reused as editorial standard by Task 4.

- [ ] **Step 1: Escrever o contrato específico que falha**

Exigir para o Experimento 4:

```js
assert.equal((html.match(/role="tab"/g) ?? []).length, 3);
assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 3);
assert.doesNotMatch(html, /painel-dados|>Dados</);
assert.match(html, /class="reasoning-sequence"/);
assert.match(html, /class="report-document"/);
assert.match(html, /\\frac\{d\\Phi_B\}\{dt\}/);
assert.match(html, /\\begin\{aligned\}/);
assert.match(report, /^## Dados brutos/m);
assert.match(report, /^## Tratamento e análise/m);
assert.match(report, /^## Discussão/m);
assert.match(report, /\$\$[\s\S]*\\frac[\s\S]*\$\$/);
```

Exigir pelo menos 1.500 palavras no Markdown, sem contar linhas de tabela.

- [ ] **Step 2: Rodar e observar as falhas estruturais e matemáticas**

Run: `node --test --test-name-pattern="04-inducao" site/testes/experimentos.test.js`

- [ ] **Step 3: Reescrever Montagem em sequência operacional**

Usar esta ordem contínua:

1. questão investigativa e objetivos mensuráveis;
2. materiais em lista compacta;
3. segurança em faixa única;
4. fotografia AZEHEB em largura integral;
5. convenções de sinal do galvanômetro, eixo e polo;
6. inspeção, ajuste de zero e teste de continuidade;
7. aproximação, repouso, afastamento e inversão do ímã;
8. repetição com velocidade e amplitude controladas;
9. previsão registrada antes da aquisição.

- [ ] **Step 4: Reescrever Fundamentação como capítulo curto**

Apresentar verticalmente:

```tex
\begin{aligned}
\Phi_B(t) &= \int_S \vec{B}(\vec{r},t)\cdot d\vec{A}, \\
\mathcal{E}(t) &= -N\frac{d\Phi_B}{dt}, \\
\mathcal{E}(t) &= -Nv\frac{d\Phi_B}{dz}, \\
L\frac{di}{dt}+Ri &= \mathcal{E}(t), \\
\tau_e &= \frac{L}{R}.
\end{aligned}
```

Explicar hipótese, sinal de Lenz, diferença entre fluxo e campo, regime quase
estacionário e resposta transitória RL. Não interpretar ímã parado como campo
nulo.

- [ ] **Step 5: Escrever o roteiro e relatório completo no HTML**

Usar a sequência: identificação, pergunta e hipótese, preparação pré-laboratório,
procedimento e controles, dados brutos, tratamento e análise, incertezas,
discussão, conclusão, referências e anexos. Inserir tabelas dentro de Dados
brutos e Tratamento, não em aba separada. Integrar as perguntas conceituais à
Discussão em parágrafos argumentativos.

- [ ] **Step 6: Tornar o Markdown equivalente e extenso**

O `relatorio.md` deve ter os mesmos títulos e fórmulas, campos para medidas,
orientações para gráficos e critérios quantitativos. Toda divisão matemática
deve usar `\frac{}` dentro de `$...$` ou `$$...$$`.

- [ ] **Step 7: Rodar testes e commitar o padrão**

Run: `node --test --test-name-pattern="04-inducao" site/testes/experimentos.test.js`

```powershell
git add site/experimentos/04-inducao-eletromagnetica site/testes/experimentos.test.js
git commit -m "feat: elevate induction experiment report"
```

---

### Task 4: Aplicar o padrão aos experimentos 1, 2 e 3

**Files:**

- Modify: `site/experimentos/01-campo-corrente/index.html`
- Modify: `site/experimentos/01-campo-corrente/relatorio.md`
- Modify: `site/experimentos/02-campo-solenoide/index.html`
- Modify: `site/experimentos/02-campo-solenoide/relatorio.md`
- Modify: `site/experimentos/03-forca-magnetica-motor/index.html`
- Modify: `site/experimentos/03-forca-magnetica-motor/relatorio.md`
- Modify: `site/testes/experimentos.test.js`

**Interfaces:**

- Consumes: canonical section names and layout from Task 3.
- Produces: all four experiments with the same three-tab contract.

- [ ] **Step 1: Generalizar os testes e confirmar três falhas**

Para todos os experimentos, exigir três abas, ausência de `painel-dados`,
`.reasoning-sequence`, `.report-document`, três ou mais equações LaTeX e os
títulos Markdown Dados brutos, Tratamento e análise, Discussão e Conclusão.
Exigir ao menos 1.500 palavras por relatório.

Run: `node --test site/testes/experimentos.test.js`

Expected: Experimento 4 PASS; experimentos 1, 2 e 3 FAIL.

- [ ] **Step 2: Reescrever o Experimento 1 — campo de uma corrente**

Sequência matemática obrigatória:

```tex
\begin{aligned}
d\vec{B} &= \frac{\mu_0}{4\pi}\frac{I\,d\vec{\ell}\times\hat{\vec{r}}}{r^2}, \\
\oint_C \vec{B}\cdot d\vec{\ell} &= \mu_0 I_{\mathrm{enc}}, \\
B(r) &= \frac{\mu_0 I}{2\pi r}, \\
\tan\varphi &= \frac{B_{\mathrm{fio}}}{B_{T,h}}.
\end{aligned}
```

O relatório deve separar observação de Oersted e extensão quantitativa, exigir
gráfico `B` versus `1/r`, ajuste linear, incerteza de corrente e raio, análise
de intercepto e discussão do campo terrestre.

- [ ] **Step 3: Reescrever o Experimento 2 — solenoide**

Sequência matemática obrigatória:

```tex
\begin{aligned}
n &= \frac{N}{\ell}, \\
B_{\mathrm{ideal}} &= \mu_0 n I, \\
B(z) &= \frac{\mu_0 n I}{2}
\left[
\frac{z+\ell/2}{\sqrt{a^2+(z+\ell/2)^2}}
-\frac{z-\ell/2}{\sqrt{a^2+(z-\ell/2)^2}}
\right].
\end{aligned}
```

O relatório deve pedir mapa qualitativo com limalha, perfil axial normalizado,
comparação entre modelo ideal e finito, análise de borda e propagação das
incertezas de `N`, `\ell`, `I`, `a` e `z`.

- [ ] **Step 4: Reescrever o Experimento 3 — força e motor**

Sequência matemática obrigatória:

```tex
\begin{aligned}
d\vec{F} &= I\,d\vec{\ell}\times\vec{B}, \\
F &= B I \ell\sin\theta, \\
\vec{\mu} &= N I A\,\hat{\vec{n}}, \\
\vec{\tau} &= \vec{\mu}\times\vec{B}, \\
U &= -\vec{\mu}\cdot\vec{B}, \\
J\ddot{\theta}+b\dot{\theta} &= \tau_{\mathrm{em}}(\theta)-\tau_{\mathrm{carga}}.
\end{aligned}
```

Manter Parte I e Parte II distintas, relacionar balança magnética e motor,
exigir gráfico `F` versus `I`, análise do sentido pelo produto vetorial e
discussão de comutação, torque e perdas.

- [ ] **Step 5: Rodar regressão experimental e commitar**

Run: `node --test site/testes/experimentos.test.js`

```powershell
git add site/experimentos/01-campo-corrente site/experimentos/02-campo-solenoide site/experimentos/03-forca-magnetica-motor site/testes/experimentos.test.js
git commit -m "feat: expand university physics lab reports"
```

---

### Task 5: Converter os quatro exercícios para LaTeX renderizado

**Files:**

- Modify: `site/exercicios/exercicio-estatico.js`
- Modify: `site/exercicios/halliday-21-13/app.js`
- Modify: `site/exercicios/halliday-21-13/index.html`
- Modify: `site/exercicios/halliday-21-18/index.html`
- Modify: `site/exercicios/halliday-21-34/index.html`
- Modify: `site/exercicios/halliday-21-42/index.html`
- Modify: `site/testes/exercicios-halliday.test.js`
- Modify: `site/testes/notacao-vetorial.test.js`

**Interfaces:**

- Consumes: side-effect import of `matematica.js` for static pages.
- Preserves: answers `1,33`, `37,47°`, `50,95°`, `56,61°`, `24 nC` and the
  equilibrium coordinate of exercise 13.

- [ ] **Step 1: Escrever testes de composição matemática**

Para cada página, exigir `\\begin{aligned}`, `\\frac{` e ao menos um vetor
LaTeX. Rejeitar sequências conhecidas como `μ₀I/(2πr)`, `x³/(...)`, `L/R` e
frações pedagógicas construídas apenas com `/`.

- [ ] **Step 2: Rodar e observar quatro falhas**

Run: `node --test site/testes/exercicios-halliday.test.js site/testes/notacao-vetorial.test.js`

- [ ] **Step 3: Carregar MathJax nas duas rotas de JavaScript**

Adicionar em `exercicio-estatico.js`:

```js
import "../componentes/matematica.js";
```

Adicionar em `halliday-21-13/app.js`:

```js
import "../../componentes/matematica.js";
```

- [ ] **Step 4: Converter cada dedução em alinhamento vertical**

Preservar os argumentos e resultados, mas expressar vetores com `\vec{E}` e
`\vec{F}`, módulos com `\lvert\cdot\rvert`, raízes com `\sqrt{}`, expoentes e
frações em LaTeX. Cada igualdade que muda de hipótese deve ter texto anterior
explicando a transformação.

- [ ] **Step 5: Rodar testes e commitar**

Run:

```powershell
node --test site/testes/exercicios-halliday.test.js site/testes/notacao-vetorial.test.js
node --check site/exercicios/exercicio-estatico.js
node --check site/exercicios/halliday-21-13/app.js
```

```powershell
git add site/exercicios site/testes/exercicios-halliday.test.js site/testes/notacao-vetorial.test.js
git commit -m "feat: typeset Halliday solutions with LaTeX"
```

---

### Task 6: Renderizar matemática dinâmica nos simuladores

**Files:**

- Modify: `site/componentes/simulador-vetores.js`
- Modify: `site/componentes/simulador-cargas.js`
- Modify: `site/testes/laboratorio-vetores.test.js`
- Modify: `site/testes/eletrostatica.test.js`
- Modify: `site/assets/simulador.css`

**Interfaces:**

- Consumes: `typesetMath(root): Promise<boolean>`.
- Preserves: funções puras de física, arraste, teclado, cargas adicionáveis e
  resultados numéricos existentes.

- [ ] **Step 1: Escrever testes para o markup dinâmico**

Exigir que as leituras geradas contenham delimitadores MathJax e comandos
`\begin{aligned}`, `\vec`, `\frac`, `\cos` e `\lVert`. Manter o teste que
garante `A⃗` ausente. Testar a chamada de recomposição com um stub que conta
uma execução por atualização visual.

- [ ] **Step 2: Rodar e confirmar falhas de notação**

Run: `node --test site/testes/laboratorio-vetores.test.js site/testes/eletrostatica.test.js`

- [ ] **Step 3: Converter o laboratório de vetores**

Apresentar componentes, soma, módulo e produto escalar como:

```tex
\begin{aligned}
\vec{R} &= \vec{A}+\vec{B}, \\
R_x &= A_x+B_x, & R_y &= A_y+B_y, \\
\lVert\vec{R}\rVert &= \sqrt{R_x^2+R_y^2}, \\
\vec{A}\cdot\vec{B} &= A_xB_x+A_yB_y
=\lVert\vec{A}\rVert\lVert\vec{B}\rVert\cos\theta.
\end{aligned}
```

Manter a área do paralelogramo explicitamente separada pelo determinante e
`\sin\theta`.

- [ ] **Step 4: Converter o simulador de cargas**

Renderizar lei de Coulomb vetorial, componentes individuais e soma:

```tex
\vec{F}_{i\to t}=k\frac{q_iq_t}{\lVert\vec{r}_t-\vec{r}_i\rVert^3}
(\vec{r}_t-\vec{r}_i),
\qquad
\vec{F}_{\mathrm{res}}=\sum_i\vec{F}_{i\to t}.
```

Os valores numéricos continuam escapados e formatados antes de entrar no
markup. Após cada atualização, chamar `typesetMath` apenas no painel alterado.

- [ ] **Step 5: Ajustar estilo e desempenho**

Permitir rolagem local em equações longas, manter alinhamento das tabelas e
evitar que recomposição matemática recrie SVGs ou listeners. Não chamar
MathJax durante cada evento `pointermove`; agendar no próximo frame visual.

- [ ] **Step 6: Rodar testes e commitar**

Run:

```powershell
node --test site/testes/laboratorio-vetores.test.js site/testes/eletrostatica.test.js
node --check site/componentes/simulador-vetores.js
node --check site/componentes/simulador-cargas.js
```

```powershell
git add site/componentes/simulador-vetores.js site/componentes/simulador-cargas.js site/testes/laboratorio-vetores.test.js site/testes/eletrostatica.test.js site/assets/simulador.css
git commit -m "feat: typeset interactive vector equations"
```

---

### Task 7: Integração, impressão e validação visual

**Files:**

- Modify: `README.md`
- Modify shared files only when a reproduced regression demands a tested fix.

**Interfaces:**

- Consumes all deliverables from Tasks 1–6.
- Produces a clean, locally committed candidate ready for push approval.

- [ ] **Step 1: Atualizar a documentação**

Registrar MathJax 4.1.2, as três abas experimentais, a incorporação de dados ao
relatório e a forma de imprimir ou abrir `relatorio.md`.

- [ ] **Step 2: Executar a regressão JavaScript completa**

Run:

```powershell
npm test
node --check site/componentes/matematica.js
node --check site/experimentos/experimento.js
node --check site/componentes/simulador-vetores.js
node --check site/componentes/simulador-cargas.js
git diff --check
```

Expected: todos os testes PASS e nenhum erro de sintaxe ou whitespace.

- [ ] **Step 3: Executar a regressão Python existente**

Dentro de `Força Magnética/Halliday/Capítulo 21/Exercício 13`:

```powershell
$env:PYTHONPATH = "$PWD\simulacao_forcas"
& "C:\Users\Gustavo\Desktop\dev\Eletromagnetismo-aulas\.venv\Scripts\python.exe" -m unittest discover -s tests -v
& "C:\Users\Gustavo\Desktop\dev\Eletromagnetismo-aulas\.venv\Scripts\python.exe" simulacao_forcas\run_py5.py --check
```

- [ ] **Step 4: Validar em navegador desktop**

Servir `site/`, abrir os quatro exercícios, os quatro experimentos e o
simulador. Confirmar:

- zero erros de console;
- nenhuma fórmula TeX crua visível após carregamento;
- três abas por experimento;
- navegação e impressão do relatório;
- figuras, legendas e créditos presentes;
- atualização dinâmica das equações do simulador.

- [ ] **Step 5: Validar celular e impressão**

Em 390 × 844 px, exigir
`document.documentElement.scrollWidth === document.documentElement.clientWidth`
nas nove páginas principais. Em mídia `print`, confirmar apenas o painel do
relatório, equações não cortadas, cabeçalhos de tabela repetidos e extensão
aproximada de seis a dez páginas por experimento.

- [ ] **Step 6: Fazer auditoria editorial final**

Pesquisar `/`, `painel-dados`, `report-grid`, `theory-card` e `report-card` no
conteúdo pedagógico. Classificar cada ocorrência restante: URL, caminho de
arquivo, operador JavaScript ou dívida real. Corrigir somente a dívida real.

- [ ] **Step 7: Commit final**

```powershell
git add README.md
git commit -m "docs: explain academic lab report workflow"
```

- [ ] **Step 8: Preparar publicação sem executar push**

Exibir commits locais, confirmar worktree limpa e solicitar autorização para
`git push origin main`. Após autorização, acompanhar GitHub Pages e verificar
HTTP 200 e comportamento real antes de declarar a publicação concluída.
