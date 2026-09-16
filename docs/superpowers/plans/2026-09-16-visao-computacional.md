# Visão computacional — organização e plano de conteúdo

**Data:** 16/09/2026.
**Objetivo:** acrescentar um único tópico em PRCCOMP, com quatro capítulos, teoria em português e exemplos pequenos que o aluno consiga ler e modificar.
**Estado:** incorporados os quatro capítulos, cards de capítulos/seções, correção da navbar e conteúdo dos notebooks nas páginas. Inferência YOLO executada em CPU; práticas físicas de embarcados e ativos ausentes de formigas permanecem sem validação. Sem commit ou publicação. Evidências em `docs/superpowers/evidence/2026-09-16-visao-computacional/README.md`.
**Escopo solicitado:** revisar e incorporar os capítulos 1–3; planejar o capítulo 4 inicialmente e, após o retorno do professor, incorporar também seu conteúdo e tornar a navegação explícita com cards. Publicação não foi solicitada.
**Referência de requisitos:** orientação do professor nesta conversa, incluindo a separação em quatro capítulos e a prioridade à clareza do código.

## 1. Organização no portal

Hierarquia proposta:

```text
Física Computacional
└── Tópico 02 — Visão computacional
    ├── 1. Fundamentos de imagem
    ├── 2. Vídeo como instrumento de medida
    ├── 3. Convolução e redes neurais
    └── 4. Detecção e segmentação
```

Manter um único registro em `site/materiais.json`, com `kind: "topico"`,
`section: "topicos"` e `disciplines: ["PRCCOMP"]`. Os capítulos são páginas
internas desse tópico; não exigem novo tipo de catálogo nem alterações nas
outras disciplinas. Cada capítulo apresenta subitens na própria página, sem
acrescentar outro nível de páginas para cada script.

Cada página terá contexto, objetivo, teoria, exemplo, pergunta de exploração,
downloads e referências. Breadcrumbs levam de volta ao tópico e à disciplina;
anterior/próximo ligam os capítulos. Reutilizar estilos, tema e navegação do
portal. As demonstrações interativas existentes devem acompanhar a teoria.

### Fonte principal dos materiais

Recomendação: as versões didáticas incorporadas passam a ser mantidas em
`disciplinas`, com procedência por arquivo e commit. O repositório anterior
permanece preservado como origem, sem sincronização automática entre cópias.
Isso permite revisar os textos e simplificar os exemplos sem quebrar o acervo
antigo. Não arquivar, apagar ou alterar o repositório de origem nesta tarefa.

Alternativa: somente vincular os arquivos externos. Evita cópia inicial, mas
separa explicação e código em duas fontes que podem divergir. Copiar todo o
acervo antigo sem seleção também não atende ao objetivo de concisão.

## 2. Revisão das fontes

| Fonte e versão consultada | Evidência | Decisão proposta |
|---|---|---|
| `visao-computacional-fisica`, `d016783` | 9 scripts, páginas de princípios, notebook 10, imagens e vídeos | Base principal dos quatro capítulos |
| `Palestra-SAMBA2022-CNN`, `8de6ce1` | `Imagens_e_convoluções.ipynb`: imagem, filtro de cor, kernels e CNN MNIST | Aproveitar explicações/visualizações; não duplicar outra CNN MNIST equivalente |
| `Webinar-Vis-o-computacional-Embarcada`, `533d5b9` | `convolution.ipynb` e `CNN.ipynb`; scripts de câmera, YOLO e treinamento | Convolução 1D/2D, kernels aprendidos e referência para capítulo 4 |
| `IA-FIC-IFSP`, `379573c` | `Aula_08/01_V2_mnist_CNN.ipynb` contém rede densa e CNN; `Aula_12/segment_SAM.ipynb` contém SAM | Base para comparação controlada MNIST; SAM como extensão curta |
| `rastreador-pendulo`, `cd16f21` | Processamento/calibração e vídeos; interfaces antigas | Recuperar procedência; não duplicar as interfaces ou o pipeline já refeito |
| `formigas`, `5713c08` | `rastreio.py`, `run_croped.py`, preparação de dataset | Estudo de detecção/rastreamento no capítulo 4, condicionado a recuperar os ativos |

Links das fontes:

- https://github.com/Atzingen/visao-computacional-fisica
- https://github.com/Atzingen/Palestra-SAMBA2022-CNN
- https://github.com/Atzingen/Webinar-Vis-o-computacional-Embarcada
- https://github.com/Atzingen/IA-FIC-IFSP
- https://github.com/Atzingen/rastreador-pendulo
- https://github.com/Atzingen/formigas

O notebook 10 recente já integra parte das fontes SAMBA, webinar e FIC.
A comparação local/remota mostrou apenas mudança no nome de exibição do
kernel, com código e saídas iguais, além de checkpoints locais não versionados.
Preservar esse estado no repositório de origem.

Não foram encontrados exemplos de Fashion-MNIST ou cães/gatos nos notebooks
inspecionados dessas fontes. São acréscimos a preparar e verificar, não conteúdo
pronto a anunciar. A busca não representa uma varredura integral do computador.

## 3. Capítulo 1 — Fundamentos de imagem

### Aproveitar

1. **Imagem como matriz:** pixels, recortes e canais; script 01 e grade interativa.
2. **Captura:** abrir uma fonte, ler quadro, exibir e encerrar; script 02.
3. **Movimento:** diferença entre quadros e limiar; script 03.
4. **Cor:** RGB/BGR, HSV e máscara binária; script 04 e sliders interativos.
5. **Da máscara à posição:** contornos e centro da bolinha; script 05.

### Revisar e completar

- Explicar `shape`, índices `[linha, coluna]` e coordenadas `(x, y)` com uma
  matriz pequena. Mostrar que a origem da imagem está no canto superior esquerdo.
- Relacionar `uint8`, intervalo 0–255 e a necessidade de evitar subtração com
  estouro; usar `cv2.absdiff` no exemplo de movimento.
- Demonstrar a troca BGR/RGB ao exibir imagens com Matplotlib.
- Separar o conceito de máscara do de imagem colorida e apresentar falsos
  positivos de uma máscara de cor.
- Introduzir área mínima e ruído a partir de um caso concreto; morfologia apenas
  se o exemplo demonstrar a necessidade, com antes/depois.
- Deixar Hough como comparação curta após contornos. Não começar com um script
  que mistura dois detectores, contadores de desempenho e vários painéis.

**Resultado para o aluno:** localizar a bolinha e explicar como cada operação
transformou a imagem. A captura mais simples terá somente o laço essencial e
verificações de abertura/leitura, seguindo a API oficial do OpenCV.

## 4. Capítulo 2 — Vídeo como instrumento de medida

### Aproveitar

- Rastreamento e exportação de `t_s,x_px,y_px` do script 06.
- Vídeos `pendulo_livre.mp4`, `pendulo_trena.mp4` e
  `pendulo_trena_vertical.mp4`, com descrição do que comparar em cada um.
- Modelo de oscilação amortecida e cálculo de g do script 07.
- Procedência do `rastreador-pendulo`; a sequência recente já cobre sua função
  principal, dispensando a incorporação das GUIs Qt/Gooey.

### Simplificação proposta

Separar duas perguntas em dois exemplos:

1. **Como medir posição ao longo do vídeo?** Ler quadros, detectar centro,
   guardar tempo e posição, salvar CSV; visualizar o resultado com um gráfico.
2. **Como obter período e g desses dados?** Abrir o CSV, mostrar x(t), ajustar
   o modelo e calcular `g = 4π²L/T²`, com comprimento medido explicitamente.

O script atual de ajuste tem 143 linhas e também rastreia vídeo, interpreta
argumentos, estima o pivô, altera FPS e recorta intervalos. Não transportar todas
essas responsabilidades para o primeiro contato. O ajuste geométrico do círculo
fica numa seção complementar, sem ser pré-requisito para medir o período.

### Teoria que precisa de revisão

- `t = quadro/fps` pressupõe taxa constante. Arquivos podem conter timestamps;
  a afirmação de que vídeo não tem relógio por quadro é excessiva. Webcam exige
  distinguir instante de aquisição de tempo gasto no processamento.
- Não remover o avanço do tempo quando a detecção falha. FFT pressupõe amostras
  regulares; tratar lacunas ou estimar o período por outro caminho antes do ajuste.
- Comparar 30 e 30,303 FPS como análise de sensibilidade. O valor de g mais perto
  da referência não comprova a taxa real do vídeo nem a causa da diferença.
- Explicar comprimento até o centro de massa, câmera perpendicular e escala no
  plano do movimento; discutir perspectiva e resolução espacial.
- Delimitar a aproximação de pequenos ângulos e o efeito de um segundo impulso.
- Mostrar resíduos e distinguir erro sistemático, dispersão e incerteza.
  Para incertezas independentes, apresentar
  `σg/g ≈ sqrt((σL/L)² + (2σT/T)²)` e separar as limitações do modelo.

**Resultado para o aluno:** obter uma série temporal, estimar o período e
argumentar sobre a confiabilidade de g, sem tratar ajuste visual como prova.

## 5. Capítulo 3 — Convolução e redes neurais

YOLO sai deste capítulo e entra no 4. A numeração antiga é procedência, não uma
restrição para a ordem didática nova.

### 3.1 Convolução antes da rede

Reaproveitar o script 09, as demonstrações e a parte inicial do notebook 10:
convolução 1D, janela 2D, suavização, Sobel e visualização dos kernels.
Usar o SAMBA e o webinar para complementar o que estiver faltando, sem repetir
os mesmos exemplos em três notebooks. Explicar stride, padding, canais e o
tamanho da saída com um exemplo numérico. Distinguir convolução matemática,
com inversão do kernel, da correlação usada por operações de imagem/CNN.

### 3.2 MNIST — rede densa versus CNN

Um notebook compara, lado a lado:

- **Rede densa:** entrada 28×28, Flatten, Dense pequena e saída de 10 classes.
- **CNN:** mesma base e partições; Conv2D, pooling e saída de 10 classes.

Usar mesmos exemplos de treino/validação/teste, normalização, semente e orçamento
de épocas; explicitar diferenças de capacidade pelo número de parâmetros.
Mostrar acurácia e perda, exemplos de acerto/erro e mapas de ativação.
Não prometer que a CNN vence em toda execução. Não usar teste como validação.

### 3.3 Fashion-MNIST — CNN

Notebook curto reutilizando a arquitetura pequena, com imagens de roupas.
Explicar classes, confusões entre peças parecidas e a diferença de dificuldade
em relação aos dígitos. Manter treino, validação e teste separados. Evitar
reexplicar instalação e treinamento do zero em várias páginas.

### 3.4 Cães e gatos — CNN em imagens RGB

Notebook próprio: carregar imagens, redimensionar, normalizar, treinar uma CNN
pequena e mostrar previsões. Explicar três canais e classificação binária
(`sigmoid`/entropia cruzada binária) em contraste com as 10 classes anteriores.

Usar fonte pública documentada, separação fixa entre treino/validação/teste e
um subconjunto equilibrado adequado à demonstração. Validar imagens e remover
arquivos inválidos na preparação, mantendo o exemplo central legível. Evitar
misturar transferência de aprendizado, arquiteturas grandes, dashboards e
callbacks avançados no primeiro exemplo. Se aumentar dados, aplicar apenas no
treino e apresentar como experiência adicional motivada por overfitting.

**Lacunas principais:** significado de neurônio/peso/bias, ativação, perda,
gradiente e atualização dos pesos; época versus lote; classificação versus
regressão; diferença entre aprender e memorizar; parâmetros compartilhados
na CNN; limites da interpretação dos kernels.

**Conjunto proposto:** quatro notebooks independentes — convolução, comparação
MNIST, Fashion-MNIST e cães/gatos. Células pequenas com texto entre elas.

## 6. Plano do capítulo 4 — Detecção e segmentação

**Atualização após incorporação:** a página agora contém a aula, scripts 09–14
e resultados reais de YOLO em imagem. O plano abaixo registra a sequência
original; SAM permanece extensão conceitual, e formigas depende dos ativos
originais ausentes. Picamera2/Hailo/OAK-D têm código e contratos explicados,
mas execução física ainda precisa do hardware.

### 4.1 O que muda em relação à classificação

Mostrar uma mesma cena em três representações: rótulo global, caixas e máscaras.
Explicar classificação, detecção, segmentação semântica, segmentação por
instância e rastreamento. Cada instância tem sua própria máscara; rastreamento
acrescenta associação entre quadros, não substitui o detector.

**Material:** diagrama simples, uma imagem de referência e perguntas sobre
quais medições cada representação permite.

### 4.2 Bounding boxes com YOLO

Começar por imagem estática. Carregar modelo pré-treinado, inferir, mostrar
caixas e ler classe, confiança e coordenadas `x1,y1,x2,y2` com nomes explícitos.
Depois repetir no vídeo usando o laço de captura já conhecido.

**Fonte:** `08_yolo_track.py` recente e exemplos do webinar. Separar detecção
de tracking no primeiro exemplo. Manter YOLO11 como referência do acervo e
confirmar a versão instalada na execução, sem migrar de geração por novidade.

**Teoria:** classes conhecidas, limiar de confiança, falsos positivos/negativos,
IoU e a ideia de supressão de caixas duplicadas no modelo escolhido. Mostrar
um caso de erro; confiança não é garantia de acerto.

### 4.3 Rastreamento — pêndulo e formigas

Primeiro usar a bolinha do capítulo 2 para comparar cor e detector aprendido.
Depois usar o caso das formigas para introduzir vários objetos e IDs persistentes.
Exemplo mínimo: modelo, vídeo, `track(..., persist=True)`, IDs e exibição. Só
acrescentar histórico de posições depois de explicar identificação entre quadros.

**Achados em `formigas`:**

- `rastreio.py` requer `models/best.pt` e `datasets/videos_raw/ants.mp4`.
- `run_croped.py` requer outro vídeo, `models/last.pt` e pontos de recorte.
- `datasets/`, `models/` e `runs/` não acompanham o GitHub; o README manda obtê-los
  separadamente. Esses ativos não foram localizados na busca local focalizada.
- Os limiares extremamente baixos presentes nos scripts devem ser reavaliados
  com exemplos reais; não apresentar esses valores como configuração recomendada.

**Dependência para um exemplo executável:** recuperar um vídeo curto e os pesos
compatíveis ou preparar um novo conjunto/modelo. O capítulo deve funcionar com
o exemplo geral independentemente disso. Não afirmar que o modelo COCO reconhece
formigas nem apresentar caixas de formigas como segmentação. Separar sequências
de vídeo entre treino e teste, evitando quadros vizinhos nos dois conjuntos.

### 4.4 Segmentação por instância

Repetir a imagem estática com um modelo YOLO de segmentação; comparar caixa e
máscara do mesmo objeto. Extrair uma máscara, contar pixels e mostrar a região
coberta. Usar `result.masks`, tratar ausência de detecções e conferir a escala
da máscara em relação à imagem antes de medir áreas.

**Teoria:** máscara binária, instâncias sobrepostas, IoU de máscaras e por que
área em pixels só vira área física com calibração e hipóteses geométricas.
O checkpoint de detecção de formigas não fornece máscaras por si só: esse caso
precisa de anotações/modelo de segmentação próprios para entrar aqui.

### 4.5 Extensão curta — segmentar por indicação

Aproveitar o conceito do SAM presente na aula 12 do FIC: ponto ou caixa indicando
o objeto e máscara resultante. Usar coordenadas explícitas e uma imagem fixa;
evitar transportar os callbacks de mouse, interfaces e autenticação do notebook
original para a introdução. SAM fica como comparação opcional após YOLO-seg.

### 4.6 Visão computacional embarcada

Acrescentado por solicitação do professor em 16/09/2026.

1. **Raspberry Pi e câmera:** captura via Picamera2 e uma operação de imagem;
   comparar com o laço OpenCV do computador. Identificar CPU, câmera e memória.
2. **Raspberry Pi + Hailo:** inferência na NPU, baseada em `hailo_preview.py` do
   Embarcados Experience 2024. Preparação do modelo HEF e dos rótulos separada
   do exemplo de aula; conferir redimensionamento e ordem de canais.
3. **OAK-D:** captura e inferência no dispositivo a partir de
   `07-oak-d-hello.py` e `08-oak-d-yolo.py` do webinar. Os exemplos usam a API
   DepthAI da época e modelos BLOB; verificar SDK e hardware antes de adaptar.
4. **Experimento de desempenho:** mesma cena, resolução/modelo registrados,
   latência e FPS medidos separadamente. Filas, quantização, processamento
   local e transferência para o host explicados a partir do experimento.

Teoria adicional: treinamento versus inferência, CPU/GPU/NPU, quantização e
formatos de modelos, pré/pós-processamento, coordenadas após resize,
consumo/memória como limites do dispositivo. Evitar números de desempenho
sem medição real. Não incorporar callbacks, futuros e renderização extensa
no exemplo central: instalação e compilação ficam num guia de preparação.

Antes de publicar scripts de hardware, verificar placa, câmera, SDK, pesos
compilados e uma execução real. Sem equipamento disponível, a página fica
como roteiro e referência, sem alegação de validação em Hailo/OAK-D.

Fontes: [Embarcados Experience 2024](https://github.com/Atzingen/VisaoComputacionalEmbarcada-2024),
[Webinar](https://github.com/Atzingen/Webinar-Vis-o-computacional-Embarcada),
[Raspberry Pi](https://www.raspberrypi.com/documentation/accessories/ai-kit.html) e
[Luxonis](https://docs.luxonis.com/).

### Entregáveis e aceite do capítulo 4

- [x] Página com roteiro de detecção, rastreamento, segmentação/SAM, formigas e embarcados.
- [x] Práticas YOLO e comparação visual entre caixa e máscara com saídas reais.
- [x] Exemplo independente de detecção em imagem; inferência CPU executada.
- [x] Exemplo independente de rastreamento em vídeo; validação técnica descrita nas evidências.
- [x] Exemplo independente de segmentação em imagem; inferência CPU executada.
- [ ] Exemplo de formigas somente após vídeo/pesos disponíveis e verificados.
- [ ] Extensão SAM curta, com entrada fixa e sem interface gráfica própria.
- [ ] Cada exemplo inclui entrada acessível, dependências, saída observável e
  uma pergunta de exploração; ausência de detecção não encerra com exceção.
- [ ] Predições e limitações mostradas vêm de execução real; não inventar
  bounding boxes, máscaras, métricas ou identidades preservadas.

## 7. Regras para código de aluno

- Um objetivo por script; fluxo de cima para baixo, nomes descritivos e operações
  separadas em linhas quando isso ajuda a leitura.
- Poucas constantes editáveis no início. Usar função somente para uma operação
  que o aluno reconheça; incluir tipos nas funções novas.
- Não criar classes de aplicação, registradores, configuração genérica, menus,
  logs extensos ou camadas de abstração para esconder o algoritmo.
- Não comprimir loops, transformações e condições em uma linha difícil.
- Evitar imports desnecessários e duplicação de bibliotecas de visualização.
- Manter verificações indispensáveis: câmera/arquivo abriu, quadro foi lido,
  imagem existe, detecção retornou algo; liberar captura ao terminar.
- Texto teórico fica na página ou em células Markdown. Comentários explicam
  decisões não óbvias; não transformar scripts em apostilas de 300 linhas.
- O número de linhas é um sinal de revisão, não uma meta a atingir com compressão.
- Dependências por percurso: OpenCV/NumPy no início; SciPy/Matplotlib na análise;
  TensorFlow nos notebooks; Ultralytics no capítulo 4. Não obrigar instalar todos
  os frameworks para executar uma captura de webcam.
- Webcam e `cv2.imshow` são apresentados como execução local. Colab é uma opção
  para notebooks; não anunciar suporte à câmera local sem implementação específica.

## 8. Mapa de arquivos proposto

```text
site/topicos/02-visao-computacional/
├── index.html
├── 01-fundamentos/index.html
├── 02-video-medida/index.html
├── 03-convolucao-redes/index.html
├── 04-deteccao-segmentacao/index.html  [teoria, código e resultados YOLO]
├── scripts/                          [exemplos curtos por conceito]
├── notebooks/
│   ├── 01-convolucao.ipynb
│   ├── 02-mnist-densa-cnn.ipynb
│   ├── 03-fashion-mnist.ipynb
│   └── 04-caes-gatos.ipynb
├── imagens/
├── videos/                           [os três vídeos pequenos existentes]
├── dados/                            [CSV de demonstração com procedência]
└── README.md                         [preparo, dependências e procedência]
```

Alterações de integração: `site/materiais.json`,
`site/disciplinas/prccomp/index.html` e `README.md`.
Estilos específicos ficam no tópico; não alterar o visual global sem necessidade.
Não versionar ambientes, caches, pesos de modelos, datasets de treinamento ou
saídas volumosas. Downloads grandes ficam fora do site e seguem o armazenamento
da máquina; registrar origem e instruções.

Os quatro capítulos estão incorporados com código e conteúdo local. YOLO
foi executado em CPU; a validação física de embarcados e a recuperação dos
ativos do experimento de formigas continuam separadas dessa entrega.

## 9. Sequência de execução e verificações

- [x] Incorporar os quatro capítulos conforme esclarecimento posterior, incluindo embarcados.
- [x] Registrar versões de origem e selecionar arquivos, preservando o checkout antigo.
- [x] Incorporar capítulo 1 com suas demonstrações e exemplos revisados.
- [x] Incorporar capítulo 2 separando rastreamento e análise; gerar CSV de referência
  a partir de um vídeo conhecido e conferir tempo, unidades e ajuste.
- [x] Preparar capítulo 3 e os quatro notebooks; executar do primeiro ao último
  bloco em kernel novo. Separar validação técnica reduzida do treino didático;
  somente resultados medidos podem aparecer como resultados da aula.
- [x] Integrar sumário, catálogo e navegação; revisar links relativos e downloads.
- [x] Executar `npm test` e `git diff --check`. Acrescentar verificações focadas
  no novo caminho de navegação e nos arquivos referenciados, sem testes que
  apenas copiem frases do conteúdo.
- [x] Verificar no navegador em desktop e celular, tema claro/escuro, navegação
  por teclado, demonstrações, equações e blocos de código sem quebrar a página.
- [ ] Conferir webcam/janelas em bancada. Processamento de arquivos verificado sem interface; isso não comprova captura física em aula.
- [x] Incorporar conteúdo do capítulo 4, inferência YOLO em CPU e scripts de embarcados com requisitos explícitos.

Não há commit, push ou publicação incluídos na elaboração deste plano.

## 10. Referências primárias consultadas

- OpenCV — captura: https://docs.opencv.org/4.x/dd/d43/tutorial_py_video_display.html
- OpenCV — filtros: https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html
- TensorFlow — rede densa/MNIST: https://www.tensorflow.org/tutorials/quickstart/beginner
- TensorFlow — Fashion-MNIST: https://www.tensorflow.org/tutorials/keras/classification
- Keras — CNN MNIST: https://keras.io/examples/vision/mnist_convnet/
- Keras — cães/gatos: https://keras.io/examples/vision/image_classification_from_scratch/
- Ultralytics — rastreamento: https://docs.ultralytics.com/modes/track/
- Ultralytics — segmentação: https://docs.ultralytics.com/tasks/segment/

As referências sustentam APIs e escolhas de exemplos. O plano propõe uma
adaptação didática; não copiar integralmente aplicações ou treinamentos mais
complexos dessas páginas.
