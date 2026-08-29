import {
  createPotentialGrid,
  electricFieldAt,
  electrodeContains,
  electrodesOverlap,
  relaxGaussSeidel,
  samplePotential,
  validateElectrodes,
} from "../nucleo/laplace.js";

const DOMAIN_ASPECT = 1.5;
const MAX_ITERATIONS = 20_000;
const COLOR_STOPS = [
  [20, 65, 112],
  [54, 135, 175],
  [238, 243, 247],
  [241, 171, 71],
  [205, 67, 47],
];

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function formatPotential(value, digits = 2) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} V`;
}

function createDefaultElectrodes() {
  return [
    {
      id: "eletrodo-1",
      label: "E₀",
      type: "circle",
      x: 0.5,
      y: 0.25,
      radius: 0.055,
      potential: 0,
    },
    {
      id: "eletrodo-2",
      label: "E₅",
      type: "circle",
      x: 0.3,
      y: 0.68,
      radius: 0.055,
      potential: 5,
    },
    {
      id: "eletrodo-3",
      label: "E₁₀",
      type: "circle",
      x: 0.7,
      y: 0.68,
      radius: 0.055,
      potential: 10,
    },
  ];
}

function interpolateColor(first, second, mix) {
  return first.map((channel, index) =>
    Math.round(channel + (second[index] - channel) * mix),
  );
}

function colorForPotential(value, minimum, maximum) {
  const range = maximum - minimum;
  const normalized = range === 0 ? 0.5 : clamp((value - minimum) / range, 0, 1);
  const scaled = normalized * (COLOR_STOPS.length - 1);
  const index = Math.min(COLOR_STOPS.length - 2, Math.floor(scaled));
  return interpolateColor(COLOR_STOPS[index], COLOR_STOPS[index + 1], scaled - index);
}

function cssColor(channels, alpha = 1) {
  return `rgb(${channels.join(" ")} / ${alpha})`;
}

function cloneElectrodes(electrodes) {
  return electrodes.map((electrode) => ({ ...electrode }));
}

function electrodeLimits(electrode) {
  if (electrode.type === "circle") {
    return {
      minimumX: electrode.radius / DOMAIN_ASPECT,
      maximumX: 1 - electrode.radius / DOMAIN_ASPECT,
      minimumY: electrode.radius,
      maximumY: 1 - electrode.radius,
    };
  }

  return {
    minimumX: electrode.width / 2,
    maximumX: 1 - electrode.width / 2,
    minimumY: electrode.height / 2,
    maximumY: 1 - electrode.height / 2,
  };
}

function keepElectrodeInside(electrode) {
  const limits = electrodeLimits(electrode);
  electrode.x = clamp(electrode.x, limits.minimumX, limits.maximumX);
  electrode.y = clamp(electrode.y, limits.minimumY, limits.maximumY);
}

function buildMarkup() {
  return `
    <section class="potential-lab" aria-label="Simulador do potencial na cuba eletrolítica">
      <div class="potential-toolbar" role="toolbar" aria-label="Ferramentas da simulação">
        <div class="potential-toolbar__group">
          <button class="potential-button" type="button" data-action="add-circle">
            <span aria-hidden="true">●</span> Adicionar cilindro
          </button>
          <button class="potential-button" type="button" data-action="add-rectangle">
            <span aria-hidden="true">▰</span> Adicionar retângulo
          </button>
        </div>
        <div class="potential-toolbar__group potential-toolbar__group--calculation">
          <button class="potential-button potential-button--primary" type="button" data-action="calculate">
            Calcular potencial
          </button>
          <button class="potential-button" type="button" data-action="pause" disabled>
            Pausar
          </button>
          <button class="potential-button" type="button" data-action="step">
            Um passo
          </button>
        </div>
      </div>

      <div class="potential-workspace">
        <aside class="potential-sidebar" aria-label="Controles dos eletrodos e do cálculo">
          <section class="potential-control-section">
            <div class="potential-control-heading">
              <div>
                <p class="potential-kicker">Condições de contorno</p>
                <h2>Eletrodos</h2>
              </div>
              <button class="potential-text-button" type="button" data-action="reset">Restaurar 0–5–10 V</button>
            </div>
            <div class="electrode-list" data-electrode-list aria-label="Eletrodos adicionados"></div>
          </section>

          <section class="potential-control-section potential-inspector" data-inspector>
            <div data-inspector-empty hidden>
              <p class="potential-muted">Selecione um eletrodo na lista ou diretamente na cuba.</p>
            </div>
            <div data-inspector-fields>
              <div class="potential-control-heading">
                <div>
                  <p class="potential-kicker">Eletrodo selecionado</p>
                  <h2 data-selected-title>Eletrodo</h2>
                </div>
                <button class="potential-icon-button" type="button" data-action="remove" aria-label="Remover eletrodo selecionado">×</button>
              </div>

              <label class="potential-field">
                <span>Potencial fixo</span>
                <div class="potential-paired-input">
                  <input type="range" min="-20" max="20" step="0.5" data-field="potential-range">
                  <input type="number" min="-20" max="20" step="0.5" inputmode="decimal" data-field="potential-number" aria-label="Potencial em volts">
                  <span>V</span>
                </div>
              </label>

              <div class="potential-field-grid">
                <label class="potential-field">
                  <span>Posição x</span>
                  <div class="potential-number-unit">
                    <input type="number" min="0" max="100" step="1" data-field="x" aria-label="Posição horizontal em porcentagem">
                    <span>%</span>
                  </div>
                </label>
                <label class="potential-field">
                  <span>Posição y</span>
                  <div class="potential-number-unit">
                    <input type="number" min="0" max="100" step="1" data-field="y" aria-label="Posição vertical em porcentagem">
                    <span>%</span>
                  </div>
                </label>
              </div>

              <label class="potential-field" data-circle-size>
                <span>Diâmetro <output data-output="diameter"></output></span>
                <input type="range" min="4" max="28" step="1" data-field="diameter">
              </label>

              <div data-rectangle-size>
                <label class="potential-field">
                  <span>Largura <output data-output="width"></output></span>
                  <input type="range" min="5" max="45" step="1" data-field="width">
                </label>
                <label class="potential-field">
                  <span>Altura <output data-output="height"></output></span>
                  <input type="range" min="5" max="45" step="1" data-field="height">
                </label>
              </div>
            </div>
          </section>

          <section class="potential-control-section">
            <p class="potential-kicker">Relaxação numérica</p>
            <h2>Gauss–Seidel</h2>
            <div class="potential-field-grid">
              <label class="potential-field">
                <span>Malha</span>
                <select data-setting="resolution">
                  <option value="91x61">91 × 61</option>
                  <option value="121x81" selected>121 × 81</option>
                  <option value="181x121">181 × 121</option>
                </select>
              </label>
              <label class="potential-field">
                <span>Relaxação ω</span>
                <select data-setting="omega">
                  <option value="1">1,00 · puro</option>
                  <option value="1.5">1,50</option>
                  <option value="1.75" selected>1,75 · rápido</option>
                </select>
              </label>
            </div>
            <label class="potential-field">
              <span>Tolerância</span>
              <select data-setting="tolerance">
                <option value="0.01">10⁻² V · demonstração</option>
                <option value="0.001" selected>10⁻³ V · padrão</option>
                <option value="0.0001">10⁻⁴ V · preciso</option>
              </select>
            </label>
            <label class="potential-field">
              <span>Velocidade <output data-output="speed">8 varreduras/quadro</output></span>
              <input type="range" min="1" max="40" step="1" value="8" data-setting="speed">
            </label>
            <div class="potential-toggle-grid">
              <label><input type="checkbox" data-view="grid" checked> Malha</label>
              <label><input type="checkbox" data-view="contours" checked> Equipotenciais</label>
            </div>
          </section>
        </aside>

        <section class="potential-stage" aria-label="Mapa de potencial calculado">
          <div class="potential-stage__header">
            <div>
              <p class="potential-kicker">Solução bidimensional</p>
              <h2>Mapa de potencial</h2>
            </div>
            <div class="potential-status" data-status data-tone="idle" role="status" aria-live="polite">
              Configure os eletrodos e clique em Calcular.
            </div>
          </div>

          <div class="potential-canvas-shell">
            <canvas
              class="potential-canvas"
              data-potential-canvas
              width="1200"
              height="800"
              tabindex="0"
              aria-label="Cuba eletrolítica. Arraste os eletrodos; clique fora deles para posicionar uma sonda depois do cálculo."
            >Seu navegador não oferece o canvas necessário para esta simulação.</canvas>
            <div class="potential-probe" data-probe-readout hidden></div>
            <div class="potential-canvas-help">Arraste para mover · setas ajustam · clique livre mede V</div>
          </div>

          <div class="potential-legend" aria-label="Escala de potencial">
            <span data-legend-min>0 V</span>
            <div class="potential-legend__gradient" aria-hidden="true"></div>
            <span data-legend-max>10 V</span>
          </div>

          <div class="potential-metrics" aria-label="Estado do cálculo">
            <div><span>Iteração</span><strong data-metric="iteration">—</strong></div>
            <div><span>Maior correção</span><strong data-metric="residual">—</strong></div>
            <div><span>Nós fixos</span><strong data-metric="fixed">—</strong></div>
            <div><span>Método</span><strong data-metric="method">Gauss–Seidel</strong></div>
          </div>
          <progress class="potential-progress" data-progress max="1" value="0">0%</progress>
        </section>
      </div>
    </section>
  `;
}

function createCanvasRenderer(canvas, getViewOptions) {
  const context = canvas.getContext("2d");
  const heatmapCanvas = document.createElement("canvas");
  const heatmapContext = heatmapCanvas.getContext("2d");
  let width = 0;
  let height = 0;
  let tank = { x: 0, y: 0, width: 0, height: 0 };

  function themeValue(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(320, bounds.width || 900);
    const nextHeight = Math.max(260, bounds.height || nextWidth / DOMAIN_ASPECT);
    const ratio = Math.min(2, globalThis.devicePixelRatio || 1);

    if (canvas.width !== Math.round(nextWidth * ratio) || canvas.height !== Math.round(nextHeight * ratio)) {
      canvas.width = Math.round(nextWidth * ratio);
      canvas.height = Math.round(nextHeight * ratio);
    }

    width = nextWidth;
    height = nextHeight;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const padding = clamp(width * 0.035, 20, 40);
    const availableWidth = width - 2 * padding;
    const availableHeight = height - 2 * padding;
    let tankWidth = availableWidth;
    let tankHeight = tankWidth / DOMAIN_ASPECT;
    if (tankHeight > availableHeight) {
      tankHeight = availableHeight;
      tankWidth = tankHeight * DOMAIN_ASPECT;
    }
    tank = {
      x: (width - tankWidth) / 2,
      y: (height - tankHeight) / 2,
      width: tankWidth,
      height: tankHeight,
    };
  }

  function drawHeatmap(solver) {
    if (heatmapCanvas.width !== solver.width || heatmapCanvas.height !== solver.height) {
      heatmapCanvas.width = solver.width;
      heatmapCanvas.height = solver.height;
    }

    const image = heatmapContext.createImageData(solver.width, solver.height);
    for (let index = 0; index < solver.values.length; index += 1) {
      const [red, green, blue] = colorForPotential(
        solver.values[index],
        solver.minimumPotential,
        solver.maximumPotential,
      );
      const offset = index * 4;
      image.data[offset] = red;
      image.data[offset + 1] = green;
      image.data[offset + 2] = blue;
      image.data[offset + 3] = 255;
    }
    heatmapContext.putImageData(image, 0, 0);
    context.imageSmoothingEnabled = true;
    context.drawImage(heatmapCanvas, tank.x, tank.y, tank.width, tank.height);
  }

  function drawGrid() {
    const columns = 18;
    const rows = 12;
    context.save();
    context.strokeStyle = themeValue("--ink", "#101620");
    context.globalAlpha = 0.18;
    context.lineWidth = 0.7;
    context.beginPath();
    for (let column = 0; column <= columns; column += 1) {
      const x = tank.x + (column / columns) * tank.width;
      context.moveTo(x, tank.y);
      context.lineTo(x, tank.y + tank.height);
    }
    for (let row = 0; row <= rows; row += 1) {
      const y = tank.y + (row / rows) * tank.height;
      context.moveTo(tank.x, y);
      context.lineTo(tank.x + tank.width, y);
    }
    context.stroke();
    context.restore();
  }

  function edgeIntersection(level, firstValue, secondValue, firstPoint, secondPoint) {
    if ((firstValue < level) === (secondValue < level)) {
      return null;
    }
    const mix = (level - firstValue) / (secondValue - firstValue);
    return {
      x: firstPoint.x + (secondPoint.x - firstPoint.x) * mix,
      y: firstPoint.y + (secondPoint.y - firstPoint.y) * mix,
    };
  }

  function drawContours(solver) {
    const range = solver.maximumPotential - solver.minimumPotential;
    if (Math.abs(range) < 1e-12) {
      return;
    }

    context.save();
    context.strokeStyle = themeValue("--ink", "#101620");
    context.globalAlpha = 0.55;
    context.lineWidth = 1.05;

    for (let levelIndex = 1; levelIndex <= 9; levelIndex += 1) {
      const level = solver.minimumPotential + (range * levelIndex) / 10;
      context.beginPath();

      for (let row = 0; row < solver.height - 1; row += 1) {
        for (let column = 0; column < solver.width - 1; column += 1) {
          const topLeftIndex = row * solver.width + column;
          const values = [
            solver.values[topLeftIndex],
            solver.values[topLeftIndex + 1],
            solver.values[topLeftIndex + solver.width + 1],
            solver.values[topLeftIndex + solver.width],
          ];
          const left = tank.x + (column / (solver.width - 1)) * tank.width;
          const right = tank.x + ((column + 1) / (solver.width - 1)) * tank.width;
          const top = tank.y + (row / (solver.height - 1)) * tank.height;
          const bottom = tank.y + ((row + 1) / (solver.height - 1)) * tank.height;
          const points = [
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom },
          ];
          const intersections = [];

          for (const [first, second] of [[0, 1], [1, 2], [2, 3], [3, 0]]) {
            const intersection = edgeIntersection(
              level,
              values[first],
              values[second],
              points[first],
              points[second],
            );
            if (intersection) {
              intersections.push(intersection);
            }
          }

          if (intersections.length === 2) {
            context.moveTo(intersections[0].x, intersections[0].y);
            context.lineTo(intersections[1].x, intersections[1].y);
          } else if (intersections.length === 4) {
            context.moveTo(intersections[0].x, intersections[0].y);
            context.lineTo(intersections[1].x, intersections[1].y);
            context.moveTo(intersections[2].x, intersections[2].y);
            context.lineTo(intersections[3].x, intersections[3].y);
          }
        }
      }
      context.stroke();
    }
    context.restore();
  }

  function drawElectrode(electrode, selected, invalid, minimum, maximum) {
    const centerX = tank.x + electrode.x * tank.width;
    const centerY = tank.y + electrode.y * tank.height;
    const channels = colorForPotential(electrode.potential, minimum, maximum);
    const normalized = maximum === minimum
      ? 0.5
      : (electrode.potential - minimum) / (maximum - minimum);

    context.save();
    context.beginPath();
    if (electrode.type === "circle") {
      context.arc(centerX, centerY, electrode.radius * tank.height, 0, Math.PI * 2);
    } else {
      context.rect(
        centerX - (electrode.width * tank.width) / 2,
        centerY - (electrode.height * tank.height) / 2,
        electrode.width * tank.width,
        electrode.height * tank.height,
      );
    }
    context.fillStyle = cssColor(channels);
    context.fill();
    context.strokeStyle = invalid
      ? themeValue("--positive", "#d94841")
      : themeValue("--ink", "#101620");
    context.lineWidth = invalid ? 4 : 2.5;
    context.setLineDash(invalid ? [7, 5] : []);
    context.stroke();

    if (selected) {
      context.strokeStyle = themeValue("--measure", "#c8880c");
      context.lineWidth = 4;
      context.setLineDash([]);
      context.stroke();
    }

    context.fillStyle = normalized < 0.25 || normalized > 0.72 ? "#ffffff" : "#101620";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `700 ${clamp(tank.height * 0.022, 10, 15)}px ${themeValue("--font-mono", "monospace")}`;
    context.fillText(electrode.label, centerX, centerY - 7);
    context.font = `600 ${clamp(tank.height * 0.018, 9, 12)}px ${themeValue("--font-mono", "monospace")}`;
    context.fillText(`${electrode.potential.toLocaleString("pt-BR")} V`, centerX, centerY + 10);
    context.restore();
  }

  function drawProbe(probe) {
    if (!probe) {
      return;
    }
    const x = tank.x + probe.x * tank.width;
    const y = tank.y + probe.y * tank.height;
    context.save();
    context.strokeStyle = themeValue("--ink", "#101620");
    context.fillStyle = themeValue("--surface", "#ffffff");
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, 6, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(x - 11, y);
    context.lineTo(x + 11, y);
    context.moveTo(x, y - 11);
    context.lineTo(x, y + 11);
    context.stroke();
    context.restore();
  }

  function draw({ solver, electrodes, selectedId, probe }) {
    resize();
    context.clearRect(0, 0, width, height);
    context.fillStyle = themeValue("--surface", "#ffffff");
    context.fillRect(0, 0, width, height);

    context.save();
    context.beginPath();
    context.roundRect(tank.x, tank.y, tank.width, tank.height, 12);
    context.clip();
    context.fillStyle = themeValue("--paper-deep", "#eef2f7");
    context.fillRect(tank.x, tank.y, tank.width, tank.height);
    if (solver) {
      drawHeatmap(solver);
    }
    if (getViewOptions().grid) {
      drawGrid();
    }
    if (solver && getViewOptions().contours) {
      drawContours(solver);
    }
    context.restore();

    context.strokeStyle = themeValue("--line-strong", "#c2ccd8");
    context.lineWidth = 2;
    context.strokeRect(tank.x, tank.y, tank.width, tank.height);

    const potentials = electrodes.map((electrode) => electrode.potential);
    const minimum = potentials.length ? Math.min(...potentials) : 0;
    const maximum = potentials.length ? Math.max(...potentials) : 10;
    const invalidIds = new Set();
    for (let first = 0; first < electrodes.length; first += 1) {
      for (let second = first + 1; second < electrodes.length; second += 1) {
        if (electrodesOverlap(electrodes[first], electrodes[second], DOMAIN_ASPECT)) {
          invalidIds.add(electrodes[first].id);
          invalidIds.add(electrodes[second].id);
        }
      }
    }

    for (const electrode of electrodes) {
      drawElectrode(
        electrode,
        electrode.id === selectedId,
        invalidIds.has(electrode.id),
        minimum,
        maximum,
      );
    }
    drawProbe(probe);
  }

  function eventPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left - tank.x) / tank.width;
    const y = (event.clientY - bounds.top - tank.y) / tank.height;
    return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
  }

  function hitTest(electrodes, point) {
    for (let index = electrodes.length - 1; index >= 0; index -= 1) {
      if (electrodeContains(electrodes[index], point.x, point.y, DOMAIN_ASPECT)) {
        return electrodes[index];
      }
    }
    return null;
  }

  return { draw, eventPoint, hitTest, resize, getTank: () => ({ ...tank }) };
}

export function mountPotentialSimulator(root) {
  if (!root) {
    throw new Error("O contêiner do simulador de potencial não foi encontrado.");
  }

  root.innerHTML = buildMarkup();

  const references = {
    canvas: root.querySelector("[data-potential-canvas]"),
    electrodeList: root.querySelector("[data-electrode-list]"),
    inspectorEmpty: root.querySelector("[data-inspector-empty]"),
    inspectorFields: root.querySelector("[data-inspector-fields]"),
    selectedTitle: root.querySelector("[data-selected-title]"),
    circleSize: root.querySelector("[data-circle-size]"),
    rectangleSize: root.querySelector("[data-rectangle-size]"),
    potentialRange: root.querySelector('[data-field="potential-range"]'),
    potentialNumber: root.querySelector('[data-field="potential-number"]'),
    x: root.querySelector('[data-field="x"]'),
    y: root.querySelector('[data-field="y"]'),
    diameter: root.querySelector('[data-field="diameter"]'),
    width: root.querySelector('[data-field="width"]'),
    height: root.querySelector('[data-field="height"]'),
    diameterOutput: root.querySelector('[data-output="diameter"]'),
    widthOutput: root.querySelector('[data-output="width"]'),
    heightOutput: root.querySelector('[data-output="height"]'),
    speedOutput: root.querySelector('[data-output="speed"]'),
    resolution: root.querySelector('[data-setting="resolution"]'),
    omega: root.querySelector('[data-setting="omega"]'),
    tolerance: root.querySelector('[data-setting="tolerance"]'),
    speed: root.querySelector('[data-setting="speed"]'),
    grid: root.querySelector('[data-view="grid"]'),
    contours: root.querySelector('[data-view="contours"]'),
    calculate: root.querySelector('[data-action="calculate"]'),
    pause: root.querySelector('[data-action="pause"]'),
    step: root.querySelector('[data-action="step"]'),
    status: root.querySelector("[data-status]"),
    probeReadout: root.querySelector("[data-probe-readout]"),
    legendMinimum: root.querySelector("[data-legend-min]"),
    legendMaximum: root.querySelector("[data-legend-max]"),
    progress: root.querySelector("[data-progress]"),
    iteration: root.querySelector('[data-metric="iteration"]'),
    residual: root.querySelector('[data-metric="residual"]'),
    fixed: root.querySelector('[data-metric="fixed"]'),
    method: root.querySelector('[data-metric="method"]'),
  };

  let electrodes = createDefaultElectrodes();
  let selectedId = electrodes[0].id;
  let electrodeCounter = electrodes.length;
  let solver = null;
  let probe = null;
  let animationFrame = null;
  let running = false;
  let paused = false;
  let converged = false;
  let initialDelta = null;
  let drag = null;

  const renderer = createCanvasRenderer(references.canvas, () => ({
    grid: references.grid.checked,
    contours: references.contours.checked,
  }));

  function selectedElectrode() {
    return electrodes.find((electrode) => electrode.id === selectedId) ?? null;
  }

  function setStatus(message, tone = "idle") {
    references.status.textContent = message;
    references.status.dataset.tone = tone;
  }

  function updateLegend() {
    const potentials = electrodes.map((electrode) => electrode.potential);
    references.legendMinimum.textContent = formatPotential(
      potentials.length ? Math.min(...potentials) : 0,
      1,
    );
    references.legendMaximum.textContent = formatPotential(
      potentials.length ? Math.max(...potentials) : 10,
      1,
    );
  }

  function updateProbeReadout() {
    if (!solver || !probe) {
      references.probeReadout.hidden = true;
      return;
    }

    const potential = samplePotential(solver, probe.x, probe.y);
    const field = electricFieldAt(solver, probe.x, probe.y);
    const fieldMagnitude = Math.hypot(field.x, field.y);
    references.probeReadout.hidden = false;
    references.probeReadout.innerHTML = `
      <strong>Sonda</strong>
      <span>x ${(probe.x * 100).toFixed(0)}% · y ${(probe.y * 100).toFixed(0)}%</span>
      <span>${formatPotential(potential, 3)} · |E| ${fieldMagnitude.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} V/u</span>
    `;
  }

  function draw() {
    renderer.draw({ solver, electrodes, selectedId, probe });
    updateProbeReadout();
  }

  function renderElectrodeList() {
    if (electrodes.length === 0) {
      references.electrodeList.innerHTML = '<p class="potential-muted">Nenhum eletrodo adicionado.</p>';
      return;
    }

    const potentials = electrodes.map((electrode) => electrode.potential);
    const minimum = Math.min(...potentials);
    const maximum = Math.max(...potentials);
    references.electrodeList.innerHTML = electrodes.map((electrode) => {
      const selected = electrode.id === selectedId;
      const color = cssColor(colorForPotential(electrode.potential, minimum, maximum));
      const shape = electrode.type === "circle" ? "Cilindro" : "Retângulo";
      return `
        <button
          type="button"
          class="electrode-list__item"
          data-electrode-id="${electrode.id}"
          aria-pressed="${selected}"
        >
          <span class="electrode-list__swatch" style="--electrode-color:${color}" aria-hidden="true"></span>
          <span><strong>${electrode.label}</strong><small>${shape}</small></span>
          <b>${formatPotential(electrode.potential, 1)}</b>
        </button>
      `;
    }).join("");
  }

  function renderInspector() {
    const electrode = selectedElectrode();
    references.inspectorEmpty.hidden = Boolean(electrode);
    references.inspectorFields.hidden = !electrode;
    if (!electrode) {
      return;
    }

    references.selectedTitle.textContent = electrode.label;
    references.potentialRange.value = String(electrode.potential);
    references.potentialNumber.value = String(electrode.potential);
    references.x.value = String(Math.round(electrode.x * 100));
    references.y.value = String(Math.round(electrode.y * 100));
    references.circleSize.hidden = electrode.type !== "circle";
    references.rectangleSize.hidden = electrode.type !== "rectangle";

    if (electrode.type === "circle") {
      const diameter = Math.round(electrode.radius * 200);
      references.diameter.value = String(diameter);
      references.diameterOutput.value = `${diameter}%`;
    } else {
      const width = Math.round(electrode.width * 100);
      const height = Math.round(electrode.height * 100);
      references.width.value = String(width);
      references.height.value = String(height);
      references.widthOutput.value = `${width}%`;
      references.heightOutput.value = `${height}%`;
    }
  }

  function updateMetrics() {
    if (!solver) {
      references.iteration.textContent = "—";
      references.residual.textContent = "—";
      references.fixed.textContent = "—";
      references.progress.value = 0;
      references.method.textContent = "Gauss–Seidel";
      return;
    }

    references.iteration.textContent = solver.iteration.toLocaleString("pt-BR");
    references.residual.textContent = Number.isFinite(solver.lastDelta)
      ? `${solver.lastDelta.toExponential(2)} V`
      : "—";
    references.fixed.textContent = solver.fixed
      .reduce((total, value) => total + value, 0)
      .toLocaleString("pt-BR");
    const omega = Number(references.omega.value);
    references.method.textContent = omega === 1 ? "Gauss–Seidel" : `SOR · ω ${omega.toLocaleString("pt-BR")}`;

    const tolerance = Number(references.tolerance.value);
    if (initialDelta && Number.isFinite(solver.lastDelta)) {
      const denominator = Math.log(initialDelta / tolerance);
      const numerator = Math.log(initialDelta / Math.max(solver.lastDelta, tolerance));
      references.progress.value = denominator > 0 ? clamp(numerator / denominator, 0, 1) : 1;
    }
  }

  function updatePauseButton() {
    references.pause.disabled = !solver || converged;
    references.pause.textContent = paused ? "Continuar" : "Pausar";
  }

  function renderAll() {
    renderElectrodeList();
    renderInspector();
    updateLegend();
    updateMetrics();
    updatePauseButton();
    draw();
  }

  function stopAnimation() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    running = false;
  }

  function invalidate(message = "Geometria alterada. Clique em Calcular para atualizar o mapa.") {
    stopAnimation();
    solver = null;
    probe = null;
    paused = false;
    converged = false;
    initialDelta = null;
    setStatus(message, "dirty");
    updateMetrics();
    updatePauseButton();
    draw();
  }

  function validationErrors() {
    return validateElectrodes(electrodes, DOMAIN_ASPECT);
  }

  function setValidationStatus() {
    const errors = validationErrors();
    if (errors.length > 0) {
      setStatus(errors[0], "error");
      return false;
    }
    setStatus("Geometria pronta. Clique em Calcular.", "dirty");
    return true;
  }

  function createSolver() {
    const errors = validationErrors();
    if (errors.length > 0) {
      setStatus(errors[0], "error");
      draw();
      return false;
    }

    const [width, height] = references.resolution.value.split("x").map(Number);
    solver = createPotentialGrid({
      width,
      height,
      aspect: DOMAIN_ASPECT,
      electrodes: cloneElectrodes(electrodes),
      initialPotential: "minimum",
    });
    probe = null;
    paused = false;
    converged = false;
    initialDelta = null;
    updateMetrics();
    draw();
    return true;
  }

  function finishCalculation(message, tone) {
    stopAnimation();
    paused = false;
    converged = tone === "success";
    references.progress.value = converged ? 1 : references.progress.value;
    setStatus(message, tone);
    updatePauseButton();
    updateMetrics();
    draw();
  }

  function runFrame() {
    if (!solver || paused) {
      return;
    }

    const sweeps = Number(references.speed.value);
    const omega = Number(references.omega.value);
    const result = relaxGaussSeidel(solver, sweeps, omega);
    if (initialDelta === null) {
      initialDelta = result.maxDelta;
    }
    updateMetrics();
    draw();

    const tolerance = Number(references.tolerance.value);
    if (result.lastDelta <= tolerance) {
      finishCalculation(
        `Convergência atingida em ${result.iteration.toLocaleString("pt-BR")} varreduras.`,
        "success",
      );
      return;
    }
    if (result.iteration >= MAX_ITERATIONS) {
      finishCalculation(
        `Limite de ${MAX_ITERATIONS.toLocaleString("pt-BR")} varreduras atingido. Aumente a tolerância ou ω.`,
        "warning",
      );
      return;
    }

    setStatus(
      `Calculando · varredura ${result.iteration.toLocaleString("pt-BR")} · Δmáx ${result.lastDelta.toExponential(2)} V`,
      "running",
    );
    animationFrame = requestAnimationFrame(runFrame);
  }

  function calculate() {
    stopAnimation();
    if (!createSolver()) {
      return;
    }
    running = true;
    setStatus("Iniciando a relaxação a partir do menor potencial…", "running");
    updatePauseButton();
    animationFrame = requestAnimationFrame(runFrame);
  }

  function togglePause() {
    if (!solver || converged) {
      return;
    }

    if (paused) {
      paused = false;
      running = true;
      setStatus("Continuando a relaxação…", "running");
      animationFrame = requestAnimationFrame(runFrame);
    } else {
      paused = true;
      stopAnimation();
      setStatus(`Pausado na varredura ${solver.iteration.toLocaleString("pt-BR")}.`, "warning");
    }
    updatePauseButton();
  }

  function singleStep() {
    if (!solver && !createSolver()) {
      return;
    }
    stopAnimation();
    paused = true;
    const result = relaxGaussSeidel(solver, 1, Number(references.omega.value));
    if (initialDelta === null) {
      initialDelta = result.maxDelta;
    }
    setStatus(
      `Passo ${result.iteration.toLocaleString("pt-BR")} concluído · Δmáx ${result.lastDelta.toExponential(2)} V`,
      "warning",
    );
    updateMetrics();
    updatePauseButton();
    draw();
  }

  function findOpenPosition(candidate) {
    const positions = [
      [0.5, 0.5], [0.18, 0.2], [0.82, 0.2], [0.18, 0.82], [0.82, 0.82],
      [0.5, 0.82], [0.5, 0.15], [0.15, 0.5], [0.85, 0.5],
    ];
    for (const [x, y] of positions) {
      candidate.x = x;
      candidate.y = y;
      keepElectrodeInside(candidate);
      if (validateElectrodes([...electrodes, candidate], DOMAIN_ASPECT).length === 0) {
        return;
      }
    }
  }

  function addElectrode(type) {
    electrodeCounter += 1;
    const potentials = electrodes.map((electrode) => electrode.potential);
    const potential = potentials.length
      ? potentials.reduce((total, value) => total + value, 0) / potentials.length
      : 5;
    const electrode = type === "circle"
      ? {
          id: `eletrodo-${electrodeCounter}`,
          label: `E${electrodeCounter}`,
          type,
          x: 0.5,
          y: 0.5,
          radius: 0.055,
          potential: Math.round(potential * 2) / 2,
        }
      : {
          id: `eletrodo-${electrodeCounter}`,
          label: `E${electrodeCounter}`,
          type,
          x: 0.5,
          y: 0.5,
          width: 0.14,
          height: 0.1,
          potential: Math.round(potential * 2) / 2,
        };
    findOpenPosition(electrode);
    electrodes.push(electrode);
    selectedId = electrode.id;
    invalidate(`${electrode.type === "circle" ? "Cilindro" : "Retângulo"} adicionado. Ajuste-o e recalcule.`);
    renderAll();
    setValidationStatus();
  }

  function removeSelected() {
    const electrode = selectedElectrode();
    if (!electrode) {
      return;
    }
    electrodes = electrodes.filter((item) => item.id !== electrode.id);
    selectedId = electrodes[0]?.id ?? null;
    invalidate(`${electrode.label} removido. Clique em Calcular para atualizar o mapa.`);
    renderAll();
    setValidationStatus();
  }

  function reset() {
    stopAnimation();
    electrodes = createDefaultElectrodes();
    electrodeCounter = electrodes.length;
    selectedId = electrodes[0].id;
    solver = null;
    probe = null;
    paused = false;
    converged = false;
    initialDelta = null;
    setStatus("Arranjo experimental de 0 V, 5 V e 10 V restaurado.", "dirty");
    renderAll();
  }

  function updateSelected(field, rawValue) {
    const electrode = selectedElectrode();
    const value = Number(rawValue);
    if (!electrode || !Number.isFinite(value)) {
      return;
    }

    if (field === "potential") {
      electrode.potential = clamp(value, -20, 20);
    } else if (field === "x" || field === "y") {
      electrode[field] = value / 100;
    } else if (field === "diameter" && electrode.type === "circle") {
      electrode.radius = value / 200;
    } else if (field === "width" && electrode.type === "rectangle") {
      electrode.width = value / 100;
    } else if (field === "height" && electrode.type === "rectangle") {
      electrode.height = value / 100;
    }
    keepElectrodeInside(electrode);
    invalidate();
    renderAll();
    setValidationStatus();
  }

  function selectElectrode(id) {
    if (!electrodes.some((electrode) => electrode.id === id)) {
      return;
    }
    selectedId = id;
    renderElectrodeList();
    renderInspector();
    draw();
  }

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "add-circle") addElectrode("circle");
    if (action === "add-rectangle") addElectrode("rectangle");
    if (action === "calculate") calculate();
    if (action === "pause") togglePause();
    if (action === "step") singleStep();
    if (action === "remove") removeSelected();
    if (action === "reset") reset();

    const electrodeButton = event.target.closest("[data-electrode-id]");
    if (electrodeButton) {
      selectElectrode(electrodeButton.dataset.electrodeId);
    }
  });

  for (const input of [references.potentialRange, references.potentialNumber]) {
    input.addEventListener("input", () => {
      references.potentialRange.value = input.value;
      references.potentialNumber.value = input.value;
      updateSelected("potential", input.value);
    });
  }
  references.x.addEventListener("change", () => updateSelected("x", references.x.value));
  references.y.addEventListener("change", () => updateSelected("y", references.y.value));
  references.diameter.addEventListener("input", () => updateSelected("diameter", references.diameter.value));
  references.width.addEventListener("input", () => updateSelected("width", references.width.value));
  references.height.addEventListener("input", () => updateSelected("height", references.height.value));

  references.speed.addEventListener("input", () => {
    references.speedOutput.value = `${references.speed.value} varreduras/quadro`;
  });
  for (const control of [references.resolution, references.omega, references.tolerance]) {
    control.addEventListener("change", () => invalidate("Parâmetros numéricos alterados. Clique em Calcular novamente."));
  }
  for (const control of [references.grid, references.contours]) {
    control.addEventListener("change", draw);
  }

  references.canvas.addEventListener("pointerdown", (event) => {
    const point = renderer.eventPoint(event);
    const electrode = renderer.hitTest(electrodes, point);
    if (electrode) {
      selectElectrode(electrode.id);
      drag = {
        id: electrode.id,
        offsetX: point.x - electrode.x,
        offsetY: point.y - electrode.y,
      };
      references.canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }

    if (solver) {
      probe = point;
      draw();
    }
  });

  references.canvas.addEventListener("pointermove", (event) => {
    if (!drag) {
      return;
    }
    const electrode = electrodes.find((item) => item.id === drag.id);
    if (!electrode) {
      return;
    }
    const point = renderer.eventPoint(event);
    electrode.x = point.x - drag.offsetX;
    electrode.y = point.y - drag.offsetY;
    keepElectrodeInside(electrode);
    if (solver) {
      invalidate();
    }
    renderInspector();
    draw();
  });

  function endDrag(event) {
    if (!drag) {
      return;
    }
    drag = null;
    if (references.canvas.hasPointerCapture(event.pointerId)) {
      references.canvas.releasePointerCapture(event.pointerId);
    }
    renderElectrodeList();
    renderInspector();
    setValidationStatus();
    draw();
  }
  references.canvas.addEventListener("pointerup", endDrag);
  references.canvas.addEventListener("pointercancel", endDrag);

  references.canvas.addEventListener("keydown", (event) => {
    const electrode = selectedElectrode();
    if (!electrode) {
      return;
    }
    const step = event.shiftKey ? 0.05 : 0.01;
    if (event.key === "ArrowLeft") electrode.x -= step;
    else if (event.key === "ArrowRight") electrode.x += step;
    else if (event.key === "ArrowUp") electrode.y -= step;
    else if (event.key === "ArrowDown") electrode.y += step;
    else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      removeSelected();
      return;
    } else {
      return;
    }
    event.preventDefault();
    keepElectrodeInside(electrode);
    invalidate();
    renderAll();
    setValidationStatus();
  });

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(draw)
    : null;
  resizeObserver?.observe(references.canvas);
  const themeObserver = typeof MutationObserver === "function"
    ? new MutationObserver(draw)
    : null;
  themeObserver?.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  renderAll();

  return {
    calculate,
    reset,
    getState() {
      return {
        electrodes: cloneElectrodes(electrodes),
        selectedId,
        iteration: solver?.iteration ?? 0,
        running,
        paused,
        converged,
      };
    },
    destroy() {
      stopAnimation();
      resizeObserver?.disconnect();
      themeObserver?.disconnect();
      root.innerHTML = "";
    },
  };
}

export { createDefaultElectrodes };
