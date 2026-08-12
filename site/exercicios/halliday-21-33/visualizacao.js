import { waterChargeSteps } from "./modelo.js";

const SCALE_MIN = 0;
const SCALE_MAX = 26;

const STEP_COPY = Object.freeze({
  volume: {
    title: "Volume",
    factorLabel: "Amostra fornecida",
    cancellationText: "Ponto de partida: ainda não há unidade a cancelar.",
    status(valueText) {
      return `O cálculo começa com ${valueText} de água.`;
    },
  },
  mass: {
    title: "Massa",
    factorLabel: "Multiplique pela densidade",
    cancellationText: "cm³ cancela com cm³; resta grama.",
    factorNumeratorFractionDigits: 2,
  },
  moles: {
    title: "Quantidade de matéria",
    stationTitle: "Mols",
    factorLabel: "Divida pela massa molar",
    cancellationText: "g cancela com g; resta mol.",
  },
  molecules: {
    title: "Moléculas",
    factorLabel: "Multiplique pelo número de Avogadro",
    cancellationText: "mol cancela com mol; resta a contagem de moléculas.",
  },
  protons: {
    title: "Prótons",
    factorLabel: "Conte dez prótons por molécula",
    cancellationText:
      "molécula cancela com molécula; resta a contagem de prótons.",
  },
  charge: {
    title: "Carga positiva",
    stationTitle: "Carga",
    factorLabel: "Multiplique pela carga elementar",
    cancellationText:
      "próton cancela com próton; resta coulomb. Os elétrons fornecem a carga oposta.",
  },
});

const SUPERSCRIPT_CHARACTERS = Object.freeze({
  "-": "⁻",
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
});

const SINGULAR_UNIT_SYMBOLS = Object.freeze({
  moléculas: "molécula",
  prótons: "próton",
});

function exponentText(exponent) {
  return String(exponent)
    .split("")
    .map((character) => SUPERSCRIPT_CHARACTERS[character] ?? character)
    .join("");
}

function decimalText(value, fractionDigits) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function scientificParts(value, decimals) {
  const absolute = Math.abs(value);
  const exponent = Math.floor(Math.log10(absolute));
  return {
    exponent,
    mantissa: absolute / 10 ** exponent,
    decimals,
  };
}

function scalarHtml(
  value,
  { scientificDecimals = 2, fractionDigits = null, forcePositive = false } = {},
) {
  const absolute = Math.abs(value);
  const prefix = value < 0 ? "−" : forcePositive ? "+" : "";

  if (absolute !== 0 && (absolute >= 1e4 || absolute < 0.01)) {
    const scientific = scientificParts(value, scientificDecimals);
    return (
      prefix +
      decimalText(scientific.mantissa, scientific.decimals) +
      ` × 10<sup>${String(scientific.exponent).replace("-", "−")}</sup>`
    );
  }

  const digits = fractionDigits ?? (Number.isInteger(absolute) ? 0 : 2);
  return prefix + decimalText(absolute, digits);
}

function scalarText(
  value,
  { scientificDecimals = 2, fractionDigits = null, forcePositive = false } = {},
) {
  const absolute = Math.abs(value);
  const prefix = value < 0 ? "−" : forcePositive ? "+" : "";

  if (absolute !== 0 && (absolute >= 1e4 || absolute < 0.01)) {
    const scientific = scientificParts(value, scientificDecimals);
    return (
      prefix +
      decimalText(scientific.mantissa, scientific.decimals) +
      ` × 10${exponentText(scientific.exponent)}`
    );
  }

  const digits = fractionDigits ?? (Number.isInteger(absolute) ? 0 : 2);
  return prefix + decimalText(absolute, digits);
}

function unitHtml(unit, cancelled = false) {
  const power = unit.power === 1 ? "" : `<sup>${unit.power}</sup>`;
  const markup = `${unit.symbol}${power}`;
  return cancelled ? `<s>${markup}</s>` : markup;
}

function unitText(unit) {
  const power = unit.power === 1 ? "" : exponentText(unit.power);
  return `${unit.symbol}${power}`;
}

function denominatorUnitHtml(unit) {
  return unitHtml(
    {
      ...unit,
      symbol: SINGULAR_UNIT_SYMBOLS[unit.symbol] ?? unit.symbol,
    },
    true,
  );
}

function quantityHtml(step, { value = step.value, forcePositive = false } = {}) {
  return `${scalarHtml(value, { forcePositive })} ${unitHtml(step.unit)}`;
}

function quantityText(step, { value = step.value, forcePositive = false } = {}) {
  return `${scalarText(value, { forcePositive })} ${unitText(step.unit)}`;
}

function factorScalarHtml(value, fractionDigits = null) {
  return scalarHtml(value, {
    scientificDecimals: 3,
    fractionDigits,
  });
}

function factorMarkup(step, previousStep, copy) {
  if (step.factor === null) {
    return quantityHtml(step);
  }
  if (!previousStep) {
    throw new TypeError(`O passo ${step.id} requer a grandeza anterior.`);
  }

  const numerator = step.factor.numerator;
  const denominator = step.factor.denominator;
  const input =
    scalarHtml(previousStep.value) +
    " " +
    unitHtml(step.cancelledUnit, true);
  const conversion =
    factorScalarHtml(
      numerator.value,
      copy.factorNumeratorFractionDigits ?? null,
    ) +
    " " +
    unitHtml(numerator.unit) +
    " / " +
    factorScalarHtml(denominator.value) +
    " " +
    denominatorUnitHtml(denominator.unit);

  return `(${input}) × (${conversion})`;
}

export function presentChargeStep(step, previousStep = null) {
  const copy = STEP_COPY[step.id];
  if (!copy) {
    throw new RangeError(`Passo de carga desconhecido: ${step.id}.`);
  }
  const valueHtml = quantityHtml(step, {
    forcePositive: step.id === "charge",
  });
  const valueText = quantityText(step, {
    forcePositive: step.id === "charge",
  });
  const statusText = copy.status
    ? copy.status(valueText)
    : `${copy.factorLabel}. ${copy.cancellationText} O resultado é ${valueText}.`;

  return Object.freeze({
    title: copy.title,
    stationTitle: copy.stationTitle ?? copy.title,
    valueHtml,
    valueText,
    factorLabel: copy.factorLabel,
    factorHtml: factorMarkup(step, previousStep, copy),
    cancellationText: copy.cancellationText,
    statusText,
    scaleHtml: `ordem de grandeza: 10<sup>${Math.floor(step.exponent)}</sup>`,
  });
}

export function chargeStationsMarkup(steps) {
  const stations = steps
    .map((step, index) => {
      const presentation = presentChargeStep(step, steps[index - 1] ?? null);
      const current = index === 0 ? ' aria-current="step"' : ' aria-current="false"';
      const state = index === 0 ? "active" : "pending";
      return (
        `<li class="charge-counting__station" data-station="${step.id}" ` +
        `data-state="${state}"${current}>` +
        '<button type="button">' +
        `<span class="charge-counting__station-index">${String(index + 1).padStart(2, "0")} · ${presentation.stationTitle}</span>` +
        `<strong class="charge-counting__station-symbol">${step.symbol}</strong>` +
        `<span class="charge-counting__station-value">${presentation.valueHtml}</span>` +
        "</button></li>"
      );
    })
    .join("");

  return `<ol class="charge-counting__stations" aria-label="Cadeia dimensional">${stations}</ol>`;
}

export function mountChargeCounting(root) {
  if (!root) {
    return null;
  }

  const steps = waterChargeSteps();
  const stationShell = root.querySelector("[data-stations]");
  stationShell.innerHTML = chargeStationsMarkup(steps);

  const motionQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
  const elements = {
    stations: [...root.querySelectorAll("[data-station]")],
    factorLabel: root.querySelector("[data-factor-label]"),
    factor: root.querySelector("[data-factor]"),
    cancellation: root.querySelector("[data-cancellation]"),
    scaleMarker: root.querySelector("[data-scale-marker]"),
    scaleValue: root.querySelector("[data-scale-value]"),
    neutrality: root.querySelector("[data-neutrality]"),
    positiveCharge: root.querySelector("[data-positive-charge]"),
    negativeCharge: root.querySelector("[data-negative-charge]"),
    netCharge: root.querySelector("[data-net-charge]"),
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

  function renderNeutrality() {
    const chargeStep = steps.at(-1);
    elements.positiveCharge.innerHTML =
      `Prótons · ${quantityHtml(chargeStep, { forcePositive: true })}`;
    elements.negativeCharge.innerHTML =
      `Elétrons · ${quantityHtml(chargeStep, { value: -chargeStep.value })}`;
    elements.netCharge.innerHTML =
      `Carga líquida: <strong>${scalarHtml(chargeStep.netChargeCoulombs)} C</strong>`;
  }

  function render() {
    const current = steps[index];
    const presentation = presentChargeStep(current, steps[index - 1] ?? null);
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

    elements.factorLabel.textContent = presentation.factorLabel;
    elements.factor.innerHTML = presentation.factorHtml;
    elements.cancellation.textContent = presentation.cancellationText;
    elements.scaleMarker.style.setProperty(
      "--scale-position",
      `${Math.max(0, Math.min(100, scalePosition))}%`,
    );
    elements.scaleValue.innerHTML = presentation.scaleHtml;
    elements.neutrality.setAttribute("aria-hidden", String(!completed));
    elements.status.textContent =
      `Passo ${index + 1} de ${steps.length}. ${presentation.statusText}`;
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
  renderNeutrality();
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
