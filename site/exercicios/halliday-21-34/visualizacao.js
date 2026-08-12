import {
  equilibriumAngleDegrees,
  normalizedForceComponents,
} from "./modelo.js";

const STEPS = Object.freeze([
  {
    id: "distance",
    label: "Distância",
    title: "A geometria alonga a separação",
    description:
      "A projeção horizontal vale R. No triângulo retângulo, a distância real é r = R/cos θ.",
  },
  {
    id: "inverse-square",
    label: "Lei de Coulomb",
    title: "O inverso do quadrado traz cos² θ",
    description:
      "Substituir r na lei de Coulomb transforma 1/r² em cos² θ/R².",
  },
  {
    id: "projection",
    label: "Projeção",
    title: "Projetar sobre x acrescenta outro cos θ",
    description:
      "Cada força diagonal fornece uma componente horizontal n cos³ θ na escala normalizada.",
  },
  {
    id: "vertical",
    label: "Vertical",
    title: "As componentes verticais se cancelam",
    description:
      "Os módulos são iguais e os sentidos opostos: +Fᵧ e −Fᵧ somam exatamente zero.",
  },
  {
    id: "horizontal",
    label: "Horizontal",
    title: "As componentes horizontais equilibram F₁₂",
    description:
      "Cada íon fornece metade da força necessária: 0,500 + 0,500 = 1,000.",
  },
  {
    id: "quantization",
    label: "Quantização",
    title: "A carga discreta seleciona o ângulo",
    description:
      "Com q = ne, somente n inteiro de 1 a 5 é permitido; cada botão leva a um ângulo físico.",
  },
]);

function decimal(value, digits = 2) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function mountQuantizedBalance(root) {
  if (!root) {
    return null;
  }

  const motionQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
  const elements = {
    ionButtons: [...root.querySelectorAll("[data-ion-multiple]")],
    stepButtons: [...root.querySelectorAll("[data-step-button]")],
    reveals: [...root.querySelectorAll("[data-reveal-step]")],
    angle: root.querySelector("[data-angle]"),
    ionCharge: root.querySelector("[data-ion-charge]"),
    distance: root.querySelector("[data-distance-ratio]"),
    forceMagnitude: root.querySelector("[data-force-magnitude]"),
    verticalValues: [...root.querySelectorAll("[data-vertical-one]")],
    horizontalOne: root.querySelector("[data-horizontal-one]"),
    horizontalPair: root.querySelector("[data-horizontal-pair]"),
    stepTitle: root.querySelector("[data-step-title]"),
    stepDescription: root.querySelector("[data-step-description]"),
    status: root.querySelector("[data-step-status]"),
    upperIon: root.querySelector("[data-upper-ion]"),
    lowerIon: root.querySelector("[data-lower-ion]"),
    upperIonSign: root.querySelector("[data-upper-ion-sign]"),
    lowerIonSign: root.querySelector("[data-lower-ion-sign]"),
    upperIonLabel: root.querySelector("[data-upper-ion-label]"),
    lowerIonLabel: root.querySelector("[data-lower-ion-label]"),
    upperGuide: root.querySelector("[data-upper-guide]"),
    lowerGuide: root.querySelector("[data-lower-guide]"),
    angleArc: root.querySelector("[data-angle-arc]"),
    angleLabel: root.querySelector("[data-angle-label]"),
    forceUpper: root.querySelector("[data-force-upper]"),
    forceLower: root.querySelector("[data-force-lower]"),
    forceUpperLabel: root.querySelector("[data-force-upper-label]"),
    forceLowerLabel: root.querySelector("[data-force-lower-label]"),
    projectionUpper: root.querySelector("[data-projection-upper]"),
    projectionLower: root.querySelector("[data-projection-lower]"),
    play: root.querySelector("[data-play]"),
    pause: root.querySelector("[data-pause]"),
    reset: root.querySelector("[data-reset]"),
    next: root.querySelector("[data-next]"),
    speed: root.querySelector("[data-speed]"),
  };

  let ionMultiple = 1;
  let stepIndex = 0;
  let speed = 1;
  let timer = null;
  let playState = "paused";

  function stopTimer() {
    if (timer !== null) {
      globalThis.clearInterval(timer);
      timer = null;
    }
  }

  function positionGeometry(theta) {
    const originX = 310;
    const originY = 350;
    const horizontal = 115;
    const vertical = Math.tan(theta) * horizontal;
    const ionX = originX + horizontal;
    const upperY = originY - vertical;
    const lowerY = originY + vertical;

    elements.upperIon.setAttribute("cx", String(ionX));
    elements.upperIon.setAttribute("cy", String(upperY));
    elements.lowerIon.setAttribute("cx", String(ionX));
    elements.lowerIon.setAttribute("cy", String(lowerY));
    elements.upperIonSign.setAttribute("x", String(ionX));
    elements.upperIonSign.setAttribute("y", String(upperY + 9));
    elements.lowerIonSign.setAttribute("x", String(ionX));
    elements.lowerIonSign.setAttribute("y", String(lowerY + 9));
    elements.upperIonLabel.setAttribute("x", String(ionX + 31));
    elements.upperIonLabel.setAttribute("y", String(upperY + 5));
    elements.lowerIonLabel.setAttribute("x", String(ionX + 31));
    elements.lowerIonLabel.setAttribute("y", String(lowerY + 5));
    elements.upperGuide.setAttribute("x2", String(ionX));
    elements.upperGuide.setAttribute("y2", String(upperY));
    elements.lowerGuide.setAttribute("x2", String(ionX));
    elements.lowerGuide.setAttribute("y2", String(lowerY));

    const radius = 66;
    const arcEndX = originX + radius * Math.cos(theta);
    const arcEndY = originY - radius * Math.sin(theta);
    elements.angleArc.setAttribute(
      "d",
      `M ${originX + radius} ${originY} A ${radius} ${radius} 0 0 0 ${arcEndX} ${arcEndY}`,
    );
    elements.angleLabel.setAttribute(
      "x",
      String(originX + 82 * Math.cos(theta / 2)),
    );
    elements.angleLabel.setAttribute(
      "y",
      String(originY - 82 * Math.sin(theta / 2) - 4),
    );

    const forceHorizontal = 75;
    const forceVertical = Math.tan(theta) * forceHorizontal;
    const forceX = originX - forceHorizontal;
    const upperForceY = originY + forceVertical;
    const lowerForceY = originY - forceVertical;
    elements.forceUpper.setAttribute("x2", String(forceX));
    elements.forceUpper.setAttribute("y2", String(upperForceY));
    elements.forceLower.setAttribute("x2", String(forceX));
    elements.forceLower.setAttribute("y2", String(lowerForceY));
    elements.forceUpperLabel.setAttribute("x", String(forceX - 55));
    elements.forceUpperLabel.setAttribute("y", String(upperForceY + 24));
    elements.forceLowerLabel.setAttribute("x", String(forceX - 55));
    elements.forceLowerLabel.setAttribute("y", String(lowerForceY - 12));
    elements.projectionUpper.setAttribute("x1", String(forceX));
    elements.projectionUpper.setAttribute("x2", String(forceX));
    elements.projectionUpper.setAttribute("y2", String(upperForceY));
    elements.projectionLower.setAttribute("x1", String(forceX));
    elements.projectionLower.setAttribute("x2", String(forceX));
    elements.projectionLower.setAttribute("y2", String(lowerForceY));
  }

  function render() {
    const step = STEPS[stepIndex];
    const angleDegrees = equilibriumAngleDegrees(ionMultiple);
    const forces = normalizedForceComponents(ionMultiple);
    const cosine = Math.cos(forces.theta);
    const forceMagnitude = ionMultiple * cosine ** 2;
    const verticalOne = forceMagnitude * Math.sin(forces.theta);
    const completed = stepIndex === STEPS.length - 1;

    root.dataset.step = String(stepIndex);
    root.dataset.stepId = step.id;
    root.dataset.playState = playState;
    root.dataset.motion = motionQuery.matches ? "reduced" : "full";
    root.dataset.selectedIon = String(ionMultiple);

    elements.angle.textContent = `${decimal(angleDegrees)}°`;
    elements.ionCharge.textContent = `−${ionMultiple}e`;
    elements.upperIonLabel.textContent = `3 · −${ionMultiple}e`;
    elements.lowerIonLabel.textContent = `4 · −${ionMultiple}e`;
    elements.distance.textContent = decimal(forces.distanceRatio, 3);
    elements.forceMagnitude.textContent = decimal(forceMagnitude, 3);
    elements.verticalValues.forEach((element) => {
      element.textContent = decimal(verticalOne, 3);
    });
    elements.horizontalOne.textContent = decimal(forces.horizontalOne, 3);
    elements.horizontalPair.textContent = decimal(
      2 * forces.horizontalOne,
      3,
    );
    elements.stepTitle.textContent = step.title;
    elements.stepDescription.textContent = step.description;
    elements.status.textContent =
      `Passo ${stepIndex + 1} de ${STEPS.length}. ${step.title}. ` +
      `Para n = ${ionMultiple}, θ = ${decimal(angleDegrees)} graus.`;

    elements.ionButtons.forEach((button) => {
      const selected = Number(button.dataset.ionMultiple) === ionMultiple;
      button.setAttribute("aria-pressed", String(selected));
    });
    elements.stepButtons.forEach((button, index) => {
      const state = index === stepIndex ? "active" : index < stepIndex ? "complete" : "pending";
      button.dataset.state = state;
      button.setAttribute("aria-current", index === stepIndex ? "step" : "false");
    });
    elements.reveals.forEach((element) => {
      const revealAt = Number(element.dataset.revealStep);
      element.dataset.visible = String(stepIndex >= revealAt);
    });

    elements.play.disabled = playState === "playing" || completed || motionQuery.matches;
    elements.pause.disabled = playState === "paused";
    elements.next.disabled = completed;
    positionGeometry(forces.theta);
  }

  function pause() {
    stopTimer();
    playState = "paused";
    render();
  }

  function goTo(nextIndex) {
    stepIndex = Math.max(0, Math.min(STEPS.length - 1, nextIndex));
    if (stepIndex === STEPS.length - 1) {
      stopTimer();
      playState = "paused";
    }
    render();
  }

  function stepForward() {
    goTo(stepIndex + 1);
  }

  function stepBack() {
    pause();
    goTo(stepIndex - 1);
  }

  function play() {
    if (motionQuery.matches || stepIndex === STEPS.length - 1) {
      pause();
      return;
    }
    stopTimer();
    playState = "playing";
    timer = globalThis.setInterval(stepForward, 1600 / speed);
    render();
  }

  function reset() {
    stopTimer();
    stepIndex = 0;
    playState = "paused";
    render();
  }

  function selectIon(nextIonMultiple) {
    ionMultiple = Number(nextIonMultiple);
    reset();
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
      ionMultiple,
      step: stepIndex,
      stepId: STEPS[stepIndex].id,
      playState,
      speed,
      motion: motionQuery.matches ? "reduced" : "full",
    });
  }

  elements.ionButtons.forEach((button) => {
    button.addEventListener("click", () => selectIon(button.dataset.ionMultiple));
  });
  elements.stepButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      pause();
      goTo(index);
    });
  });
  elements.play.addEventListener("click", play);
  elements.pause.addEventListener("click", pause);
  elements.reset.addEventListener("click", reset);
  elements.next.addEventListener("click", stepForward);
  elements.speed.addEventListener("change", (event) => {
    setSpeed(event.currentTarget.value);
  });
  root.addEventListener("keydown", (event) => {
    if (event.target === elements.speed) {
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      pause();
      stepForward();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepBack();
    } else if (event.key === "Home") {
      event.preventDefault();
      reset();
    } else if (event.key === " ") {
      event.preventDefault();
      playState === "playing" ? pause() : play();
    }
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
    selectIon,
    setSpeed,
    getState,
  });
}
