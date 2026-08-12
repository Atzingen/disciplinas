# Design — geometria e progressão matemática nos exercícios Halliday 21

Data: 2026-08-12

## Objetivo

Transformar os exercícios Halliday 21.13, 21.18, 21.33, 21.34 e 21.42 em experiências de estudo que conectem, sem saltos, a geometria, os vetores e cada transformação algébrica já publicada. As respostas e o conteúdo científico atuais são a referência e não serão alterados.

## Decisão de arquitetura

A solução escolhida é acrescentar a cada pasta um pequeno modelo matemático puro, uma visualização SVG e um controlador de reprodução próprios. O HTML continuará contendo a resolução completa e uma figura inicial útil mesmo se o JavaScript falhar. Cada exercício poderá ser implementado e testado por um subagente diferente sem editar arquivos de outro exercício.

Foram descartadas duas alternativas:

1. Estender o simulador genérico de cargas: ele serve ao 21.13, mas força abstrações inadequadas para contagem de partículas, quantização e pêndulos.
2. Criar um motor Canvas único: reduziria a acessibilidade sem trazer ganho para figuras com poucos objetos vetoriais e rótulos semânticos.

Os cinco problemas são discretos; nenhum contém uma integral física natural. Portanto, não será inventada uma integral. A progressão elemento a elemento será representada pelo equivalente didático correto de cada caso: varredura de posição, composição vetorial, cadeia de conversões, decomposição em componentes ou aproximação de pequeno ângulo.

## Contrato comum das experiências

Cada página terá um painel local `[data-didactic-visualization]` com:

- SVG responsivo com `role="img"`, `title`, `desc`, rótulos textuais e padrões que não dependem apenas de cor;
- controles nativos e visíveis `Reproduzir`, `Pausar`, `Reiniciar`, `Próximo passo` e `Velocidade` (`0,5×`, `1×`, `2×`);
- estado inicial pausado, avanço determinístico por passos e leitura textual do passo atual em `aria-live="polite"`;
- API local `play()`, `pause()`, `reset()`, `step()`, `setSpeed()` e `getState()` para teste;
- interrupção segura ao ocultar a página e ausência de temporizadores duplicados;
- `prefers-reduced-motion: reduce` detectado no JavaScript e no CSS: sem interpolação ou autoplay, mas com todos os passos disponíveis manualmente;
- alvos de toque de pelo menos 44 px, foco visível, controles que quebram linha e ausência de rolagem horizontal em 390 × 844;
- CSS limitado à pasta do exercício e integrado aos temas claro/escuro por variáveis já existentes.

A linguagem visual será uma bancada de eletrostática: grade de medição, eixos, réguas, setas com origem aplicada, marcas de projeção e leituras monoespaçadas. Cada exercício terá uma metáfora visual própria, evitando um painel genérico de dashboard.

## Conteúdo e interação por exercício

### 21.13 — radar de nulidade do campo

**Verdade matemática preservada:** `q₁ = +1,0 µC` em `(0,0)`, `q₂ = −3,0 µC` em `(10 cm,0)` e equilíbrio em `(−13,66 cm,0)`. O cancelamento exige vetores colineares, logo `y = 0`; entre as cargas os campos apontam para `+x`; à direita `q₂` domina; à esquerda existe a única raiz de módulos iguais.

**Visualização:** plano cartesiano com as duas fontes, o ponto candidato, os campos `E₁`, `E₂` e a resultante desenhados na mesma escala. Um roteiro visita: ponto fora do eixo, região entre as cargas, região à direita, dois pontos à esquerda e a raiz. Na etapa à esquerda, o candidato varre posições discretas sem cruzar uma carga; barras de módulo mostram a troca de dominância até `E₁/E₂ = 1`.

**Interação específica:** os controles percorrem o roteiro geométrico, e a simulação arrastável existente permanece disponível abaixo para exploração livre. A nova experiência explica por que procurar; o simulador existente permite testar.

### 21.18 — mesa de forças sobre um locus circular

**Verdade matemática preservada:** `F_B + F_C = 2,014 × 10⁻²³ N`, `F_C − F_B = 2,877 × 10⁻²⁴ N`, `F_B = 8,6315 × 10⁻²⁴ N`, `F_C = 1,15085 × 10⁻²³ N` e `q_C/q_B ≈ 1,33` porque os demais fatores de Coulomb são comuns.

**Visualização:** A ocupa o centro de uma circunferência de raio `r`; C fica à direita e B percorre o semicírculo de `+r` a `−r`, tornando visível que a distância de B até A não muda. A seta `F_B` gira com B, `F_C` permanece em `−x` e a resultante é recomposta ponta a cauda. Os pontos intermediários são rotulados como transição não medida; apenas as extremidades correspondem às configurações do enunciado.

**Interação específica:** os passos separam configuração (a), conservação do módulo de `F_B`, deslocamento de B, configuração (b), solução do sistema soma/diferença e cancelamento de `kq_A/r²` na razão final.

### 21.33 — câmara de contagem por ordens de grandeza

**Verdade matemática preservada:** `250 cm³ → 250 g → 13,87 mol → 8,35 × 10²⁴ moléculas → 8,35 × 10²⁵ prótons → 1,34 × 10⁷ C`; cada molécula de água tem dez prótons. A carga positiva é enorme, mas a carga líquida da água neutra continua zero.

**Visualização:** uma cadeia de seis estações liga recipiente, massa, mol, molécula, prótons e carga. A unidade que cancela fica riscada em cada passagem, enquanto uma régua logarítmica desloca o marcador de escala; ícones de partículas são explicitamente simbólicos, nunca apresentados como contagem literal. Na última etapa, duas barras iguais `+1,34 × 10⁷ C` e `−1,34 × 10⁷ C` mostram por que o saldo é zero.

**Interação específica:** cada passo revela um único fator (`ρ`, `1/M`, `N_A`, `Z`, `e`) e sua unidade. O explorador de substâncias atual permanece intacto e continua a aplicar a cadeia a outros materiais.

### 21.34 — balança vetorial quantizada

**Verdade matemática preservada:** `r = R/cos θ`, cada força iônica fornece `keq cos²θ/R²`, a projeção horizontal acrescenta outro `cos θ`, e o equilíbrio dá `q/e = 1/(2cos³θ)`. Para `q = ne`, `n = 1…5`, os três menores ângulos são `37,47°`, `50,95°` e `56,61°`.

**Visualização:** diagrama simétrico com forças iônicas diagonais, projeções tracejadas e duas balanças: componentes verticais que fecham em zero e componentes horizontais que igualam `F₁₂`. Um seletor discreto `n = q/e` reposiciona os íons no ângulo de equilíbrio e atualiza `r/R`, `cos²θ`, o fator de projeção e `cos³θ`.

**Interação específica:** os passos revelam distância inclinada, módulo de Coulomb, projeção horizontal, cancelamento vertical, equilíbrio horizontal e quantização. A escolha de `n` é restrita aos cinco valores físicos do enunciado.

### 21.42 — pêndulo calibrado e calibre da aproximação

**Verdade matemática preservada:** para uma esfera, `Tsinθ = Fₑ`, `Tcosθ = mg`, `sinθ = x/(2L)` e `tanθ ≈ sinθ`. Assim, `x = (q²L/(2πε₀mg))^(1/3)` e, para `L = 1,20 m`, `m = 0,010 kg`, `x = 0,050 m`, `|q| = 2,38 × 10⁻⁸ C ≈ 24 nC`; `θ ≈ 1,19°` confirma a hipótese.

**Visualização:** montagem simétrica ligada ao diagrama de corpo livre da esfera direita. A tensão é decomposta em `Tsinθ` e `Tcosθ`, a régua destaca `x/2` e um calibre compara `sinθ` com `tanθ`. Como o ângulo real é visualmente pequeno, a figura pode ampliá-lo, desde que exiba permanentemente “geometria ampliada; valores numéricos exatos”.

**Interação específica:** um controle de separação, com reset em `5,0 cm`, mostra como `θ`, a carga inferida e o erro da aproximação variam; o roteiro retorna ao caso pedido. Os passos percorrem geometria, corpo livre, eliminação de T, Coulomb, aproximação e resposta.

## Preservação e limites

- O texto científico existente continua visível; mudanças editoriais limitam-se a conectar a visualização aos passos já publicados.
- Nenhum framework, dependência npm, imagem do livro ou serviço externo será adicionado.
- SVG, CSS e JavaScript serão autorais e locais; os componentes compartilhados atuais apenas serão consumidos.
- O exercício 21.13 não perderá seu simulador de cargas; o 21.33 não perderá o explorador de substâncias.
- Não haverá áudio, gamificação, armazenamento de progresso, pontuação ou alteração do catálogo.

## Testes e evidência visual

Cada exercício começa com um teste Node em arquivo exclusivo que cobre o modelo matemático, a estrutura acessível, os controles e a resposta canônica. O primeiro ciclo deve falhar por módulo/contrato ausente (RED); após a implementação, o teste direcionado e a suíte completa devem passar (GREEN).

Cada implementador valida sua própria página em servidor HTTP real com `playwright-cli`, em 1440 × 1000 e 390 × 844. A evidência mínima por exercício é um screenshot desktop no passo mais explicativo e outro mobile, além de verificações de reprodução, pausa, reinício, passo, velocidade, `prefers-reduced-motion`, foco por teclado, `scrollWidth <= clientWidth` e ausência de erros no console.

A integração final roda todos os testes, verifica HTTP 200 nas cinco rotas, repete um smoke test Playwright cruzado e registra as dez capturas em um manifesto. Nenhuma página será declarada pronta sem essas evidências.
