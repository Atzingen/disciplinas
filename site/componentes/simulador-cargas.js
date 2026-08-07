import {
  calculateForceSystem,
  ElectrostaticSingularityError,
} from "../nucleo/eletrostatica.js";
import { magnitude } from "../nucleo/vetores.js";
import { createMathRenderScheduler } from "./matematica.js";

const FORCE_COLORS = [
  "#008B95",
  "#E07A1F",
  "#2D8659",
  "#BD3F85",
  "#6C63B7",
  "#7A6511",
];
const SVG_WIDTH = 800;
const SVG_HEIGHT = 480;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function subscript(number) {
  const digits = "₀₁₂₃₄₅₆₇₈₉";
  return String(number)
    .split("")
    .map((digit) => digits[Number(digit)])
    .join("");
}

function sourceNumber(source) {
  const match = String(source.id).match(/^q(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function selectedCharge(state) {
  if (state.selectedId === state.testCharge.id) {
    return state.testCharge;
  }
  return state.sources.find((source) => source.id === state.selectedId) ?? null;
}

function selectedSource(state) {
  return state.sources.find((source) => source.id === state.selectedId) ?? null;
}

export function createSimulatorState(preset) {
  const sources = preset.sources.map((source) => ({ ...source }));
  const nextSourceNumber =
    Math.max(0, ...sources.map((source) => sourceNumber(source))) + 1;

  return {
    id: preset.id,
    title: preset.title,
    resetLabel: preset.resetLabel,
    maxSources: preset.maxSources,
    lockSources: Boolean(preset.lockSources),
    viewport: { ...preset.viewport },
    sources,
    testCharge: { ...preset.testCharge },
    selectedId: preset.testCharge.id,
    nextSourceNumber,
    message: "",
  };
}

export function addSource(state) {
  if (state.lockSources || state.sources.length >= state.maxSources) {
    return false;
  }

  const number = state.nextSourceNumber;
  const angle = ((number - 1) * 2 * Math.PI) / state.maxSources;
  const usedColors = new Set(
    state.sources.map((existingSource) => existingSource.vectorColor),
  );
  const vectorColor =
    FORCE_COLORS.find((color) => !usedColors.has(color)) ??
    FORCE_COLORS[(number - 1) % FORCE_COLORS.length];
  const source = {
    id: "q" + String(number),
    label: "q" + subscript(number),
    xCm: Number((10 * Math.cos(angle)).toFixed(1)),
    yCm: Number((7 * Math.sin(angle)).toFixed(1)),
    magnitudeMicroC: 1,
    sign: 1,
    vectorColor,
  };

  state.sources.push(source);
  state.selectedId = source.id;
  state.nextSourceNumber += 1;
  state.message = "Fonte " + source.label + " adicionada.";
  return true;
}

export function removeSelectedSource(state) {
  if (state.lockSources || state.selectedId === state.testCharge.id) {
    return false;
  }

  const index = state.sources.findIndex(
    (source) => source.id === state.selectedId,
  );
  if (index === -1) {
    return false;
  }

  const removed = state.sources.splice(index, 1)[0];
  state.selectedId = state.testCharge.id;
  state.message = "Fonte " + removed.label + " removida.";
  return true;
}

export function moveSelected(state, dxCm, dyCm) {
  const charge = selectedCharge(state);
  if (
    charge === null ||
    !Number.isFinite(dxCm) ||
    !Number.isFinite(dyCm) ||
    (state.lockSources && selectedSource(state))
  ) {
    return false;
  }

  charge.xCm = clamp(
    charge.xCm + dxCm,
    state.viewport.minX,
    state.viewport.maxX,
  );
  charge.yCm = clamp(
    charge.yCm + dyCm,
    state.viewport.minY,
    state.viewport.maxY,
  );
  return true;
}

export function setSelectedMagnitude(state, magnitudeMicroC) {
  const charge = selectedCharge(state);
  if (
    charge === null ||
    !Number.isFinite(magnitudeMicroC) ||
    (state.lockSources && selectedSource(state))
  ) {
    return charge?.magnitudeMicroC ?? null;
  }

  const adjusted = Math.round(clamp(magnitudeMicroC, 0.1, 10) * 10) / 10;
  charge.magnitudeMicroC = adjusted;
  return adjusted;
}

export function flipSelectedSign(state) {
  const charge = selectedCharge(state);
  if (charge === null) {
    return null;
  }
  if (state.lockSources && selectedSource(state)) {
    return charge.sign;
  }
  charge.sign *= -1;
  return charge.sign;
}

export function calculateArrowScale(forceSystem, maximumPixels = 125) {
  const magnitudes = [
    ...forceSystem.individual.map((entry) => magnitude(entry.force)),
    magnitude(forceSystem.resultant),
  ];
  const largest = Math.max(0, ...magnitudes);
  return largest <= Number.EPSILON ? 0 : maximumPixels / largest;
}

function chargeValue(charge) {
  const sign = charge.sign > 0 ? "+" : "−";
  return sign + charge.magnitudeMicroC.toFixed(1).replace(".", ",") + " µC";
}

function forceLatexValue(value) {
  if (Math.abs(value) < 1e-14) return "0{,}00";

  const parts = value.toExponential(2).split("e");
  return (
    parts[0].replace(".", "{,}") +
    "\\times10^{" +
    String(Number(parts[1])) +
    "}"
  );
}

function displayMath(contents) {
  return '<div class="math-display">\\[' + contents + "\\]</div>";
}

function forceSubscript(source) {
  const number = sourceNumber(source);
  return number > 0 ? String(number) + "\\to t" : "i\\to t";
}

function forceVectorLatex(force) {
  return (
    "\\left(" +
    forceLatexValue(force.x) +
    "\\,;\\," +
    forceLatexValue(force.y) +
    "\\right)"
  );
}

function toSvgPoint(state, xCm, yCm) {
  const x =
    ((xCm - state.viewport.minX) /
      (state.viewport.maxX - state.viewport.minX)) *
    SVG_WIDTH;
  const y =
    SVG_HEIGHT -
    ((yCm - state.viewport.minY) /
      (state.viewport.maxY - state.viewport.minY)) *
      SVG_HEIGHT;
  return { x, y };
}

function fromSvgPoint(state, x, y) {
  const xCm =
    state.viewport.minX +
    (x / SVG_WIDTH) * (state.viewport.maxX - state.viewport.minX);
  const yCm =
    state.viewport.minY +
    ((SVG_HEIGHT - y) / SVG_HEIGHT) *
      (state.viewport.maxY - state.viewport.minY);
  return {
    xCm: Number(clamp(xCm, state.viewport.minX, state.viewport.maxX).toFixed(1)),
    yCm: Number(clamp(yCm, state.viewport.minY, state.viewport.maxY).toFixed(1)),
  };
}

function gridMarkup(state) {
  const lines = [];
  const startX = Math.ceil(state.viewport.minX / 2) * 2;
  const startY = Math.ceil(state.viewport.minY / 2) * 2;

  for (let value = startX; value <= state.viewport.maxX; value += 2) {
    const point = toSvgPoint(state, value, 0);
    const isAxis = value === 0;
    lines.push(
      '<line x1="' +
        point.x +
        '" y1="0" x2="' +
        point.x +
        '" y2="' +
        SVG_HEIGHT +
        '" class="' +
        (isAxis ? "plane-axis" : "plane-grid-line") +
        '"></line>',
    );
    if (value % 10 === 0 && !isAxis) {
      lines.push(
        '<text x="' +
          (point.x + 5) +
          '" y="' +
          (toSvgPoint(state, 0, 0).y - 7) +
          '" class="plane-tick">' +
          value +
          "</text>",
      );
    }
  }

  for (let value = startY; value <= state.viewport.maxY; value += 2) {
    const point = toSvgPoint(state, 0, value);
    const isAxis = value === 0;
    lines.push(
      '<line x1="0" y1="' +
        point.y +
        '" x2="' +
        SVG_WIDTH +
        '" y2="' +
        point.y +
        '" class="' +
        (isAxis ? "plane-axis" : "plane-grid-line") +
        '"></line>',
    );
    if (value % 10 === 0 && !isAxis) {
      lines.push(
        '<text x="' +
          (toSvgPoint(state, 0, 0).x + 7) +
          '" y="' +
          (point.y - 5) +
          '" class="plane-tick">' +
          value +
          "</text>",
      );
    }
  }

  const axisOrigin = toSvgPoint(state, 0, 0);
  lines.push(
    '<text x="' +
      (SVG_WIDTH - 32) +
      '" y="' +
      (axisOrigin.y - 9) +
      '" class="plane-axis-label">x (cm)</text>',
    '<text x="' +
      (axisOrigin.x + 9) +
      '" y="20" class="plane-axis-label">y (cm)</text>',
  );
  return lines.join("");
}

function markerMarkup(id, color) {
  return (
    '<marker id="' +
    id +
    '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M 0 0 L 10 5 L 0 10 z" fill="' +
    color +
    '"></path></marker>'
  );
}

function forceMarkup(state, forceSystem) {
  const markup = [];
  const origin = toSvgPoint(
    state,
    state.testCharge.xCm,
    state.testCharge.yCm,
  );
  const arrowScale = calculateArrowScale(forceSystem);

  for (const entry of forceSystem.individual) {
    const color = entry.source.vectorColor;
    const markerId = "arrow-" + entry.source.id;
    const endX = origin.x + entry.force.x * arrowScale;
    const endY = origin.y - entry.force.y * arrowScale;
    markup.push(
      '<line x1="' +
        origin.x +
        '" y1="' +
        origin.y +
        '" x2="' +
        endX +
        '" y2="' +
        endY +
        '" class="force-arrow" style="--vector-color:' +
        color +
        '" marker-end="url(#' +
        markerId +
        ')"><title>Força de ' +
        entry.source.label +
        " sobre " +
        state.testCharge.label +
        "</title></line>",
    );
  }

  const resultantMagnitude = magnitude(forceSystem.resultant);
  if (resultantMagnitude <= 1e-14 || arrowScale === 0) {
    markup.push(
      '<circle cx="' +
        origin.x +
        '" cy="' +
        origin.y +
        '" r="7" class="resultant-zero"><title>Resultante nula</title></circle>',
    );
  } else {
    markup.push(
      '<line x1="' +
        origin.x +
        '" y1="' +
        origin.y +
        '" x2="' +
        (origin.x + forceSystem.resultant.x * arrowScale) +
        '" y2="' +
        (origin.y - forceSystem.resultant.y * arrowScale) +
        '" class="resultant-arrow" marker-end="url(#arrow-resultant)"><title>Força resultante</title></line>',
    );
  }

  return markup.join("");
}

function chargeMarkup(state, charge, kind, index = 0) {
  const point = toSvgPoint(state, charge.xCm, charge.yCm);
  const selected = state.selectedId === charge.id;
  const fixed = kind === "source" && state.lockSources;
  const color =
    kind === "source" ? charge.vectorColor : "var(--ink, #142A3B)";
  const classes = [
    "charge-node",
    charge.sign > 0 ? "charge-node--positive" : "charge-node--negative",
    selected ? "is-selected" : "",
    fixed ? "is-fixed" : "",
    kind === "test" ? "charge-node--test" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const symbol = charge.sign > 0 ? "+" : "−";
  const numberBadge =
    kind === "source"
      ? '<circle cx="' +
        (point.x + 20) +
        '" cy="' +
        (point.y - 20) +
        '" r="10" fill="' +
        color +
        '" class="charge-force-badge"></circle><text x="' +
        (point.x + 20) +
        '" y="' +
        (point.y - 16.5) +
        '" class="charge-force-number">' +
        String(index + 1) +
        "</text>"
      : "";

  return (
    '<g class="' +
    classes +
    '" data-charge-id="' +
    charge.id +
    '" tabindex="0" role="button" aria-label="' +
    charge.label +
    ", " +
    chargeValue(charge) +
    '">' +
    '<circle cx="' +
    point.x +
    '" cy="' +
    point.y +
    '" r="' +
    (kind === "test" ? 19 : 17) +
    '" class="charge-disc" style="--force-ring:' +
    color +
    '"></circle>' +
    '<text x="' +
    point.x +
    '" y="' +
    (point.y + 7) +
    '" class="charge-sign">' +
    symbol +
    "</text>" +
    numberBadge +
    '<g class="charge-label" transform="translate(' +
    (point.x + 25) +
    " " +
    (point.y + 30) +
    ')"><rect x="-4" y="-15" width="112" height="23" rx="3"></rect><text x="2" y="1">' +
    charge.label +
    " · " +
    chargeValue(charge) +
    "</text></g></g>"
  );
}

function svgMarkup(state, forceSystem) {
  const markers = state.sources
    .map((source) => markerMarkup("arrow-" + source.id, source.vectorColor))
    .join("");
  const forces = forceSystem ? forceMarkup(state, forceSystem) : "";
  const sources = state.sources
    .map((source, index) => chargeMarkup(state, source, "source", index))
    .join("");
  const test = chargeMarkup(state, state.testCharge, "test");

  return (
    "<defs>" +
    markers +
    markerMarkup("arrow-resultant", "#7A3CE7") +
    "</defs>" +
    '<rect width="' +
    SVG_WIDTH +
    '" height="' +
    SVG_HEIGHT +
    '" class="plane-background"></rect>' +
    gridMarkup(state) +
    '<g class="force-layer">' +
    forces +
    '</g><g class="charge-layer">' +
    sources +
    test +
    "</g>"
  );
}

export function forceEquationsMarkup(state, forceSystem) {
  const law = [
    '<div class="equation-block"><span>Lei de Coulomb vetorial</span>',
    displayMath(
      "\\vec{F}_{i\\to t}=k\\frac{q_iq_t}{\\lVert\\vec{r}_t-\\vec{r}_i\\rVert^3}" +
        "\\left(\\vec{r}_t-\\vec{r}_i\\right)",
    ),
    '<p class="equation-caption">O sinal de \\(q_iq_t\\) determina atração ou repulsão; o vetor posição determina a direção.</p></div>',
  ].join("");

  if (!forceSystem) {
    return (
      law +
      '<p class="simulator-equation-warning">Separe as cargas coincidentes para calcular componentes e resultante.</p>'
    );
  }

  const componentLines = forceSystem.individual.map(
    (entry) =>
      "\\vec{F}_{" +
      forceSubscript(entry.source) +
      "}&=" +
      forceVectorLatex(entry.force) +
      "\\,\\mathrm{N}",
  );
  componentLines.push(
    "\\vec{F}_{\\mathrm{res}}&=\\sum_i\\vec{F}_{i\\to t}=" +
      forceVectorLatex(forceSystem.resultant) +
      "\\,\\mathrm{N}",
  );
  componentLines.push(
    "\\lVert\\vec{F}_{\\mathrm{res}}\\rVert&=" +
      forceLatexValue(magnitude(forceSystem.resultant)) +
      "\\,\\mathrm{N}",
  );

  return (
    law +
    '<div class="equation-block equation-block--result"><span>Componentes e superposição</span>' +
    displayMath(
      "\\begin{aligned}" +
        componentLines.join("\\\\") +
        "\\end{aligned}",
    ) +
    "</div>"
  );
}

function forceTableMarkup(state, forceSystem) {
  if (!forceSystem) {
    return "";
  }

  const rows = forceSystem.individual.map((entry) => {
    const module = magnitude(entry.force);
    return (
      '<tr><th scope="row"><span class="force-swatch" style="--vector-color:' +
      entry.source.vectorColor +
      '"></span>\\(\\vec{F}_{' +
      forceSubscript(entry.source) +
      "}\\)</th><td>\\(" +
      forceLatexValue(entry.force.x) +
      "\\)</td><td>\\(" +
      forceLatexValue(entry.force.y) +
      "\\)</td><td>\\(" +
      forceLatexValue(module) +
      "\\)" +
      "</td></tr>"
    );
  });
  const resultant = forceSystem.resultant;
  rows.push(
    '<tr class="force-result-row"><th scope="row"><span class="force-swatch force-swatch--resultant"></span>\\(\\vec{F}_{\\mathrm{res}}\\)</th><td>\\(' +
      forceLatexValue(resultant.x) +
      "\\)</td><td>\\(" +
      forceLatexValue(resultant.y) +
      "\\)</td><td>\\(" +
      forceLatexValue(magnitude(resultant)) +
      "\\)</td></tr>",
  );
  return rows.join("");
}

function simulatorShell() {
  return [
    '<div class="charge-lab">',
    '<section class="charge-stage-panel" aria-label="Plano das cargas">',
    '<div class="stage-readout"><span data-stage-selection></span><span>Escala vetorial automática e comum</span></div>',
    '<svg class="charge-plane" viewBox="0 0 800 480" role="application" tabindex="0" aria-label="Plano cartesiano interativo. Selecione e arraste as cargas."></svg>',
    '<p class="keyboard-guide"><strong>Teclado no plano:</strong> setas movem · Shift acelera · +/− altera a carga · S troca o sinal · A adiciona · Delete remove · R restaura</p>',
    "</section>",
    '<aside class="charge-control-panel" aria-label="Controles e resultados">',
    '<section class="control-block selected-charge-panel"><p class="control-kicker">Item selecionado</p><h3 data-selected-label></h3>',
    '<p class="selected-position" data-selected-position></p>',
    '<label class="magnitude-control"><span>Módulo da carga (µC)</span><input type="number" min="0.1" max="10" step="0.1" inputmode="decimal" data-magnitude></label>',
    '<button type="button" class="control-button" data-action="flip-sign">Trocar sinal <span data-sign-value></span></button>',
    "</section>",
    '<section class="control-block"><div class="control-heading"><div><p class="control-kicker">Fontes</p><h3>Cargas no plano</h3></div><span data-source-count></span></div>',
    '<div class="source-list" data-source-list></div>',
    '<div class="button-row"><button type="button" class="control-button control-button--primary" data-action="add-source">Adicionar carga</button><button type="button" class="control-button" data-action="remove-source">Remover</button></div>',
    '<button type="button" class="control-button control-button--reset" data-action="reset"></button>',
    "</section>",
    '<section class="control-block results-block"><div class="control-heading"><div><p class="control-kicker">Superposição</p><h3>Forças sobre a carga de prova</h3></div><span>SI</span></div>',
    '<div class="force-equations" data-force-equations></div>',
    '<div class="table-scroll"><table class="force-table"><thead><tr><th>Vetor</th><th>\\(F_x\\)</th><th>\\(F_y\\)</th><th>\\(\\lVert\\vec{F}\\rVert\\)</th></tr></thead><tbody data-force-table></tbody></table></div>',
    '<p class="simulator-message" data-simulator-message aria-live="polite"></p>',
    "</section>",
    "</aside>",
    "</div>",
  ].join("");
}

export function mountChargeSimulator(root, preset, options = {}) {
  let state = createSimulatorState(preset);
  let draggingId = null;
  let forceSystem = null;

  root.innerHTML = simulatorShell();
  const svg = root.querySelector(".charge-plane");
  const selectionReadout = root.querySelector("[data-stage-selection]");
  const selectedLabel = root.querySelector("[data-selected-label]");
  const selectedPosition = root.querySelector("[data-selected-position]");
  const magnitudeInput = root.querySelector("[data-magnitude]");
  const flipSignButton = root.querySelector('[data-action="flip-sign"]');
  const signValue = root.querySelector("[data-sign-value]");
  const sourceCount = root.querySelector("[data-source-count]");
  const sourceList = root.querySelector("[data-source-list]");
  const forceEquations = root.querySelector("[data-force-equations]");
  const forceTable = root.querySelector("[data-force-table]");
  const message = root.querySelector("[data-simulator-message]");
  const addButton = root.querySelector('[data-action="add-source"]');
  const removeButton = root.querySelector('[data-action="remove-source"]');
  const resetButton = root.querySelector('[data-action="reset"]');
  const scheduleMath = createMathRenderScheduler(
    options.typesetMath,
    options.requestFrame,
  );

  function render() {
    let calculationError = "";
    try {
      forceSystem = calculateForceSystem(state.sources, state.testCharge);
    } catch (error) {
      forceSystem = null;
      calculationError =
        error instanceof ElectrostaticSingularityError
          ? "Singularidade: a carga de prova coincide com " +
            error.sourceId +
            ". Separe as cargas para calcular as forças."
          : "Não foi possível calcular as forças.";
    }

    svg.innerHTML = svgMarkup(state, forceSystem);
    const selected = selectedCharge(state);
    const selectedIsSource = Boolean(selectedSource(state));
    const selectedIsLockedSource = state.lockSources && selectedIsSource;
    selectionReadout.textContent =
      selected.label +
      " em (" +
      selected.xCm.toFixed(1).replace(".", ",") +
      "; " +
      selected.yCm.toFixed(1).replace(".", ",") +
      ") cm";
    selectedLabel.textContent = selected.label + " · " + chargeValue(selected);
    selectedPosition.textContent =
      "x = " +
      selected.xCm.toFixed(1).replace(".", ",") +
      " cm · y = " +
      selected.yCm.toFixed(1).replace(".", ",") +
      " cm";
    magnitudeInput.value = selected.magnitudeMicroC.toFixed(1);
    magnitudeInput.disabled = selectedIsLockedSource;
    magnitudeInput.title = selectedIsLockedSource
      ? "A carga desta fonte é fixa neste exercício."
      : "";
    flipSignButton.disabled = selectedIsLockedSource;
    flipSignButton.title = magnitudeInput.title;
    signValue.textContent = selected.sign > 0 ? "(agora positiva)" : "(agora negativa)";
    sourceCount.textContent =
      String(state.sources.length) + " / " + String(state.maxSources);
    sourceList.innerHTML = state.sources
      .map(
        (source, index) =>
          '<button type="button" class="source-chip' +
          (state.selectedId === source.id ? " is-selected" : "") +
          '" data-select-charge="' +
          source.id +
          '"><span class="force-swatch" style="--vector-color:' +
          source.vectorColor +
          '"></span><span>' +
          String(index + 1) +
          " · " +
          source.label +
          "</span><small>" +
          chargeValue(source) +
          "</small></button>",
      )
      .join("");
    sourceList.insertAdjacentHTML(
      "beforeend",
      '<button type="button" class="source-chip source-chip--test' +
        (state.selectedId === state.testCharge.id ? " is-selected" : "") +
        '" data-select-charge="' +
        state.testCharge.id +
        '"><span class="test-swatch">T</span><span>' +
        state.testCharge.label +
        "</span><small>" +
        chargeValue(state.testCharge) +
        "</small></button>",
    );
    forceEquations.innerHTML = forceEquationsMarkup(state, forceSystem);
    forceTable.innerHTML = forceTableMarkup(state, forceSystem);
    message.textContent = calculationError || state.message;
    message.classList.toggle("is-error", Boolean(calculationError));
    addButton.disabled =
      state.lockSources || state.sources.length >= state.maxSources;
    addButton.title = state.lockSources
      ? "As duas fontes são fixas neste exercício."
      : state.sources.length >= state.maxSources
        ? "Limite de seis fontes atingido."
        : "";
    removeButton.disabled = state.lockSources || !selectedIsSource;
    resetButton.textContent = state.resetLabel;
    scheduleMath(root);
  }

  function selectFromTarget(target) {
    const chargeNode = target.closest("[data-charge-id]");
    if (!chargeNode) {
      return null;
    }
    state.selectedId = chargeNode.dataset.chargeId;
    return selectedCharge(state);
  }

  function pointerPosition(event) {
    const rectangle = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rectangle.left) / rectangle.width) * SVG_WIDTH,
      y: ((event.clientY - rectangle.top) / rectangle.height) * SVG_HEIGHT,
    };
  }

  function handlePointerDown(event) {
    const charge = selectFromTarget(event.target);
    if (!charge) {
      return;
    }
    const isLockedSource = state.lockSources && Boolean(selectedSource(state));
    if (!isLockedSource) {
      draggingId = charge.id;
      svg.setPointerCapture(event.pointerId);
    }
    render();
  }

  function handlePointerMove(event) {
    if (draggingId === null || !svg.hasPointerCapture(event.pointerId)) {
      return;
    }
    state.selectedId = draggingId;
    const charge = selectedCharge(state);
    const point = pointerPosition(event);
    const position = fromSvgPoint(state, point.x, point.y);
    charge.xCm = position.xCm;
    charge.yCm = position.yCm;
    state.message = "";
    render();
  }

  function handlePointerUp(event) {
    if (svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
    }
    draggingId = null;
  }

  function handleRootClick(event) {
    const selectButton = event.target.closest("[data-select-charge]");
    if (selectButton) {
      state.selectedId = selectButton.dataset.selectCharge;
      state.message = "";
      render();
      svg.focus();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.action;
    if (action === "add-source") {
      if (!addSource(state)) {
        state.message = "O plano aceita no máximo seis cargas-fonte.";
      }
    } else if (action === "remove-source") {
      removeSelectedSource(state);
    } else if (action === "flip-sign") {
      flipSelectedSign(state);
      state.message = "Sinal de " + selectedCharge(state).label + " alterado.";
    } else if (action === "reset") {
      state = createSimulatorState(preset);
      state.message = "Configuração restaurada.";
    }
    render();
  }

  function handleMagnitudeChange() {
    const supplied = Number(String(magnitudeInput.value).replace(",", "."));
    const previous = selectedCharge(state).magnitudeMicroC;
    const adjusted = setSelectedMagnitude(state, supplied);
    if (!Number.isFinite(supplied)) {
      state.message = "Digite um módulo numérico entre 0,1 e 10,0 µC.";
    } else if (adjusted !== supplied) {
      state.message =
        "O módulo foi ajustado ao intervalo de 0,1 a 10,0 µC.";
    } else if (previous !== adjusted) {
      state.message = "Módulo atualizado.";
    }
    render();
  }

  function handleKeyDown(event) {
    const step = event.shiftKey ? 2 : 0.5;
    const movement = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }[event.key];

    let handled = false;
    if (movement) {
      handled = moveSelected(state, movement[0], movement[1]);
    } else if (event.key === "+" || event.key === "=") {
      setSelectedMagnitude(
        state,
        selectedCharge(state).magnitudeMicroC + 0.1,
      );
      handled = true;
    } else if (event.key === "-") {
      setSelectedMagnitude(
        state,
        selectedCharge(state).magnitudeMicroC - 0.1,
      );
      handled = true;
    } else if (event.key.toLowerCase() === "s") {
      flipSelectedSign(state);
      handled = true;
    } else if (event.key.toLowerCase() === "a") {
      handled = addSource(state);
    } else if (event.key === "Delete") {
      handled = removeSelectedSource(state);
    } else if (event.key.toLowerCase() === "r") {
      state = createSimulatorState(preset);
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      state.message = "";
      render();
    }
  }

  svg.addEventListener("pointerdown", handlePointerDown);
  svg.addEventListener("pointermove", handlePointerMove);
  svg.addEventListener("pointerup", handlePointerUp);
  svg.addEventListener("pointercancel", handlePointerUp);
  svg.addEventListener("keydown", handleKeyDown);
  root.addEventListener("click", handleRootClick);
  magnitudeInput.addEventListener("change", handleMagnitudeChange);

  const controller = {
    reset() {
      state = createSimulatorState(preset);
      render();
    },
    getState() {
      return state;
    },
    destroy() {
      svg.removeEventListener("pointerdown", handlePointerDown);
      svg.removeEventListener("pointermove", handlePointerMove);
      svg.removeEventListener("pointerup", handlePointerUp);
      svg.removeEventListener("pointercancel", handlePointerUp);
      svg.removeEventListener("keydown", handleKeyDown);
      root.removeEventListener("click", handleRootClick);
      magnitudeInput.removeEventListener("change", handleMagnitudeChange);
      root.replaceChildren();
    },
  };

  render();
  return controller;
}
