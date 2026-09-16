"""Detecção com câmera Pi e um HEF que já inclui pós-processamento NMS."""
from pathlib import Path
import sys

from picamera2 import Picamera2
from picamera2.devices import Hailo


def extrair_deteccoes(
    saida: list, nomes: list[str], limiar: float = 0.5,
) -> list[tuple[str, float]]:
    deteccoes: list[tuple[str, float]] = []
    for classe, objetos in enumerate(saida):
        for objeto in objetos:
            confianca = float(objeto[4])
            if confianca >= limiar:
                deteccoes.append((nomes[classe], confianca))
    return deteccoes


if len(sys.argv) != 4 or sys.argv[3].lower() not in {"rgb", "bgr"}:
    raise SystemExit(
        "Uso: python scripts/13_hailo_hef.py modelo.hef rotulos.txt rgb|bgr"
    )

caminho_hef, caminho_rotulos = map(Path, sys.argv[1:3])
ordem_modelo = sys.argv[3].lower()
if not caminho_hef.exists() or not caminho_rotulos.exists():
    raise SystemExit("Confira os caminhos do HEF e dos rótulos.")

nomes = caminho_rotulos.read_text(encoding="utf-8").splitlines()
with Hailo(str(caminho_hef)) as hailo:
    altura, largura, _ = hailo.get_input_shape()
    # Os nomes libcamera são invertidos em relação à ordem do array NumPy.
    formato_camera = "BGR888" if ordem_modelo == "rgb" else "RGB888"
    with Picamera2() as camera:
        config = camera.create_preview_configuration(
            lores={"size": (largura, altura), "format": formato_camera},
        )
        camera.configure(config)
        camera.start()
        try:
            while True:
                quadro = camera.capture_array("lores")
                deteccoes = extrair_deteccoes(hailo.run(quadro), nomes)
                print(deteccoes)
        except KeyboardInterrupt:
            pass
