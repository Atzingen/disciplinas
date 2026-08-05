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

Em **Halliday → Capítulo 21**, os exercícios 13, 18, 34 e 42 formam uma
sequência navegável. Cada página possui resolução passo a passo, diagrama ou
simulação e links para o exercício anterior, o próximo e o índice do capítulo.

## Experimentos e relatórios

Os quatro roteiros baseados no conjunto de eletromagnetismo AZEHEB foram
ampliados para turmas de Engenharia e Física:

1. campo magnético gerado por corrente elétrica;
2. campo magnético de um solenoide;
3. força magnética e motor elementar;
4. indução eletromagnética.

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
