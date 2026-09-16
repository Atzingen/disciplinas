"""Kernel escrito à mão numa imagem fixa; execute na pasta do tópico."""
import cv2
import numpy as np

imagem = cv2.imread("imagens/frame_bolinha.png", cv2.IMREAD_GRAYSCALE)
if imagem is None:
    raise SystemExit("Não encontrei a imagem. Execute na pasta do tópico.")

kernel = np.array([[-1, 0, 1],
                   [-2, 0, 2],
                   [-1, 0, 1]], dtype=np.float32)

# O resultado pode ser negativo: preservamos os sinais em ponto flutuante.
resposta = cv2.filter2D(imagem, cv2.CV_32F, kernel, borderType=cv2.BORDER_REPLICATE)
magnitude = np.abs(resposta)
visualizacao = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
visualizacao = visualizacao.astype(np.uint8)

cv2.imshow("Original", imagem)
cv2.imshow("Bordas verticais - modulo", visualizacao)
cv2.waitKey(0)
cv2.destroyAllWindows()
