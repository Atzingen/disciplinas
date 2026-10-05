import { analyticVelocity, integrateRocket } from "./foguete-modelo.js";

const root = document.querySelector("[data-rocket-explorer]");
const find = name => root.querySelector(`[data-rocket-${name}]`);
const form = find("form");
const chart = find("chart");
const slider = find("step");
const methodNames = { euler: "Euler", rk2: "RK2 — ponto médio", rk4: "RK4 — clássico" };
const stageNames = ["k₁", "k₂", "k₃", "k₄"];
const format = (value, digits = 5) => value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
const formatError = value => value < 0.0001 && value > 0 ? value.toExponential(3).replace(".", ",") : format(value, 7);
let parameters;
let simulation;
let selected = 0;
let timer = null;

function pause() {
  clearInterval(timer);
  timer = null;
  find("play").textContent = "Reproduzir passos";
}

function svgElement(tag, attributes = {}, text) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

function drawChart() {
  if (!simulation) return;
  const step = simulation.steps[selected];
  const zoom = find("zoom").checked;
  const width = Math.max(320, chart.getBoundingClientRect().width);
  const height = width < 600 ? 320 : 380;
  const left = 57;
  const right = width - 18;
  const top = 32;
  const bottom = height - 46;
  const startTime = zoom ? Math.max(0, step.t - step.h * 0.2) : 0;
  const endTime = zoom ? Math.min(parameters.finalTime, step.t + step.h * 1.2) : parameters.finalTime;
  const exact = Array.from({ length: 301 }, (_, index) => {
    const t = startTime + (endTime - startTime) * index / 300;
    return { t, v: analyticVelocity(t, parameters.initialVelocity) };
  });
  const visible = simulation.points.filter(point => point.t >= startTime && point.t <= endTime);
  const values = [...exact, ...visible, ...(zoom ? step.stages : [])].map(point => point.v);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max((maximum - minimum) * 0.12, 0.5);
  const low = minimum - padding;
  const high = maximum + padding;
  const x = t => left + (t - startTime) / (endTime - startTime) * (right - left);
  const y = v => bottom - (v - low) / (high - low) * (bottom - top);
  const pathData = points => points.map((point, index) => `${index ? "L" : "M"}${x(point.t)},${y(point.v)}`).join(" ");

  chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  chart.replaceChildren(
    svgElement("title", { id: "rocket-chart-title" }, "Velocidade do foguete em função do tempo"),
    svgElement("desc", { id: "rocket-chart-description" }, `${methodNames[parameters.method]}, passo ${selected + 1}. Curva analítica e pontos numéricos; a tabela abaixo contém os valores.`),
  );
  const ticks = width < 600 ? 3 : 5;
  for (let i = 0; i <= ticks; i += 1) {
    const t = startTime + (endTime - startTime) * i / ticks;
    const v = low + (high - low) * i / ticks;
    const velocityLabel = Math.abs(v) >= 1000 ? v.toExponential(0) : format(v, 1);
    chart.append(
      svgElement("line", { x1: left, x2: right, y1: y(v), y2: y(v), class: "rocket-grid" }),
      svgElement("text", { x: left - 9, y: y(v) + 5, "text-anchor": "end" }, velocityLabel),
      svgElement("text", { x: x(t), y: bottom + 24, "text-anchor": "middle" }, format(t, zoom ? 2 : 1)),
    );
  }
  chart.append(
    svgElement("text", { x: left, y: 18 }, "v (m/s)"),
    svgElement("text", { x: (left + right) / 2, y: height - 3, "text-anchor": "middle" }, "Tempo (s)"),
  );
  const clip = svgElement("clipPath", { id: "rocket-plot-clip" });
  clip.append(svgElement("rect", { x: left, y: top, width: right - left, height: bottom - top }));
  const definitions = svgElement("defs");
  definitions.append(clip);
  chart.append(definitions);
  const plot = svgElement("g", { "clip-path": "url(#rocket-plot-clip)" });
  plot.append(
    svgElement("path", { d: pathData(exact), class: "rocket-exact" }),
    svgElement("path", { d: pathData(simulation.points), class: "rocket-numeric" }),
  );
  for (const point of visible) {
    plot.append(svgElement("circle", { cx: x(point.t), cy: y(point.v), r: 3, class: "rocket-point" }));
  }
  plot.append(svgElement("path", {
    d: pathData([simulation.points[selected], simulation.points[selected + 1]]),
    class: "rocket-selected",
  }));
  if (zoom) {
    step.stages.forEach((stage, index) => {
      const half = step.h * 0.13;
      plot.append(
        svgElement("line", {
          x1: x(stage.t - half), y1: y(stage.v - half * stage.slope),
          x2: x(stage.t + half), y2: y(stage.v + half * stage.slope),
          class: `rocket-slope rocket-stage-${index}`,
        }),
        svgElement("circle", { cx: x(stage.t), cy: y(stage.v), r: 4, class: `rocket-stage-dot rocket-stage-${index}` }),
      );
      chart.append(svgElement("text", {
        x: Math.min(right - 22, x(stage.t) + 8),
        y: Math.max(top + 14, Math.min(bottom - 8, y(stage.v) + (index % 2 ? 20 : -10))),
        class: `rocket-stage-label rocket-stage-${index}`,
      }, stageNames[index]));
    });
  }
  const current = simulation.points[selected + 1];
  plot.append(svgElement("circle", { cx: x(current.t), cy: y(current.v), r: 6, class: "rocket-current" }));
  chart.append(plot);
}

function showStep() {
  if (!simulation) return;
  const step = simulation.steps[selected];
  const current = simulation.points[selected + 1];
  const exact = analyticVelocity(current.t, parameters.initialVelocity);
  slider.value = selected;
  find("counter").textContent = `${selected + 1} de ${simulation.steps.length}`;
  find("previous").disabled = selected === 0;
  find("next").disabled = selected === simulation.steps.length - 1;
  find("status").textContent = `Passo ${selected} → ${selected + 1}: de ${format(step.t)} s até ${format(current.t)} s. ${methodNames[parameters.method]}.`;
  find("start").textContent = `Começamos com t = ${format(step.t)} s, v = ${format(step.v)} m/s e h = ${format(step.h)} s.`;
  find("recipe").textContent = {
    euler: "Uma avaliação: k₁ = f(t, v). Usamos essa aceleração durante todo o passo.",
    rk2: "k₁ no início; k₂ em (t + h/2, v + h·k₁/2). A atualização usa a aceleração k₂ do ponto médio.",
    rk4: "k₁ no início; k₂ em (t + h/2, v + h·k₁/2); k₃ em (t + h/2, v + h·k₂/2); k₄ em (t + h, v + h·k₃).",
  }[parameters.method];
  find("stages").innerHTML = step.stages.map((stage, index) => `<tr><th scope="row">${stageNames[index]}</th><td>${format(stage.t)}</td><td>${format(stage.v)}</td><td>${format(50 - 0.5 * stage.t)}</td><td>${format(stage.slope)}</td></tr>`).join("");
  let calculation = "";
  if (parameters.method === "rk4") {
    const slopes = step.stages.map(stage => format(stage.slope));
    calculation = `Aceleração média = (${slopes[0]} + 2 × ${slopes[1]} + 2 × ${slopes[2]} + ${slopes[3]}) / 6 = ${format(step.averageSlope)} m/s². `;
  }
  find("calculation").textContent = `${calculation}v seguinte = ${format(step.v)} + ${format(step.h)} × (${format(step.averageSlope)}) = ${format(current.v)} m/s.`;
  find("error-value").textContent = `Neste mesmo instante: analítica = ${format(exact)} m/s; erro absoluto = |${format(current.v)} − ${format(exact)}| ≈ ${formatError(Math.abs(current.v - exact))} m/s. O erro usa os valores completos, antes do arredondamento.`;
  drawChart();
}

function recalculate() {
  pause();
  parameters = {
    initialVelocity: form.elements.initialVelocity.valueAsNumber,
    step: form.elements.step.valueAsNumber,
    finalTime: form.elements.finalTime.valueAsNumber,
    method: form.elements.method.value,
  };
  try {
    simulation = integrateRocket(parameters);
  } catch (error) {
    simulation = null;
    find("error").textContent = error.message;
    find("error").hidden = false;
    find("results").hidden = true;
    return;
  }
  find("error").hidden = true;
  find("results").hidden = false;
  selected = Math.min(selected, simulation.steps.length - 1);
  slider.max = simulation.steps.length - 1;
  find("play").disabled = simulation.steps.length < 2;
  find("method-label").textContent = `${methodNames[parameters.method]} — pontos calculados`;
  find("table").innerHTML = simulation.points.map((point, index) => {
    const exact = analyticVelocity(point.t, parameters.initialVelocity);
    return `<tr><th scope="row">${index}</th><td>${format(point.t)}</td><td>${format(point.v)}</td><td>${format(exact)}</td><td>${formatError(Math.abs(point.v - exact))}</td></tr>`;
  }).join("");
  showStep();
}

form.addEventListener("input", recalculate);
form.addEventListener("submit", event => { event.preventDefault(); recalculate(); });
form.addEventListener("reset", () => {
  selected = 0;
  find("zoom").checked = false;
  setTimeout(recalculate, 0);
});
slider.addEventListener("input", () => { pause(); selected = Number(slider.value); showStep(); });
find("zoom").addEventListener("change", drawChart);
find("previous").addEventListener("click", () => { pause(); selected = Math.max(0, selected - 1); showStep(); });
find("next").addEventListener("click", () => { pause(); selected = Math.min(simulation.steps.length - 1, selected + 1); showStep(); });
find("restart").addEventListener("click", () => { pause(); selected = 0; showStep(); });
find("play").addEventListener("click", () => {
  if (timer !== null) { pause(); return; }
  if (selected === simulation.steps.length - 1) selected = 0;
  showStep();
  find("play").textContent = "Pausar";
  timer = setInterval(() => {
    selected += 1;
    showStep();
    if (selected === simulation.steps.length - 1) pause();
  }, 850);
});
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
window.addEventListener("pagehide", pause);
new ResizeObserver(drawChart).observe(chart);
recalculate();
