#!/usr/bin/env python3
"""Picoh em funções simples — mexer boca, cabeça, olhos e cor da base.

Só precisa de pyserial. O protocolo é o mesmo da biblioteca oficial da Ohbot
(19200 baud), então não é preciso instalar nada da Ohbot.

    from picoh_simples import conectar
    robo = conectar()
    robo.cor(0, 200, 255)
    robo.virar(8)
    robo.boca(9)
    robo.repouso()

Na linha de comando:

    python picoh_simples.py               # demo: passa por tudo
    python picoh_simples.py --porta /dev/ttyACM0
    python picoh_simples.py --repouso     # apaga a cor e solta os motores

Atenção: só um programa por vez pode falar com o robô. Feche a aba do Scratch
(ou qualquer outro programa conectado) antes de rodar este script.
"""

from __future__ import annotations

import argparse
import glob
import os
import random
import sys
import time

import serial

BAUD = 19200

# Motores: índice -> (grau mínimo, grau máximo, invertido).
# As posições que você usa vão sempre de 0 a 10, e 5 é o meio.
ACENAR, VIRAR, OLHO_H, PALPEBRA, LABIO_SUP, LABIO_INF, INCLINAR = range(7)
MOTORES: dict[int, tuple[int, int, bool]] = {
    ACENAR: (54, 111, True),      # cabeça para cima / para baixo
    VIRAR: (0, 180, False),       # cabeça para a esquerda / direita
    LABIO_SUP: (0, 99, True),
    LABIO_INF: (34, 151, True),
}

# Formatos de olho (matriz de LED). O valor é o desenho, em hexadecimal.
OLHOS: dict[str, str] = {
    "normal": "387CFEFEFE7C380000007CFEFEFE7C00000000007CFE7C00000000000000FE7C00000000000000827C00000000000010381000000000",
    "grande": "387CFEFEFE7C380000007CFEFEFE7C00000000007CFE7C00000000000000FE7C00000000000000827C000000000010387C3810000000",
    "bravo": "2070F8FCFE7C3800000070F8FCFE3C000000000078FCFC38000000000000F8FC0000000000000000F800000000000010381000000000",
    "triste": "081C3E7EFE7C380000001C3E7EFE7C00000000003C7E7E3C0000000000003E7E00000000000000003E00000000000010381000000000",
    "coracao": "6CFEFEFE7C38100000007CFEFE7C3810000000007CFE7C38100000000000FE7C38000000000000007C00000000000010381000000000",
    "quadrado": "7CFEFEFEFEFE7C0000007CFEFEFE7C00000000007CFE7C00000000000000FE7C00000000000000827C00000000000010381000000000",
    "oculos": "FEFFFEFEFE00000000FEFFFEFEFE00000000FEFFFEFEFE00000000FEFFFEFEFE00000000FEFFFEFEFE00000000001038100000000000",
    "cheio": "ffffffffffffffffffffffffffffffff0000ffffffff0000000000ffff00000000000000000000000000000000000000000000000000",
}


class Picoh:
    """Um Picoh conectado. Cada método é um comando pronto."""

    def __init__(self, porta: str):
        self.serial = serial.Serial(porta, BAUD, timeout=0.5, write_timeout=1.0)
        self.porta = porta
        self._ligados: set[int] = set()

    # --- o básico ---------------------------------------------------------
    def _enviar(self, comando: str) -> None:
        self.serial.write(comando.encode("latin-1"))

    def mover(self, motor: int, posicao: float, velocidade: float = 5) -> None:
        """Move um motor para uma posição de 0 a 10 (5 = meio)."""
        minimo, maximo, invertido = MOTORES[motor]
        posicao = max(0.0, min(10.0, float(posicao)))
        if motor == LABIO_INF and posicao < 5:   # abaixo do meio bate no lábio de cima
            posicao = 5 - (5 - posicao) / 2
        if invertido:
            posicao = 10 - posicao
        graus = int(minimo + (maximo - minimo) / 10 * posicao)
        if motor not in self._ligados:           # "a0<m>" liga o servo
            self._enviar(f"a0{motor}\n")
            self._ligados.add(motor)
        self._enviar(f"m0{motor},{graus},{int(max(0, min(10, velocidade)) * 25)}\n")

    # --- rosto ------------------------------------------------------------
    def boca(self, abertura: float, velocidade: float = 8) -> None:
        """0 = fechada, 10 = bem aberta."""
        self.mover(LABIO_INF, 5 + abertura * 0.5, velocidade)
        self.mover(LABIO_SUP, 5 - abertura * 0.2, velocidade)

    def falar_boca(self, segundos: float = 3.0) -> None:
        """Mexe a boca como se estivesse falando, por N segundos."""
        fim = time.time() + segundos
        while time.time() < fim:
            self.boca(random.uniform(0, 9))
            time.sleep(random.uniform(0.08, 0.18))
        self.boca(0)

    def virar(self, posicao: float, velocidade: float = 5) -> None:
        """Cabeça na horizontal: 0 = esquerda, 5 = centro, 10 = direita."""
        self.mover(VIRAR, posicao, velocidade)

    def acenar(self, posicao: float, velocidade: float = 5) -> None:
        """Cabeça na vertical: 0 = para baixo, 5 = centro, 10 = para cima."""
        self.mover(ACENAR, posicao, velocidade)

    def concordar(self, vezes: int = 2) -> None:
        """Balança a cabeça dizendo "sim"."""
        for _ in range(vezes):
            self.acenar(7, 8)
            time.sleep(0.35)
            self.acenar(3, 8)
            time.sleep(0.35)
        self.acenar(5, 5)

    def negar(self, vezes: int = 2) -> None:
        """Balança a cabeça dizendo "não"."""
        for _ in range(vezes):
            self.virar(3, 8)
            time.sleep(0.35)
            self.virar(7, 8)
            time.sleep(0.35)
        self.virar(5, 5)

    # --- olhos ------------------------------------------------------------
    def olhar(self, x: float, y: float) -> None:
        """Move as pupilas: (5, 5) é o centro, 0-10 em cada eixo."""
        def escala(v: float) -> int:
            v = (max(0.0, min(10.0, float(v))) - 5) * 0.4 + 5
            return int(round(v * 255 / 10))
        self._enviar(f"FE,0,{escala(x)},{escala(y)}\n")

    def formato_olho(self, nome: str) -> None:
        """Troca o desenho dos olhos: normal, grande, bravo, triste, coracao,
        quadrado, oculos, cheio."""
        desenho = OLHOS[nome]
        for conjunto, comando in ((0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 8)):
            self._enviar(f"FB,{comando},{_linhas_do_olho(desenho, conjunto)}\n")

    def brilho_olhos(self, nivel: float) -> None:
        """0 = apagados, 10 = no máximo."""
        nivel = max(0.0, min(10.0, float(nivel))) / 10
        self._enviar(f"FI,{int(round(nivel * nivel * 255))}\n")

    def palpebras(self, fechadas: float) -> None:
        """0 = olhos abertos, 1 = fechados."""
        self._enviar(f"FL,+0,{int(round(max(0.0, min(1.0, fechadas)) * 255))}\n")

    def piscar(self, vezes: int = 1) -> None:
        for _ in range(vezes):
            self.palpebras(1)
            time.sleep(0.12)
            self.palpebras(0)
            time.sleep(0.25)

    # --- base -------------------------------------------------------------
    def cor(self, r: int, g: int, b: int) -> None:
        """Cor da base, RGB de 0 a 255. cor(0, 0, 0) apaga."""
        r, g, b = (max(0, min(255, int(v))) for v in (r, g, b))
        self._enviar(f"l00,{r},{g},{b}\n")
        self._enviar(f"l01,{r},{g},{b}\n")

    # --- encerrar ---------------------------------------------------------
    def repouso(self) -> None:
        """Volta tudo ao normal, solta os motores e fecha a porta."""
        self.cor(0, 0, 0)
        self.formato_olho("normal")
        self.brilho_olhos(3)
        self.olhar(5, 5)
        self.palpebras(0)
        for motor in (LABIO_INF, LABIO_SUP, VIRAR, ACENAR):
            self.mover(motor, 5, 3)
            time.sleep(0.15)
        for motor in sorted(self._ligados):      # "d0<m>" desliga o servo
            self._enviar(f"d0{motor}\n")
        self._ligados.clear()

    def fechar(self) -> None:
        self.serial.close()


def _inverter_bits(hexa: str) -> str:
    x = int(hexa, 16)
    r = 0
    for bit in range(8):
        if x & (1 << bit):
            r |= 1 << (7 - bit)
    return f"{r:02X}"


def _linhas_do_olho(desenho: str, conjunto: int) -> str:
    """As 9 linhas da matriz, espelhadas para o olho direito."""
    linhas = []
    for linha in range(9):
        i = conjunto * 18 + linha * 2
        byte = desenho[i:i + 2]
        linhas.append(byte + _inverter_bits(byte))
    return ",".join(linhas)


def portas_seriais() -> list[str]:
    encontradas = {os.path.realpath(p) for p in glob.glob("/dev/serial/by-id/*")}
    encontradas.update(glob.glob("/dev/ttyACM*") + glob.glob("/dev/ttyUSB*"))
    return sorted(encontradas)


def e_picoh(porta: str) -> bool:
    """Manda "v": o Picoh responde "v2..."."""
    try:
        with serial.Serial(porta, BAUD, timeout=1.0, write_timeout=1.0) as s:
            time.sleep(0.3)
            s.reset_input_buffer()
            s.write(b"v\n")
            return b"v2" in s.readline()
    except Exception:
        return False


def conectar(porta: str | None = None) -> Picoh:
    """Acha o Picoh nas portas USB (ou usa a que você passar) e conecta."""
    for candidata in ([porta] if porta else portas_seriais()):
        if e_picoh(candidata):
            print(f"Picoh em {candidata}")
            return Picoh(candidata)
    raise RuntimeError(
        "Picoh não encontrado. Ele está ligado no USB? Outro programa pode estar "
        "com a porta aberta (a aba do Scratch, por exemplo) — feche e tente de novo."
    )


def demo(robo: Picoh) -> None:
    """Passa por tudo que dá pra fazer."""
    print("cores da base")
    for nome, rgb in [("verde", (0, 220, 60)), ("azul", (0, 120, 255)),
                      ("laranja", (255, 120, 0)), ("vermelho", (255, 0, 0))]:
        print(f"  {nome}")
        robo.cor(*rgb)
        time.sleep(0.8)

    print("olhos")
    robo.brilho_olhos(10)
    for formato in ("grande", "bravo", "triste", "coracao", "oculos", "normal"):
        print(f"  {formato}")
        robo.formato_olho(formato)
        time.sleep(0.8)
    for x, y in [(2, 5), (8, 5), (5, 8), (5, 2), (5, 5)]:
        robo.olhar(x, y)
        time.sleep(0.4)
    robo.piscar(2)

    print("cabeça")
    robo.cor(90, 110, 255)
    robo.concordar()
    robo.negar()

    print("boca")
    robo.falar_boca(3)

    print("repouso")
    robo.repouso()


def main() -> int:
    ap = argparse.ArgumentParser(description="Picoh em funções simples")
    ap.add_argument("--porta", default=None, help="ex.: /dev/ttyACM0 (padrão: procura sozinho)")
    ap.add_argument("--repouso", action="store_true", help="só volta o robô ao repouso e sai")
    args = ap.parse_args()

    try:
        robo = conectar(args.porta)
    except RuntimeError as e:
        print(e, file=sys.stderr)
        return 1
    try:
        robo.repouso() if args.repouso else demo(robo)
    finally:
        robo.fechar()
    return 0


if __name__ == "__main__":
    sys.exit(main())
