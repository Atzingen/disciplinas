import { positiveChargeChain } from "../../nucleo/contagem-particulas.js";

function step(details) {
  return Object.freeze({
    ...details,
    exponent: Math.log10(Math.abs(details.value)),
  });
}

export function waterChargeSteps() {
  const chain = positiveChargeChain({
    volumeCm3: 250,
    densityGramsPerCm3: 1,
    molarMassGramsPerMol: 18.02,
    protonsPerUnit: 10,
  });

  return Object.freeze([
    step({
      id: "volume",
      title: "Volume",
      symbol: "V",
      value: 250,
      unit: "cm³",
      displayValue: "250 cm³",
      factorLabel: "Amostra fornecida",
      factorHtml: "250 cm<sup>3</sup>",
      cancellationHtml: "Ponto de partida: ainda não há unidade a cancelar.",
      accessibleText: "O cálculo começa com 250 centímetros cúbicos de água.",
    }),
    step({
      id: "mass",
      title: "Massa",
      symbol: "m",
      value: chain.massGrams,
      unit: "g",
      displayValue: "250 g",
      factorLabel: "Multiplique pela densidade",
      factorHtml:
        "(250 <s>cm<sup>3</sup></s>) × (1,00 g/<s>cm<sup>3</sup></s>)",
      cancellationHtml: "cm³ cancela com cm³; resta grama.",
      accessibleText:
        "Multiplique o volume pela densidade. Centímetros cúbicos são cancelados e o resultado é 250 gramas.",
    }),
    step({
      id: "moles",
      title: "Quantidade de matéria",
      symbol: "n",
      value: chain.moles,
      unit: "mol",
      displayValue: "13,87 mol",
      factorLabel: "Divida pela massa molar",
      factorHtml: "(250 <s>g</s>) × (1 mol / 18,02 <s>g</s>)",
      cancellationHtml: "g cancela com g; resta mol.",
      accessibleText:
        "Divida a massa pela massa molar. Gramas são cancelados e o resultado é 13,87 mol.",
    }),
    step({
      id: "molecules",
      title: "Moléculas",
      symbol: "N",
      value: chain.units,
      unit: "moléculas",
      displayValue: "8,35 × 10²⁴ moléculas",
      factorLabel: "Multiplique pelo número de Avogadro",
      factorHtml:
        "(13,87 <s>mol</s>) × (6,022 × 10<sup>23</sup> moléculas/<s>mol</s>)",
      cancellationHtml: "mol cancela com mol; resta a contagem de moléculas.",
      accessibleText:
        "Multiplique pelo número de Avogadro. Mols são cancelados e obtemos 8,35 vezes dez elevado a 24 moléculas.",
    }),
    step({
      id: "protons",
      title: "Prótons",
      symbol: "Nₚ",
      value: chain.protonCount,
      unit: "prótons",
      displayValue: "8,35 × 10²⁵ prótons",
      factorLabel: "Conte dez prótons por molécula",
      factorHtml:
        "(8,35 × 10<sup>24</sup> <s>moléculas</s>) × (10 prótons/<s>molécula</s>)",
      cancellationHtml:
        "molécula cancela com molécula; resta a contagem de prótons.",
      accessibleText:
        "Cada molécula de água reúne dez prótons. A contagem chega a 8,35 vezes dez elevado a 25 prótons.",
    }),
    step({
      id: "charge",
      title: "Carga positiva",
      symbol: "q⁺",
      value: chain.chargeCoulombs,
      unit: "C",
      displayValue: "+1,34 × 10⁷ C",
      factorLabel: "Multiplique pela carga elementar",
      factorHtml:
        "(8,35 × 10<sup>25</sup> <s>prótons</s>) × (1,602 × 10<sup>−19</sup> C/<s>próton</s>)",
      cancellationHtml:
        "próton cancela com próton; resta coulomb. Os elétrons fornecem a carga oposta.",
      accessibleText:
        "Multiplique pela carga elementar. A carga positiva é 1,34 vezes dez elevado a 7 coulombs e a carga negativa igual deixa saldo zero.",
      netChargeCoulombs: 0,
    }),
  ]);
}
