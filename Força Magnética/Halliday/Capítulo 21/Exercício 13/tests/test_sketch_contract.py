# -*- coding: utf-8 -*-

from __future__ import division

import ast
import io
import os
import re
import unittest


PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), os.pardir)
)
SKETCH_PATH = os.path.join(
    PROJECT_ROOT,
    "simulacao_forcas",
    "simulacao_forcas.pyde",
)
README_PATH = os.path.join(PROJECT_ROOT, "README.md")


class SketchContractTests(unittest.TestCase):

    def setUp(self):
        with io.open(SKETCH_PATH, "r", encoding="utf-8") as sketch_file:
            self.source = sketch_file.read()

    def test_sketch_is_valid_python_and_has_processing_callbacks(self):
        tree = ast.parse(self.source)
        function_names = {
            node.name
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
        }
        required_callbacks = {
            "setup",
            "draw",
            "mousePressed",
            "mouseDragged",
            "mouseReleased",
            "keyPressed",
        }

        self.assertTrue(required_callbacks.issubset(function_names))

    def test_sketch_exposes_required_controls_and_force_labels(self):
        required_tokens = (
            "from physics_core import",
            "UP",
            "DOWN",
            "'s'",
            "'r'",
            "F13",
            "F23",
            "FR",
        )

        for token in required_tokens:
            self.assertIn(token, self.source)

    def test_pyde_has_no_encoding_cookie_for_jython_unicode_input(self):
        first_two_lines = "\n".join(self.source.splitlines()[:2])

        self.assertNotIn("coding:", first_two_lines)

    def test_force_arrows_fit_beside_the_equilibrium_point(self):
        match = re.search(
            r"^MAXIMUM_ARROW_PIXELS\s*=\s*([0-9.]+)",
            self.source,
            re.MULTILINE,
        )

        self.assertIsNotNone(match)
        self.assertLessEqual(float(match.group(1)), 110.0)

    def test_zero_resultant_uses_a_dot_without_overlapping_text(self):
        self.assertNotIn('text(label + " ~ 0"', self.source)

    def test_particle_labels_have_a_background_over_force_arrows(self):
        self.assertIn("label_width = textWidth(charge_label)", self.source)


class DocumentationContractTests(unittest.TestCase):

    def test_readme_explains_how_to_run_and_control_the_sketch(self):
        with io.open(README_PATH, "r", encoding="utf-8") as readme_file:
            readme = readme_file.read()

        required_instructions = (
            "simulacao_forcas/simulacao_forcas.pyde",
            "Seta para cima",
            "Seta para baixo",
            "`S`",
            "`R`",
        )

        for instruction in required_instructions:
            self.assertIn(instruction, readme)


if __name__ == "__main__":
    unittest.main()
