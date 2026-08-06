# Eletromagnetismo — aulas

Materiais de apoio para as aulas de eletromagnetismo: exercícios resolvidos,
roteiros de laboratório, relatórios e simulações interativas.

## Site interativo

O acervo está publicado em:

**https://atzingen.github.io/Eletromagnetismo-aulas/**

A navegação possui três áreas independentes:

- **Exercícios:** resoluções organizadas por referência e capítulo;
- **Experimentos:** roteiros avançados de Física III, com montagem,
  fundamentação e relatório acadêmico;
- **Simulações:** modelos interativos para explorar cargas, forças e vetores.

Equações, deduções e leituras dinâmicas são compostas com **MathJax 4.1.2**.
Os relatórios usam **Marked 18.0.7** para transformar o Markdown acadêmico em
HTML; os delimitadores LaTeX são preservados e então renderizados pelo MathJax.

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

Cada experimento possui três abas:

1. **Montagem**, com materiais, segurança, convenções e procedimento;
2. **Fundamentação**, com as deduções e os limites do modelo físico;
3. **Roteiro e relatório**, que integra dados brutos, tratamento, incertezas,
   discussão, conclusão, referências e anexos.

O conteúdo da terceira aba vem diretamente do arquivo editável `relatorio.md`
de cada experimento, evitando duas versões divergentes. O botão de impressão
ativa essa aba, aguarda o carregamento do Markdown e a composição das equações,
remove os controles de navegação e prepara um documento A4 de aproximadamente
seis a dez páginas.

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
