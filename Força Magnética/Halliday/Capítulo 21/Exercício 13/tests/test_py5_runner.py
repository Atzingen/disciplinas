from pathlib import Path
import subprocess
import sys
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = PROJECT_ROOT / "simulacao_forcas" / "run_py5.py"


class Py5RunnerContractTests(unittest.TestCase):

    def test_check_loads_the_real_processing_sketch(self) -> None:
        completed = subprocess.run(
            [sys.executable, str(RUNNER_PATH), "--check"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=30,
        )

        self.assertEqual(
            completed.returncode,
            0,
            msg=completed.stdout + completed.stderr,
        )
        self.assertIn(
            "OK: simulacao_forcas.pyde carregado pelo py5",
            completed.stdout,
        )

    def test_runner_exposes_all_interactive_py5_callbacks(self) -> None:
        inspection_code = (
            "from simulacao_forcas import run_py5; "
            "callbacks = run_py5.sketch_functions(); "
            "assert all(callable(value) for value in callbacks.values()); "
            "print(','.join(sorted(callbacks)))"
        )
        completed = subprocess.run(
            [sys.executable, "-c", inspection_code],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=30,
        )

        self.assertEqual(
            completed.returncode,
            0,
            msg=completed.stdout + completed.stderr,
        )
        self.assertEqual(
            completed.stdout.strip(),
            "draw,key_pressed,mouse_dragged,mouse_pressed,mouse_released,settings,setup",
        )


if __name__ == "__main__":
    unittest.main()
