# Vídeo, reconhecimento e gráfico sincronizados

A seção 2.1 apresenta três painéis: vídeo original, centro reconhecido e gráfico x(t). Os controles nativos de reprodução, pausa e busca no tempo governam os três. Em telas estreitas os painéis ficam empilhados.

A visualização usa as 3379 posições reais de `dados/pendulo_trena.csv`, extraídas pelo script 06. Não executa um novo reconhecimento no navegador. A marcação indica o centro; seu tamanho fixo não representa o raio medido. O gráfico mostra os últimos dez segundos e mantém escala vertical fixa para preservar a leitura do amortecimento. Os scripts Python dos alunos não foram ampliados.

## Verificação

- `npm test`: 255 testes passaram, zero falhas.
- Testes de seleção temporal cobrem os 3379 instantes reais, ausência de amostras, intervalos e retorno no tempo.
- Navegador: buscas em 5, 25, 2, 0, 111,4 e 8 segundos selecionaram respectivamente as amostras 151, 757, 60, 0, 3375 e 242.
- Reprodução avançou até a amostra 281; após pausa, permaneceu na mesma amostra.
- Layout conferido em 1440, 390 e 320 pixels, sem transbordamento horizontal.
- Capturas: `video-medida-desktop.png` e `video-medida-mobile.png`.
- `git diff --check`: sem erros.

## Prévia local

O servidor anterior não suportava requisições de intervalo e impedia a busca no vídeo. A prévia em 127.0.0.1:8017 agora usa RangeHTTPServer 1.4.0, no serviço de usuário `disciplinas-visao-preview-range.service`. Verificado HTTP 206 com Content-Range e Accept-Ranges. Instruções de execução estão no README do tópico. Não houve publicação remota.

## Inspeção visual

A nova visualização não apresentou defeitos de layout. Os alertas do detector para esta página referem-se ao padrão existente do portal (fonte, identificação curricular e fundo quadriculado), à barra de navegação já corrigida, a seletores globais sem elementos presentes (.area-card, .report-template-promo, .discipline-card) e à leitura incorreta dos tamanhos tipográficos: h2 real 24,48 px versus corpo 16,32 px. Nenhuma exceção adicional foi criada nesta alteração.
