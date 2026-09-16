# Visão computacional — material de PRCCOMP

Abra `index.html` pelo servidor do portal. Cards levam aos quatro capítulos
e às suas seções. Teoria, códigos e resultados ficam nas próprias páginas;
o capítulo 3 incorpora a leitura completa dos quatro notebooks.

## Execução local

Os scripts partem desta pasta, não de `scripts/`:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-imagem.txt
python scripts/01_imagem.py
```

No Windows PowerShell, ative com `.venv\Scripts\Activate.ps1`.

- Capítulo 1: `requirements-imagem.txt`.
- Capítulo 2: `requirements-medida.txt`.
- Capítulo 3: `requirements-redes.txt`; abra `jupyter notebook notebooks/`.
- Capítulo 4: `requirements-deteccao.txt` para YOLO; hardware embarcado tem
  preparação específica, descrita na página.

Arquivos de entrada ficam em `imagens/`, `videos/` e `dados/`. Ao baixar só
um exemplo, preserve esses caminhos. As saídas dos scripts ficam em `saidas/`,
fora do Git. O script 02 abre a webcam sem argumento e um arquivo quando
recebe o caminho. O script 06 trabalha apenas com arquivo de taxa constante.
Pressione Q nos vídeos e uma tecla nas imagens fixas para encerrar.

Os notebooks também podem ser enviados ao Colab por **Arquivo → Fazer upload
de notebook**. O conteúdo e as figuras estão incorporados ao capítulo 3;
os arquivos HTML separados ficam como cópias de leitura. Widgets Python
precisam de kernel ativo. Downloads de datasets requerem
internet na primeira execução e não são incorporados ao repositório. O exemplo
de cães/gatos baixa aproximadamente 825 MB da Microsoft e usa uma amostra de
3.000 imagens; o conjunto compacto antigo não estava acessível na validação.

## Arquivos e procedência

| Material entregue | Origem e adaptação |
|---|---|
| Scripts 01–05 | Conceitos dos scripts 01–05 de `Atzingen/visao-computacional-fisica`, commit `d016783`; reescritos para uma operação central por exemplo |
| Script 06 | Rastreamento HSV da mesma sequência; preserva índice do quadro mesmo quando não detecta a bolinha; sem painel/gráfico ao vivo |
| Visualização antes do ajuste | `07_visualizar_trajetoria.py`: gráfico de x(t) dos primeiros ciclos, para escolher o período inicial |
| Script 07 | Modelo amortecido do script 07 original; somente CSV, comprimento explícito e chute inicial de período editável; gráfico com resíduos |
| Script 08 | Sobel do script 09 original; imagem fixa, resposta assinada e borda replicada explicitamente |
| Demos de pixels, HSV e convolução | `principios/01-imagem-e-matriz.html`, `04-hsv.html` e `09-convolucao.html` do mesmo commit; estilos do portal e controles de teclado/toque |
| Imagens e três vídeos | Cópias sem alteração do acervo recente; vídeos originários de `Atzingen/rastreador-pendulo` |
| CSV e gráfico do pêndulo | Gerados em 16/09/2026 com os scripts 06/07 incluídos, a partir de `videos/pendulo_trena.mp4`; sem correção de FPS |
| Notebooks | Seleção/adaptação da sequência recente, SAMBA, webinar e FIC; referências e metodologia dentro de cada notebook |

O CSV usa cabeçalho `t_s,x_px,y_px`. Na execução registrada, 3.379 posições
foram extraídas de 3.379 quadros, com FPS declarado 30,303030. Com L = 0,83 m,
o ajuste resultou em T ≈ 1,8072 s e g ≈ 10,033 m/s². Esses resultados dependem
das hipóteses documentadas na página; não comprovam a calibração do relógio.

### Acervo consultado

- [Visão aplicada à física](https://github.com/Atzingen/visao-computacional-fisica), `d016783`.
- [SAMBA 2022](https://github.com/Atzingen/Palestra-SAMBA2022-CNN), `8de6ce1`.
- [Webinar de visão embarcada](https://github.com/Atzingen/Webinar-Vis-o-computacional-Embarcada), `533d5b9`.
- [IA-FIC-IFSP](https://github.com/Atzingen/IA-FIC-IFSP), `379573c`.
- [Rastreador de pêndulo](https://github.com/Atzingen/rastreador-pendulo), `cd16f21`.
- [Formigas](https://github.com/Atzingen/formigas), `5713c08`.
- [Embarcados Experience 2024](https://github.com/Atzingen/VisaoComputacionalEmbarcada-2024).

As versões didáticas desta pasta são mantidas em `disciplinas`; os
repositórios de origem permanecem como referência histórica. O caso das
formigas depende de recuperar vídeos/pesos não versionados. Hailo e OAK-D
dependem de hardware, SDK e modelos compilados compatíveis; não foram
apresentados como práticas verificadas nesta entrega.

## Atualizar a leitura dos notebooks

Depois de editar e executar os `.ipynb`, use o ambiente que contém `nbconvert`:

```bash
python scripts/visao/renderizar-notebooks.py
```

O comando acima parte da raiz do repositório. Ele atualiza os quatro blocos
da página e extrai as figuras para `imagens/notebooks/`, sem retreinar modelos.
O teste de consistência verifica que todas as células continuam na leitura.

## Vídeo e gráfico sincronizados

O capítulo 2 apresenta original, centro reconhecido e x(t) lado a lado.
`demo-video-medida.js` usa o relógio dos quadros apresentados pelo navegador
e o CSV real do script 06; não executa reconhecimento novamente no navegador.
O gráfico mostra uma janela de dez segundos com escala vertical fixa.
Reproduzir, pausar e buscar outro instante mantém as três vistas sincronizadas.

Para uma prévia local com avanço/retorno do vídeo, o servidor precisa atender
a requisições HTTP Range. Uma opção pequena é [RangeHTTPServer](https://github.com/danvk/RangeHTTPServer):

```bash
python -m pip install rangehttpserver==1.4.0
# A partir da raiz do repositório:
cd site
python -m RangeHTTPServer --bind 127.0.0.1 8017
```

O `python -m http.server` simples pode servir o arquivo mas deixar a faixa
de busca do player vazia; nesse caso, trocar de instante retorna ao início.
