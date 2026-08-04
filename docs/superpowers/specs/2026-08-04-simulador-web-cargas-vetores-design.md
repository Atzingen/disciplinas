# Simulador web de cargas e vetores — especificação de design

**Data:** 4 de agosto de 2026
**Status:** aprovado para implementação
**Repositório:** Atzingen/Eletromagnetismo-aulas

## 1. Objetivo

Criar um site estático, publicável no GitHub Pages, para organizar os materiais
de eletromagnetismo e oferecer duas experiências que compartilham o mesmo
núcleo matemático:

1. um simulador genérico de forças elétricas com até seis cargas-fonte e uma
   carga de prova;
2. uma versão web do exercício 13 do capítulo 21 do Halliday, aberta com os
   dados específicos do enunciado.

O público principal são estudantes do IFSP em uma aula expositiva ou em estudo
individual. A tarefa central da interface é tornar visível que a força
resultante é uma soma vetorial e relacionar sua intensidade ao produto escalar.

## 2. Decisões aprovadas

- HTML5, CSS e JavaScript em módulos ES, com desenho em SVG.
- Sem framework, empacotador ou etapa de compilação.
- Site estático no GitHub Pages.
- O código py5/Processing existente será preservado.
- O exercício Halliday será um preset do mesmo motor do simulador genérico.
- O catálogo terá páginas separadas. Abas existirão apenas dentro de cada
  material.
- O arquivo **site/simuladores.json** será o registro central.
- O núcleo será implementado com testes prévios e validado em navegador real.

## 3. Escopo funcional

### 3.1 Página inicial e catálogo

A página inicial apresentará o título “Laboratório de Eletromagnetismo”, uma
explicação curta e busca por título, tema, livro, capítulo ou palavra-chave.
Filtros permitirão mostrar todos os materiais, simuladores ou resoluções.

O catálogo virá de **site/simuladores.json** e começará com dois cartões:

- **Cargas e vetores:** simulador genérico;
- **Halliday — capítulo 21 — exercício 13:** enunciado, resolução e preset.

Adicionar uma aula futura exigirá criar sua pasta e registrar um item no JSON,
sem alterar o mecanismo do catálogo.

### 3.2 Simulador genérico

A aba **Experimento** terá plano cartesiano em centímetros e painel de
controle. O estado inicial terá duas cargas-fonte e uma carga de prova. Será
possível:

- adicionar fontes até o limite de seis;
- selecionar e remover qualquer fonte;
- alternar o sinal positivo ou negativo;
- ajustar o módulo entre 0,1 µC e 10,0 µC, em passos de 0,1 µC;
- arrastar todas as cargas pelo plano;
- mover o item selecionado com o teclado;
- restaurar a configuração inicial.

A carga de prova será única e não poderá ser removida. Seu módulo e sinal
também serão ajustáveis.

Para cada fonte, o SVG exibirá a força exercida sobre a carga de prova. A
resultante aparecerá como uma seta mais espessa. Todas as setas usarão o mesmo
fator de escala visual no quadro atual, preservando as proporções. Um painel
numérico mostrará componentes, módulo e unidade de cada força e da resultante.

### 3.3 Soma de vetores

A aba **Soma de vetores** apresentará A e B com extremidades arrastáveis:

- construção ponta-com-cauda;
- paralelogramo formado por A e B;
- diagonal R = A + B;
- componentes cartesianas;
- módulos de A, B e R;
- ângulo entre os vetores.

### 3.4 Produto escalar

A aba **Produto escalar** reutilizará A e B e mostrará:

- ângulo θ e projeção de um vetor na direção do outro;
- A · B = AₓBₓ + AᵧBᵧ;
- A · B = |A||B| cos θ;
- classificação como positivo, nulo ou negativo;
- |A + B|² = |A|² + |B|² + 2A · B.

A explicação derivará |A| = √(Aₓ² + Aᵧ²) pelo teorema de Pitágoras e ligará
projeção e cosseno para justificar a forma geométrica do produto escalar.

> **Distinção científica:** a área do paralelogramo é
> |det(A,B)| = |A||B||sen θ|. Ela não é o produto escalar e não determina
> diretamente o módulo da soma. O produto escalar usa cos θ e aparece no termo
> cruzado do módulo da resultante.

### 3.5 Teoria guiada

A aba **Teoria guiada** organizará:

1. componentes;
2. módulo por Pitágoras;
3. soma por componentes;
4. produto escalar por componentes e projeção;
5. dedução do módulo da soma;
6. diferença entre produto escalar e área.

Os exemplos numéricos acompanharão os vetores posicionados pelo aluno.

### 3.6 Exercício Halliday

A página terá abas **Enunciado**, **Resolução** e **Simulação**. A resolução
existente será preservada em HTML. O preset usará:

- q₁ = +1,0 µC em (0,0);
- q₂ = −3,0 µC em (10,0);
- q₃ = +1,0 µC em x = −10/(√3−1) cm, y = 0.

Um botão restaurará o ponto teórico e o painel mostrará as forças de mesmo
módulo e sentidos opostos.

## 4. Modelo científico e unidades

O núcleo usará SI internamente:

- centímetros serão convertidos em metros;
- microcoulombs serão convertidos em coulombs;
- forças serão calculadas em newtons;
- k = 8,9875517923 × 10⁹ N·m²/C².

Para fonte qᵢ em rᵢ e carga de prova qₜ em rₜ:

**Fᵢ = k qᵢ qₜ (rₜ − rᵢ) / |rₜ − rᵢ|³**

A resultante será a soma das forças individuais. O sinal de qᵢqₜ produzirá
atração ou repulsão sem regras especiais de direção.

Coincidência exata de posições será tratada como singularidade. A interface
ocultará as setas afetadas e explicará como separar as cargas, sem inventar um
limite artificial.

## 5. Arquitetura

~~~text
site/
├── .nojekyll
├── index.html
├── simuladores.json
├── assets/
│   ├── base.css
│   └── simulador.css
├── componentes/
│   ├── abas.js
│   ├── catalogo.js
│   ├── simulador-cargas.js
│   └── simulador-vetores.js
├── nucleo/
│   ├── eletrostatica.js
│   ├── formato.js
│   └── vetores.js
├── simuladores/
│   └── cargas-e-vetores/
│       ├── index.html
│       └── app.js
├── exercicios/
│   └── halliday-21-13/
│       ├── index.html
│       └── app.js
└── testes/
    ├── catalogo.test.js
    ├── eletrostatica.test.js
    ├── presets.test.js
    └── vetores.test.js
~~~

**vetores.js** conterá funções puras de soma, subtração, escala, módulo,
produto escalar, determinante, ângulo e projeção. **eletrostatica.js** conterá
a lei de Coulomb e a soma de forças. Nenhum conhecerá o DOM.

**simulador-cargas.js** receberá um elemento HTML e uma configuração, manterá o
estado, chamará o núcleo e renderizará o SVG. As duas páginas fornecerão
presets diferentes à mesma função pública.

**simulador-vetores.js** controlará as experiências vetoriais. **abas.js**
implementará navegação acessível. **catalogo.js** carregará e filtrará o JSON.

## 6. Fluxo de dados

1. A página carrega seu preset.
2. O componente transforma o preset em estado local.
3. Arraste, tecla ou controle altera somente esse estado.
4. Funções puras recalculam vetores e forças.
5. O componente redesenha o SVG e atualiza a tabela.
6. A escala comum parte do maior módulo entre forças individuais e resultante.

Não haverá servidor, banco de dados, conta ou persistência nesta versão.

## 7. Controles e acessibilidade

- Clique ou toque seleciona uma carga; arrastar muda sua posição.
- Setas movem 0,5 cm; Shift + seta move 2 cm.
- + e − ajustam módulo; S troca sinal; A adiciona fonte; Delete remove a fonte
  selecionada; R restaura o preset.
- Atalhos atuarão somente com o plano focado.
- Controles terão rótulos visíveis e foco perceptível.
- Abas seguirão os papéis ARIA de tablist, tab e tabpanel.
- Cor não será o único código: sinais, rótulos e padrões acompanharão as cores.
- A interface respeitará prefers-reduced-motion.

Em telas largas, plano e controles ficarão lado a lado. Em telas estreitas, o
plano virá primeiro e o painel abaixo, com alvos de toque de pelo menos 44 px.

## 8. Direção visual

O conceito é uma **mesa de laboratório vetorial**, não um painel corporativo.
A grade lembra papel milimetrado e as leituras lembram instrumentos.

### Paleta

- papel frio: #F4F7F8;
- tinta técnica: #142A3B;
- positivo: #D94841;
- negativo: #246BCE;
- resultante: #7A3CE7;
- medição: #E3A018.

Seis cores distinguíveis ligarão cada fonte à sua força. A carga continuará
vermelha ou azul conforme o sinal; um anel numerado indicará sua força.

### Tipografia e composição

Títulos usarão Trebuchet MS, texto usará Segoe UI e dados usarão Consolas, com
alternativas locais. A assinatura será a construção controlável do
paralelogramo, como desenho feito com régua. O restante será contido, sem
gradientes decorativos, cartões excessivos ou animações sem função.

## 9. Tratamento de erros

- Entrada vazia ou não numérica preserva o último valor válido e explica a
  correção.
- Valor fora da faixa é limitado e informado.
- Com seis fontes, adicionar fica desabilitado e explica o limite.
- A carga de prova não pode ser removida.
- Singularidade gera mensagem específica.
- Falha do JSON mostra orientação para recarregar.

## 10. Testes e critérios de aceitação

O executor nativo do Node.js cobrirá:

- operações vetoriais, projeção, ângulo e vetor nulo;
- equivalência das duas formas do produto escalar;
- identidade do módulo da soma;
- módulo e direção da lei de Coulomb;
- atração, repulsão e soma de até seis fontes;
- singularidade;
- posição analítica do preset Halliday e resultante numericamente nula;
- validade e destinos de cada item do catálogo.

No navegador serão validados catálogo, busca, filtros, navegação, manipulação
das cargas, mouse, teclado, setas, leituras, abas, foco, preset, restauração,
desktop, celular e console sem erros.

O trabalho estará concluído quando os testes passarem, as duas páginas
funcionarem em navegador real, o site estiver publicado e a URL pública
responder com sucesso.

## 11. Publicação

O conteúdo de **site/** será publicado por GitHub Actions em:

https://atzingen.github.io/Eletromagnetismo-aulas/

O README apontará para o site e para a versão py5. A publicação será verificada
por resposta HTTP e navegação real.
