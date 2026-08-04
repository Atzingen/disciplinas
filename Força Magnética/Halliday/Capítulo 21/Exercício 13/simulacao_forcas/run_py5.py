from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys
from collections.abc import Callable
from typing import Any


SKETCH_PATH = Path(__file__).with_name("simulacao_forcas.pyde")
REQUIRED_CALLBACKS = (
    "setup",
    "draw",
    "mousePressed",
    "mouseDragged",
    "mouseReleased",
    "keyPressed",
)


def _configure_java_home() -> None:
    if os.environ.get("JAVA_HOME"):
        return

    program_files = Path(os.environ.get("ProgramFiles", r"C:\Program Files"))
    processing_jdk = program_files / "Processing" / "app" / "resources" / "jdk"
    if processing_jdk.is_dir():
        os.environ["JAVA_HOME"] = str(processing_jdk)


_configure_java_home()

import py5


def _configured_in_settings(*args: Any) -> None:
    return None


def processing_compatibility_namespace() -> dict[str, Any]:
    function_aliases = {
        "background": py5.background,
        "clip": py5.clip,
        "createFont": py5.create_font,
        "cursor": py5.cursor,
        "ellipse": py5.ellipse,
        "fill": py5.fill,
        "frameRate": py5.frame_rate,
        "line": py5.line,
        "noClip": py5.no_clip,
        "noFill": py5.no_fill,
        "noStroke": py5.no_stroke,
        "rect": py5.rect,
        "size": _configured_in_settings,
        "smooth": _configured_in_settings,
        "stroke": py5.stroke,
        "strokeWeight": py5.stroke_weight,
        "text": py5.text,
        "textAlign": py5.text_align,
        "textFont": py5.text_font,
        "textSize": py5.text_size,
        "textWidth": py5.text_width,
    }
    constant_names = (
        "ARROW",
        "BASELINE",
        "BOTTOM",
        "CENTER",
        "CODED",
        "DOWN",
        "HALF_PI",
        "HAND",
        "LEFT",
        "PI",
        "RIGHT",
        "TOP",
        "UP",
    )
    namespace: dict[str, Any] = {
        "__file__": str(SKETCH_PATH),
        "__name__": "processing_py5_sketch",
        "unicode": str,
    }
    namespace.update(function_aliases)
    namespace.update({name: getattr(py5, name) for name in constant_names})
    return namespace


def load_processing_sketch() -> dict[str, Any]:
    namespace = processing_compatibility_namespace()
    source = SKETCH_PATH.read_text(encoding="utf-8")
    sketch_directory = str(SKETCH_PATH.parent)
    inserted_directory = sketch_directory not in sys.path
    if inserted_directory:
        sys.path.insert(0, sketch_directory)
    try:
        exec(compile(source, str(SKETCH_PATH), "exec"), namespace)
    finally:
        if inserted_directory:
            sys.path.remove(sketch_directory)

    missing_callbacks = [
        name for name in REQUIRED_CALLBACKS if not callable(namespace.get(name))
    ]
    if missing_callbacks:
        joined_names = ", ".join(missing_callbacks)
        raise RuntimeError("Callbacks ausentes no sketch: " + joined_names)

    return namespace


PROCESSING_SKETCH = load_processing_sketch()


def _sync_dynamic_state() -> None:
    dynamic_names = {
        "mouseX": "mouse_x",
        "mouseY": "mouse_y",
        "mouseButton": "mouse_button",
        "key": "key",
        "keyCode": "key_code",
    }
    for processing_name, py5_name in dynamic_names.items():
        PROCESSING_SKETCH[processing_name] = getattr(py5, py5_name)


def settings() -> None:
    py5.size(
        PROCESSING_SKETCH["WINDOW_WIDTH"],
        PROCESSING_SKETCH["WINDOW_HEIGHT"],
    )
    py5.smooth()


def setup() -> None:
    _sync_dynamic_state()
    PROCESSING_SKETCH["setup"]()


def draw() -> None:
    _sync_dynamic_state()
    PROCESSING_SKETCH["draw"]()


def mouse_pressed() -> None:
    _sync_dynamic_state()
    PROCESSING_SKETCH["mousePressed"]()


def mouse_dragged() -> None:
    _sync_dynamic_state()
    PROCESSING_SKETCH["mouseDragged"]()


def mouse_released() -> None:
    _sync_dynamic_state()
    PROCESSING_SKETCH["mouseReleased"]()


def key_pressed() -> None:
    _sync_dynamic_state()
    PROCESSING_SKETCH["keyPressed"]()


def sketch_functions() -> dict[str, Callable[[], None]]:
    return {
        "settings": settings,
        "setup": setup,
        "draw": draw,
        "mouse_pressed": mouse_pressed,
        "mouse_dragged": mouse_dragged,
        "mouse_released": mouse_released,
        "key_pressed": key_pressed,
    }


def run(block: bool = True) -> None:
    py5.run_sketch(
        block=block,
        sketch_functions=sketch_functions(),
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Executa o sketch Processing.py usando Python 3 e py5."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Carrega e valida o sketch sem abrir a janela.",
    )
    args = parser.parse_args()

    if args.check:
        print("OK: simulacao_forcas.pyde carregado pelo py5")
        return 0

    run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
