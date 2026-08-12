# Final fix report — geometria e acessibilidade

Data: 12 de agosto de 2026.

## Status

Os três findings Important da auditoria final foram corrigidos com ciclos TDD independentes. Os Minors registrados no ledger não foram tratados.

## 21.18 — raio comum de B e C

### RED

O teste dedicado foi ampliado antes da produção para exigir:

- `cPosition` explícita no modelo;
- `|AB| = |AC|` nos dois extremos medidos;
- `AB = AC` nas duas figuras fallback;
- C no extremo `+r` do SVG interativo;
- preservação da dedução `q_C/q_B = F_C/F_B ≈ 1,33`.

A primeira execução teve 5 sucessos e 3 falhas: ausência de `cPosition`, ausência dos marcadores geométricos do fallback e ausência da geometria física de C no DOM.

A inspeção Playwright mobile encontrou depois uma colisão real menor que 1 px entre os rótulos B e C. Um segundo RED específico observou separação SVG de apenas 36 unidades, abaixo das 48 exigidas para a fonte mobile.

### GREEN e matemática

- `forceSceneAt()` fixa C em `(1, 0)` e mantém B no locus unitário;
- no interativo, A está em `(380, 225)` e B/C em `(535, 225)`: `AB = AC = 155`;
- nos dois fallbacks, `AB = AC = 124`;
- B e C coincidem fisicamente na configuração de soma; C recebe apenas `translate(16px, -18px)` para leitura e o painel rotula explicitamente esse deslocamento como gráfico e esquemático;
- o afastamento extra do rótulo B atua somente próximo ao extremo positivo e preserva a associação nos demais quadros;
- `q_C/q_B = 1,3333140242...` permaneceu inalterado.

Resultado dedicado final: 8 testes aprovados, 0 falhas.

## 21.34 — forças do fallback

### RED

O novo teste lê as posições do elétron 2 e dos íons 3/4 e calcula os vetores a partir dos endpoints reais do SVG. O RED teve 5 sucessos e 1 falha: `F_3` apontava para cima, em direção incompatível com a repulsão causada pelo íon superior.

### GREEN

- `F_3 = (-129, +56)` no sistema SVG, portanto aponta para baixo e à esquerda, para longe do íon 3 superior;
- `F_4 = (-129, -56)`, portanto aponta para cima e à esquerda, para longe do íon 4 inferior;
- os rótulos acompanharam as setas;
- nenhum arquivo do interativo foi alterado.

Resultado dedicado final: 6 testes aprovados, 0 falhas.

## 21.42 — alvo real do range

### RED

O teste de integração deixou de procurar qualquer ocorrência global de `min-height: 44px`. Ele agora encontra a regra de cada seletor de controle e exige especificamente `min-height: 44px` em `.charged-pendulum__slider input`.

O RED teve 6 sucessos e 1 falha; a mensagem mostrou a regra real do range contendo apenas largura, cor de destaque e cursor.

### GREEN e medidas reais

- o input range recebeu `min-height: 44px`; o thumb nativo não foi ampliado;
- em viewport `390 × 844`, o bounding box medido foi `338,390625 × 44 px`;
- o elemento manteve semântica de slider, recebeu foco e `ArrowRight` alterou `5` para `5,5` sem avançar o roteiro nem iniciar reprodução;
- Reiniciar restaurou `5`;
- overflow horizontal: `0`;
- com reduced motion: `data-motion="reduced"`, reprodução desabilitada e range com 44 px.

Resultado da integração final: 7 testes aprovados, 0 falhas.

## Validação visual e navegador

- servidor isolado: `python -m http.server 8299 --bind 127.0.0.1 --directory site`;
- HTTP 200 confirmado em 21.18, 21.34 e 21.42;
- T3 preview abriu o 21.18 na porta 8299 e confirmou o painel montado;
- Playwright CLI usou Chrome real em desktop e mobile;
- 21.18 foi recapturado em `1440 × 1000` e `390 × 844`; as duas imagens foram inspecionadas, com `AB = AC`, offset esquemático explícito, vetores e rótulos sem colisão;
- 21.34 normal montou o controlador e o fallback corrigido ficou visível; com `app.js` bloqueado, o controlador não montou e o mesmo SVG permaneceu visível e geometricamente correto;
- 21.42 mediu o range, foco, teclado, reset, reduced motion e overflow sem substituir a evidência mobile existente do corpo livre;
- consoles normais finais: 0 mensagens, 0 erros e 0 avisos. No fallback bloqueado do 21.34 houve somente o 404 deliberado de `app.js`.

## Arquivos

- `site/exercicios/halliday-21-18/index.html`
- `site/exercicios/halliday-21-18/modelo.js`
- `site/exercicios/halliday-21-18/visualizacao.js`
- `site/exercicios/halliday-21-18/visualizacao.css`
- `site/testes/halliday-21-18-visualizacao.test.js`
- `site/exercicios/halliday-21-34/index.html`
- `site/testes/halliday-21-34-visualizacao.test.js`
- `site/exercicios/halliday-21-42/visualizacao.css`
- `site/testes/exercicios-geometria-integral-integracao.test.js`
- `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-18-desktop.png`
- `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/21-18-mobile-390x844.png`
- `docs/superpowers/evidence/2026-08-12-exercicios-geometria-integral/README.md`
- `.superpowers/sdd/2026-08-12-exercicios-geometria-integral/final-fix-report.md`

## Self-review

- mudanças limitadas aos três exercícios, testes dedicados, integração, capturas 21.18, manifesto e este relatório;
- nenhuma resposta científica, dependência, asset compartilhado, componente, núcleo, pacote ou catálogo foi alterado;
- nenhuma integral foi introduzida;
- o interativo do 21.34 e a evidência mobile do corpo livre do 21.42 foram preservados;
- os Minors do ledger continuam fora do escopo.

## Verificação final fresca

- testes dedicados 21.18/21.34/21.42: 20/20;
- integração geométrica: 7/7;
- shared Halliday: 5/5;
- `npm test`: 146/146, sem falhas, skips ou todos;
- `node --check`: `app.js`, `modelo.js` e `visualizacao.js` dos três exercícios, todos com exit code 0;
- HTTP na porta 8299: 200 nas três rotas;
- `git diff --check`: exit code 0.
