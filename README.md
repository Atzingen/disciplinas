# Eletromagnetismo — aulas

Materiais de apoio para as aulas de eletromagnetismo: resoluções comentadas,
exercícios, códigos e simulações interativas.

## Site interativo

O catálogo web reúne simuladores e resoluções em páginas separadas:

**https://atzingen.github.io/Eletromagnetismo-aulas/**

Para executar localmente:

~~~powershell
npm test
npm run serve
~~~

Depois, acesse http://127.0.0.1:8000/.

O arquivo **site/simuladores.json** registra os materiais do catálogo. Cada
nova aula deve ter uma pasta própria em **site/simuladores/** ou
**site/exercicios/** e uma entrada nesse arquivo.

## Organização dos arquivos-fonte

Os materiais são separados por tema, referência bibliográfica, capítulo e
exercício:

```text
tema/
└── referência/
    └── capítulo/
        └── exercício/
```

## Materiais disponíveis

- **Força Magnética — Halliday — Capítulo 21 — Exercício 13:**
  [resolução e simulação py5](<Força Magnética/Halliday/Capítulo 21/Exercício 13/README.md>);
- **Cargas e vetores:**
  [simulador web genérico](site/simuladores/cargas-e-vetores/);
- **Halliday — Capítulo 21 — Exercício 13:**
  [resolução e preset web](site/exercicios/halliday-21-13/).
- **Halliday — Capítulo 21 — Exercício 18:**
  [forças colineares e razão entre cargas](site/exercicios/halliday-21-18/).
- **Halliday — Capítulo 21 — Exercício 34:**
  [simetria, componentes e ângulos possíveis](site/exercicios/halliday-21-34/).
- **Halliday — Capítulo 21 — Exercício 42:**
  [pêndulos carregados e equilíbrio](site/exercicios/halliday-21-42/).

Cada pasta de exercício contém as instruções necessárias para executar seus
códigos e simulações.
