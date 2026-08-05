import {
  add,
  angleBetween,
  determinant,
  dot,
  magnitude,
  project,
} from "../nucleo/vetores.js";
import {
  formatDecimal,
} from "../nucleo/formato.js";
import { createMathRenderScheduler } from "./matematica.js";

const SVG_WIDTH = 680;
const SVG_HEIGHT = 440;

const VECTOR_A = "\\vec{A}";
const VECTOR_B = "\\vec{B}";
const VECTOR_R = "\\vec{R}";

function latexDecimal(value, digits) {
  return formatDecimal(value, digits)
    .replace("−", "-")
    .replace(",", "{,}");
}
function latexVector(vector, digits) {
  return (
    "\\left(" +
    latexDecimal(vector.x, digits) +
    "\\,;\\," +
    latexDecimal(vector.y, digits) +
    "\\right)"
  );
}

function latexDegrees(radians, digits = 1) {
  if (radians === null) return "\\text{indefinido}";
  return latexDecimal((radians * 180) / Math.PI, digits) + "^{\\circ}";
}

function displayMath(contents) {
  return '<div class="math-display">\\[' + contents + "\\]</div>";
}

function inlineMath(contents) {
  return "\\(" + contents + "\\)";
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createVectorLabState(initial = {}) {
  return {
    a: { ...(initial.a ?? { x: 4, y: 1 }) },
    b: { ...(initial.b ?? { x: 1, y: 3 }) },
    viewport: {
      minX: initial.viewport?.minX ?? -6,
      maxX: initial.viewport?.maxX ?? 6,
      minY: initial.viewport?.minY ?? -6,
      maxY: initial.viewport?.maxY ?? 6,
    },
    selectedVector: "a",
  };
}

export function calculateVectorMetrics(state) {
  const sum = add(state.a, state.b);
  const scalarProduct = dot(state.a, state.b);
  const tolerance = 1e-10;
  let dotClassification = "nulo";
  if (scalarProduct > tolerance) {
    dotClassification = "positivo";
  } else if (scalarProduct < -tolerance) {
    dotClassification = "negativo";
  }

  return {
    sum,
    magnitudeA: magnitude(state.a),
    magnitudeB: magnitude(state.b),
    magnitudeSum: magnitude(sum),
    dot: scalarProduct,
    determinant: determinant(state.a, state.b),
    angleRadians: angleBetween(state.a, state.b),
    projectionBOnA: project(state.b, state.a),
    dotClassification,
  };
}

export function moveVectorEndpoint(state, name, point) {
  if (
    !["a", "b"].includes(name) ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y)
  ) {
    return false;
  }

  state[name] = {
    x:
      Math.round(
        clamp(point.x, state.viewport.minX, state.viewport.maxX) * 10,
      ) / 10,
    y:
      Math.round(
        clamp(point.y, state.viewport.minY, state.viewport.maxY) * 10,
      ) / 10,
  };
  state.selectedVector = name;
  return true;
}

function toSvgPoint(state, vector) {
  return {
    x:
      ((vector.x - state.viewport.minX) /
        (state.viewport.maxX - state.viewport.minX)) *
      SVG_WIDTH,
    y:
      SVG_HEIGHT -
      ((vector.y - state.viewport.minY) /
        (state.viewport.maxY - state.viewport.minY)) *
        SVG_HEIGHT,
  };
}

function fromSvgPoint(state, x, y) {
  return {
    x:
      state.viewport.minX +
      (x / SVG_WIDTH) * (state.viewport.maxX - state.viewport.minX),
    y:
      state.viewport.minY +
      ((SVG_HEIGHT - y) / SVG_HEIGHT) *
        (state.viewport.maxY - state.viewport.minY),
  };
}

function vectorGridMarkup(state) {
  const markup = [];
  for (
    let x = Math.ceil(state.viewport.minX);
    x <= state.viewport.maxX;
    x += 1
  ) {
    const point = toSvgPoint(state, { x, y: 0 });
    markup.push(
      '<line x1="' +
        point.x +
        '" y1="0" x2="' +
        point.x +
        '" y2="' +
        SVG_HEIGHT +
        '" class="' +
        (x === 0 ? "vector-axis" : "vector-grid-line") +
        '"></line>',
    );
  }
  for (
    let y = Math.ceil(state.viewport.minY);
    y <= state.viewport.maxY;
    y += 1
  ) {
    const point = toSvgPoint(state, { x: 0, y });
    markup.push(
      '<line x1="0" y1="' +
        point.y +
        '" x2="' +
        SVG_WIDTH +
        '" y2="' +
        point.y +
        '" class="' +
        (y === 0 ? "vector-axis" : "vector-grid-line") +
        '"></line>',
    );
  }
  return markup.join("");
}

function vectorDefinitions() {
  return [
    "<defs>",
    '<marker id="vector-arrow-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#008B95"></path></marker>',
    '<marker id="vector-arrow-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#E07A1F"></path></marker>',
    '<marker id="vector-arrow-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#7A3CE7"></path></marker>',
    '<marker id="vector-arrow-projection" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#E3A018"></path></marker>',
    "</defs>",
  ].join("");
}

function vectorLine(start, end, className, markerId, label) {
  return (
    '<line x1="' +
    start.x +
    '" y1="' +
    start.y +
    '" x2="' +
    end.x +
    '" y2="' +
    end.y +
    '" class="' +
    className +
    '" marker-end="url(#' +
    markerId +
    ')"><title>' +
    label +
    "</title></line>"
  );
}

function vectorHandle(point, name, selected) {
  const symbol = name.toUpperCase();
  const labelX = point.x + 15;
  const labelY = point.y - 13;
  const arrowY = labelY - 18;
  const arrowEndX = labelX + 14;
  return (
    '<g class="vector-handle' +
    (selected ? " is-selected" : "") +
    '" data-vector-handle="' +
    name +
    '" tabindex="0" role="button" aria-label="Extremidade do vetor ' +
    name.toUpperCase() +
    '"><circle cx="' +
    point.x +
    '" cy="' +
    point.y +
    '" r="11"></circle><text x="' +
    labelX +
    '" y="' +
    labelY +
    '">' +
    symbol +
    '</text><line x1="' +
    labelX +
    '" y1="' +
    arrowY +
    '" x2="' +
    arrowEndX +
    '" y2="' +
    arrowY +
    '" class="vector-symbol-arrow"></line><path d="M' +
    arrowEndX +
    " " +
    arrowY +
    " L" +
    (arrowEndX - 5) +
    " " +
    (arrowY - 4) +
    " L" +
    (arrowEndX - 5) +
    " " +
    (arrowY + 4) +
    ' Z" class="vector-symbol-arrow-head"></path></g>'
  );
}

function sumSvgMarkup(state, metrics) {
  const origin = toSvgPoint(state, { x: 0, y: 0 });
  const a = toSvgPoint(state, state.a);
  const b = toSvgPoint(state, state.b);
  const sum = toSvgPoint(state, metrics.sum);
  return [
    vectorDefinitions(),
    '<rect width="' +
      SVG_WIDTH +
      '" height="' +
      SVG_HEIGHT +
      '" class="vector-plane-background"></rect>',
    vectorGridMarkup(state),
    '<polygon points="' +
      origin.x +
      "," +
      origin.y +
      " " +
      a.x +
      "," +
      a.y +
      " " +
      sum.x +
      "," +
      sum.y +
      " " +
      b.x +
      "," +
      b.y +
      '" class="vector-parallelogram"></polygon>',
    '<line x1="' +
      a.x +
      '" y1="' +
      a.y +
      '" x2="' +
      sum.x +
      '" y2="' +
      sum.y +
      '" class="vector-helper vector-helper--b"></line>',
    '<line x1="' +
      b.x +
      '" y1="' +
      b.y +
      '" x2="' +
      sum.x +
      '" y2="' +
      sum.y +
      '" class="vector-helper vector-helper--a"></line>',
    vectorLine(origin, a, "vector-line vector-line--a", "vector-arrow-a", "Vetor A"),
    vectorLine(origin, b, "vector-line vector-line--b", "vector-arrow-b", "Vetor B"),
    vectorLine(
      origin,
      sum,
      "vector-line vector-line--resultant",
      "vector-arrow-r",
      "Resultante A mais B",
    ),
    vectorLine(
      a,
      sum,
      "vector-line vector-line--translated",
      "vector-arrow-b",
      "Cópia de B na construção ponta-com-cauda",
    ),
    '<circle cx="' +
      origin.x +
      '" cy="' +
      origin.y +
      '" r="5" class="vector-origin"></circle>',
    vectorHandle(a, "a", state.selectedVector === "a"),
    vectorHandle(b, "b", state.selectedVector === "b"),
  ].join("");
}

function angleArcMarkup(state) {
  const metrics = calculateVectorMetrics(state);
  if (metrics.angleRadians === null) {
    return "";
  }
  const origin = toSvgPoint(state, { x: 0, y: 0 });
  const start = Math.atan2(state.a.y, state.a.x);
  let delta = Math.atan2(state.b.y, state.b.x) - start;
  while (delta > Math.PI) {
    delta -= 2 * Math.PI;
  }
  while (delta < -Math.PI) {
    delta += 2 * Math.PI;
  }
  const points = [];
  const radius = 45;
  for (let index = 0; index <= 16; index += 1) {
    const angle = start + (delta * index) / 16;
    points.push(
      (origin.x + radius * Math.cos(angle)).toFixed(2) +
        "," +
        (origin.y - radius * Math.sin(angle)).toFixed(2),
    );
  }
  return (
    '<polyline points="' +
    points.join(" ") +
    '" class="vector-angle-arc"></polyline>'
  );
}

function dotSvgMarkup(state, metrics) {
  const origin = toSvgPoint(state, { x: 0, y: 0 });
  const a = toSvgPoint(state, state.a);
  const b = toSvgPoint(state, state.b);
  const projection = metrics.projectionBOnA
    ? toSvgPoint(state, metrics.projectionBOnA)
    : null;
  const projectionMarkup = projection
    ? [
        vectorLine(
          origin,
          projection,
          "vector-line vector-line--projection",
          "vector-arrow-projection",
          "Projeção de B sobre A",
        ),
        '<line x1="' +
          b.x +
          '" y1="' +
          b.y +
          '" x2="' +
          projection.x +
          '" y2="' +
          projection.y +
          '" class="projection-helper"></line>',
        '<path d="M ' +
          projection.x +
          " " +
          projection.y +
          " l 9 -2 l 2 9\" class=\"right-angle-mark\"></path>",
      ].join("")
    : "";

  return [
    vectorDefinitions(),
    '<rect width="' +
      SVG_WIDTH +
      '" height="' +
      SVG_HEIGHT +
      '" class="vector-plane-background"></rect>',
    vectorGridMarkup(state),
    angleArcMarkup(state),
    vectorLine(origin, a, "vector-line vector-line--a", "vector-arrow-a", "Vetor A"),
    vectorLine(origin, b, "vector-line vector-line--b", "vector-arrow-b", "Vetor B"),
    projectionMarkup,
    '<circle cx="' +
      origin.x +
      '" cy="' +
      origin.y +
      '" r="5" class="vector-origin"></circle>',
    vectorHandle(a, "a", state.selectedVector === "a"),
    vectorHandle(b, "b", state.selectedVector === "b"),
  ].join("");
}

function classificationText(metrics) {
  if (metrics.angleRadians === null) {
    return "Um dos vetores é nulo: o produto vale zero, mas o ângulo não está definido.";
  }
  if (metrics.dotClassification === "positivo") {
    return "Positivo: o ângulo é agudo e os vetores se reforçam na soma.";
  }
  if (metrics.dotClassification === "negativo") {
    return "Negativo: o ângulo é obtuso e um vetor reduz parte do outro.";
  }
  return "Nulo: os vetores são perpendiculares e não há projeção de um sobre o outro.";
}

function sumReadoutMarkup(state, metrics) {
  const a = latexVector(state.a, 1);
  const b = latexVector(state.b, 1);
  const sum = latexVector(metrics.sum, 1);

  return [
    '<div class="equation-block"><span>Componentes</span>' +
      displayMath(
        "\\begin{aligned}" +
          VECTOR_A +
          "&=" +
          a +
          ",&" +
          VECTOR_B +
          "&=" +
          b +
          "\\\\ " +
          "A_x&=" +
          latexDecimal(state.a.x, 1) +
          ",&A_y&=" +
          latexDecimal(state.a.y, 1) +
          "\\\\ " +
          "B_x&=" +
          latexDecimal(state.b.x, 1) +
          ",&B_y&=" +
          latexDecimal(state.b.y, 1) +
          "\\end{aligned}",
      ) +
      "</div>",
    '<div class="equation-block equation-block--result"><span>Soma por componentes</span>' +
      displayMath(
        "\\begin{aligned}" +
          VECTOR_R +
          "&=" +
          VECTOR_A +
          "+" +
          VECTOR_B +
          "\\\\ R_x&=A_x+B_x=" +
          latexDecimal(state.a.x, 1) +
          "+" +
          latexDecimal(state.b.x, 1) +
          "=" +
          latexDecimal(metrics.sum.x, 1) +
          "\\\\ R_y&=A_y+B_y=" +
          latexDecimal(state.a.y, 1) +
          "+" +
          latexDecimal(state.b.y, 1) +
          "=" +
          latexDecimal(metrics.sum.y, 1) +
          "\\\\ " +
          VECTOR_R +
          "&=" +
          sum +
          "\\\\ \\lVert" +
          VECTOR_R +
          "\\rVert&=\\sqrt{R_x^2+R_y^2}=" +
          latexDecimal(metrics.magnitudeSum, 2) +
          "\\end{aligned}",
      ) +
      "</div>",
    '<dl class="metric-list"><div><dt>' +
      inlineMath("\\lVert" + VECTOR_A + "\\rVert") +
      "</dt><dd>" +
      formatDecimal(metrics.magnitudeA, 2) +
      "</dd></div><div><dt>" +
      inlineMath("\\lVert" + VECTOR_B + "\\rVert") +
      "</dt><dd>" +
      formatDecimal(metrics.magnitudeB, 2) +
      "</dd></div><div><dt>" +
      inlineMath("\\lVert" + VECTOR_R + "\\rVert") +
      "</dt><dd>" +
      formatDecimal(metrics.magnitudeSum, 2) +
      "</dd></div><div><dt>" +
      inlineMath("\\theta") +
      "</dt><dd>" +
      formatDecimal(
        metrics.angleRadians === null
          ? Number.NaN
          : (metrics.angleRadians * 180) / Math.PI,
        1,
      ).replace("NaN", "indefinido") +
      (metrics.angleRadians === null ? "" : "°") +
      "</dd></div></dl>",
  ].join("");
}

function dotReadoutMarkup(state, metrics) {
  const cosine =
    metrics.angleRadians === null ? null : Math.cos(metrics.angleRadians);
  const identityLeft = metrics.magnitudeSum ** 2;
  const identityRight =
    metrics.magnitudeA ** 2 +
    metrics.magnitudeB ** 2 +
    2 * metrics.dot;
  const cosineLine =
    cosine === null
      ? "\\theta&\\text{ não está definido para vetor nulo}"
      : "\\cos\\theta&=\\frac{" +
        VECTOR_A +
        "\\cdot" +
        VECTOR_B +
        "}{\\lVert" +
        VECTOR_A +
        "\\rVert\\lVert" +
        VECTOR_B +
        "\\rVert}=" +
        latexDecimal(cosine, 3);

  return [
    '<div class="equation-block"><span>Produto escalar por componentes</span>' +
      displayMath(
        "\\begin{aligned}" +
          VECTOR_A +
          "\\cdot" +
          VECTOR_B +
          "&=A_xB_x+A_yB_y\\\\ &=" +
          latexDecimal(state.a.x, 1) +
          "\\cdot" +
          latexDecimal(state.b.x, 1) +
          "+" +
          latexDecimal(state.a.y, 1) +
          "\\cdot" +
          latexDecimal(state.b.y, 1) +
          "\\\\ &=" +
          latexDecimal(metrics.dot, 2) +
          "\\end{aligned}",
      ) +
      "</div>",
    '<div class="equation-block"><span>Produto escalar por projeção</span>' +
      displayMath(
        "\\begin{aligned}" +
          VECTOR_A +
          "\\cdot" +
          VECTOR_B +
          "&=\\lVert" +
          VECTOR_A +
          "\\rVert\\lVert" +
          VECTOR_B +
          "\\rVert\\cos\\theta\\\\ " +
          cosineLine +
          "\\end{aligned}",
      ) +
      "</div>",
    '<p class="classification classification--' +
      metrics.dotClassification +
      '"><strong>Produto ' +
      metrics.dotClassification +
      ".</strong> " +
      classificationText(metrics) +
      "</p>",
    '<div class="equation-block equation-block--result"><span>Produto escalar no módulo da soma</span>' +
      displayMath(
        "\\begin{aligned}" +
          "\\lVert" +
          VECTOR_R +
          "\\rVert^2&=\\lVert" +
          VECTOR_A +
          "\\rVert^2+\\lVert" +
          VECTOR_B +
          "\\rVert^2+2" +
          VECTOR_A +
          "\\cdot" +
          VECTOR_B +
          "\\\\ " +
          latexDecimal(identityLeft, 2) +
          "&=" +
          latexDecimal(metrics.magnitudeA ** 2, 2) +
          "+" +
          latexDecimal(metrics.magnitudeB ** 2, 2) +
          "+2(" +
          latexDecimal(metrics.dot, 2) +
          ")\\\\" +
          "&=" +
          latexDecimal(identityRight, 2) +
          "\\end{aligned}",
      ) +
      "</div>",
    '<aside class="area-warning"><strong>Área não é produto escalar</strong><p>A área usa a componente perpendicular e o seno; o produto escalar usa a projeção paralela e o cosseno.</p>' +
      displayMath(
        "\\begin{aligned}\\mathcal{A}&=\\lvert\\det(" +
          VECTOR_A +
          "," +
          VECTOR_B +
          ")\\rvert\\\\ &=\\lvert A_xB_y-A_yB_x\\rvert\\\\ &=\\lVert" +
          VECTOR_A +
          "\\rVert\\lVert" +
          VECTOR_B +
          "\\rVert\\lvert\\sin\\theta\\rvert\\\\ &=" +
          latexDecimal(Math.abs(metrics.determinant), 2) +
          "\\end{aligned}",
      ) +
      "</aside>",
  ].join("");
}

function theoryMarkup(state, metrics) {
  const cosine =
    metrics.angleRadians === null ? null : Math.cos(metrics.angleRadians);
  const projectionValue =
    cosine === null
      ? "\\text{indefinido}"
      : latexDecimal(metrics.magnitudeB * cosine, 2);

  return [
    '<div class="theory-intro"><p class="eyebrow">Uma dedução em seis passos</p><h2>Da componente à resultante</h2><p>Os valores acompanham ' +
      inlineMath(VECTOR_A + "=" + latexVector(state.a, 1)) +
      " e " +
      inlineMath(VECTOR_B + "=" + latexVector(state.b, 1)) +
      ".</p></div>",
    '<div class="theory-flow">',
    '<article><span>01</span><h3>Componentes</h3><p>Um vetor no plano reúne deslocamentos horizontal e vertical.</p>' +
      displayMath(
        VECTOR_A +
          "=A_x\\hat{\\vec{x}}+A_y\\hat{\\vec{y}}=" +
          latexVector(state.a, 1),
      ) +
      "</article>",
    '<article><span>02</span><h3>Módulo</h3><p>As componentes são catetos ortogonais; o teorema de Pitágoras fornece o comprimento.</p>' +
      displayMath(
        "\\lVert" +
          VECTOR_A +
          "\\rVert=\\sqrt{A_x^2+A_y^2}=" +
          latexDecimal(metrics.magnitudeA, 2),
      ) +
      "</article>",
    '<article><span>03</span><h3>Soma</h3><p>Somam-se componentes associadas ao mesmo eixo. A diagonal do paralelogramo representa a resultante.</p>' +
      displayMath(
        "\\begin{aligned}" +
          VECTOR_R +
          "&=" +
          VECTOR_A +
          "+" +
          VECTOR_B +
          "\\\\ &=(A_x+B_x)\\hat{\\vec{x}}+(A_y+B_y)\\hat{\\vec{y}}" +
          "\\\\ &=" +
          latexVector(metrics.sum, 1) +
          "\\end{aligned}",
      ) +
      "</article>",
    '<article><span>04</span><h3>Projeção e cosseno</h3><p>A projeção assinada de um vetor sobre o outro mede quanto eles apontam na mesma direção.</p>' +
      displayMath(
        "\\begin{aligned}\\operatorname{comp}_{\\vec{A}}" +
          VECTOR_B +
          "&=\\frac{" +
          VECTOR_A +
          "\\cdot" +
          VECTOR_B +
          "}{\\lVert" +
          VECTOR_A +
          "\\rVert}\\\\ &=\\lVert" +
          VECTOR_B +
          "\\rVert\\cos\\theta=" +
          projectionValue +
          "\\end{aligned}",
      ) +
      "</article>",
    '<article><span>05</span><h3>Módulo da soma</h3><p>Ao expandir o produto da resultante por ela mesma surgem dois termos cruzados iguais.</p>' +
      displayMath(
        "\\begin{aligned}\\lVert" +
          VECTOR_A +
          "+" +
          VECTOR_B +
          "\\rVert^2&=(" +
          VECTOR_A +
          "+" +
          VECTOR_B +
          ")\\cdot(" +
          VECTOR_A +
          "+" +
          VECTOR_B +
          ")\\\\ &=\\lVert" +
          VECTOR_A +
          "\\rVert^2+\\lVert" +
          VECTOR_B +
          "\\rVert^2+2" +
          VECTOR_A +
          "\\cdot" +
          VECTOR_B +
          "\\end{aligned}",
      ) +
      "</article>",
    '<article class="theory-warning"><span>06</span><h3>E a área?</h3><p>O paralelogramo mede a componente perpendicular. Por isso sua área envolve seno e determinante, não produto escalar.</p>' +
      displayMath(
        "\\mathcal{A}=\\lvert\\det(" +
          VECTOR_A +
          "," +
          VECTOR_B +
          ")\\rvert=\\lVert" +
          VECTOR_A +
          "\\rVert\\lVert" +
          VECTOR_B +
          "\\rVert\\lvert\\sin\\theta\\rvert=" +
          latexDecimal(Math.abs(metrics.determinant), 2),
      ) +
      "</article>",
    "</div>",
  ].join("");
}

export function createVectorReadoutMarkup(state) {
  const metrics = calculateVectorMetrics(state);
  return {
    sum: sumReadoutMarkup(state, metrics),
    dot: dotReadoutMarkup(state, metrics),
    theory: theoryMarkup(state, metrics),
  };
}

function labShell(kind) {
  return [
    '<div class="vector-lab">',
    '<section class="vector-stage-panel">',
    '<div class="stage-readout"><span>' +
      (kind === "sum"
        ? "PARALELOGRAMO + PONTA-COM-CAUDA"
        : "ÂNGULO + PROJEÇÃO") +
      '</span><span>Arraste A ou B</span></div>',
    '<svg class="vector-plane" data-vector-plane="' +
      kind +
      '" viewBox="0 0 680 440" role="application" tabindex="0" aria-label="Plano vetorial interativo"></svg>',
    '<p class="keyboard-guide"><strong>Teclado:</strong> clique em A ou B; use as setas para ajustar a extremidade.</p>',
    "</section>",
    '<aside class="vector-readout" data-vector-readout="' +
      kind +
      '"></aside>',
    "</div>",
  ].join("");
}

export function mountVectorLabs(roots, initial = {}, options = {}) {
  let state = createVectorLabState(initial);
  let dragging = null;

  roots.sum.innerHTML = labShell("sum");
  roots.dot.innerHTML = labShell("dot");
  const planes = [
    roots.sum.querySelector("[data-vector-plane]"),
    roots.dot.querySelector("[data-vector-plane]"),
  ];
  const mathRoot =
    options.mathRoot ?? roots.sum.closest?.("[data-tabs]") ?? roots.theory;
  const scheduleMath = createMathRenderScheduler(
    options.typesetMath,
    options.requestFrame,
  );

  function render() {
    const metrics = calculateVectorMetrics(state);
    const markup = createVectorReadoutMarkup(state);
    planes[0].innerHTML = sumSvgMarkup(state, metrics);
    planes[1].innerHTML = dotSvgMarkup(state, metrics);
    roots.sum.querySelector("[data-vector-readout]").innerHTML =
      markup.sum;
    roots.dot.querySelector("[data-vector-readout]").innerHTML =
      markup.dot;
    roots.theory.innerHTML = markup.theory;
    scheduleMath(mathRoot);
  }

  function pointFromEvent(plane, event) {
    const rectangle = plane.getBoundingClientRect();
    const x = ((event.clientX - rectangle.left) / rectangle.width) * SVG_WIDTH;
    const y = ((event.clientY - rectangle.top) / rectangle.height) * SVG_HEIGHT;
    return fromSvgPoint(state, x, y);
  }

  const listeners = [];
  for (const plane of planes) {
    const pointerDown = (event) => {
      const handle = event.target.closest("[data-vector-handle]");
      if (!handle) {
        return;
      }
      dragging = handle.dataset.vectorHandle;
      state.selectedVector = dragging;
      plane.setPointerCapture(event.pointerId);
      render();
    };
    const pointerMove = (event) => {
      if (dragging === null || !plane.hasPointerCapture(event.pointerId)) {
        return;
      }
      moveVectorEndpoint(state, dragging, pointFromEvent(plane, event));
      render();
    };
    const pointerUp = (event) => {
      if (plane.hasPointerCapture(event.pointerId)) {
        plane.releasePointerCapture(event.pointerId);
      }
      dragging = null;
    };
    const keyDown = (event) => {
      const step = event.shiftKey ? 1 : 0.2;
      const delta = {
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 },
        ArrowUp: { x: 0, y: step },
        ArrowDown: { x: 0, y: -step },
      }[event.key];
      if (!delta) {
        return;
      }
      const current = state[state.selectedVector];
      moveVectorEndpoint(state, state.selectedVector, {
        x: current.x + delta.x,
        y: current.y + delta.y,
      });
      event.preventDefault();
      render();
    };
    plane.addEventListener("pointerdown", pointerDown);
    plane.addEventListener("pointermove", pointerMove);
    plane.addEventListener("pointerup", pointerUp);
    plane.addEventListener("pointercancel", pointerUp);
    plane.addEventListener("keydown", keyDown);
    listeners.push({ plane, pointerDown, pointerMove, pointerUp, keyDown });
  }

  render();
  return {
    getState() {
      return state;
    },
    reset() {
      state = createVectorLabState(initial);
      render();
    },
    destroy() {
      for (const listener of listeners) {
        listener.plane.removeEventListener("pointerdown", listener.pointerDown);
        listener.plane.removeEventListener("pointermove", listener.pointerMove);
        listener.plane.removeEventListener("pointerup", listener.pointerUp);
        listener.plane.removeEventListener("pointercancel", listener.pointerUp);
        listener.plane.removeEventListener("keydown", listener.keyDown);
      }
      roots.sum.replaceChildren();
      roots.dot.replaceChildren();
      roots.theory.replaceChildren();
    },
  };
}
