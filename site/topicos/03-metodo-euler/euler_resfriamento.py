temperatura_ambiente = 20.0  # °C
temperatura = 80.0  # °C, no instante inicial
k = 0.1  # 1/min
dt = 1.0  # min
tempo_final = 10.0  # min
numero_passos = round(tempo_final / dt)

print("t (min) | T (°C)")
print(f"{0.0:7.2f} | {temperatura:7.3f}")

for passo in range(numero_passos):
    taxa = -k * (temperatura - temperatura_ambiente)
    temperatura = temperatura + taxa * dt
    tempo = (passo + 1) * dt
    print(f"{tempo:7.2f} | {temperatura:7.3f}")
