# -*- coding: utf-8 -*-

from __future__ import division

import unittest

from physics_core import (
    CoincidentChargesError,
    change_charge_magnitude,
    coulomb_force,
    display_scale,
    equilibrium_point,
    relative_resultant,
    resultant_force,
    scale_vector,
    vector_magnitude,
)


class CoulombForceTests(unittest.TestCase):

    def test_equal_positive_charges_repel_along_positive_x(self):
        force = coulomb_force(
            1.0e-6,
            1.0e-6,
            (0.0, 0.0),
            (0.10, 0.0),
        )

        self.assertGreater(force[0], 0.0)
        self.assertAlmostEqual(force[1], 0.0, places=12)
        self.assertAlmostEqual(
            vector_magnitude(force),
            0.89875517923,
            places=10,
        )

    def test_opposite_charges_attract_toward_source(self):
        force = coulomb_force(
            -3.0e-6,
            1.0e-6,
            (0.10, 0.0),
            (0.20, 0.0),
        )

        self.assertLess(force[0], 0.0)
        self.assertAlmostEqual(force[1], 0.0, places=12)

    def test_resultant_adds_components(self):
        result = resultant_force((1.5, -2.0), (-0.5, 5.0))

        self.assertEqual(result, (1.0, 3.0))

    def test_coincident_charges_are_singular(self):
        with self.assertRaises(CoincidentChargesError):
            coulomb_force(
                1.0e-6,
                1.0e-6,
                (0.0, 0.0),
                (0.0, 0.0),
            )


class EquilibriumAndDisplayTests(unittest.TestCase):

    def test_equilibrium_point_matches_analytic_solution(self):
        point = equilibrium_point(1.0e-6, -3.0e-6, 0.10)

        self.assertAlmostEqual(point[0], -0.1366025403784439, places=12)
        self.assertEqual(point[1], 0.0)

    def test_equilibrium_moves_right_when_q2_has_smaller_magnitude(self):
        point = equilibrium_point(3.0e-6, -1.0e-6, 0.10)

        self.assertAlmostEqual(point[0], 0.2366025403784439, places=12)
        self.assertEqual(point[1], 0.0)

    def test_forces_cancel_at_equilibrium(self):
        point = equilibrium_point(1.0e-6, -3.0e-6, 0.10)
        force_1 = coulomb_force(
            1.0e-6,
            1.0e-6,
            (0.0, 0.0),
            point,
        )
        force_2 = coulomb_force(
            -3.0e-6,
            1.0e-6,
            (0.10, 0.0),
            point,
        )
        result = resultant_force(force_1, force_2)

        self.assertLess(vector_magnitude(result), 1.0e-12)
        self.assertLess(relative_resultant(result, force_1, force_2), 1.0e-12)

    def test_negative_q3_reverses_every_force(self):
        point = (-0.10, 0.05)
        positive = coulomb_force(
            1.0e-6,
            1.0e-6,
            (0.0, 0.0),
            point,
        )
        negative = coulomb_force(
            1.0e-6,
            -1.0e-6,
            (0.0, 0.0),
            point,
        )

        self.assertAlmostEqual(negative[0], -positive[0], places=12)
        self.assertAlmostEqual(negative[1], -positive[1], places=12)

    def test_display_scale_uses_one_linear_scale_for_all_vectors(self):
        pixels_per_newton = display_scale(
            ((3.0, 4.0), (0.0, 10.0)),
            150.0,
        )

        self.assertEqual(
            scale_vector((3.0, 4.0), pixels_per_newton),
            (45.0, 60.0),
        )
        self.assertEqual(
            scale_vector((0.0, 10.0), pixels_per_newton),
            (0.0, 150.0),
        )

    def test_charge_magnitude_changes_without_changing_sign(self):
        increased = change_charge_magnitude(
            -1.0e-6,
            1,
            0.5e-6,
            0.5e-6,
            5.0e-6,
        )
        limited = change_charge_magnitude(
            -0.5e-6,
            -1,
            0.5e-6,
            0.5e-6,
            5.0e-6,
        )

        self.assertEqual(increased, -1.5e-6)
        self.assertEqual(limited, -0.5e-6)

    def test_equilibrium_requires_opposite_unequal_charges(self):
        with self.assertRaises(ValueError):
            equilibrium_point(1.0e-6, 3.0e-6, 0.10)
        with self.assertRaises(ValueError):
            equilibrium_point(1.0e-6, -1.0e-6, 0.10)


if __name__ == "__main__":
    unittest.main()
