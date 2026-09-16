"""Detecta objetos numa imagem com YOLO11; execute na pasta do tópico."""
from pathlib import Path
from urllib.request import urlretrieve

import cv2
from ultralytics import YOLO

MODELO_URL = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt"
MODELO = Path.home() / ".cache" / "disciplinas" / "yolo11n.pt"
ENTRADA = Path("imagens/deteccao-entrada.jpg")
SAIDA = Path("saidas/deteccao-resultado.jpg")


def obter_modelo() -> Path:
    if not MODELO.exists():
        MODELO.parent.mkdir(parents=True, exist_ok=True)
        urlretrieve(MODELO_URL, MODELO)
    return MODELO


imagem = cv2.imread(str(ENTRADA))
if imagem is None:
    raise SystemExit(f"Não encontrei {ENTRADA}. Execute na pasta do tópico.")

modelo = YOLO(obter_modelo())
resultado = modelo.predict(imagem, conf=0.25, device="cpu", verbose=False)[0]
SAIDA.parent.mkdir(exist_ok=True)
cv2.imwrite(str(SAIDA), resultado.plot())

for caixa, confianca, classe in zip(
    resultado.boxes.xyxy.cpu().numpy(),
    resultado.boxes.conf.cpu().numpy(),
    resultado.boxes.cls.cpu().numpy(),
):
    x1, y1, x2, y2 = caixa.round().astype(int)
    nome = resultado.names[int(classe)]
    print(f"{nome:10s} conf={confianca:.3f} caixa=({x1}, {y1}, {x2}, {y2})")

print(f"{len(resultado.boxes)} objetos; imagem salva em {SAIDA}")
