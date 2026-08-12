import { forceSceneAt, solveMeasuredForces } from "./modelo.js";

const MEASURED_FORCES = solveMeasuredForces(2.014e-23, 2.877e-24);
const STORY_FRAMES = Object.freeze([
  {
    progress: 0,
    title: "Soma: B e C repelem A para −x",
    explanation: "Configuração medida (a): B e C estão à direita de A; as duas forças têm o mesmo sentido e F_B + F_C = S = 2,014 × 10⁻²³ N.",
  },
  {
    progress: 0.25,
    title: "O módulo de F_B permanece constante",
    explanation: "B percorre um arco centrado em A. Como AB = r não muda, o comprimento do vetor F_B também não muda; somente sua direção gira.",
  },
  {
    progress: 0.5,
    title: "Transferência de B pelo semicírculo",
    explanation: "Este é apenas o trajeto de transferência; configuração não medida. A composição ponta a cauda mostra a resultante instantânea sem criar outra equação experimental.",
  },
  {
    progress: 1,
    title: "Diferença: B chega ao lado oposto",
    explanation: "Configuração medida (b): F_B aponta para +x, F_C permanece em −x e F_C − F_B = D = 2,877 × 10⁻²⁴ N.",
  },
  {
    progress: 1,
    title: "Isole os módulos medidos",
    explanation: "Somando e subtraindo: F_C = (S + D)/2 = 1,15085 × 10⁻²³ N e F_B = (S − D)/2 = 8,6315 × 10⁻²⁴ N.",
  },
  {
    progress: 1,
    title: "Cancele o fator comum e obtenha a razão",
    explanation: "Como F_i = (k|q_A|/r²)q_i e as distâncias são iguais, o fator comum se cancela: q_C/q_B = F_C/F_B ≈ 1,33.",
  },
]);

function scaleVector(vector, maximum, length) {
  return {
    x: (vector.x / maximum) * length,
    y: (vector.y / maximum) * length,
  };
}

function setLine(line, start, vector) {
  line.setAttribute("x1", start.x.toFixed(2));
  line.setAttribute("y1", start.y.toFixed(2));
  line.setAttribute("x2", (start.x + vector.x).toFixed(2));
  line.setAttribute("y2", (start.y + vector.y).toFixed(2));
}

function placeLabel(label, line, offsetY = -10) {
  const x1 = Number(line.getAttribute("x1"));
  const y1 = Number(line.getAttribute("y1"));
  const x2 = Number(line.getAttribute("x2"));
  const y2 = Number(line.getAttribute("y2"));
  label.setAttribute("x", ((x1 + x2) / 2).toFixed(2));
  label.setAttribute("y", (((y1 + y2) / 2) + offsetY).toFixed(2));
}

function formatNewton(value) {
  if (value === 0) {
    return "0 N";
  }
  const parts = Math.abs(value).toExponential(3).split("e");
  return `${parts[0].replace(".", ",")} × 10^${Number(parts[1])} N`;
}

export function mountForceLocus(root) {
  if (!root) {
    return null;
  }

  const motionQuery = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
  const elements = {
    title: root.querySelector("[data-frame-title]"),
    explanation: root.querySelector("[data-frame-explanation]"),
    status: root.querySelector("[data-frame-status]"),
    measurement: root.querySelector("[data-measurement-status]"),
    equation: root.querySelector("[data-current-equation]"),
    bCharge: root.querySelector("[data-b-charge]"),
    bSign: root.querySelector("[data-b-sign]"),
    bLabel: root.querySelector("[data-b-label]"),
    radius: root.querySelector("[data-radius]"),
    radiusLabel: root.querySelector("[data-radius-label]"),
    forceB: root.querySelector("[data-force-b]"),
    forceC: root.querySelector("[data-force-c]"),
    resultant: root.querySelector("[data-resultant]"),
    forceBLabel: root.querySelector("[data-force-b-label]"),
    forceCLabel: root.querySelector("[data-force-c-label]"),
    resultantLabel: root.querySelector("[data-resultant-label]"),
    valueB: root.querySelector("[data-value-b]"),
    valueC: root.querySelector("[data-value-c]"),
    valueResultant: root.querySelector("[data-value-resultant]"),
    play: root.querySelector("[data-play]"),
    pause: root.querySelector("[data-pause]"),
    reset: root.querySelector("[data-reset]"),
    next: root.querySelector("[data-next]"),
    speed: root.querySelector("[data-speed]"),
  };
  const center = { x: 380, y: 225 };
  const radiusPixels = 155;
  const vectorLength = 145;
  let index = 0;
  let speed = 1;
  let timer = null;
  let animationFrame = null;
  let playState = "paused";
  let visualProgress = 0;

  function stopTimer() {
    if (timer !== null) {
      globalThis.clearInterval(timer);
      timer = null;
    }
  }

  function motionPreference() {
    return motionQuery.matches ? "reduced" : "full";
  }

  function cancelAnimation() {
    if (animationFrame !== null) {
      globalThis.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function renderGeometry(progress) {
    const scene = forceSceneAt(progress, MEASURED_FORCES.forceB, MEASURED_FORCES.forceC);
    const bPosition = {
      x: center.x + (scene.bPosition.x * radiusPixels),
      y: center.y - (scene.bPosition.y * radiusPixels),
    };
    const forceB = scaleVector(scene.bForce, MEASURED_FORCES.forceC, vectorLength);
    const forceC = scaleVector(scene.cForce, MEASURED_FORCES.forceC, vectorLength);
    const resultant = scaleVector(scene.resultant, MEASURED_FORCES.forceC, vectorLength);
    const tailToHead = {
      x: center.x + forceB.x,
      y: center.y - forceB.y,
    };
    const resultantOrigin = { x: center.x + 180, y: center.y - 50 };
    const radiusVector = {
      x: bPosition.x - center.x,
      y: bPosition.y - center.y,
    };
    const radiusLength = Math.hypot(radiusVector.x, radiusVector.y);
    const radiusMidpoint = {
      x: (center.x + bPosition.x) / 2,
      y: (center.y + bPosition.y) / 2,
    };

    visualProgress = progress;
    root.dataset.progress = String(progress);
    root.dataset.measured = String(scene.measured);
    elements.measurement.textContent = scene.measured
      ? "Configuração medida"
      : "Trajeto de transferência · configuração não medida";
    elements.equation.textContent = scene.equation ?? "Sem nova equação experimental";
    elements.bCharge.setAttribute("cx", bPosition.x.toFixed(2));
    elements.bCharge.setAttribute("cy", bPosition.y.toFixed(2));
    elements.bSign.setAttribute("x", bPosition.x.toFixed(2));
    elements.bSign.setAttribute("y", (bPosition.y + 7).toFixed(2));
    elements.bLabel.setAttribute("x", bPosition.x.toFixed(2));
    elements.bLabel.setAttribute("y", (bPosition.y - 52).toFixed(2));
    elements.radius.setAttribute("x2", bPosition.x.toFixed(2));
    elements.radius.setAttribute("y2", bPosition.y.toFixed(2));
    elements.radiusLabel.setAttribute(
      "x",
      (radiusMidpoint.x - ((radiusVector.y / radiusLength) * 18)).toFixed(2),
    );
    elements.radiusLabel.setAttribute(
      "y",
      (radiusMidpoint.y + ((radiusVector.x / radiusLength) * 18)).toFixed(2),
    );
    setLine(elements.forceB, center, { x: forceB.x, y: -forceB.y });
    setLine(elements.forceC, tailToHead, { x: forceC.x, y: -forceC.y });
    setLine(elements.resultant, resultantOrigin, { x: resultant.x, y: -resultant.y });
    placeLabel(elements.forceBLabel, elements.forceB, -15);
    placeLabel(elements.forceCLabel, elements.forceC, 70);
    placeLabel(elements.resultantLabel, elements.resultant, -44);
    elements.valueB.textContent = formatNewton(MEASURED_FORCES.forceB);
    elements.valueC.textContent = formatNewton(MEASURED_FORCES.forceC);
    elements.valueResultant.textContent = formatNewton(Math.hypot(scene.resultant.x, scene.resultant.y));
  }

  function animateTo(targetProgress) {
    cancelAnimation();
    if (motionQuery.matches || visualProgress === targetProgress) {
      renderGeometry(targetProgress);
      return;
    }

    const startProgress = visualProgress;
    const duration = 650 / speed;
    const startTime = globalThis.performance.now();

    function tick(now) {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = elapsed < 0.5
        ? 2 * elapsed * elapsed
        : 1 - ((-2 * elapsed + 2) ** 2) / 2;
      renderGeometry(startProgress + ((targetProgress - startProgress) * eased));
      if (elapsed < 1) {
        animationFrame = globalThis.requestAnimationFrame(tick);
      } else {
        animationFrame = null;
        renderGeometry(targetProgress);
      }
    }

    animationFrame = globalThis.requestAnimationFrame(tick);
  }

  function render(animateGeometry = false) {
    const frame = STORY_FRAMES[index];
    root.dataset.step = String(index);
    root.dataset.playState = playState;
    root.dataset.motion = motionPreference();
    elements.title.textContent = frame.title;
    elements.explanation.textContent = frame.explanation;
    elements.status.textContent = `Passo ${index + 1} de ${STORY_FRAMES.length} · ${frame.title}`;
    elements.play.disabled = playState === "playing" || motionQuery.matches;
    elements.pause.disabled = playState === "paused";
    elements.next.disabled = index === STORY_FRAMES.length - 1;
    if (animateGeometry) {
      animateTo(frame.progress);
    } else {
      renderGeometry(visualProgress);
    }
  }

  function pause() {
    stopTimer();
    cancelAnimation();
    playState = "paused";
    render(false);
  }

  function step() {
    if (index < STORY_FRAMES.length - 1) {
      index += 1;
    }
    if (index === STORY_FRAMES.length - 1) {
      stopTimer();
      playState = "paused";
    }
    render(true);
  }

  function play() {
    if (motionQuery.matches || index === STORY_FRAMES.length - 1) {
      pause();
      return;
    }
    stopTimer();
    playState = "playing";
    timer = globalThis.setInterval(step, 1800 / speed);
    render(true);
  }

  function reset() {
    stopTimer();
    cancelAnimation();
    index = 0;
    visualProgress = 0;
    playState = "paused";
    render(false);
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
      progress: visualProgress,
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
      cancelAnimation();
      visualProgress = STORY_FRAMES[index].progress;
      pause();
    } else {
      render(false);
    }
  });
  root.dataset.enhanced = "true";
  render(false);

  return Object.freeze({ play, pause, reset, step, setSpeed, getState });
}
