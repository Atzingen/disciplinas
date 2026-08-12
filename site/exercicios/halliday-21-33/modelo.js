import {
  AVOGADRO_CONSTANT,
  ELEMENTARY_CHARGE,
  positiveChargeChain,
} from "../../nucleo/contagem-particulas.js";

const CUBIC_CENTIMETER = dimension("cm", 3);
const GRAM = dimension("g");
const MOLE = dimension("mol");
const MOLECULES = dimension("moléculas");
const PROTONS = dimension("prótons");
const COULOMB = dimension("C");

function dimension(symbol, power = 1) {
  return Object.freeze({ symbol, power });
}

function factor(numeratorValue, numeratorUnit, denominatorValue, denominatorUnit) {
  return Object.freeze({
    numerator: Object.freeze({ value: numeratorValue, unit: numeratorUnit }),
    denominator: Object.freeze({
      value: denominatorValue,
      unit: denominatorUnit,
    }),
  });
}

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
      symbol: "V",
      value: 250,
      unit: CUBIC_CENTIMETER,
      factor: null,
      cancelledUnit: null,
    }),
    step({
      id: "mass",
      symbol: "m",
      value: chain.massGrams,
      unit: GRAM,
      factor: factor(1, GRAM, 1, CUBIC_CENTIMETER),
      cancelledUnit: CUBIC_CENTIMETER,
    }),
    step({
      id: "moles",
      symbol: "n",
      value: chain.moles,
      unit: MOLE,
      factor: factor(1, MOLE, 18.02, GRAM),
      cancelledUnit: GRAM,
    }),
    step({
      id: "molecules",
      symbol: "N",
      value: chain.units,
      unit: MOLECULES,
      factor: factor(AVOGADRO_CONSTANT, MOLECULES, 1, MOLE),
      cancelledUnit: MOLE,
    }),
    step({
      id: "protons",
      symbol: "Nₚ",
      value: chain.protonCount,
      unit: PROTONS,
      factor: factor(10, PROTONS, 1, MOLECULES),
      cancelledUnit: MOLECULES,
    }),
    step({
      id: "charge",
      symbol: "q⁺",
      value: chain.chargeCoulombs,
      unit: COULOMB,
      factor: factor(ELEMENTARY_CHARGE, COULOMB, 1, PROTONS),
      cancelledUnit: PROTONS,
      netChargeCoulombs: 0,
    }),
  ]);
}
