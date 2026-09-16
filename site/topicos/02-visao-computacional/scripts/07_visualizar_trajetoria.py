"""Veja os primeiros ciclos antes de escolher o período inicial do ajuste."""
import numpy as np
import matplotlib.pyplot as plt

ARQUIVO = "dados/pendulo_trena.csv"
dados = np.loadtxt(ARQUIVO, delimiter=",", skiprows=1, ndmin=2)
tempo = dados[:, 0] - dados[0, 0]
posicao = dados[:, 1]

plt.plot(tempo, posicao, ".-", markersize=2)
plt.xlim(0, 10)
plt.xlabel("Tempo (s)")
plt.ylabel("x (pixels)")
plt.title("Estime o período pela distância entre picos")
plt.show()
