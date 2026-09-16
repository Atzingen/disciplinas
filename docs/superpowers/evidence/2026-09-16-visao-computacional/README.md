# Verificação — tópico de visão computacional

Data: 16/09/2026. Base do portal: `70daab6`.

## Escopo entregue

- Um tópico de PRCCOMP, com páginas de capítulos e navegação anterior/próximo.
- Capítulos 1–3 incorporados: teoria revisada, nove scripts de 15–50 linhas,
  três demonstrações interativas, três vídeos, CSV real e gráfico de ajuste.
- Quatro notebooks executados e suas leituras HTML com resultados e imagens embutidas.
- Capítulo 4 ampliado após o retorno do professor: teoria, scripts 09–14,
  imagens reais de detecção/segmentação, caso de formigas e embarcados.
  Inferência YOLO validada em CPU; hardware não executado nesta máquina.

## Verificações executadas

- Baseline: `npm test`, 248 aprovados.
- Primeira incorporação: `npm test`, 252 aprovados, zero falhas.
- Revisão com conteúdo incorporado e cards: `npm test`, 253 aprovados, zero falhas.
- `git diff --check`: sem erros.
- AST Python: nove scripts e todas as células Python dos quatro notebooks válidos.
- Notebooks: 9/14/10/12 células de código executadas em kernels novos, zero
  saídas de erro, `nbformat.validate` aprovado. HTMLs exportados com nbconvert.
- Vídeos e imagens originais: hashes SHA-256 iguais à origem.
- Rastreamento completo do vídeo da trena e ajuste do CSV com os scripts entregues.
- Smoke de processamento OpenCV com imagens/vídeo reais, substituindo apenas
  janelas/teclado por verificações sem interface. Não valida webcam física.
- Navegador: catálogo da disciplina encontra o tópico; links locais e downloads
  resolvem; páginas verificadas em 320, 390 e 1280 px. Equação longa do capítulo
  3 foi separada em duas linhas para evitar transbordamento em 320 px.
- Canais R/B mudam a grade; slider HSV muda cobertura de 3,5% para 0,0%; kernel
  identidade preserva pixels e tons de cinza. Teclado e toque acionam a conta.
- Tema escuro verificado; imagens e leitura HTML dos notebooks inspecionadas.

## Resultados de execução

| Experimento | Resultado |
|---|---|
| Rastreamento | 3.379 posições / 3.379 quadros; FPS declarado 30,303030 |
| Ajuste, L = 0,83 m | T ≈ 1,8072 s; τ ≈ 109,3 s; g ≈ 10,033 m/s²; desvio dos resíduos ≈ 10 px |
| MNIST densa | 91,88% no teste; 3 épocas; 50.890 parâmetros |
| MNIST CNN | 96,25% no mesmo teste; 3 épocas; 30.762 parâmetros |
| Fashion-MNIST CNN | 79,31% no teste; 3 épocas |
| Cães/gatos CNN | 65,00% no teste; 4 épocas |

MNIST e Fashion: 12.000 treino / 2.000 validação / 10.000 teste.
Cães/gatos: 1.598 treino / 400 validação / 1.000 teste; arquivo inválido excluído
antes da divisão. O notebook usa a fonte Microsoft confirmada acessível:
primeiro download de aproximadamente 825 MB, fora do repositório.

Ambiente dos notebooks: Python 3.12.12, TensorFlow 2.21.0, NumPy 2.2.6,
Matplotlib 3.11.1; execução em CPU. Sementes fixas não eliminam diferenças
numéricas entre plataformas. As métricas descrevem uma execução didática.

## Revisão

A revisão independente solicitou três correções, incorporadas:

1. Escala visual da convolução: identidade/média mantêm a mesma escala da
   entrada; Sobel explicita módulo normalizado, preservando números assinados.
2. Um gráfico simples da trajetória antecede a escolha do período inicial,
   sem depender do sucesso do ajuste não linear.
3. O caminho de cães/gatos aceita tanto o ZIP retornado pelo Keras antigo
   quanto a pasta retornada pelo atual. Célula validada novamente com cache
   real e com retorno ZIP simulado; treinamento inalterado não foi repetido.

Os resultados do pêndulo dependem da calibração espacial/temporal e do modelo;
nenhuma mudança de FPS foi apresentada como correção comprovada. Hailo/OAK-D
não foram executados em hardware nesta rodada. Publicação e commit não fazem
parte desta entrega local.

## Revisão de navegação e conteúdo na própria página

Após o retorno do professor:

- Sumário com quatro cards inteiramente clicáveis e ação “Abrir capítulo”.
- Cards de seções dentro dos capítulos, com navegação por âncoras.
- Código principal visível e os quatro notebooks incorporados ao capítulo 3:
  45 células, 15 figuras locais e saídas da execução. Download permanece opcional.
- Gerador em `scripts/visao/renderizar-notebooks.py`; leitura conferida contra
  os notebooks, incluindo identidade byte a byte das figuras.
- Navbar corrigida: a regra de margem de `details` agora se limita ao conteúdo
  da aula. Antes, “Disciplinas” estava 16 px abaixo dos demais links; depois,
  os cinco controles tiveram o mesmo topo em 1440 px. Menu e Escape verificados.
- Cards verificados em 1440, 390 e 320 px, temas claro e escuro; navegação por
  clique até capítulo e seção confirmada. Figuras têm dimensões reservadas
  para evitar saltos de layout durante o carregamento.

Capturas desta revisão: `cards-desktop.png`, `cards-mobile.png`,
`navbar-corrigida.png` e `notebook-na-pagina.png`.

### Capítulo 4 incorporado

Relatório dos comandos, fontes e resultados em `capitulo4-execucao.md`.
Scripts 09–14 estão integralmente na página. A detecção da cena de ônibus
produziu cinco caixas; a segmentação produziu seis máscaras. O smoke de
tracking percorreu dez quadros reais do pêndulo e mostrou falsos positivos
de semáforo, sem trajetória útil para a bolinha.

A revisão corrigiu saída normal sem máscara (status 0), ordem dos canais
Picamera2, escolha explícita RGB/BGR no HEF e filas bloqueantes para parear
quadros/resultados da OAK-D. Não houve execução física dos embarcados.
O capítulo 4 também passou pela conferência em 1440, 390 e 320 px, sem
transbordamento; captura em `capitulo4-mobile.png`.
