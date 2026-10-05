from collections.abc import Sequence

import matplotlib.pyplot as plt
from scipy.integrate import solve_ivp


def resfriamento(t: float, estado: Sequence[float]) -> list[float]:
    temperatura = estado[0]
    return [-0.1 * (temperatura - 20.0)]


tempos = [float(t) for t in range(11)]
solucao = solve_ivp(
    resfriamento,
    (0.0, 10.0),
    [80.0],
    method="RK45",
    t_eval=tempos,
    rtol=1e-8,
    atol=1e-10,
)

if not solucao.success:
    raise RuntimeError(solucao.message)

for tempo, temperatura in zip(solucao.t, solucao.y[0]):
    print(f"{tempo:5.1f} min | {temperatura:7.3f} °C")

plt.plot(solucao.t, solucao.y[0], "o-", label="Runge–Kutta (RK45)")
plt.xlabel("Tempo (min)")
plt.ylabel("Temperatura (°C)")
plt.grid(True)
plt.legend()
plt.show()
