import {
  AVOGADRO_CONSTANT,
  ELEMENTARY_CHARGE,
  lightningEquivalent,
  positiveChargeChain,
  protonsPerUnit,
} from "../nucleo/contagem-particulas.js";
import { formatDecimal, formatScientific } from "../nucleo/formato.js";

const ELEMENT_LABELS = {
  H: "hidrogênio",
  C: "carbono",
  N: "nitrogênio",
  O: "oxigênio",
  Na: "sódio",
  Si: "silício",
  Cl: "cloro",
};

function formatQuantity(value, digits = 3) {
  if (!Number.isFinite(value)) {
    return "indefinido";
  }
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute < 0.01 || absolute >= 1e4)) {
    return formatScientific(value, digits);
  }
  return value.toLocaleString("pt-BR", { maximumSignificantDigits: digits + 1 });
}

function formatDensity(value) {
  return Math.abs(value) >= 0.01 ? formatDecimal(value, 2) : formatScientific(value, 3);
}

function shade(hex, amount) {
  const channels = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const weight = Math.abs(amount);
  const mix = (channel) => Math.round(channel + (target - channel) * weight);
  const red = mix((channels >> 16) & 255);
  const green = mix((channels >> 8) & 255);
  const blue = mix(channels & 255);
  return "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
}

function latticeMarkup(colors) {
  const front = [
    [100, 96],
    [212, 96],
    [212, 208],
    [100, 208],
  ];
  const back = front.map(([x, y]) => [x + 56, y - 44]);
  const segment = (from, to) =>
    `<line x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}" class="molecule-lattice-edge"></line>`;

  let markup = "";
  for (let index = 0; index < front.length; index += 1) {
    const next = (index + 1) % front.length;
    markup +=
      segment(front[index], front[next]) +
      segment(back[index], back[next]) +
      segment(front[index], back[index]);
  }
  return (
    markup +
    [...front, ...back]
      .map(([x, y], index) => {
        const element = index % 2 === 0 ? "Na" : "Cl";
        return `<circle cx="${x}" cy="${y}" r="13" fill="${colors[element].fill}" opacity="0.32"></circle>`;
      })
      .join("")
  );
}

function bondsMarkup(diagram) {
  return diagram.bonds
    .map((bond) => {
      const from = diagram.atoms[bond.from];
      const to = diagram.atoms[bond.to];
      const deltaX = to.x - from.x;
      const deltaY = to.y - from.y;
      const length = Math.hypot(deltaX, deltaY);
      const normalX = -deltaY / length;
      const normalY = deltaX / length;
      const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-6, 6] : [-10, 0, 10];

      return offsets
        .map((offset) => {
          const x1 = from.x + normalX * offset;
          const y1 = from.y + normalY * offset;
          const x2 = to.x + normalX * offset;
          const y2 = to.y + normalY * offset;
          const dash = bond.dashed ? ' stroke-dasharray="3 10"' : "";
          const width = bond.order === 1 ? 7 : 5;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="molecule-bond" stroke-width="${width}" opacity="${bond.dashed ? 0.3 : 0.45}"${dash}></line>`;
        })
        .join("");
    })
    .join("");
}

function atomsMarkup(substance, colors, atomicNumbers) {
  return substance.diagram.atoms
    .map((atom) => {
      const palette = colors[atom.element];
      const badgeX = atom.x + atom.r * 0.74;
      const badgeY = atom.y - atom.r * 0.74;
      return (
        `<g opacity="${atom.faded ? 0.5 : 1}">` +
        `<circle cx="${atom.x}" cy="${atom.y}" r="${atom.r}" fill="url(#gradiente-${substance.id}-${atom.element})" stroke="${shade(palette.fill, -0.45)}" stroke-width="1"></circle>` +
        `<text x="${atom.x}" y="${atom.y + atom.r * 0.17}" class="molecule-symbol" fill="${palette.ink}" font-size="${Math.round(atom.r * 0.78)}">${atom.element}</text>` +
        `<circle cx="${badgeX}" cy="${badgeY}" r="14" class="molecule-badge" stroke="${palette.fill}"></circle>` +
        `<text x="${badgeX}" y="${badgeY + 4.2}" class="molecule-badge-text" fill="${palette.fill}">${atomicNumbers[atom.element]}</text>` +
        "</g>"
      );
    })
    .join("");
}

function moleculeMarkup(substance, colors, atomicNumbers) {
  const gradients = [...new Set(substance.diagram.atoms.map((atom) => atom.element))]
    .map((element) => {
      const base = colors[element].fill;
      return (
        `<radialGradient id="gradiente-${substance.id}-${element}" cx="34%" cy="28%" r="78%">` +
        `<stop offset="0%" stop-color="${shade(base, 0.5)}"></stop>` +
        `<stop offset="52%" stop-color="${base}"></stop>` +
        `<stop offset="100%" stop-color="${shade(base, -0.4)}"></stop>` +
        "</radialGradient>"
      );
    })
    .join("");

  const description = substance.diagram.atoms
    .map((atom) => `${ELEMENT_LABELS[atom.element]} com ${atomicNumbers[atom.element]} prótons`)
    .join(", ");

  return (
    `<svg class="molecule-diagram" viewBox="${substance.diagram.viewBox}" role="img" ` +
    `aria-labelledby="molecula-titulo molecula-descricao">` +
    `<title id="molecula-titulo">Estrutura de ${substance.name}</title>` +
    `<desc id="molecula-descricao">${substance.caption}. Átomos representados: ${description}.</desc>` +
    `<defs>${gradients}</defs>` +
    (substance.lattice ? latticeMarkup(colors) : "") +
    bondsMarkup(substance.diagram) +
    atomsMarkup(substance, colors, atomicNumbers) +
    "</svg>"
  );
}

function protonSumMarkup(substance, protons) {
  const parts = substance.composition
    .map(([element, atoms]) => {
      const atomicNumber = protons.atomicNumbers[element];
      const factor = atoms > 1 ? `${atoms} × ` : "";
      return `${factor}${atomicNumber} <small>(${element})</small>`;
    })
    .join(" + ");
  const unitLabel = substance.unit === "molécula" ? "molécula" : "unidade";
  return `${parts} = ${protons.total} prótons por ${unitLabel}`;
}

function chainRows(substance, chain, protons, volumeCm3) {
  const unitsLabel = substance.unit === "molécula" ? "moléculas" : "unidades de fórmula";
  return [
    {
      step: "01",
      quantity: "Massa",
      expression: `m = ρV = (${formatDensity(substance.densityGramsPerCm3)} g/cm³)(${volumeCm3} cm³)`,
      value: `${formatQuantity(chain.massGrams)} g`,
    },
    {
      step: "02",
      quantity: "Quantidade de matéria",
      expression: `n = m/M = ${formatQuantity(chain.massGrams)} g ÷ ${formatDecimal(substance.molarMassGramsPerMol, 2)} g/mol`,
      value: `${formatQuantity(chain.moles)} mol`,
    },
    {
      step: "03",
      quantity: unitsLabel.charAt(0).toUpperCase() + unitsLabel.slice(1),
      expression: `N = n·N<sub>A</sub> = (${formatQuantity(chain.moles)} mol)(${formatScientific(AVOGADRO_CONSTANT, 3)} mol⁻¹)`,
      value: formatQuantity(chain.units),
    },
    {
      step: "04",
      quantity: "Prótons",
      expression: `N<sub>p</sub> = N·Z = (${formatQuantity(chain.units)})(${protons.total})`,
      value: formatQuantity(chain.protonCount),
    },
    {
      step: "05",
      quantity: "Carga positiva",
      expression: `q = N<sub>p</sub>·e = (${formatQuantity(chain.protonCount)})(${formatScientific(ELEMENTARY_CHARGE, 3)} C)`,
      value: `${formatQuantity(chain.chargeCoulombs)} C`,
    },
  ];
}

function explorerShell(substances) {
  const chips = substances
    .map(
      (substance) =>
        `<button class="substance-chip" type="button" data-substance="${substance.id}" ` +
        `style="--substance-accent: ${substance.accent}" aria-pressed="false">` +
        `<span class="substance-chip__dot" aria-hidden="true"></span>` +
        `<strong>${substance.formulaLabel}</strong><small>${substance.name.toLowerCase()}</small></button>`,
    )
    .join("");

  return (
    '<div class="substance-explorer">' +
    `<div class="substance-chips" role="group" aria-label="Substância analisada" data-substance-chips>${chips}</div>` +
    '<div class="substance-sheet">' +
    '<figure class="substance-model">' +
    '<div data-substance-model></div>' +
    '<figcaption data-substance-caption></figcaption>' +
    "</figure>" +
    '<div class="substance-record" data-substance-record aria-live="polite">' +
    '<div class="substance-record__head">' +
    "<div>" +
    '<h3 data-substance-name></h3>' +
    '<span class="substance-state" data-substance-state></span>' +
    "</div>" +
    '<p class="substance-formula" data-substance-formula></p>' +
    "</div>" +
    '<dl class="metric-list">' +
    "<div><dt>Densidade ρ (g/cm³)</dt><dd data-substance-density></dd></div>" +
    "<div><dt>Massa molar M (g/mol)</dt><dd data-substance-molar></dd></div>" +
    "<div><dt>Prótons por unidade Z</dt><dd data-substance-protons></dd></div>" +
    "<div><dt>Massa em 250 cm³ (g)</dt><dd data-substance-mass></dd></div>" +
    "</dl>" +
    '<p class="substance-note" data-substance-note></p>' +
    '<div class="equation-block equation-block--result">' +
    "<span>Contagem de prótons</span><strong data-substance-sum></strong>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="table-scroll">' +
    '<table class="value-table substance-chain" data-substance-chain>' +
    "<caption>Cadeia de conversão para a substância selecionada</caption>" +
    "<thead><tr><th>Passo</th><th>Grandeza</th><th>Expressão</th><th>Valor</th></tr></thead>" +
    "<tbody></tbody>" +
    "</table>" +
    "</div>" +
    '<div class="result-callout"><span>Carga positiva</span><strong data-substance-result></strong></div>' +
    '<p class="substance-lightning" data-substance-lightning></p>' +
    '<div class="table-scroll">' +
    '<table class="value-table" data-substance-comparison>' +
    "<caption>As seis substâncias no mesmo volume de 250 cm³</caption>" +
    "<thead><tr><th>Substância</th><th>Fórmula</th><th>Densidade (g/cm³)</th><th>Massa molar (g/mol)</th><th>Z</th><th>Prótons</th><th>Carga (C)</th></tr></thead>" +
    "<tbody></tbody>" +
    "</table>" +
    "</div>" +
    "</div>"
  );
}

export function mountSubstanceExplorer(root, options) {
  if (!root) {
    return null;
  }

  const substances = options.substances;
  const volumeCm3 = options.volumeCm3;
  const colors = options.colors;
  const atomicNumbers = options.atomicNumbers;

  root.innerHTML = explorerShell(substances);

  const chipButtons = [...root.querySelectorAll("[data-substance]")];
  const chainBody = root.querySelector("[data-substance-chain] tbody");
  const comparisonBody = root.querySelector("[data-substance-comparison] tbody");

  function analyse(substance) {
    const total = protonsPerUnit(substance.composition);
    const chain = positiveChargeChain({
      volumeCm3,
      densityGramsPerCm3: substance.densityGramsPerCm3,
      molarMassGramsPerMol: substance.molarMassGramsPerMol,
      protonsPerUnit: total,
    });
    return { total, chain };
  }

  function render(substance) {
    const { total, chain } = analyse(substance);
    const explorer = root.querySelector(".substance-explorer");
    explorer.style.setProperty("--substance-accent", substance.accent);

    root.querySelector("[data-substance-model]").innerHTML = moleculeMarkup(
      substance,
      colors,
      atomicNumbers,
    );
    root.querySelector("[data-substance-caption]").textContent = substance.caption;
    root.querySelector("[data-substance-name]").textContent = substance.name;
    root.querySelector("[data-substance-state]").textContent =
      substance.state + " · " + substance.unit;
    root.querySelector("[data-substance-formula]").innerHTML = substance.formulaHtml;
    root.querySelector("[data-substance-density]").textContent = formatDensity(
      substance.densityGramsPerCm3,
    );
    root.querySelector("[data-substance-molar]").textContent = formatDecimal(
      substance.molarMassGramsPerMol,
      2,
    );
    root.querySelector("[data-substance-protons]").textContent = String(total);
    root.querySelector("[data-substance-mass]").textContent = formatQuantity(
      chain.massGrams,
    );
    root.querySelector("[data-substance-note]").textContent = substance.note;
    root.querySelector("[data-substance-sum]").innerHTML = protonSumMarkup(substance, {
      total,
      atomicNumbers,
    });

    chainBody.innerHTML = chainRows(substance, chain, { total }, volumeCm3)
      .map(
        (row) =>
          `<tr><td>${row.step}</td><td>${row.quantity}</td>` +
          `<td class="substance-chain__expression">${row.expression}</td>` +
          `<td><strong>${row.value}</strong></td></tr>`,
      )
      .join("");

    root.querySelector("[data-substance-result]").textContent =
      "q ≈ " + formatQuantity(chain.chargeCoulombs, 2) + " C em 250 cm³ de " +
      substance.name.toLowerCase();
    root.querySelector("[data-substance-lightning]").textContent =
      "Equivale à carga transportada por cerca de " +
      formatQuantity(lightningEquivalent(chain.chargeCoulombs), 2) +
      " relâmpagos típicos (≈ 20 C cada). Ainda assim, a carga líquida da amostra é exatamente zero.";

    comparisonBody.innerHTML = substances
      .map((item) => {
        const analysis = analyse(item);
        const selected = item.id === substance.id ? ' class="is-answer"' : "";
        return (
          `<tr${selected}><td>${item.name}</td><td>${item.formulaHtml}</td>` +
          `<td>${formatDensity(item.densityGramsPerCm3)}</td>` +
          `<td>${formatDecimal(item.molarMassGramsPerMol, 2)}</td>` +
          `<td>${analysis.total}</td>` +
          `<td>${formatQuantity(analysis.chain.protonCount)}</td>` +
          `<td>${formatQuantity(analysis.chain.chargeCoulombs)}</td></tr>`
        );
      })
      .join("");

    for (const button of chipButtons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.substance === substance.id),
      );
    }
  }

  function select(substanceId) {
    const substance = substances.find((item) => item.id === substanceId);
    if (!substance) {
      throw new RangeError("Substância desconhecida: " + substanceId + ".");
    }
    render(substance);
    return substance;
  }

  for (const button of chipButtons) {
    button.addEventListener("click", () => select(button.dataset.substance));
  }

  render(substances[0]);

  return { select, analyse };
}
