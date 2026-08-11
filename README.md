# Eletromagnetismo — aulas

Materiais de apoio para as aulas de eletromagnetismo: exercícios resolvidos,
roteiros de laboratório, relatórios e simulações interativas.

## Site interativo

O acervo está publicado em:

**https://atzingen.github.io/Eletromagnetismo-aulas/**

A navegação possui três áreas independentes:

- **Exercícios:** resoluções organizadas por referência e capítulo;
- **Experimentos:** roteiros avançados de Física III, com montagem,
  fundamentos, dados e relatório;
- **Simulações:** modelos interativos para explorar cargas, forças e vetores.

## Exercícios

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

## Experimentos e relatórios

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

O arquivo [site/simuladores.json](site/simuladores.json) é o registro central do
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

- [Índice de exercícios](site/exercicios/)
- [Halliday — Capítulo 21](site/exercicios/capitulo-21/)
- [Índice de experimentos](site/experimentos/)
- [Índice de simulações](site/simuladores/)
- [Simulador de cargas e vetores](site/simuladores/cargas-e-vetores/)
