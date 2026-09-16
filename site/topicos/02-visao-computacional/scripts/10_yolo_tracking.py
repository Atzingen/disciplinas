"""Mantém IDs entre quadros consecutivos; execute na pasta do tópico."""
from pathlib import Path
from urllib.request import urlretrieve
import sys

import cv2
from ultralytics import YOLO

MODELO_URL = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt"
MODELO = Path.home() / ".cache" / "disciplinas" / "yolo11n.pt"


def obter_modelo() -> Path:
    if not MODELO.exists():
        MODELO.parent.mkdir(parents=True, exist_ok=True)
        urlretrieve(MODELO_URL, MODELO)
    return MODELO


fonte = sys.argv[1] if len(sys.argv) > 1 else "videos/pendulo_trena.mp4"
video = cv2.VideoCapture(int(fonte) if fonte.isdigit() else fonte)
if not video.isOpened():
    raise SystemExit(f"Não foi possível abrir {fonte}")

modelo = YOLO(obter_modelo())
while True:
    ok, frame = video.read()
    if not ok:
        break

    resultado = modelo.track(
        frame, persist=True, tracker="bytetrack.yaml",
        conf=0.25, device="cpu", verbose=False,
    )[0]
    anotado = resultado.plot()

    if resultado.boxes.id is not None:
        ids = resultado.boxes.id.int().cpu().tolist()
        cv2.putText(anotado, f"IDs: {ids}", (20, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 220, 255), 2)

    cv2.imshow("YOLO tracking", anotado)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

video.release()
cv2.destroyAllWindows()
