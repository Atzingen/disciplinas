"""Diferença de quadros. Execute na pasta do tópico. Q encerra."""
import cv2

FONTE = "videos/pendulo_livre.mp4"  # Use 0 para a webcam.
LIMIAR = 12
video = cv2.VideoCapture(FONTE)
leu, quadro = video.read()
if not leu:
    video.release()
    raise SystemExit("Não foi possível ler o primeiro quadro.")
anterior = cv2.cvtColor(quadro, cv2.COLOR_BGR2GRAY)

while True:
    leu, quadro = video.read()
    if not leu:
        break
    atual = cv2.cvtColor(quadro, cv2.COLOR_BGR2GRAY)
    diferenca = cv2.absdiff(atual, anterior)
    _, mascara = cv2.threshold(diferenca, LIMIAR, 255, cv2.THRESH_BINARY)
    anterior = atual
    cv2.imshow("Movimento", mascara)
    if cv2.waitKey(30) == ord("q"):
        break

video.release()
cv2.destroyAllWindows()
