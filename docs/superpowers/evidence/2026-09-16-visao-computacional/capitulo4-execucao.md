# Capítulo 4 — relatório de execução

Data: 2026-09-16

## Arquivos entregues

- `site/topicos/02-visao-computacional/04-deteccao-segmentacao/index.html`
- `site/topicos/02-visao-computacional/requirements-deteccao.txt`
- `site/topicos/02-visao-computacional/scripts/09_yolo_imagem.py`
- `site/topicos/02-visao-computacional/scripts/10_yolo_tracking.py`
- `site/topicos/02-visao-computacional/scripts/11_yolo_segmentacao.py`
- `site/topicos/02-visao-computacional/scripts/12_picamera_opencv.py`
- `site/topicos/02-visao-computacional/scripts/13_hailo_hef.py`
- `site/topicos/02-visao-computacional/scripts/14_oakd_blob.py`
- `site/topicos/02-visao-computacional/imagens/deteccao-entrada.jpg`
- `site/topicos/02-visao-computacional/imagens/deteccao-resultado.jpg`
- `site/topicos/02-visao-computacional/imagens/deteccao-bolinha-limite.jpg`
- `site/topicos/02-visao-computacional/imagens/segmentacao-resultado.jpg`

A página contém a teoria, resultados e o código integral dos scripts 09–14. Os links são downloads locais auxiliares. Não houve commit.

## Fontes usadas

### Acervo local

- `visao-computacional-fisica`, commit `d016783`: base recente de YOLO/tracking.
- `formigas`, commit `5713c08`: `rastreio.py` e `run_croped.py`.
- `VisaoComputacionalEmbarcada-2024`, commit `f622170`: Picamera2/Hailo.
- `Webinar-Vis-o-computacional-Embarcada`, commit `533d5b9`: OAK-D/DepthAI v2.

### Fontes oficiais atuais

- Ultralytics: Predict, Track e Segment.
- Raspberry Pi: manual Picamera2 e exemplo oficial `examples/hailo/detect.py`.
- Hailo: exemplos oficiais de aplicação.
- Luxonis: `DetectionNetwork` v3 e exemplo legado Tiny YOLO v2.
- Imagem de demonstração: `https://ultralytics.com/images/bus.jpg`.

## Execuções reais

Ambiente: `/home/gustavo/Desktop/dev/visao-computacional-fisica/.venv/bin/python`, Ultralytics 8.4.136, OpenCV 4.12.0 e CPU explícita. Pesos mantidos fora do repositório em `~/.cache/disciplinas/`.

### Detecção

Comando: `python scripts/09_yolo_imagem.py`.

Resultado em `bus.jpg`, YOLO11n, `conf=0.25`:

- bus 0,940, caixa `(4, 229, 796, 728)`;
- person 0,888, caixa `(671, 395, 810, 879)`;
- person 0,878, caixa `(47, 400, 239, 904)`;
- person 0,856, caixa `(223, 409, 344, 860)`;
- person 0,622, caixa `(0, 556, 69, 872)`.

No quadro `frame_bolinha.png`, o mesmo modelo retornou zero detecções. A página usa esse resultado para explicar que o modelo COCO genérico não garante bolinha ou formiga.

### Segmentação

Comando: `python scripts/11_yolo_segmentacao.py`.

Resultado em `bus.jpg`, YOLO11n-seg, `conf=0.25`, `retina_masks=True`:

- bus: 0,899 e 262.715 px²;
- person: 0,885 e 21.955 px²;
- person: 0,863 e 50.394 px²;
- person: 0,822 e 35.075 px²;
- stop sign: 0,461 e 1.879 px²;
- person: 0,443 e 11.276 px².

O caminho sem máscaras foi simulado com resultado Ultralytics vazio e terminou com status 0, imprimindo a ausência normalmente.

### Tracking

Foi feito smoke real sem janela sobre os dez primeiros quadros de `videos/pendulo_trena.mp4`, com os mesmos parâmetros do script 10 e ByteTrack. Contagens por quadro: `[2, 0, 1, 0, 0, 0, 0, 0, 0, 0]`; apenas o primeiro quadro recebeu IDs `[1, 2]`. Na repetição curta, as duas previsões foram falsos positivos `traffic light` (0,275 e 0,255), seguidos por quadros vazios. Isso valida o fluxo e reforça que o YOLO genérico não rastreia a bolinha de modo útil. `lap==0.5.13` foi incluído explicitamente nas dependências.

## Verificações

- AST válido para todos os scripts Python do tópico.
- Scripts 09 e 11 reexecutados com as saídas gravadas em `saidas/`, pasta ignorada pelo Git.
- HTML analisado: 18 IDs sem duplicação, 54 referências internas/locais resolvidas.
- Conteúdo exato e integral dos scripts 09–14 confirmado dentro da página.
- `git diff --check` passou nos arquivos deste escopo.
- A suíte geral foi executada pelo root: 253/253 testes passaram.

## Limitações declaradas

- Hailo e OAK-D não foram executados: não há SDKs, placas nem HEF/BLOB compatíveis neste ambiente. Os arquivos foram validados por AST e seguem fluxos do acervo/SDK oficial.
- O script Hailo exige HEF de detecção com NMS e pede ao aluno a ordem de canais `rgb|bgr`; não tenta inferi-la pelo nome do formato Picamera2.
- O exemplo OAK-D preserva a API DepthAI v2 e exige BLOB Tiny YOLOv4 COCO compatível; o texto aponta a substituição por `DetectionNetwork` no v3.
- Os pesos `models/best.pt`, `models/last.pt` e o vídeo `datasets/videos_raw/ants.mp4` do caso de formigas não estão no acervo. Nenhum resultado de formiga foi inventado.
- Área física requer referência de escala no mesmo plano e, quando necessário, correção de perspectiva. A página não converte a cena do ônibus para unidades físicas.

Nenhum processo desta tarefa ficou em execução.
