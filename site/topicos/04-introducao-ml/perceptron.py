"""Perceptron de um neurônio aprendendo a porta lógica AND, passada por passada."""

TAXA = 0.25
MAXIMO_EPOCAS = 20

# Cada linha: entradas (x1, x2) e a resposta desejada d.
AMOSTRAS = [
    ((0, 0), 0),
    ((0, 1), 0),
    ((1, 0), 0),
    ((1, 1), 1),
]

w1 = -0.5
w2 = 0.5
b = -0.25

for epoca in range(1, MAXIMO_EPOCAS + 1):
    erros = 0
    for (x1, x2), d in AMOSTRAS:
        # 1. Propagação: soma ponderada e função degrau.
        v = w1 * x1 + w2 * x2 + b
        y = 1 if v >= 0 else 0

        # 2. Erro entre o desejado e o obtido.
        e = d - y

        # 3. Correção: cada peso anda na direção que reduz o erro.
        w1 = w1 + TAXA * e * x1
        w2 = w2 + TAXA * e * x2
        b = b + TAXA * e

        if e != 0:
            erros += 1
        print(f"época {epoca}  x=({x1},{x2})  d={d}  v={v:+.2f}  y={y}  e={e:+d}  "
              f"->  w1={w1:+.2f}  w2={w2:+.2f}  b={b:+.2f}")

    print(f"--- fim da época {epoca}: {erros} correção(ões)")
    if erros == 0:
        print(f"Convergiu: a reta {w1:.2f}·x1 + {w2:.2f}·x2 + {b:.2f} = 0 separa as classes.")
        break
