"""Ajusta o CSV do vídeo da trena; execute na pasta do tópico."""
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

ARQUIVO = "dados/pendulo_trena.csv"  # Troque por saidas/trajetoria.csv.
COMPRIMENTO = 0.83  # Metros, do ponto de suspensão ao centro da bolinha.
PERIODO_INICIAL = 1.8  # Estime a distância entre picos no gráfico de x(t).
dados = np.loadtxt(ARQUIVO, delimiter=",", skiprows=1, ndmin=2)
if len(dados) < 10 or dados.shape[1] != 3 or not np.isfinite(dados).all():
    raise SystemExit("O CSV precisa de pelo menos 10 posições válidas: t, x, y.")
tempo = dados[:, 0] - dados[0, 0]
posicao = dados[:, 1]
if np.any(np.diff(tempo) <= 0):
    raise SystemExit("Os tempos precisam estar em ordem crescente.")


def oscilacao(t: np.ndarray, amplitude: float, tau: float,
              periodo: float, fase: float, centro: float) -> np.ndarray:
    envelope = amplitude * np.exp(-t / tau)
    return centro + envelope * np.cos(2 * np.pi * t / periodo + fase)


chute = [np.ptp(posicao) / 2, 100, PERIODO_INICIAL, 0, np.mean(posicao)]
limites = ([0, 0.01, 0.1, -2 * np.pi, -np.inf],
           [np.inf, 100000, 10, 2 * np.pi, np.inf])
parametros, _ = curve_fit(oscilacao, tempo, posicao, p0=chute,
                         bounds=limites, maxfev=20000)
amplitude, tau, periodo, fase, centro = parametros
ajuste = oscilacao(tempo, *parametros)
residuo = posicao - ajuste
gravidade = 4 * np.pi**2 * COMPRIMENTO / periodo**2
print(f"Período: {periodo:.4f} s; amortecimento: {tau:.1f} s")
print(f"g estimado: {gravidade:.3f} m/s²; comprimento adotado: {COMPRIMENTO} m")
print(f"Desvio padrão dos resíduos: {np.std(residuo):.2f} px")

figura, eixos = plt.subplots(2, 1, sharex=True, figsize=(9, 6))
eixos[0].plot(tempo, posicao, ".", markersize=1, label="Posições medidas")
eixos[0].plot(tempo, ajuste, label="Oscilação amortecida")
eixos[0].set_ylabel("x (pixels)")
eixos[0].legend()
eixos[1].plot(tempo, residuo, linewidth=0.6)
eixos[1].axhline(0, color="black", linewidth=0.5)
eixos[1].set(xlabel="Tempo (s)", ylabel="Resíduo (pixels)")
figura.suptitle("Pêndulo: medida, modelo e resíduos")
figura.tight_layout()
Path("saidas").mkdir(exist_ok=True)
figura.savefig("saidas/ajuste_pendulo.png", dpi=120)
plt.show()
