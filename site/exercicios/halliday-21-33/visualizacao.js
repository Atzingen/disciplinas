import { waterChargeSteps } from "./modelo.js";

const SCALE_MIN = 0;
const SCALE_MAX = 26;

export function mountChargeCounting(root) {
  if (!root) {
    return null;
  }

  const steps = waterChargeSteps();
  const motionQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
  const elements = {
    stations: [...root.querySelectorAll("[data-station]")],
    factorLabel: root.querySelector("[data-factor-label]"),
    factor: root.querySelector("[data-factor]"),
    cancellation: root.querySelector("[data-cancellation]"),
    scaleMarker: root.querySelector("[data-scale-marker]"),
    scaleValue: root.querySelector("[data-scale-value]"),
    neutrality: root.querySelector("[data-neutrality]"),
    status: root.querySelector("[data-step-status]"),
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

  function render() {
    const current = steps[index];
    const completed = index === steps.length - 1;
    const scalePosition =
      ((current.exponent - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

    root.dataset.step = String(index);
    root.dataset.stepId = current.id;
    root.dataset.playState = playState;
    root.dataset.motion = motionPreference();
    root.dataset.complete = String(completed);

    elements.stations.forEach((station, stationIndex) => {
      station.dataset.state =
        stationIndex === index
          ? "active"
          : stationIndex < index
            ? "complete"
            : "pending";
      station.setAttribute(
        "aria-current",
        stationIndex === index ? "step" : "false",
      );
    });

    elements.factorLabel.textContent = current.factorLabel;
    elements.factor.innerHTML = current.factorHtml;
    elements.cancellation.textContent = current.cancellationHtml;
    elements.scaleMarker.style.setProperty(
      "--scale-position",
      `${Math.max(0, Math.min(100, scalePosition))}%`,
    );
    elements.scaleValue.textContent =
      `ordem de grandeza: 10^${Math.floor(current.exponent)}`;
    elements.neutrality.setAttribute("aria-hidden", String(!completed));
    elements.status.textContent =
      `Passo ${index + 1} de ${steps.length}. ${current.accessibleText}`;
    elements.play.disabled = playState === "playing" || completed;
    elements.pause.disabled = playState === "paused";
    elements.next.disabled = completed;
  }

  function pause() {
    stopTimer();
    playState = "paused";
    render();
  }

  function goTo(nextIndex) {
    index = Math.max(0, Math.min(steps.length - 1, nextIndex));
    if (index === steps.length - 1) {
      stopTimer();
      playState = "paused";
    }
    render();
  }

  function stepForward() {
    goTo(index + 1);
  }

  function stepBack() {
    pause();
    goTo(index - 1);
  }

  function play() {
    if (motionQuery.matches || index === steps.length - 1) {
      pause();
      return;
    }
    stopTimer();
    playState = "playing";
    timer = globalThis.setInterval(stepForward, 1700 / speed);
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
      stepId: steps[index].id,
      speed,
      motion: motionPreference(),
    });
  }

  elements.play.addEventListener("click", play);
  elements.pause.addEventListener("click", pause);
  elements.reset.addEventListener("click", reset);
  elements.next.addEventListener("click", stepForward);
  elements.speed.addEventListener("change", (event) => {
    setSpeed(event.currentTarget.value);
  });
  elements.stations.forEach((station, stationIndex) => {
    station.addEventListener("click", () => {
      pause();
      goTo(stationIndex);
    });
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
    setSpeed,
    getState,
  });
}
