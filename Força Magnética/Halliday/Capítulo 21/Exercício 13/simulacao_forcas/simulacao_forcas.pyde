from __future__ import division

import math

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


WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 760

PLOT_LEFT = 28.0
PLOT_TOP = 78.0
PLOT_RIGHT = 884.0
PLOT_BOTTOM = 732.0
PANEL_LEFT = 900.0

ORIGIN_X = 410.0
ORIGIN_Y = 405.0
PIXELS_PER_CM = 20.0
GRID_STEP_CM = 2
PARTICLE_RADIUS = 23.0
MAXIMUM_ARROW_PIXELS = 100.0

Q1_C = 1.0e-6
Q2_C = -3.0e-6
Q1_POSITION_M = (0.0, 0.0)
Q2_POSITION_M = (0.10, 0.0)
SEPARATION_M = 0.10

Q3_INITIAL_C = 1.0e-6
Q3_STEP_C = 0.5e-6
Q3_MINIMUM_C = 0.5e-6
Q3_MAXIMUM_C = 5.0e-6

EQUILIBRIUM_POSITION_M = equilibrium_point(Q1_C, Q2_C, SEPARATION_M)
EQUILIBRIUM_RELATIVE_TOLERANCE = 1.0e-6

COLOR_POSITIVE = (226, 71, 71)
COLOR_NEGATIVE = (55, 112, 214)
COLOR_F13 = (0, 153, 184)
COLOR_F23 = (230, 139, 24)
COLOR_FR = (190, 55, 168)
COLOR_EQUILIBRIUM = (36, 153, 92)
COLOR_TEXT = (35, 43, 56)
COLOR_MUTED = (101, 113, 132)

q3_charge_c = Q3_INITIAL_C
q3_position_m = EQUILIBRIUM_POSITION_M
dragging_q3 = False
ui_font = None


def setup():
    global ui_font

    size(1200, 760)
    smooth()
    frameRate(60)
    ui_font = createFont("Arial", 14)
    textFont(ui_font)


def draw():
    background(244, 247, 251)

    draw_header()
    draw_coordinate_plane()
    draw_distance_marker()
    draw_equilibrium_marker()

    force_state = None
    force_error = None
    pixels_per_newton = 0.0

    try:
        force_state = calculate_force_state()
        pixels_per_newton = display_scale(
            (
                force_state["F13"],
                force_state["F23"],
                force_state["FR"],
            ),
            MAXIMUM_ARROW_PIXELS,
        )
        draw_force_vectors(force_state, pixels_per_newton)
    except CoincidentChargesError as error:
        force_error = unicode(error)

    draw_charge(Q1_POSITION_M, Q1_C, "q1", False)
    draw_charge(Q2_POSITION_M, Q2_C, "q2", False)
    draw_charge(q3_position_m, q3_charge_c, "q3", True)
    draw_side_panel(force_state, force_error, pixels_per_newton)
    update_cursor()


def calculate_force_state():
    force_13 = coulomb_force(
        Q1_C,
        q3_charge_c,
        Q1_POSITION_M,
        q3_position_m,
    )
    force_23 = coulomb_force(
        Q2_C,
        q3_charge_c,
        Q2_POSITION_M,
        q3_position_m,
    )
    resultant = resultant_force(force_13, force_23)

    return {
        "F13": force_13,
        "F23": force_23,
        "FR": resultant,
    }


def world_to_screen(position_m):
    x_cm = position_m[0] * 100.0
    y_cm = position_m[1] * 100.0

    return (
        ORIGIN_X + x_cm * PIXELS_PER_CM,
        ORIGIN_Y - y_cm * PIXELS_PER_CM,
    )


def screen_to_world(screen_x, screen_y):
    bounded_x = max(
        PLOT_LEFT + PARTICLE_RADIUS,
        min(PLOT_RIGHT - PARTICLE_RADIUS, screen_x),
    )
    bounded_y = max(
        PLOT_TOP + PARTICLE_RADIUS,
        min(PLOT_BOTTOM - PARTICLE_RADIUS, screen_y),
    )

    x_cm = (bounded_x - ORIGIN_X) / PIXELS_PER_CM
    y_cm = (ORIGIN_Y - bounded_y) / PIXELS_PER_CM

    return (x_cm / 100.0, y_cm / 100.0)


def draw_header():
    noStroke()
    fill(244, 247, 251)
    rect(0, 0, PANEL_LEFT, PLOT_TOP)

    fill(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])
    textAlign(LEFT, BASELINE)
    textSize(23)
    text(u"Forças eletrostáticas sobre a partícula 3", PLOT_LEFT, 32)

    fill(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2])
    textSize(13)
    text(
        u"Arraste q3 pelo plano e observe as duas forças e a resultante.",
        PLOT_LEFT,
        56,
    )

    draw_header_legend(510, 30, COLOR_F13, "F13")
    draw_header_legend(620, 30, COLOR_F23, "F23")
    draw_header_legend(730, 30, COLOR_FR, "FR")


def draw_header_legend(x, y, rgb, label):
    stroke(rgb[0], rgb[1], rgb[2])
    strokeWeight(4)
    line(x, y, x + 25, y)
    noStroke()
    fill(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])
    textAlign(LEFT, CENTER)
    textSize(12)
    text(label, x + 33, y)


def draw_coordinate_plane():
    noStroke()
    fill(255)
    rect(
        PLOT_LEFT,
        PLOT_TOP,
        PLOT_RIGHT - PLOT_LEFT,
        PLOT_BOTTOM - PLOT_TOP,
        10,
    )

    x_min_cm = int(math.floor((PLOT_LEFT - ORIGIN_X) / PIXELS_PER_CM))
    x_max_cm = int(math.ceil((PLOT_RIGHT - ORIGIN_X) / PIXELS_PER_CM))
    y_min_cm = int(math.floor((ORIGIN_Y - PLOT_BOTTOM) / PIXELS_PER_CM))
    y_max_cm = int(math.ceil((ORIGIN_Y - PLOT_TOP) / PIXELS_PER_CM))

    textSize(10)
    for x_cm in range(x_min_cm, x_max_cm + 1):
        if x_cm % GRID_STEP_CM != 0:
            continue
        screen_x = ORIGIN_X + x_cm * PIXELS_PER_CM
        stroke(224, 230, 238)
        strokeWeight(1)
        line(screen_x, PLOT_TOP, screen_x, PLOT_BOTTOM)

        if x_cm % 5 == 0 and x_cm != 0:
            noStroke()
            fill(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2])
            textAlign(CENTER, TOP)
            text(str(x_cm), screen_x, ORIGIN_Y + 7)

    for y_cm in range(y_min_cm, y_max_cm + 1):
        if y_cm % GRID_STEP_CM != 0:
            continue
        screen_y = ORIGIN_Y - y_cm * PIXELS_PER_CM
        stroke(224, 230, 238)
        strokeWeight(1)
        line(PLOT_LEFT, screen_y, PLOT_RIGHT, screen_y)

        if y_cm % 5 == 0 and y_cm != 0:
            noStroke()
            fill(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2])
            textAlign(RIGHT, CENTER)
            text(str(y_cm), ORIGIN_X - 7, screen_y)

    stroke(75, 85, 101)
    strokeWeight(1.6)
    line(PLOT_LEFT, ORIGIN_Y, PLOT_RIGHT, ORIGIN_Y)
    line(ORIGIN_X, PLOT_TOP, ORIGIN_X, PLOT_BOTTOM)

    draw_axis_arrow(PLOT_RIGHT - 4, ORIGIN_Y, 0.0)
    draw_axis_arrow(ORIGIN_X, PLOT_TOP + 4, -HALF_PI)

    noStroke()
    fill(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])
    textSize(12)
    textAlign(RIGHT, BOTTOM)
    text("x (cm)", PLOT_RIGHT - 9, ORIGIN_Y - 8)
    textAlign(LEFT, TOP)
    text("y (cm)", ORIGIN_X + 9, PLOT_TOP + 8)
    textAlign(RIGHT, TOP)
    text("0", ORIGIN_X - 7, ORIGIN_Y + 7)


def draw_axis_arrow(tip_x, tip_y, angle):
    arrow_size = 8.0
    stroke(75, 85, 101)
    strokeWeight(1.6)
    line(
        tip_x,
        tip_y,
        tip_x - arrow_size * math.cos(angle - PI / 6.0),
        tip_y - arrow_size * math.sin(angle - PI / 6.0),
    )
    line(
        tip_x,
        tip_y,
        tip_x - arrow_size * math.cos(angle + PI / 6.0),
        tip_y - arrow_size * math.sin(angle + PI / 6.0),
    )


def draw_distance_marker():
    q1_screen = world_to_screen(Q1_POSITION_M)
    q2_screen = world_to_screen(Q2_POSITION_M)
    marker_y = ORIGIN_Y + 83.0

    stroke(112, 124, 143)
    strokeWeight(1.2)
    line(q1_screen[0], marker_y, q2_screen[0], marker_y)
    line(q1_screen[0], marker_y - 5, q1_screen[0], marker_y + 5)
    line(q2_screen[0], marker_y - 5, q2_screen[0], marker_y + 5)

    noStroke()
    fill(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2])
    textAlign(CENTER, BOTTOM)
    textSize(11)
    text("L = 10,0 cm", (q1_screen[0] + q2_screen[0]) / 2.0, marker_y - 5)


def draw_equilibrium_marker():
    marker = world_to_screen(EQUILIBRIUM_POSITION_M)

    noFill()
    stroke(
        COLOR_EQUILIBRIUM[0],
        COLOR_EQUILIBRIUM[1],
        COLOR_EQUILIBRIUM[2],
        180,
    )
    strokeWeight(2)
    ellipse(marker[0], marker[1], 58, 58)
    line(marker[0] - 7, marker[1], marker[0] + 7, marker[1])
    line(marker[0], marker[1] - 7, marker[0], marker[1] + 7)

    noStroke()
    fill(
        COLOR_EQUILIBRIUM[0],
        COLOR_EQUILIBRIUM[1],
        COLOR_EQUILIBRIUM[2],
    )
    textAlign(CENTER, BOTTOM)
    textSize(11)
    text(u"Equilíbrio teórico", marker[0], marker[1] - 50)
    text(u"x = -13,66 cm", marker[0], marker[1] - 36)


def draw_force_vectors(force_state, pixels_per_newton):
    start = world_to_screen(q3_position_m)

    clip(
        int(PLOT_LEFT),
        int(PLOT_TOP),
        int(PLOT_RIGHT - PLOT_LEFT),
        int(PLOT_BOTTOM - PLOT_TOP),
    )
    draw_force_arrow(
        start,
        force_state["F13"],
        pixels_per_newton,
        COLOR_F13,
        "F13",
        3.0,
    )
    draw_force_arrow(
        start,
        force_state["F23"],
        pixels_per_newton,
        COLOR_F23,
        "F23",
        3.0,
    )
    draw_force_arrow(
        start,
        force_state["FR"],
        pixels_per_newton,
        COLOR_FR,
        "FR",
        4.5,
    )
    noClip()


def draw_force_arrow(start, force_n, pixels_per_newton, rgb, label, weight):
    vector_pixels = scale_vector(force_n, pixels_per_newton)
    dx = vector_pixels[0]
    dy = -vector_pixels[1]
    length_pixels = math.hypot(dx, dy)

    stroke(rgb[0], rgb[1], rgb[2])
    fill(rgb[0], rgb[1], rgb[2])
    strokeWeight(weight)

    if length_pixels < 1.0:
        noStroke()
        ellipse(start[0], start[1], 8, 8)
        return

    end_x = start[0] + dx
    end_y = start[1] + dy
    line(start[0], start[1], end_x, end_y)

    angle = math.atan2(dy, dx)
    arrow_size = 11.0
    line(
        end_x,
        end_y,
        end_x - arrow_size * math.cos(angle - PI / 6.0),
        end_y - arrow_size * math.sin(angle - PI / 6.0),
    )
    line(
        end_x,
        end_y,
        end_x - arrow_size * math.cos(angle + PI / 6.0),
        end_y - arrow_size * math.sin(angle + PI / 6.0),
    )

    noStroke()
    textSize(11)
    if dx >= 0.0:
        textAlign(LEFT, CENTER)
        text(label, end_x + 7, end_y)
    else:
        textAlign(LEFT, BOTTOM)
        text(label, end_x + 7, end_y - 6)


def draw_charge(position_m, charge_c, label, draggable):
    screen_position = world_to_screen(position_m)
    rgb = COLOR_POSITIVE if charge_c > 0.0 else COLOR_NEGATIVE

    noStroke()
    fill(24, 32, 46, 35)
    ellipse(
        screen_position[0] + 3,
        screen_position[1] + 5,
        PARTICLE_RADIUS * 2.0,
        PARTICLE_RADIUS * 2.0,
    )

    if draggable and dragging_q3:
        noFill()
        stroke(rgb[0], rgb[1], rgb[2], 130)
        strokeWeight(4)
        ellipse(
            screen_position[0],
            screen_position[1],
            PARTICLE_RADIUS * 2.0 + 12,
            PARTICLE_RADIUS * 2.0 + 12,
        )

    stroke(255)
    strokeWeight(3)
    fill(rgb[0], rgb[1], rgb[2])
    ellipse(
        screen_position[0],
        screen_position[1],
        PARTICLE_RADIUS * 2.0,
        PARTICLE_RADIUS * 2.0,
    )

    noStroke()
    fill(255)
    textAlign(CENTER, CENTER)
    textSize(22)
    text("+" if charge_c > 0.0 else "-", screen_position[0], screen_position[1] - 2)

    charge_label = "{} = {}".format(label, format_charge(charge_c))
    label_y = screen_position[1] + PARTICLE_RADIUS + 7
    textSize(12)
    label_width = textWidth(charge_label)

    noStroke()
    fill(255, 245)
    rect(
        screen_position[0] - label_width / 2.0 - 5,
        label_y - 2,
        label_width + 10,
        18,
        4,
    )

    fill(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2])
    textAlign(CENTER, TOP)
    text(charge_label, screen_position[0], label_y)


def draw_side_panel(force_state, force_error, pixels_per_newton):
    noStroke()
    fill(27, 35, 50)
    rect(PANEL_LEFT, 0, WINDOW_WIDTH - PANEL_LEFT, WINDOW_HEIGHT)

    panel_x = PANEL_LEFT + 20
    panel_width = WINDOW_WIDTH - PANEL_LEFT - 40

    fill(255)
    textAlign(LEFT, BASELINE)
    textSize(18)
    text(u"Estado de q3", panel_x, 31)

    fill(185, 197, 216)
    textSize(12)
    text(
        "Carga: {}".format(format_charge(q3_charge_c)),
        panel_x,
        57,
    )
    text(
        "Posicao: ({:.2f}, {:.2f}) cm".format(
            q3_position_m[0] * 100.0,
            q3_position_m[1] * 100.0,
        ),
        panel_x,
        77,
    )

    if force_error is not None:
        draw_error_box(panel_x, 98, panel_width, force_error)
        draw_controls(panel_x, 238)
        return

    relative = relative_resultant(
        force_state["FR"],
        force_state["F13"],
        force_state["F23"],
    )
    is_equilibrium = relative < EQUILIBRIUM_RELATIVE_TOLERANCE
    draw_status_box(panel_x, 95, panel_width, is_equilibrium, relative)

    y = 170
    y = draw_force_panel_entry(
        panel_x,
        y,
        COLOR_F13,
        "F13 - forca de q1",
        force_state["F13"],
    )
    y = draw_force_panel_entry(
        panel_x,
        y,
        COLOR_F23,
        "F23 - forca de q2",
        force_state["F23"],
    )
    y = draw_force_panel_entry(
        panel_x,
        y,
        COLOR_FR,
        "FR - resultante",
        force_state["FR"],
    )

    if pixels_per_newton > 0.0:
        maximum_force = MAXIMUM_ARROW_PIXELS / pixels_per_newton
        fill(151, 166, 190)
        textSize(11)
        textAlign(LEFT, BASELINE)
        text(
            "Escala atual: {:.0f} px = {:.3e} N".format(
                MAXIMUM_ARROW_PIXELS,
                maximum_force,
            ),
            panel_x,
            y + 6,
        )
        text(
            u"As três setas usam a mesma escala linear.",
            panel_x,
            y + 23,
        )

    draw_controls(panel_x, 555)


def draw_status_box(x, y, box_width, is_equilibrium, relative):
    if is_equilibrium:
        rgb = COLOR_EQUILIBRIUM
        title = u"EQUILÍBRIO"
        detail = u"A resultante é praticamente nula."
    else:
        rgb = COLOR_FR
        title = u"FORÇA RESULTANTE"
        detail = "|FR| / max(|Fi|) = {:.2e}".format(relative)

    noStroke()
    fill(rgb[0], rgb[1], rgb[2], 38)
    rect(x, y, box_width, 55, 7)

    fill(rgb[0], rgb[1], rgb[2])
    textAlign(LEFT, BASELINE)
    textSize(12)
    text(title, x + 12, y + 21)

    fill(210, 220, 235)
    textSize(11)
    text(detail, x + 12, y + 41)


def draw_error_box(x, y, box_width, message):
    noStroke()
    fill(226, 71, 71, 45)
    rect(x, y, box_width, 112, 7)

    fill(242, 112, 112)
    textAlign(LEFT, BASELINE)
    textSize(12)
    text(u"SINGULARIDADE", x + 12, y + 23)

    fill(225, 232, 243)
    textSize(11)
    text(u"q3 coincide com uma carga fixa.", x + 12, y + 47)
    text(u"A lei de cargas puntiformes não", x + 12, y + 65)
    text(u"possui força finita nesse ponto.", x + 12, y + 83)
    text(u"Afaste q3 para continuar.", x + 12, y + 101)


def draw_force_panel_entry(x, y, rgb, title, force_n):
    stroke(rgb[0], rgb[1], rgb[2])
    strokeWeight(4)
    line(x, y + 3, x + 24, y + 3)

    noStroke()
    fill(239, 243, 250)
    textAlign(LEFT, BASELINE)
    textSize(12)
    text(title, x + 34, y + 7)

    fill(175, 188, 207)
    textSize(11)
    text(
        "Fx = {:+.3e} N".format(force_n[0]),
        x,
        y + 28,
    )
    text(
        "Fy = {:+.3e} N".format(force_n[1]),
        x,
        y + 45,
    )
    text(
        "Modulo = {:.3e} N".format(vector_magnitude(force_n)),
        x,
        y + 62,
    )

    return y + 86


def draw_controls(x, y):
    fill(255)
    textAlign(LEFT, BASELINE)
    textSize(14)
    text("Controles", x, y)

    fill(176, 189, 209)
    textSize(11)
    text(u"Mouse: arrastar q3", x, y + 25)
    text(u"Seta para cima: aumentar |q3|", x, y + 45)
    text(u"Seta para baixo: diminuir |q3|", x, y + 65)
    text(u"S: inverter o sinal de q3", x, y + 85)
    text(u"R: restaurar o equilíbrio", x, y + 105)

    fill(135, 151, 176)
    textSize(10)
    text(u"Faixa: 0,5 a 5,0 uC", x, y + 132)


def format_charge(charge_c):
    return "{:+.1f} uC".format(charge_c * 1.0e6)


def is_mouse_over_q3():
    screen_position = world_to_screen(q3_position_m)
    dx = mouseX - screen_position[0]
    dy = mouseY - screen_position[1]

    return dx * dx + dy * dy <= (PARTICLE_RADIUS + 5.0) ** 2


def update_cursor():
    if dragging_q3 or is_mouse_over_q3():
        cursor(HAND)
    else:
        cursor(ARROW)


def mousePressed():
    global dragging_q3

    if mouseButton == LEFT and is_mouse_over_q3():
        dragging_q3 = True


def mouseDragged():
    global q3_position_m

    if dragging_q3:
        q3_position_m = screen_to_world(mouseX, mouseY)


def mouseReleased():
    global dragging_q3

    dragging_q3 = False


def keyPressed():
    global q3_charge_c
    global q3_position_m

    if key == CODED:
        if keyCode == UP:
            q3_charge_c = change_charge_magnitude(
                q3_charge_c,
                1,
                Q3_STEP_C,
                Q3_MINIMUM_C,
                Q3_MAXIMUM_C,
            )
        elif keyCode == DOWN:
            q3_charge_c = change_charge_magnitude(
                q3_charge_c,
                -1,
                Q3_STEP_C,
                Q3_MINIMUM_C,
                Q3_MAXIMUM_C,
            )
        return

    pressed_key = str(key).lower()
    if pressed_key == 's':
        q3_charge_c = -q3_charge_c
    elif pressed_key == 'r':
        q3_charge_c = Q3_INITIAL_C
        q3_position_m = EQUILIBRIUM_POSITION_M
