empuxo = 1500.0  # N
massa_inicial = 50.0  # kg
consumo = 0.5  # kg/s
arrasto = 0.5  # kg/m
g = 9.8  # m/s²
velocidade = 0.0  # m/s
dt = 0.5  # s
tempo_final = 20.0  # s
numero_passos = round(tempo_final / dt)

print("t (s) | v (m/s)")
print(f"{0.0:5.1f} | {velocidade:9.5f}")

for passo in range(numero_passos):
    tempo = passo * dt
    massa = massa_inicial - consumo * tempo
    # EDO simplificada usada no vídeo.
    aceleracao = (
        empuxo - massa * g - arrasto * velocidade**2
        + consumo * velocidade
    ) / massa
    velocidade = velocidade + aceleracao * dt
    print(f"{tempo + dt:5.1f} | {velocidade:9.5f}")
