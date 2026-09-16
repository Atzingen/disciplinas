"""Vídeo de taxa constante → CSV. Execute na pasta do tópico; Q salva e sai."""
from pathlib import Path
import cv2
import numpy as np

FONTE = "videos/pendulo_trena.mp4"
MINIMO = (0, 120, 120)
MAXIMO = (25, 255, 255)
video = cv2.VideoCapture(FONTE)
fps = video.get(cv2.CAP_PROP_FPS)
if not video.isOpened() or fps <= 0:
    video.release()
    raise SystemExit("Vídeo não abriu ou não informa FPS válido.")

dados = []
numero = 0
while True:
    leu, quadro = video.read()
    if not leu:
        break
    tempo = numero / fps
    numero += 1  # O relógio avança mesmo se a detecção falhar.
    hsv = cv2.cvtColor(quadro, cv2.COLOR_BGR2HSV)
    mascara = cv2.inRange(hsv, MINIMO, MAXIMO)
    contornos, _ = cv2.findContours(mascara, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contornos:
        maior = max(contornos, key=cv2.contourArea)
        if cv2.contourArea(maior) > 30:
            (x, y), raio = cv2.minEnclosingCircle(maior)
            dados.append((tempo, x, y))
            cv2.circle(quadro, (int(x), int(y)), int(raio), (0, 255, 0), 2)
    cv2.imshow("Trajetoria", quadro)
    if cv2.waitKey(1) == ord("q"):
        break

video.release()
cv2.destroyAllWindows()
if not dados:
    raise SystemExit("Nenhuma posição detectada; reveja a faixa HSV.")
Path("saidas").mkdir(exist_ok=True)
np.savetxt("saidas/trajetoria.csv", dados, delimiter=",",
           header="t_s,x_px,y_px", comments="", fmt="%.6f")
print(f"{len(dados)} posições em {numero} quadros; FPS declarado: {fps:.6f}.")
print("Arquivo: saidas/trajetoria.csv")
