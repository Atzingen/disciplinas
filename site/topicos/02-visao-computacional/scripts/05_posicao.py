"""Da máscara ao centro da bolinha. Q ou qualquer tecla encerra a imagem."""
import cv2

MINIMO = (0, 120, 120)
MAXIMO = (25, 255, 255)
AREA_MINIMA = 30
imagem = cv2.imread("imagens/frame_bolinha.png")
if imagem is None:
    raise SystemExit("Não encontrei a imagem. Execute na pasta do tópico.")

hsv = cv2.cvtColor(imagem, cv2.COLOR_BGR2HSV)
mascara = cv2.inRange(hsv, MINIMO, MAXIMO)
contornos, _ = cv2.findContours(mascara, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

if contornos:
    maior = max(contornos, key=cv2.contourArea)
    if cv2.contourArea(maior) > AREA_MINIMA:
        (x, y), raio = cv2.minEnclosingCircle(maior)
        print(f"Centro: x={x:.1f} px, y={y:.1f} px; raio={raio:.1f} px")
        cv2.circle(imagem, (int(x), int(y)), int(raio), (0, 255, 0), 2)
    else:
        print("A região é menor que a área mínima.")
else:
    print("Nenhuma região encontrada nessa faixa de cor.")

cv2.imshow("Posicao", imagem)
cv2.waitKey(0)
cv2.destroyAllWindows()
