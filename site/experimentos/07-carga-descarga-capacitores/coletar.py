"""Salva um par carga/descarga sem sobrescrever dados existentes.

Instalacao: python -m pip install pyserial
Uso: python coletar.py /dev/ttyACM0 R47k.csv
Windows: python coletar.py COM3 R47k.csv
"""

import argparse
import csv
import os
import time
from pathlib import Path
from typing import TextIO

HEADER = "fase,t_ms,adc,r_nominal_ohm"


def collect(connection, output: TextIO, timeout: float = 10.0) -> int:
    """Valida e grava dados; interrupcoes deixam um CSV parcial recuperavel."""
    writer = csv.writer(output, lineterminator="\n")
    count = 0
    header_seen = False
    last_time: dict[str, int] = {}
    resistor = None
    last_received = time.monotonic()
    while True:
        raw = connection.readline()
        if not raw:
            if time.monotonic() - last_received > timeout:
                raise RuntimeError("Sem dados por 10 s; coleta incompleta.")
            continue
        last_received = time.monotonic()
        line = raw.decode("ascii").strip()
        if line.startswith(("# erro", "# interrompido")):
            raise RuntimeError(line)
        if line == "# fim":
            if set(last_time) != {"carga", "descarga"}:
                raise RuntimeError("Faltou uma das curvas; coleta incompleta.")
            return count
        if line == HEADER:
            if header_seen:
                raise RuntimeError("Aquisicao reiniciada durante a coleta.")
            writer.writerow(HEADER.split(","))
            header_seen = True
            continue
        if line.startswith("# pronto") and header_seen:
            raise RuntimeError("Arduino reiniciado; coleta incompleta.")
        if line.startswith("#") or not line:
            continue
        if not header_seen:
            raise ValueError("Dados sem cabecalho.")
        phase, timestamp, adc, nominal = line.split(",")
        t, value, resistance = int(timestamp), int(adc), int(nominal)
        if phase not in {"carga", "descarga"} or not 0 <= value <= 1023:
            raise ValueError("Fase ou ADC invalido.")
        if resistance not in {47000, 56000, 68000}:
            raise ValueError("Resistor nominal inesperado.")
        if resistor is not None and resistor != resistance:
            raise ValueError("Resistor mudou dentro da mesma coleta.")
        if t < 0 or t <= last_time.get(phase, -1):
            raise ValueError("Tempo repetido ou fora de ordem.")
        if phase == "carga" and "descarga" in last_time:
            raise ValueError("Carga depois da descarga.")
        if phase == "descarga" and "carga" not in last_time:
            raise ValueError("Descarga sem carga anterior.")
        resistor = resistance
        last_time[phase] = t
        writer.writerow([phase, t, value, resistance])
        output.flush()
        count += 1


def leave_port_usable_by_chrome(connection) -> None:
    """No Linux, pyserial deixa VMIN=0 e o Chrome passa a tratar read()==0 como
    porta perdida ("The device has been lost"). Restaura VMIN=1 antes de fechar."""
    if os.name != "posix":
        return
    import termios

    attributes = termios.tcgetattr(connection.fd)
    attributes[6][termios.VMIN] = 1
    attributes[6][termios.VTIME] = 0
    termios.tcsetattr(connection.fd, termios.TCSANOW, attributes)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("porta", help="Ex.: /dev/ttyACM0 ou COM3")
    parser.add_argument("arquivo", type=Path, help="CSV novo; nunca sobrescreve")
    args = parser.parse_args()
    import serial

    with args.arquivo.open("x", encoding="utf-8", newline="") as output:
        with serial.Serial(args.porta, 115200, timeout=1) as connection:
            # Abrir a porta normalmente reinicia o Uno; espere o bootloader.
            time.sleep(2)
            connection.reset_input_buffer()
            connection.write(b"i")
            print("Coletando carga e descarga. Ctrl+C interrompe; CSV parcial e preservado.")
            try:
                count = collect(connection, output)
            finally:
                connection.write(b"x")
                leave_port_usable_by_chrome(connection)
            print(f"Concluido: {count} leituras em {args.arquivo}")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, OSError, RuntimeError, ValueError) as error:
        raise SystemExit(f"Coleta interrompida/incompleta: {error}") from error
