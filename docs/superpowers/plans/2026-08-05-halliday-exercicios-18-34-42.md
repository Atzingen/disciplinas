# Exercícios Halliday 21.18, 21.34 e 21.42 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acrescentar ao catálogo três resoluções didáticas completas, cada uma com enunciado parafraseado, dedução passo a passo, respostas numéricas e diagrama vetorial autoral.

**Architecture:** Cada exercício será uma página HTML estática independente, montada sobre o componente de abas já existente. Um pequeno inicializador compartilhado ativará as abas; estilos comuns cuidarão das deduções, tabelas e diagramas SVG. O catálogo JSON continuará sendo a fonte única da página inicial.

**Tech Stack:** HTML5 semântico, CSS responsivo, JavaScript ES modules, SVG inline acessível, Node.js test runner, Python HTTP server e GitHub Pages.

## Global Constraints

- Preservar o padrão visual e a navegação já usados no exercício 21.13.
- Não reproduzir as fotografias nem transcrever integralmente o texto do livro.
- Criar diagramas SVG autorais, com `title` e `desc`, legíveis em desktop e celular.
- Usar vírgula decimal na apresentação e valores SI nas deduções.
- Não inserir o caractere combinante U+20D7; vetores textuais usam a classe `.vector-symbol`.
- Manter três abas acessíveis em cada página: Enunciado, Resolução e Diagrama.
- Todo contrato novo de página ou catálogo começa com teste falhando.
- Não alterar o simulador py5/Processing nem o simulador genérico já publicado.

---

## Mapa de arquivos

- **site/exercicios/exercicio-estatico.js:** inicializador comum das abas.
- **site/exercicios/halliday-21-18/index.html:** forças colineares e razão entre cargas.
- **site/exercicios/halliday-21-34/index.html:** equilíbrio por simetria e ângulos possíveis.
- **site/exercicios/halliday-21-42/index.html:** pêndulos carregados e aproximação de pequeno ângulo.
- **site/assets/simulador.css:** figuras didáticas, tabelas e blocos de conclusão compartilhados.
- **site/simuladores.json:** três novos itens no catálogo.
- **site/testes/exercicios-halliday.test.js:** contratos estruturais, resultados e acessibilidade básica.
- **site/testes/catalogo.test.js:** expectativa do catálogo ampliado e buscas relacionadas.

---

### Task 1: Contrato das três páginas e infraestrutura comum

**Files:**

- Create: `site/testes/exercicios-halliday.test.js`
- Create: `site/exercicios/exercicio-estatico.js`
- Modify: `site/assets/simulador.css`

- [ ] **Step 1: Escrever o teste de contrato que falha**

Ler os três caminhos planejados e verificar que cada página contém:

```js
assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 3);
assert.match(html, /<svg[^>]+role="img"/);
assert.match(html, /<title>/);
assert.match(html, /<desc>/);
assert.match(html, /exercicio-estatico\.js/);
```

Verificar também os resultados visíveis: `1,33` no exercício 18; `37,47°`,
`50,95°` e `56,61°` no exercício 34; `2,38 × 10⁻⁸ C` e `24 nC` no exercício
42.

- [ ] **Step 2: Executar o teste e observar a falha esperada**

Run: `node --test site/testes/exercicios-halliday.test.js`

Expected: FAIL porque as três páginas ainda não existem.

- [ ] **Step 3: Criar o inicializador compartilhado**

Importar `setupTabs` de `../componentes/abas.js`, localizar `[data-tabs]` e montar
o controlador. Não adicionar estado ou abstração além disso.

- [ ] **Step 4: Acrescentar somente os estilos comuns necessários**

Adicionar classes para figura, legenda, quadro de conclusão, grade de dedução,
tabela de valores e elementos SVG. Garantir `overflow-x: auto` para fórmulas e
`max-width: 100%` para diagramas.

---

### Task 2: Exercício Halliday 21.18

**Files:**

- Create: `site/exercicios/halliday-21-18/index.html`
- Test: `site/testes/exercicios-halliday.test.js`

- [ ] **Step 1: Construir a página sem esconder os sentidos das forças**

Na configuração (a), apresentar:

```text
F_B + F_C = 2,014 × 10⁻²³ N
```

Na configuração (b), após B mudar de lado:

```text
F_C - F_B = 2,877 × 10⁻²⁴ N
```

- [ ] **Step 2: Resolver o sistema e concluir a razão**

Exibir:

```text
F_C = (F_a + F_b)/2
F_B = (F_a - F_b)/2
q_C/q_B = F_C/F_B = (F_a + F_b)/(F_a - F_b) ≈ 1,33
```

Explicar que os fatores `k`, `q_A` e `r²` se cancelam porque as distâncias são
consideradas iguais.

- [ ] **Step 3: Desenhar o SVG autoral das duas configurações**

Mostrar A, B e C no eixo x e setas coloridas aplicadas em A. Na segunda linha,
as setas devem apontar em sentidos opostos e a seta de C deve ser maior.

- [ ] **Step 4: Rodar o teste direcionado**

Run: `node --test --test-name-pattern="21.18" site/testes/exercicios-halliday.test.js`

Expected: PASS para o exercício 21.18; os demais casos continuam falhando por
arquivos ainda ausentes.

- [ ] **Step 5: Commit atômico**

```powershell
git add site/exercicios/exercicio-estatico.js site/assets/simulador.css site/exercicios/halliday-21-18/index.html site/testes/exercicios-halliday.test.js
git commit -m "feat: add Halliday exercise 21.18 solution"
```

---

### Task 3: Exercício Halliday 21.34

**Files:**

- Create: `site/exercicios/halliday-21-34/index.html`
- Test: `site/testes/exercicios-halliday.test.js`

- [ ] **Step 1: Explicar a simetria antes da álgebra**

Mostrar que as componentes verticais das forças dos íons 3 e 4 se cancelam,
enquanto suas componentes horizontais somam para a esquerda. A força do elétron
1 sobre o elétron 2 aponta para a direita.

- [ ] **Step 2: Deduzir a condição de equilíbrio**

Com `r = R/cos θ`, desenvolver:

```text
F_íon,x = k e q cos³θ / R²
e² = 2 e q cos³θ
q/e = 1/(2 cos³θ)
```

- [ ] **Step 3: Aplicar a quantização da carga**

Usar `q = ne`, com `n = 1, 2, 3, 4, 5`, e a fórmula:

```text
θ_n = arccos[(1/(2n))^(1/3)]
```

Apresentar os três menores valores positivos: `37,47°`, `50,95°` e `56,61°`.

- [ ] **Step 4: Desenhar o SVG de geometria e forças**

Mostrar as posições, os dois ângulos iguais, as linhas de comprimento `R`, as
forças diagonais e a compensação das componentes verticais.

- [ ] **Step 5: Rodar o teste direcionado e commitar**

Run: `node --test --test-name-pattern="21.34" site/testes/exercicios-halliday.test.js`

Expected: PASS para o exercício 21.34.

```powershell
git add site/exercicios/halliday-21-34/index.html site/testes/exercicios-halliday.test.js
git commit -m "feat: add Halliday exercise 21.34 solution"
```

---

### Task 4: Exercício Halliday 21.42

**Files:**

- Create: `site/exercicios/halliday-21-42/index.html`
- Test: `site/testes/exercicios-halliday.test.js`

- [ ] **Step 1: Montar o equilíbrio de uma esfera**

Exibir `T cos θ = mg`, `T sin θ = F_e` e, pela divisão, `tan θ = F_e/(mg)`.

- [ ] **Step 2: Relacionar a geometria à aproximação de pequeno ângulo**

Usar `sin θ = x/(2L)`, `tan θ ≈ sin θ` e
`F_e = kq²/x²`, chegando a:

```text
x³ = q²L/(2π ε₀mg)
x = (q²L/(2π ε₀mg))^(1/3)
```

- [ ] **Step 3: Substituir os dados da parte (b)**

Converter `L = 1,20 m`, `m = 0,010 kg` e `x = 0,050 m`. Calcular:

```text
|q| = sqrt(2π ε₀mgx³/L) = 2,38 × 10⁻⁸ C ≈ 24 nC
```

- [ ] **Step 4: Desenhar o pêndulo e o diagrama de corpo livre**

O SVG deve mostrar os dois fios, a separação `x`, os ângulos `θ` e, ao lado, as
forças `T`, `mg` e `F_e` aplicadas a uma esfera.

- [ ] **Step 5: Rodar o teste direcionado e commitar**

Run: `node --test --test-name-pattern="21.42" site/testes/exercicios-halliday.test.js`

Expected: todos os contratos das três páginas PASS.

```powershell
git add site/exercicios/halliday-21-42/index.html site/testes/exercicios-halliday.test.js
git commit -m "feat: add Halliday exercise 21.42 solution"
```

---

### Task 5: Catálogo, regressão e publicação

**Files:**

- Modify: `site/simuladores.json`
- Modify: `site/testes/catalogo.test.js`
- Modify: `README.md` somente se a lista de conteúdo exigir atualização.

- [ ] **Step 1: Atualizar primeiro as expectativas do catálogo**

Esperar cinco itens, IDs únicos e quatro resoluções Halliday. Incluir buscas que
encontrem os exercícios por `21.18`, `21.34`, `21.42`, `pêndulo` e `equilíbrio`.

- [ ] **Step 2: Executar e observar a falha esperada**

Run: `node --test site/testes/catalogo.test.js`

Expected: FAIL porque o JSON ainda possui dois itens.

- [ ] **Step 3: Registrar as três páginas**

Acrescentar título, tipo `resolucao`, tema, descrição, caminho e etiquetas para
cada exercício, sem alterar os dois itens existentes.

- [ ] **Step 4: Validar o projeto completo**

Run:

```powershell
npm test
python -m unittest discover -s tests -v
python -m py_compile py5_app/main.py
node --check site/exercicios/exercicio-estatico.js
```

Expected: todas as suítes e verificações PASS.

- [ ] **Step 5: Validar visualmente em servidor local**

Abrir o catálogo e as três rotas em navegador real. Em cada página, alternar as
três abas e conferir SVG, fórmulas, respostas, ausência de overflow horizontal e
largura móvel de aproximadamente 390 px.

- [ ] **Step 6: Commit, push e GitHub Pages**

```powershell
git add site/simuladores.json site/testes/catalogo.test.js README.md
git commit -m "feat: publish three Halliday electrostatics lessons"
git push origin main
gh run watch --exit-status
```

- [ ] **Step 7: Verificar a publicação real**

Confirmar HTTP 200 para o catálogo e as três rotas públicas, conferir que o
catálogo exibe cinco cartões e repetir no site publicado as verificações
essenciais de abas, resultados e diagramas.
