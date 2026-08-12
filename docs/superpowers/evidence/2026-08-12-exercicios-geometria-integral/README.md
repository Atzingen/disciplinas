# Evidências — exercícios de geometria integral

Data da integração: 12 de agosto de 2026.

| Exercício | Desktop | Mobile | Estado capturado |
|---|---|---|---|
| 21.13 | [`21-13-desktop.png`](./21-13-desktop.png) — 1440 × 1000 | [`21-13-mobile-390x844.png`](./21-13-mobile-390x844.png) — 390 × 844 | raiz de campo nulo em `x = −13,66 cm`, com campos iguais e opostos |
| 21.18 | [`21-18-desktop.png`](./21-18-desktop.png) — 1440 × 1000 | [`21-18-mobile-390x844.png`](./21-18-mobile-390x844.png) — 390 × 844 | passo 3, transferência de B pelo semicírculo, com referências de soma e diferença |
| 21.33 | [`21-33-desktop.png`](./21-33-desktop.png) — 1440 × 1000 | [`21-33-mobile-390x844.png`](./21-33-mobile-390x844.png) — 390 × 844 | prótons, carga positiva e fechamento por neutralidade |
| 21.34 | [`21-34-desktop.png`](./21-34-desktop.png) — 1440 × 1000 | [`21-34-mobile-390x844.png`](./21-34-mobile-390x844.png) — 390 × 844 | `n = 3`, `θ = 56,61°` e balanço vetorial horizontal |
| 21.42 | [`21-42-desktop.png`](./21-42-desktop.png) — 1440 × 1450 | [`21-42-mobile-390x844.png`](./21-42-mobile-390x844.png) — 390 × 844 | `x = 5,0 cm`, corpo livre, aproximação de pequeno ângulo e `q ≈ 24 nC` |

As dimensões acima foram lidas diretamente dos cabeçalhos dos arquivos PNG, e os dez arquivos foram inspecionados visualmente nesta integração.

## Validação cruzada observada

- Servidor: `python -m http.server 8199 --bind 127.0.0.1 --directory site`; a porta foi reservada para a integração, e o processo foi encerrado ao final.
- HTTP: as cinco rotas `halliday-21-13`, `halliday-21-18`, `halliday-21-33`, `halliday-21-34` e `halliday-21-42` responderam `200`.
- T3 preview: os cinco painéis abriram, permaneceram visíveis, expuseram um único root comum e os cinco controles, sem overflow global em 1440 × 1000.
- Playwright CLI: desktop 1440 × 1000 e mobile 390 × 844 foram exercitados nos cinco exercícios; reproduzir, pausar, reiniciar, próximo passo, velocidade e ativação por teclado responderam em todas as páginas.
- Controles preservados: o simulador livre de 21.13 e o explorador de substâncias de 21.33 permaneceram montados; o seletor `n = 3` de 21.34 e o slider de separação de 21.42 responderam ao teclado, e o reset de 21.42 restaurou `x = 5,0 cm`.
- Alvos e overflow: os controles comuns mediram no mínimo 44 px no mobile, e nenhuma das cinco páginas apresentou overflow horizontal global em desktop ou mobile.
- Movimento reduzido: os cinco roots expuseram `data-motion="reduced"`, bloquearam reprodução automática e mantiveram o avanço manual disponível.
- Console: `0` mensagens, `0` erros e `0` avisos na sessão final do Playwright CLI.
