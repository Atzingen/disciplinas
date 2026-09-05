# Materiais didáticos — Gustavo von Atzingen

Site de materiais didáticos do professor Gustavo von Atzingen no IFSP Câmpus
Piracicaba. Cada componente curricular possui uma página independente.

## Portal docente

O acervo está publicado em:

**https://atzingen.github.io/disciplinas/**

A página inicial abre com um texto de apresentação, segue com o professor e
encaminha para os dois componentes curriculares atualmente disponíveis:

- **PRCFEMG — Fundamentos do Eletromagnetismo:** resoluções organizadas por
  referência e capítulo e simulações de cargas, forças, campos e vetores;
- **PRCLFBE — Laboratório de Física Básica: Eletromagnetismo:** roteiros
  experimentais, montagens, dados, relatórios e recursos virtuais de apoio.

Os nomes, códigos, ementas, objetivos, conteúdos programáticos e bibliografias
seguem o
[PPC da Licenciatura em Física](site/referencias/2023.03.07-PPC-LIC-Física-PRC-Reformulação.pdf).
As páginas de referência usadas e a divergência de total de aulas encontrada
em PRCFEMG estão documentadas em
[site/referencias/README.md](site/referencias/README.md).

O PPC aparece como um cartão lateral na página de cada disciplina e como um
link discreto na página inicial.

As **simulações** formam uma área própria (`site/simuladores/`), com entrada
na navegação principal e independente das disciplinas. Cada simulação é
marcada com as disciplinas em que faz sentido; a página de simulações filtra
por disciplina e a página de cada disciplina lista as simulações marcadas com
o seu código.

Novas disciplinas devem ganhar uma página em `site/disciplinas/<codigo>/`, com
o código em letras minúsculas no caminho, e uma entrada na lista de
`buildMainNavigation` em `site/componentes/navegacao-principal.js`. Os itens
do catálogo indicam os códigos oficiais, em letras maiúsculas, na lista
`disciplines` de `site/materiais.json`; uma simulação pode listar mais de uma
disciplina.

## Exercícios

A aba **Enade** reúne 137 questões específicas de Física: 37 de 2024 e 50
de cada aplicação de 2025. Permite filtrar por ano, aplicação, tópico, tipo e
disponibilidade de resolução, além de buscar no texto. Enunciados, figuras,
textos-base e gabaritos acompanham os PDFs originais. A estrutura para
resoluções comentadas está preparada; elas ainda não foram adicionadas.
Veja a [documentação do acervo](site/enade/README.md) para atualizar o catálogo.

Em **Halliday → Capítulo 21**, os exercícios 13, 18, 33, 34 e 42 formam uma
sequência navegável. Enunciado, resolução e o apoio visual (diagrama ou
simulação) ficam na mesma página, em leitura contínua: a barra fixa no topo é
só atalho de rolagem e acompanha a seção em foco. O rodapé leva ao exercício
anterior, ao próximo e ao índice do capítulo.

O exercício 33 — a carga positiva contida em 250 cm³ de água — traz um
explorador interativo: a mesma cadeia de conversão (volume → massa → mols →
moléculas → prótons → carga) é recalculada para seis substâncias, o que
evidencia o salto de mil vezes entre líquidos/sólidos e gases em CNTP. O cálculo
puro fica em [site/nucleo/contagem-particulas.js](site/nucleo/contagem-particulas.js).

Em **Campo elétrico → Capítulo 22**, cinco exercícios temáticos desenvolvem
integrais de distribuições contínuas (anel, arco, barras e disco) e três
exercícios do Halliday — 22.24, 22.26 e 22.28 — aplicam os mesmos argumentos de
simetria e geometria. As duas sequências são identificadas e navegadas
separadamente.

## PRCLFBE — Laboratório de Física Básica: Eletromagnetismo

Os quatro roteiros baseados no conjunto de eletromagnetismo AZEHEB foram
ampliados para turmas de Engenharia e Física:

1. campo magnético gerado por corrente elétrica;
2. campo magnético de um solenoide;
3. força magnética e motor elementar;
4. indução eletromagnética.

O quinto roteiro é uma montagem própria em protoboard:

5. varal de resistores — a escada infinita montada degrau a degrau com nove
   resistores de 10 kΩ medidos um a um, convergindo para (1 + √3)R. A
   recorrência da escada vive em
   [site/nucleo/escada-resistores.js](site/nucleo/escada-resistores.js) e a
   página traz um explorador interativo de degraus.

O sexto roteiro retorna ao campo elétrico com outra montagem própria:

6. cuba eletrolítica com três eletrodos cilíndricos em 0 V, 5 V e 10 V. Os
   estudantes medem todos os cruzamentos de uma região quadrada da malha,
   constroem equipotenciais, estimam \(\vec E=-\nabla V\) por diferenças
   finitas e testam discretamente a equação de Laplace. As fotografias da
   bancada estão em
   [site/assets/experimentos/cuba-eletrolitica/](site/assets/experimentos/cuba-eletrolitica/).

O roteiro possui um laboratório virtual complementar em
[site/simuladores/cuba-eletrolitica/](site/simuladores/cuba-eletrolitica/).
Nele, cilindros e retângulos móveis funcionam como condições de potencial
fixo, enquanto uma malha resolvida por Gauss–Seidel/SOR mostra a convergência
do mapa e das equipotenciais inteiramente no navegador.

Na página de cada experimento, a aba **Relatório** contém uma folha preparada
para impressão. O botão de impressão ativa essa aba e remove da cópia os
controles de navegação. A mesma estrutura também está disponível em
`relatorio.md` dentro da pasta do experimento.

As fotografias selecionadas do manual permanecem creditadas à AZEHEB. O PDF
original não é publicado neste repositório; a proveniência das imagens está em
[site/assets/experimentos/azeheb/README.md](site/assets/experimentos/azeheb/README.md).

## Executar localmente

```powershell
npm test
npm run serve
```

Depois, acesse http://127.0.0.1:8000/.

O arquivo [site/materiais.json](site/materiais.json) é o registro central do
acervo. Cada material informa sua área e seu caminho; exercícios também
informam a referência, o capítulo e o número.

## Organização dos arquivos-fonte

Os códigos e documentos originais continuam separados por tema, referência,
capítulo e exercício:

```text
tema/
└── referência/
    └── capítulo/
        └── exercício/
```

O exercício que iniciou o projeto permanece em:

- **Força Magnética — Halliday — Capítulo 21 — Exercício 13:**
  [resolução e simulação py5](<Força Magnética/Halliday/Capítulo 21/Exercício 13/README.md>).

## Atalhos para o conteúdo web

- [Portal de disciplinas](site/)
- [PRCFEMG — Fundamentos do Eletromagnetismo](site/disciplinas/prcfemg/)
- [PRCLFBE — Laboratório de Física Básica: Eletromagnetismo](site/disciplinas/prclfbe/)
- [Índice de exercícios](site/exercicios/)
- [Enade · Física](site/enade/)
- [Halliday — Capítulo 21](site/exercicios/capitulo-21/)
- [Campo elétrico — Capítulo 22](site/exercicios/capitulo-22/)
- [Índice de experimentos](site/experimentos/)
- [Índice de simulações](site/simuladores/)
- [Simulador de cargas e vetores](site/simuladores/cargas-e-vetores/)
- [Simulador do potencial na cuba](site/simuladores/cuba-eletrolitica/)
