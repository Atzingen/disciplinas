import {
  attenuationPerRung,
  infiniteLadderResistance,
  ladderResistance,
  relativeDeviation,
  resistorsUsed,
  rungVoltages,
} from "../nucleo/escada-resistores.js";
import { formatDecimal } from "../nucleo/formato.js";

const RUNG_WIDTH = 150;
const LEFT_MARGIN = 84;
const TOP_RAIL = 62;
const BOTTOM_RAIL = 178;
const MIDDLE = (TOP_RAIL + BOTTOM_RAIL) / 2;

function kilohms(ohms) {
  return formatDecimal(ohms / 1000, 3);
}

function percent(fraction) {
  return formatDecimal(fraction * 100, 3);
}

function seriesResistor(x, y, label) {
  return (
    `<rect class="escada-resistor" x="${x}" y="${y - 11}" width="58" height="22" rx="3"></rect>` +
    `<text class="escada-simbolo" x="${x + 29}" y="${y + 5}">${label}</text>`
  );
}

function shuntResistor(x, label, destaque) {
  const classe = destaque ? "escada-resistor escada-resistor--destacado" : "escada-resistor";
  return (
    `<line class="escada-fio" x1="${x}" y1="${TOP_RAIL}" x2="${x}" y2="${MIDDLE - 29}"></line>` +
    `<rect class="${classe}" x="${x - 11}" y="${MIDDLE - 29}" width="22" height="58" rx="3"></rect>` +
    `<line class="escada-fio" x1="${x}" y1="${MIDDLE + 29}" x2="${x}" y2="${BOTTOM_RAIL}"></line>` +
    `<text class="escada-simbolo escada-simbolo--vertical" x="${x + 20}" y="${MIDDLE + 5}">${label}</text>`
  );
}

function ladderMarkup(rungs, voltages) {
  const largura = LEFT_MARGIN + rungs * RUNG_WIDTH + 96;
  let corpo = "";

  for (let degrau = 0; degrau < rungs; degrau += 1) {
    const inicio = LEFT_MARGIN + degrau * RUNG_WIDTH;
    const shuntX = inicio + 112;
    const fim = inicio + RUNG_WIDTH;

    corpo +=
      `<line class="escada-fio" x1="${inicio}" y1="${TOP_RAIL}" x2="${inicio + 16}" y2="${TOP_RAIL}"></line>` +
      `<line class="escada-fio" x1="${inicio}" y1="${BOTTOM_RAIL}" x2="${inicio + 16}" y2="${BOTTOM_RAIL}"></line>` +
      seriesResistor(inicio + 16, TOP_RAIL, "R") +
      seriesResistor(inicio + 16, BOTTOM_RAIL, "R") +
      `<line class="escada-fio" x1="${inicio + 74}" y1="${TOP_RAIL}" x2="${fim}" y2="${TOP_RAIL}"></line>` +
      `<line class="escada-fio" x1="${inicio + 74}" y1="${BOTTOM_RAIL}" x2="${fim}" y2="${BOTTOM_RAIL}"></line>` +
      shuntResistor(shuntX, "R", degrau === rungs - 1);

    const tensao = voltages[degrau];
    if (tensao !== undefined) {
      corpo +=
        `<text class="escada-tensao" x="${shuntX}" y="${BOTTOM_RAIL + 34}">` +
        `V${degrau + 1} = ${formatDecimal(tensao, 3)} V</text>`;
    }
  }

  const fim = LEFT_MARGIN + rungs * RUNG_WIDTH;
  const terminais =
    `<line class="escada-fio" x1="42" y1="${TOP_RAIL}" x2="${LEFT_MARGIN}" y2="${TOP_RAIL}"></line>` +
    `<line class="escada-fio" x1="42" y1="${BOTTOM_RAIL}" x2="${LEFT_MARGIN}" y2="${BOTTOM_RAIL}"></line>` +
    `<circle class="escada-terminal" cx="42" cy="${TOP_RAIL}" r="6"></circle>` +
    `<circle class="escada-terminal" cx="42" cy="${BOTTOM_RAIL}" r="6"></circle>` +
    `<text class="escada-borne" x="18" y="${TOP_RAIL + 7}">A</text>` +
    `<text class="escada-borne" x="18" y="${BOTTOM_RAIL + 7}">B</text>` +
    `<text class="escada-aberto" x="${fim + 12}" y="${TOP_RAIL - 12}">aberto</text>` +
    `<line class="escada-fio escada-fio--corte" x1="${fim}" y1="${TOP_RAIL}" x2="${fim + 44}" y2="${TOP_RAIL}"></line>` +
    `<line class="escada-fio escada-fio--corte" x1="${fim}" y1="${BOTTOM_RAIL}" x2="${fim + 44}" y2="${BOTTOM_RAIL}"></line>`;

  return (
    `<svg class="escada-diagrama" viewBox="0 0 ${largura} 240" role="img" ` +
    `aria-labelledby="escada-titulo escada-descricao">` +
    `<title id="escada-titulo">Varal de resistores com ${rungs} degrau${rungs > 1 ? "s" : ""}</title>` +
    `<desc id="escada-descricao">Dois fios horizontais ligados aos bornes A, em cima, e B, embaixo. ` +
    `Cada degrau acrescenta um resistor no fio de cima, um no fio de baixo e um na vertical entre os dois. ` +
    `São ${resistorsUsed(rungs)} resistores no total e a extremidade direita fica aberta.</desc>` +
    terminais +
    corpo +
    "</svg>"
  );
}

function shellMarkup(maxRungs) {
  const botoes = Array.from({ length: maxRungs }, (_, indice) => {
    const rungs = indice + 1;
    return (
      `<button class="escada-botao" type="button" data-degraus="${rungs}" aria-pressed="false">` +
      `${rungs} degrau${rungs > 1 ? "s" : ""}<small>${rungs * 3} resistores</small></button>`
    );
  }).join("");

  return (
    '<div class="escada">' +
    `<div class="escada-controles" role="group" aria-label="Número de degraus" data-escada-controles>${botoes}</div>` +
    '<div class="escada-palco" data-escada-diagrama></div>' +
    '<dl class="escada-leitura" data-escada-leitura aria-live="polite">' +
    "<div><dt>Resistores usados</dt><dd data-escada-resistores></dd></div>" +
    "<div><dt>Resistência entre A e B</dt><dd data-escada-resistencia></dd></div>" +
    "<div><dt>Distância do valor infinito</dt><dd data-escada-desvio></dd></div>" +
    "<div><dt>Limite (1 + √3)R</dt><dd data-escada-limite></dd></div>" +
    "</dl>" +
    '<p class="escada-nota" data-escada-nota></p>' +
    "</div>"
  );
}

export function mountResistorLadder(root, options = {}) {
  if (!root) {
    return null;
  }

  const resistance = options.resistance ?? 10_000;
  const maxRungs = options.maxRungs ?? 6;
  const sourceVolts = options.sourceVolts ?? 6;
  const limite = infiniteLadderResistance(resistance);

  root.innerHTML = shellMarkup(maxRungs);

  const botoes = [...root.querySelectorAll("[data-degraus]")];

  function render(rungs) {
    const valor = ladderResistance(rungs, resistance);
    const desvio = relativeDeviation(valor, limite);
    const tensoes = rungVoltages(rungs, resistance, sourceVolts);

    root.querySelector("[data-escada-diagrama]").innerHTML = ladderMarkup(rungs, tensoes);
    root.querySelector("[data-escada-resistores]").textContent = String(resistorsUsed(rungs));
    root.querySelector("[data-escada-resistencia]").textContent = kilohms(valor) + " kΩ";
    root.querySelector("[data-escada-desvio]").textContent = "+" + percent(desvio) + " %";
    root.querySelector("[data-escada-limite]").textContent = kilohms(limite) + " kΩ";

    const razao = tensoes.length > 1 ? tensoes[1] / tensoes[0] : null;
    root.querySelector("[data-escada-nota]").textContent =
      razao === null
        ? `Com um degrau só, a escada vale 3R e ainda está ${percent(desvio)} % acima do limite.`
        : `Com a fonte de ${formatDecimal(sourceVolts, 2)} V, o primeiro resistor vertical fica com ` +
          `${formatDecimal(tensoes[0], 3)} V e o seguinte com ${formatDecimal(tensoes[1], 3)} V — ` +
          `razão ${formatDecimal(razao, 3)}, contra ${formatDecimal(attenuationPerRung(), 3)} na escada infinita.`;

    for (const botao of botoes) {
      botao.setAttribute("aria-pressed", String(Number(botao.dataset.degraus) === rungs));
    }
  }

  for (const botao of botoes) {
    botao.addEventListener("click", () => render(Number(botao.dataset.degraus)));
  }

  render(options.initialRungs ?? 3);

  return { render };
}

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-escada-resistores-app]")) {
    mountResistorLadder(root, {
      resistance: Number(root.dataset.resistencia ?? 10_000),
      maxRungs: Number(root.dataset.maxDegraus ?? 6),
      sourceVolts: Number(root.dataset.fonte ?? 6),
      initialRungs: Number(root.dataset.degrausIniciais ?? 3),
    });
  }
}
