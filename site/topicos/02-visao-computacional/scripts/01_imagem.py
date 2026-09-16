"""Execute na pasta do tópico: python scripts/01_imagem.py"""
import cv2

imagem = cv2.imread("imagens/frame_bolinha.png")
if imagem is None:
    raise SystemExit("Não encontrei imagens/frame_bolinha.png.")

print("Linhas, colunas e canais:", imagem.shape)
print("Tipo dos valores:", imagem.dtype)
print("Pixel [linha 100, coluna 100] em BGR:", imagem[100, 100])

azul, verde, vermelho = cv2.split(imagem)
cinza = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)

cv2.imshow("Imagem colorida", imagem)
cv2.imshow("Canal azul", azul)
cv2.imshow("Canal vermelho", vermelho)
cv2.imshow("Cinza", cinza)
cv2.waitKey(0)
cv2.destroyAllWindows()
