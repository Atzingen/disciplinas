g = 9.81  # m/s²
massa = 1.0  # kg
b = 0.2  # kg/s, resistência linear do ar
velocidade = 0.0  # m/s, sentido positivo para baixo
dt = 0.1  # s
tempo_final = 10.0  # s
numero_passos = round(tempo_final / dt)

print("t (s) | v (m/s)")
print(f"{0.0:5.1f} | {velocidade:8.4f}")

for passo in range(numero_passos):
    aceleracao = g - (b / massa) * velocidade
    velocidade = velocidade + aceleracao * dt
    tempo = (passo + 1) * dt
    print(f"{tempo:5.1f} | {velocidade:8.4f}")
