"""Sem argumento: webcam. Com argumento: caminho de um vídeo. Q encerra."""
import sys
import cv2

fonte = 0
if len(sys.argv) > 1:
    fonte = sys.argv[1]

video = cv2.VideoCapture(fonte)
if not video.isOpened():
    raise SystemExit("Não foi possível abrir a câmera ou o vídeo.")

while True:
    leu, quadro = video.read()
    if not leu:
        break
    cv2.imshow("Captura", quadro)
    if cv2.waitKey(30) == ord("q"):
        break

video.release()
cv2.destroyAllWindows()
