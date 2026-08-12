import { magnitude } from "../../nucleo/vetores.js";
import { equilibriumStoryFrames, fieldVectorsAt } from "./modelo.js";

const VIEWPORT = Object.freeze({
  minX: -24,
  maxX: 16,
  minY: -8,
  maxY: 8,
  left: 80,
  right: 820,
  top: 55,
  bottom: 295,
});

function plotX(xCm) {
  return VIEWPORT.left + ((xCm - VIEWPORT.minX) / (VIEWPORT.maxX - VIEWPORT.minX)) * (VIEWPORT.right - VIEWPORT.left);
}

function plotY(yCm) {
  return VIEWPORT.bottom - ((yCm - VIEWPORT.minY) / (VIEWPORT.maxY - VIEWPORT.minY)) * (VIEWPORT.bottom - VIEWPORT.top);
}

function setLineVector(line, origin, vector, pixelsPerUnit) {
  line.setAttribute("x1", origin.x.toFixed(2));
  line.setAttribute("y1", origin.y.toFixed(2));
  line.setAttribute("x2", (origin.x + vector.x * pixelsPerUnit).toFixed(2));
  line.setAttribute("y2", (origin.y - vector.y * pixelsPerUnit).toFixed(2));
}

function formatScientific(value) {
  if (value === 0) {
    return "0 N/C";
  }

  return value.toExponential(2).replace("e+", " × 10^").replace("e", " × 10^") + " N/C";
}

export function mountEquilibriumGeometry(root) {
  if (!root) {
    return null;
  }

  const frames = equilibriumStoryFrames();
  const motionQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
  const elements = {
    title: root.querySelector("[data-frame-title]"),
    explanation: root.querySelector("[data-frame-explanation]"),
    status: root.querySelector("[data-frame-status]"),
    region: root.querySelector("[data-current-region]"),
    candidate: root.querySelector("[data-candidate]"),
    candidateLabel: root.querySelector("[data-candidate-label]"),
    guideX: root.querySelector("[data-guide-x]"),
    guideY: root.querySelector("[data-guide-y]"),
    field1: root.querySelector("[data-field-q1]"),
    field2: root.querySelector("[data-field-q2]"),
    resultant: root.querySelector("[data-field-resultant]"),
    field1Label: root.querySelector("[data-field-q1-label]"),
    field2Label: root.querySelector("[data-field-q2-label]"),
    resultantLabel: root.querySelector("[data-field-resultant-label]"),
    bar1: root.querySelector("[data-bar-q1]"),
    bar2: root.querySelector("[data-bar-q2]"),
    barResultant: root.querySelector("[data-bar-resultant]"),
    bar1Value: root.querySelector("[data-bar-q1-value]"),
    bar2Value: root.querySelector("[data-bar-q2-value]"),
    barResultantValue: root.querySelector("[data-bar-resultant-value]"),
    play: root.querySelector("[data-play]"),
    pause: root.querySelector("[data-pause]"),
    reset: root.querySelector("[data-reset]"),
    next: root.querySelector("[data-next]"),
    speed: root.querySelector("[data-speed]"),
  };
  let index = 0;
  let speed = 1;
  let timer = null;
  let playState = "paused";

  function motionPreference() {
    return motionQuery.matches ? "reduced" : "full";
  }

  function stopTimer() {
    if (timer !== null) {
      globalThis.clearInterval(timer);
      timer = null;
    }
  }

  function placeVectorLabel(label, line) {
    const x1 = Number(line.getAttribute("x1"));
    const y1 = Number(line.getAttribute("y1"));
    const x2 = Number(line.getAttribute("x2"));
    const y2 = Number(line.getAttribute("y2"));
    label.setAttribute("x", ((x1 + x2) / 2).toFixed(2));
    label.setAttribute("y", (((y1 + y2) / 2) - 8).toFixed(2));
  }

  function render() {
    const frame = frames[index];
    const vectors = fieldVectorsAt(frame.xCm, frame.yCm);
    const field1 = vectors.individual.find((entry) => entry.sourceId === "q1").field;
    const field2 = vectors.individual.find((entry) => entry.sourceId === "q2").field;
    const magnitudes = [magnitude(field1), magnitude(field2), magnitude(vectors.resultant)];
    const maximum = Math.max(...magnitudes, Number.EPSILON);
    const pixelsPerUnit = 92 / maximum;
    const barScale = 245 / maximum;
    const origin = { x: plotX(frame.xCm), y: plotY(frame.yCm) };
    const axisY = plotY(0);

    root.dataset.step = String(index);
    root.dataset.playState = playState;
    root.dataset.motion = motionPreference();
    elements.title.textContent = frame.title;
    elements.explanation.textContent = frame.explanation;
    elements.status.textContent = `Passo ${index + 1} de ${frames.length} · ${frame.title}`;
    elements.region.textContent = `Região atual: ${frame.region}`;
    elements.candidate.setAttribute("cx", origin.x.toFixed(2));
    elements.candidate.setAttribute("cy", origin.y.toFixed(2));
    elements.candidateLabel.setAttribute("x", (origin.x + 14).toFixed(2));
    elements.candidateLabel.setAttribute("y", (origin.y - 42).toFixed(2));
    elements.candidateLabel.textContent = `P (${frame.xCm.toFixed(2).replace("-", "−")}; ${frame.yCm.toFixed(2).replace("-", "−")}) cm`;
    elements.guideX.setAttribute("x1", origin.x.toFixed(2));
    elements.guideX.setAttribute("x2", origin.x.toFixed(2));
    elements.guideX.setAttribute("y1", origin.y.toFixed(2));
    elements.guideX.setAttribute("y2", axisY.toFixed(2));
    elements.guideY.setAttribute("x1", plotX(0).toFixed(2));
    elements.guideY.setAttribute("x2", origin.x.toFixed(2));
    elements.guideY.setAttribute("y1", origin.y.toFixed(2));
    elements.guideY.setAttribute("y2", origin.y.toFixed(2));
    setLineVector(elements.field1, origin, field1, pixelsPerUnit);
    setLineVector(elements.field2, origin, field2, pixelsPerUnit);
    setLineVector(elements.resultant, origin, vectors.resultant, pixelsPerUnit);
    placeVectorLabel(elements.field1Label, elements.field1);
    placeVectorLabel(elements.field2Label, elements.field2);
    placeVectorLabel(elements.resultantLabel, elements.resultant);
    elements.bar1.setAttribute("width", Math.max(0, magnitudes[0] * barScale).toFixed(2));
    elements.bar2.setAttribute("width", Math.max(0, magnitudes[1] * barScale).toFixed(2));
    elements.barResultant.setAttribute("width", Math.max(1, magnitudes[2] * barScale).toFixed(2));
    elements.bar1Value.textContent = formatScientific(magnitudes[0]);
    elements.bar2Value.textContent = formatScientific(magnitudes[1]);
    elements.barResultantValue.textContent = index === frames.length - 1 ? "≈ 0 N/C" : formatScientific(magnitudes[2]);
    elements.play.disabled = playState === "playing";
    elements.pause.disabled = playState === "paused";
    elements.next.disabled = index === frames.length - 1;
  }

  function pause() {
    stopTimer();
    playState = "paused";
    render();
  }

  function step() {
    if (index < frames.length - 1) {
      index += 1;
    }
    if (index === frames.length - 1) {
      stopTimer();
      playState = "paused";
    }
    render();
  }

  function play() {
    if (motionQuery.matches || index === frames.length - 1) {
      pause();
      return;
    }
    stopTimer();
    playState = "playing";
    timer = globalThis.setInterval(step, 1800 / speed);
    render();
  }

  function reset() {
    stopTimer();
    index = 0;
    playState = "paused";
    render();
  }

  function setSpeed(multiplier) {
    const nextSpeed = Number(multiplier);
    if (![0.5, 1, 2].includes(nextSpeed)) {
      throw new RangeError("A velocidade deve ser 0,5×, 1× ou 2×.");
    }
    speed = nextSpeed;
    elements.speed.value = String(speed);
    if (playState === "playing") {
      play();
    }
    return getState();
  }

  function getState() {
    return Object.freeze({
      playState,
      step: index,
      speed,
      motion: motionPreference(),
    });
  }

  elements.play.addEventListener("click", play);
  elements.pause.addEventListener("click", pause);
  elements.reset.addEventListener("click", reset);
  elements.next.addEventListener("click", step);
  elements.speed.addEventListener("change", (event) => setSpeed(event.currentTarget.value));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
    }
  });
  motionQuery.addEventListener("change", () => {
    if (motionQuery.matches) {
      pause();
    } else {
      render();
    }
  });
  render();

  return Object.freeze({ play, pause, reset, step, setSpeed, getState });
}
