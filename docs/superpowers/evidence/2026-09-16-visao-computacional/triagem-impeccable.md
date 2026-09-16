# Triagem do hook de design — capítulo 4

16/09/2026. Escopo: capítulo 4 e CSS local do tópico; sem mudança em base.css.

## Correções

- Texto sobre o laranja usa tinta escura neste tópico: contraste medido no navegador
  de 4,8717:1, nos temas claro/escuro e larguras 1440/390 px.
- Notas com borda uniforme de 1 px e respiro interno de 16 px; removida regra
  antiga duplicada de borda lateral dos notebooks. Saídas usam borda discreta.

## Exceções persistidas pelo CLI

Seis exceções em `.impeccable/config.json`, restritas ao HTML do capítulo 4:

- `overused-font=space grotesk`: fonte existente do portal, preservada.
- `hero-eyebrow-chip`: identificação curricular acompanha os demais tópicos.
- `codex-grid-background`: fundo herdado do portal de física.
- `flat-type-hierarchy`: falso positivo; navegador mediu h2 24,48 px,
  h3 19,0944 px e corpo 16,32 px, não três papéis de 16,3 px.
- `cramped-padding`: o alerta refere-se à barra estrutural com divisor inferior;
  o conteúdo tem afastamento da janela de 30 px desktop/16 px mobile e os
  controles têm seu próprio padding, conforme conferência visual.
- `side-tab`: após as correções locais, os seletores remanescentes são
  `.area-card`, `.report-template-promo` e `.discipline-card`, ausentes do DOM.

## Verificação

- Detector final do capítulo: `[]`, considerando as exceções acima.
- 5 testes do tópico aprovados; `git diff --check` sem erros.
- Conferência conjunta em desktop/mobile e claro/escuro, sem transbordamento.
- Nenhuma regra global ou arquivo inteiro foi ignorado.
