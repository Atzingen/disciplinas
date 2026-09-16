"""Segmenta instâncias e mede suas áreas em pixels; execute no tópico."""
from pathlib import Path
from urllib.request import urlretrieve

import cv2
from ultralytics import YOLO

MODELO_URL = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n-seg.pt"
MODELO = Path.home() / ".cache" / "disciplinas" / "yolo11n-seg.pt"
ENTRADA = Path("imagens/deteccao-entrada.jpg")
SAIDA = Path("saidas/segmentacao-resultado.jpg")


def obter_modelo() -> Path:
    if not MODELO.exists():
        MODELO.parent.mkdir(parents=True, exist_ok=True)
        urlretrieve(MODELO_URL, MODELO)
    return MODELO


imagem = cv2.imread(str(ENTRADA))
if imagem is None:
    raise SystemExit(f"Não encontrei {ENTRADA}. Execute na pasta do tópico.")

modelo = YOLO(obter_modelo())
resultado = modelo.predict(
    imagem, conf=0.25, device="cpu", retina_masks=True, verbose=False,
)[0]
SAIDA.parent.mkdir(exist_ok=True)
cv2.imwrite(str(SAIDA), resultado.plot())

if resultado.masks is None:
    print(f"Nenhuma máscara; imagem salva em {SAIDA}")
else:
    for mascara, classe, confianca in zip(
        resultado.masks.data.cpu().numpy(),
        resultado.boxes.cls.cpu().numpy(),
        resultado.boxes.conf.cpu().numpy(),
    ):
        nome = resultado.names[int(classe)]
        area_px = int(mascara.sum())
        print(f"{nome:10s} conf={confianca:.3f} área={area_px} px²")

    print(f"{len(resultado.masks.data)} máscaras; imagem salva em {SAIDA}")
