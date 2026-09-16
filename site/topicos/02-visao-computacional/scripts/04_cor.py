"""Ajuste HSV numa imagem fixa. Anote as faixas para os exemplos 05 e 06."""
import cv2

imagem = cv2.imread("imagens/frame_bolinha.png")
if imagem is None:
    raise SystemExit("Não encontrei a imagem. Execute na pasta do tópico.")
hsv = cv2.cvtColor(imagem, cv2.COLOR_BGR2HSV)


def mudou(valor: int) -> None:
    pass  # A leitura dos controles ocorre no laço abaixo.


cv2.namedWindow("Filtro HSV")
controles = [("Hmin", 0, 179), ("Hmax", 25, 179),
             ("Smin", 120, 255), ("Smax", 255, 255),
             ("Vmin", 120, 255), ("Vmax", 255, 255)]
for nome, valor, maximo in controles:
    cv2.createTrackbar(nome, "Filtro HSV", valor, maximo, mudou)

while True:
    hmin = cv2.getTrackbarPos("Hmin", "Filtro HSV")
    hmax = cv2.getTrackbarPos("Hmax", "Filtro HSV")
    smin = cv2.getTrackbarPos("Smin", "Filtro HSV")
    smax = cv2.getTrackbarPos("Smax", "Filtro HSV")
    vmin = cv2.getTrackbarPos("Vmin", "Filtro HSV")
    vmax = cv2.getTrackbarPos("Vmax", "Filtro HSV")
    mascara = cv2.inRange(hsv, (hmin, smin, vmin), (hmax, smax, vmax))
    resultado = cv2.bitwise_and(imagem, imagem, mask=mascara)
    cv2.imshow("Filtro HSV", resultado)
    cv2.imshow("Mascara", mascara)
    if cv2.waitKey(30) == ord("q"):
        break

print("Mínimo:", (hmin, smin, vmin), "Máximo:", (hmax, smax, vmax))
cv2.destroyAllWindows()
