import { pendulumState } from "./modelo.js";

const LENGTH_M = 1.2;
const MASS_KG = 0.01;
const GRAVITY = 9.81;
const DEFAULT_SEPARATION_CM = 5;

const STEPS = Object.freeze([
  {
    id: "geometry",
    label: "geometria",
    title: "Encontre x/2 e θ",
    description:
      "A simetria divide a separação igualmente: cada esfera se afasta x/2 da vertical.",
  },
  {
    id: "forces",
    label: "corpo livre",
    title: "Isole a esfera direita",
    description:
      "Sobre ela atuam a tensão T, o peso mg e a repulsão elétrica Fₑ.",
  },
  {
    id: "components",
    label: "componentes",
    title: "Projete a tensão",
    description:
      "A componente horizontal equilibra Fₑ; a componente vertical equilibra mg.",
  },
  {
    id: "elimination",
    label: "eliminação",
    title: "Faça T desaparecer",
    description:
      "Dividir T sen θ = Fₑ por T cos θ = mg elimina a tensão: tan θ = Fₑ/mg.",
  },
  {
    id: "coulomb",
    label: "Coulomb",
    title: "Escreva a repulsão",
    description:
      "Como x é a distância entre as cargas, a lei de Coulomb fornece Fₑ = kq²/x².",
  },
  {
    id: "approximation",
    label: "aproximação",
    title: "Compare sen θ e tan θ",
    description:
      "Para θ pequeno, tan θ ≈ sen θ = x/2L. O calibre abaixo mostra o erro em q.",
  },
  {
    id: "answer",
    label: "resposta",
    title: "Isole a carga",
    description:
      "A relação cúbica leva a q = √(mgx³/(2Lk)). Para x = 5,0 cm, q ≈ 24 nC.",
  },
]);

function decimal(value, digits) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function isNativeInteractiveTarget(target, root) {
  if (!target || target === root || typeof target.closest !== "function") {
    return false;
  }
  return Boolean(
    target.closest("button, input, select, textarea, a, [contenteditable='true']"),
  );
}

export function formatRelativeError(relativeError) {
  if (!Number.isFinite(relativeError) || relativeError < 0) {
    throw new RangeError("O erro relativo deve ser finito e não negativo.");
  }

  const percent = relativeError * 100;
  if (percent > 0 && percent < 0.001) {
    return "< 0,001%";
  }
  return `${decimal(percent, 3)}%`;
}

export function handleChargedPendulumShortcut(event, root, actions) {
  if (isNativeInteractiveTarget(event.target, root)) {
    return false;
  }

  const actionByKey = {
    ArrowLeft: actions.previous,
    ArrowRight: actions.next,
    Home: actions.reset,
    " ": actions.togglePlay,
    Spacebar: actions.togglePlay,
  };
  const action = actionByKey[event.key];
  if (!action) {
    return false;
  }

  event.preventDefault();
  action();
  return true;
}

export function mountChargedPendulum(root) {
  if (!root) {
    return null;
  }

  root.dataset.enhanced = "true";

  const elements = {
    separation: root.querySelector("[data-separation]"),
    separationOutput: root.querySelector("[data-separation-output]"),
    angleOutput: root.querySelector("[data-angle-output]"),
    chargeOutput: root.querySelector("[data-charge-output]"),
    errorOutput: root.querySelector("[data-error-output]"),
    svgSeparation: root.querySelector("[data-svg-separation]"),
    svgAngle: root.querySelector("[data-svg-angle]"),
    halfLabel: root.querySelector("[data-half-label]"),
    leftString: root.querySelector("[data-left-string]"),
    rightString: root.querySelector("[data-right-string]"),
    leftMass: root.querySelector("[data-left-mass]"),
    rightMass: root.querySelector("[data-right-mass]"),
    leftSign: root.querySelector("[data-left-sign]"),
    rightSign: root.querySelector("[data-right-sign]"),
    leftDrop: root.querySelector("[data-left-drop]"),
    rightDrop: root.querySelector("[data-right-drop]"),
    fullDimension: root.querySelector("[data-full-dimension]"),
    halfDimension: root.querySelector("[data-half-dimension]"),
    stepStatus: root.querySelector("[data-step-status]"),
    stepTitle: root.querySelector("[data-step-title]"),
    stepDescription: root.querySelector("[data-step-description]"),
    reveals: [...root.querySelectorAll("[data-reveal-step]")],
    stepButtons: [...root.querySelectorAll("[data-step-button]")],
    play: root.querySelector("[data-play]"),
    pause: root.querySelector("[data-pause]"),
    reset: root.querySelector("[data-reset]"),
    next: root.querySelector("[data-next]"),
    speed: root.querySelector("[data-speed]"),
  };

  const motionQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
  let stepIndex = 0;
  let separationCm = DEFAULT_SEPARATION_CM;
  let speed = 1;
  let playState = "paused";
  let timerId = null;

  function stopTimer() {
    if (timerId !== null) {
      globalThis.clearTimeout(timerId);
      timerId = null;
    }
  }

  function updateGeometry() {
    const pivotX = 290;
    const pivotY = 105;
    const drawnStringLength = 280;
    const halfSpan = 52 + ((separationCm - 1) / 19) * 108;
    const massY =
      pivotY + Math.sqrt(drawnStringLength ** 2 - halfSpan ** 2);
    const leftX = pivotX - halfSpan;
    const rightX = pivotX + halfSpan;

    for (const [element, x] of [
      [elements.leftMass, leftX],
      [elements.leftSign, leftX],
      [elements.rightMass, rightX],
      [elements.rightSign, rightX],
    ]) {
      element.setAttribute("cx" in element ? "cx" : "x", String(x));
    }
    elements.leftMass.setAttribute("cy", String(massY));
    elements.rightMass.setAttribute("cy", String(massY));
    elements.leftSign.setAttribute("y", String(massY + 9));
    elements.rightSign.setAttribute("y", String(massY + 9));
    elements.leftString.setAttribute("x2", String(leftX));
    elements.leftString.setAttribute("y2", String(massY));
    elements.rightString.setAttribute("x2", String(rightX));
    elements.rightString.setAttribute("y2", String(massY));
    elements.leftDrop.setAttribute("x1", String(leftX));
    elements.leftDrop.setAttribute("x2", String(leftX));
    elements.leftDrop.setAttribute("y1", String(massY));
    elements.rightDrop.setAttribute("x1", String(rightX));
    elements.rightDrop.setAttribute("x2", String(rightX));
    elements.rightDrop.setAttribute("y1", String(massY));
    elements.fullDimension.setAttribute("x1", String(leftX + 10));
    elements.fullDimension.setAttribute("x2", String(rightX - 10));
    elements.halfDimension.setAttribute("x2", String(rightX - 10));
    elements.halfLabel.setAttribute("x", String((pivotX + rightX) / 2));
  }

  function render() {
    const state = pendulumState({
      lengthM: LENGTH_M,
      massKg: MASS_KG,
      separationM: separationCm / 100,
      gravity: GRAVITY,
    });
    const separationLabel = `${decimal(separationCm, 1)} cm`;
    const angleLabel = `${decimal(state.thetaDegrees, 2)}°`;
    const chargeNanoC = state.approximateChargeC * 1e9;
    const chargeLabel = `${decimal(chargeNanoC, 0)} nC`;
    const errorLabel = formatRelativeError(state.relativeChargeError);
    const step = STEPS[stepIndex];

    root.dataset.step = String(stepIndex);
    root.dataset.stepId = step.id;
    root.dataset.playState = playState;
    root.dataset.motion = motionQuery.matches ? "reduced" : "full";
    elements.separationOutput.textContent = separationLabel;
    elements.angleOutput.textContent = `θ ≈ ${angleLabel}`;
    elements.chargeOutput.textContent = `q ≈ ${chargeLabel}`;
    elements.errorOutput.textContent = errorLabel;
    elements.svgSeparation.textContent = separationLabel;
    elements.svgAngle.textContent = `θ real ≈ ${angleLabel}`;
    elements.halfLabel.textContent = `x/2 = ${decimal(separationCm / 2, 1)} cm`;
    elements.stepStatus.textContent = `Passo ${stepIndex + 1} de ${STEPS.length} · ${step.label}`;
    elements.stepTitle.textContent = step.title;
    elements.stepDescription.textContent = step.description;

    for (const reveal of elements.reveals) {
      const visible = Number(reveal.dataset.revealStep) <= stepIndex;
      reveal.dataset.visible = String(visible);
      reveal.setAttribute("aria-hidden", String(!visible));
    }
    for (const [index, button] of elements.stepButtons.entries()) {
      const stateName =
        index === stepIndex ? "active" : index < stepIndex ? "complete" : "upcoming";
      button.dataset.state = stateName;
      if (index === stepIndex) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    }

    elements.play.disabled = playState === "playing" || motionQuery.matches;
    elements.pause.disabled = playState !== "playing";
    elements.next.disabled = stepIndex === STEPS.length - 1;
    updateGeometry();
  }

  function pause() {
    stopTimer();
    playState = "paused";
    render();
  }

  function goTo(nextIndex) {
    stepIndex = Math.max(0, Math.min(STEPS.length - 1, nextIndex));
    render();
  }

  function stepForward() {
    pause();
    goTo(stepIndex + 1);
  }

  function stepBack() {
    pause();
    goTo(stepIndex - 1);
  }

  function scheduleNext() {
    stopTimer();
    timerId = globalThis.setTimeout(() => {
      if (stepIndex >= STEPS.length - 1) {
        pause();
        return;
      }
      stepIndex += 1;
      render();
      scheduleNext();
    }, 1500 / speed);
  }

  function play() {
    if (motionQuery.matches) {
      return;
    }
    if (stepIndex >= STEPS.length - 1) {
      stepIndex = 0;
    }
    playState = "playing";
    render();
    scheduleNext();
  }

  function reset() {
    stopTimer();
    playState = "paused";
    stepIndex = 0;
    separationCm = DEFAULT_SEPARATION_CM;
    elements.separation.value = String(DEFAULT_SEPARATION_CM);
    render();
  }

  function setSpeed(multiplier) {
    speed = Number(multiplier);
    if (playState === "playing") {
      scheduleNext();
    }
    render();
  }

  function getState() {
    const state = pendulumState({
      lengthM: LENGTH_M,
      massKg: MASS_KG,
      separationM: separationCm / 100,
      gravity: GRAVITY,
    });
    return Object.freeze({
      ...state,
      stepIndex,
      stepId: STEPS[stepIndex].id,
      separationCm,
      speed,
      playState,
      motion: motionQuery.matches ? "reduced" : "full",
    });
  }

  elements.separation.addEventListener("input", (event) => {
    pause();
    separationCm = Number(event.currentTarget.value);
    render();
  });
  elements.play.addEventListener("click", play);
  elements.pause.addEventListener("click", pause);
  elements.reset.addEventListener("click", reset);
  elements.next.addEventListener("click", stepForward);
  elements.speed.addEventListener("change", (event) => {
    setSpeed(event.currentTarget.value);
  });
  for (const button of elements.stepButtons) {
    button.addEventListener("click", () => {
      pause();
      goTo(Number(button.dataset.stepButton));
    });
  }
  root.addEventListener("keydown", (event) => {
    handleChargedPendulumShortcut(event, root, {
      next: stepForward,
      previous: stepBack,
      reset,
      togglePlay: () => (playState === "playing" ? pause() : play()),
    });
  });
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

  return Object.freeze({
    play,
    pause,
    reset,
    step: stepForward,
    setSpeed,
    getState,
  });
}
