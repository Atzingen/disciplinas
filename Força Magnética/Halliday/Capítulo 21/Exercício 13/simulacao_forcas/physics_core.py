# -*- coding: utf-8 -*-

from __future__ import division

import math


K_COULOMB = 8.9875517923e9


class CoincidentChargesError(ValueError):
    """Indica a singularidade de duas cargas puntiformes coincidentes."""


def vector_magnitude(vector):
    """Retorna o módulo de um vetor bidimensional.

    Args:
        vector (tuple[float, float]): Componentes cartesianas do vetor.

    Returns:
        float: Módulo euclidiano do vetor.
    """
    return math.hypot(vector[0], vector[1])


def coulomb_force(
    source_charge_c,
    test_charge_c,
    source_position_m,
    test_position_m,
):
    """Calcula a força de uma carga fonte sobre uma carga de teste.

    Args:
        source_charge_c (float): Carga fonte em coulombs.
        test_charge_c (float): Carga de teste em coulombs.
        source_position_m (tuple[float, float]): Posição da fonte em metros.
        test_position_m (tuple[float, float]): Posição do teste em metros.

    Returns:
        tuple[float, float]: Componentes da força em newtons.

    Raises:
        CoincidentChargesError: Se as duas cargas ocuparem o mesmo ponto.
    """
    dx = test_position_m[0] - source_position_m[0]
    dy = test_position_m[1] - source_position_m[1]
    distance_squared = dx * dx + dy * dy

    if distance_squared == 0.0:
        raise CoincidentChargesError(
            "A forca entre cargas puntiformes coincidentes e indefinida."
        )

    distance = math.sqrt(distance_squared)
    factor = (
        K_COULOMB
        * source_charge_c
        * test_charge_c
        / (distance_squared * distance)
    )

    return (factor * dx, factor * dy)


def resultant_force(force_a, force_b):
    """Soma duas forças bidimensionais componente a componente.

    Args:
        force_a (tuple[float, float]): Primeira força em newtons.
        force_b (tuple[float, float]): Segunda força em newtons.

    Returns:
        tuple[float, float]: Força resultante em newtons.
    """
    return (force_a[0] + force_b[0], force_a[1] + force_b[1])


def equilibrium_point(q1_c, q2_c, separation_m):
    """Calcula o ponto de campo nulo para duas cargas opostas no eixo x.

    A primeira carga ocupa ``(0, 0)`` e a segunda, ``(separation_m, 0)``.

    Args:
        q1_c (float): Primeira carga em coulombs.
        q2_c (float): Segunda carga em coulombs.
        separation_m (float): Separação positiva em metros.

    Returns:
        tuple[float, float]: Ponto de equilíbrio em metros.

    Raises:
        ValueError: Para entradas que não possuem ponto finito único.
    """
    if separation_m <= 0.0:
        raise ValueError("A separacao deve ser positiva.")
    if q1_c == 0.0 or q2_c == 0.0:
        raise ValueError("As duas cargas fixas devem ser nao nulas.")
    if q1_c * q2_c >= 0.0:
        raise ValueError("As cargas devem ter sinais opostos.")

    magnitude_1 = abs(q1_c)
    magnitude_2 = abs(q2_c)

    if magnitude_1 == magnitude_2:
        raise ValueError(
            "Cargas opostas de mesmo modulo nao possuem ponto finito de campo nulo."
        )

    if magnitude_1 < magnitude_2:
        distance_ratio = math.sqrt(magnitude_2 / magnitude_1)
        distance_from_q1 = separation_m / (distance_ratio - 1.0)
        return (-distance_from_q1, 0.0)

    distance_ratio = math.sqrt(magnitude_1 / magnitude_2)
    distance_from_q2 = separation_m / (distance_ratio - 1.0)
    return (separation_m + distance_from_q2, 0.0)


def display_scale(vectors, maximum_pixels):
    """Obtém uma escala linear comum para desenhar diversos vetores.

    Args:
        vectors (iterable[tuple[float, float]]): Vetores em newtons.
        maximum_pixels (float): Comprimento visual da maior seta.

    Returns:
        float: Quantidade de pixels por newton.
    """
    if maximum_pixels <= 0.0:
        raise ValueError("O comprimento visual maximo deve ser positivo.")

    maximum_magnitude = 0.0
    for vector in vectors:
        maximum_magnitude = max(maximum_magnitude, vector_magnitude(vector))

    if maximum_magnitude == 0.0:
        return 0.0

    return maximum_pixels / maximum_magnitude


def scale_vector(vector, pixels_per_newton):
    """Converte um vetor em newtons para componentes em pixels.

    Args:
        vector (tuple[float, float]): Vetor em newtons.
        pixels_per_newton (float): Escala linear de desenho.

    Returns:
        tuple[float, float]: Componentes do vetor em pixels.
    """
    return (
        vector[0] * pixels_per_newton,
        vector[1] * pixels_per_newton,
    )


def change_charge_magnitude(
    charge_c,
    direction,
    step_c,
    minimum_c,
    maximum_c,
):
    """Altera o módulo de uma carga, preservando seu sinal.

    Args:
        charge_c (float): Carga atual não nula em coulombs.
        direction (int): ``1`` para aumentar ou ``-1`` para diminuir.
        step_c (float): Passo positivo em coulombs.
        minimum_c (float): Menor módulo permitido.
        maximum_c (float): Maior módulo permitido.

    Returns:
        float: Nova carga em coulombs.
    """
    if charge_c == 0.0:
        raise ValueError("A carga ajustavel deve ser nao nula.")
    if direction not in (-1, 1):
        raise ValueError("A direcao deve ser -1 ou 1.")
    if step_c <= 0.0:
        raise ValueError("O passo deve ser positivo.")
    if minimum_c <= 0.0 or maximum_c < minimum_c:
        raise ValueError("Os limites de carga sao invalidos.")

    sign = 1.0 if charge_c > 0.0 else -1.0
    new_magnitude = abs(charge_c) + direction * step_c
    new_magnitude = max(minimum_c, min(maximum_c, new_magnitude))

    return sign * new_magnitude


def relative_resultant(resultant, force_a, force_b):
    """Compara o módulo da resultante com a maior força individual.

    Args:
        resultant (tuple[float, float]): Força resultante em newtons.
        force_a (tuple[float, float]): Primeira força em newtons.
        force_b (tuple[float, float]): Segunda força em newtons.

    Returns:
        float: Razão adimensional entre os módulos.
    """
    reference = max(vector_magnitude(force_a), vector_magnitude(force_b))
    resultant_magnitude = vector_magnitude(resultant)

    if reference == 0.0:
        if resultant_magnitude == 0.0:
            return 0.0
        return float("inf")

    return resultant_magnitude / reference
