// Gráfico em tempo real do coletor Web Serial: ADC por tempo, no espírito do
// Serial Plotter da IDE do Arduino. O eixo X é o tempo total do par: a descarga
// continua de onde a carga terminou, com uma linha marcando a comutação.

const VIEW = { width: 800, height: 320, left: 62, right: 16, top: 14, bottom: 34 };
const ADC_MAX = 1023;

export function createChartModel() {
  const state = {
    points: [],
    chargeEndMs: 0,
    resistance: null,
    crop: null,
  };

  function add({ phase, timestamp, adc, resistance }) {
    if (phase === "carga") state.chargeEndMs = Math.max(state.chargeEndMs, timestamp);
    const totalMs = phase === "carga" ? timestamp : state.chargeEndMs + timestamp;
    state.points.push({ phase, timestamp, adc, resistance, x: totalMs / 1000 });
    state.resistance = resistance;
  }

  function reset() {
    state.points.length = 0;
    state.chargeEndMs = 0;
    state.crop = null;
  }

  function setCrop(from, to) {
    if (from === null || to === null || !Number.isFinite(from) || !Number.isFinite(to)) {
      state.crop = null;
      return;
    }
    state.crop = { from: Math.min(from, to), to: Math.max(from, to) };
  }

  function croppedPoints() {
    if (!state.crop) return [];
    return state.points.filter((p) => p.x >= state.crop.from && p.x <= state.crop.to);
  }

  function croppedCsv() {
    const rows = croppedPoints();
    if (!rows.length) return "";
    const lines = rows.map((p) => `${p.phase},${p.timestamp},${p.adc},${p.resistance}`);
    return `fase,t_ms,adc,r_nominal_ohm\n${lines.join("\n")}\n`;
  }

  return {
    add,
    reset,
    setCrop,
    croppedPoints,
    croppedCsv,
    get points() { return state.points; },
    get crop() { return state.crop; },
    get resistance() { return state.resistance; },
    get chargeEndSeconds() { return state.chargeEndMs / 1000; },
  };
}

// Escolhe os limites de um eixo. No modo automático o X cresce com os dados e
// o Y acompanha a faixa realmente medida, com folga; no manual vale o que o
// aluno digitou, desde que faça sentido.
export function computeAxis(values, { mode, min, max, fallback }) {
  if (mode === "manual" && Number.isFinite(min) && Number.isFinite(max) && max > min) {
    return { min, max };
  }
  if (!values.length) return { ...fallback };
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi === lo) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.05;
  return { min: Math.max(fallback.hardMin ?? -Infinity, lo - pad), max: hi + pad };
}

export function niceTicks(min, max, count = 5) {
  const span = max - min;
  if (!(span > 0)) return [];
  const rough = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step / 1e6; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

function scaleX(axis) {
  const plotWidth = VIEW.width - VIEW.left - VIEW.right;
  return (x) => VIEW.left + ((x - axis.min) / (axis.max - axis.min)) * plotWidth;
}

function scaleY(axis) {
  const plotHeight = VIEW.height - VIEW.top - VIEW.bottom;
  return (y) => VIEW.top + plotHeight - ((y - axis.min) / (axis.max - axis.min)) * plotHeight;
}

function formatTick(value) {
  return Math.abs(value) >= 100 || Number.isInteger(value) ? String(Math.round(value)) : value.toFixed(1);
}

// Converte um deslocamento horizontal em pixels na tela para segundos no eixo X.
export function pixelToSeconds(offsetX, elementWidth, xAxis) {
  const viewX = (offsetX / elementWidth) * VIEW.width;
  const plotWidth = VIEW.width - VIEW.left - VIEW.right;
  const fraction = (viewX - VIEW.left) / plotWidth;
  return xAxis.min + Math.min(1, Math.max(0, fraction)) * (xAxis.max - xAxis.min);
}

export function renderChart(model, { xAxis, yAxis }) {
  const sx = scaleX(xAxis);
  const sy = scaleY(yAxis);
  const plotRight = VIEW.width - VIEW.right;
  const plotBottom = VIEW.height - VIEW.bottom;
  const parts = [];

  for (const tick of niceTicks(yAxis.min, yAxis.max)) {
    const y = sy(tick).toFixed(1);
    parts.push(`<line class="serial-chart__grid" x1="${VIEW.left}" y1="${y}" x2="${plotRight}" y2="${y}"/>`);
    parts.push(`<text class="serial-chart__label" x="${VIEW.left - 8}" y="${y}" text-anchor="end" dominant-baseline="middle">${formatTick(tick)}</text>`);
  }
  for (const tick of niceTicks(xAxis.min, xAxis.max, 8)) {
    const x = sx(tick).toFixed(1);
    parts.push(`<line class="serial-chart__grid" x1="${x}" y1="${VIEW.top}" x2="${x}" y2="${plotBottom}"/>`);
    parts.push(`<text class="serial-chart__label" x="${x}" y="${plotBottom + 18}" text-anchor="middle">${formatTick(tick)}</text>`);
  }
  parts.push(`<text class="serial-chart__label" x="${plotRight}" y="${VIEW.height - 4}" text-anchor="end">tempo (s)</text>`);
  parts.push(`<text class="serial-chart__label" x="${VIEW.left - 8}" y="${VIEW.top - 4}" text-anchor="end">ADC</text>`);

  if (model.crop) {
    const from = sx(model.crop.from);
    const to = sx(model.crop.to);
    parts.push(`<rect class="serial-chart__crop" x="${Math.min(from, to).toFixed(1)}" y="${VIEW.top}" width="${Math.abs(to - from).toFixed(1)}" height="${plotBottom - VIEW.top}"/>`);
  }

  const inside = (p) => p.x >= xAxis.min && p.x <= xAxis.max;
  for (const phase of ["carga", "descarga"]) {
    const coords = model.points
      .filter((p) => p.phase === phase && inside(p))
      .map((p) => `${sx(p.x).toFixed(1)},${sy(Math.min(yAxis.max, Math.max(yAxis.min, p.adc))).toFixed(1)}`);
    if (coords.length) {
      parts.push(`<polyline class="serial-chart__line serial-chart__line--${phase}" points="${coords.join(" ")}"/>`);
    }
  }
  if (model.chargeEndSeconds > 0 && model.points.some((p) => p.phase === "descarga")) {
    const x = sx(model.chargeEndSeconds).toFixed(1);
    parts.push(`<line class="serial-chart__switch" x1="${x}" y1="${VIEW.top}" x2="${x}" y2="${plotBottom}"/>`);
  }
  parts.push(`<rect class="serial-chart__frame" x="${VIEW.left}" y="${VIEW.top}" width="${plotRight - VIEW.left}" height="${plotBottom - VIEW.top}"/>`);
  return parts.join("");
}

export function setupSerialChart(root, { download }) {
  const svg = root.querySelector("[data-chart-svg]");
  const controls = {
    xMode: root.querySelector("[data-chart-x-mode]"),
    xMin: root.querySelector("[data-chart-x-min]"),
    xMax: root.querySelector("[data-chart-x-max]"),
    yMode: root.querySelector("[data-chart-y-mode]"),
    yMin: root.querySelector("[data-chart-y-min]"),
    yMax: root.querySelector("[data-chart-y-max]"),
    reset: root.querySelector("[data-chart-reset]"),
    cropClear: root.querySelector("[data-chart-crop-clear]"),
    cropDownload: root.querySelector("[data-chart-crop-download]"),
    cropInfo: root.querySelector("[data-chart-crop-info]"),
  };
  const model = createChartModel();
  let frameRequested = false;
  let currentXAxis = { min: 0, max: 1 };
  let dragStart = null;

  function axes() {
    const xAxis = computeAxis(model.points.map((p) => p.x), {
      mode: controls.xMode.value,
      min: Number(controls.xMin.value),
      max: Number(controls.xMax.value),
      fallback: { min: 0, max: 1, hardMin: 0 },
    });
    if (controls.xMode.value === "auto") xAxis.min = 0;
    const yAxis = computeAxis(model.points.map((p) => p.adc), {
      mode: controls.yMode.value,
      min: Number(controls.yMin.value),
      max: Number(controls.yMax.value),
      fallback: { min: 0, max: ADC_MAX, hardMin: 0 },
    });
    return { xAxis, yAxis };
  }

  function render() {
    frameRequested = false;
    const scales = axes();
    currentXAxis = scales.xAxis;
    svg.innerHTML = renderChart(model, scales);
    const cropped = model.croppedPoints();
    controls.cropDownload.disabled = cropped.length === 0;
    controls.cropClear.disabled = model.crop === null;
    controls.cropInfo.textContent = model.crop
      ? `Recorte: ${model.crop.from.toFixed(2)} s a ${model.crop.to.toFixed(2)} s — ${cropped.length} leituras.`
      : "Arraste sobre o gráfico para escolher o trecho a exportar.";
  }

  function scheduleRender() {
    if (frameRequested) return;
    frameRequested = true;
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(render);
    else setTimeout(render, 0);
  }

  function setManualInputs(mode, min, max) {
    const manual = mode.value === "manual";
    min.disabled = !manual;
    max.disabled = !manual;
  }

  function secondsFromEvent(event) {
    const rect = svg.getBoundingClientRect();
    return pixelToSeconds(event.clientX - rect.left, rect.width, currentXAxis);
  }

  svg.addEventListener("pointerdown", (event) => {
    if (!model.points.length) return;
    dragStart = secondsFromEvent(event);
    model.setCrop(dragStart, dragStart);
    svg.setPointerCapture(event.pointerId);
    scheduleRender();
  });
  svg.addEventListener("pointermove", (event) => {
    if (dragStart === null) return;
    model.setCrop(dragStart, secondsFromEvent(event));
    scheduleRender();
  });
  svg.addEventListener("pointerup", (event) => {
    if (dragStart === null) return;
    model.setCrop(dragStart, secondsFromEvent(event));
    dragStart = null;
    if (model.crop && model.crop.to - model.crop.from < 1e-6) model.setCrop(null, null);
    scheduleRender();
  });

  for (const control of [controls.xMode, controls.yMode]) {
    control.addEventListener("change", () => {
      setManualInputs(controls.xMode, controls.xMin, controls.xMax);
      setManualInputs(controls.yMode, controls.yMin, controls.yMax);
      scheduleRender();
    });
  }
  for (const input of [controls.xMin, controls.xMax, controls.yMin, controls.yMax]) {
    input.addEventListener("input", scheduleRender);
  }
  controls.reset.addEventListener("click", () => {
    model.reset();
    scheduleRender();
  });
  controls.cropClear.addEventListener("click", () => {
    model.setCrop(null, null);
    scheduleRender();
  });
  controls.cropDownload.addEventListener("click", () => {
    const csv = model.croppedCsv();
    if (!csv) return;
    const resistor = model.resistance ? `R${model.resistance / 1000}k` : "R-desconhecido";
    const range = `${model.crop.from.toFixed(1)}s-${model.crop.to.toFixed(1)}s`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    download(csv, `${resistor}-recorte-${range}-${timestamp}.csv`);
  });

  setManualInputs(controls.xMode, controls.xMin, controls.xMax);
  setManualInputs(controls.yMode, controls.yMin, controls.yMax);
  render();

  return {
    add(point) {
      model.add(point);
      scheduleRender();
    },
    reset() {
      model.reset();
      scheduleRender();
    },
    model,
  };
}
