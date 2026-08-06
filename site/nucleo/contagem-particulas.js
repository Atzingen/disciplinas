export const AVOGADRO_CONSTANT = 6.022e23;
export const ELEMENTARY_CHARGE = 1.602e-19;
export const LIGHTNING_STRIKE_COULOMBS = 20;

export const ATOMIC_NUMBERS = {
  H: 1,
  C: 6,
  N: 7,
  O: 8,
  Na: 11,
  Si: 14,
  Cl: 17,
};

export function protonsPerUnit(composition) {
  if (!Array.isArray(composition) || composition.length === 0) {
    throw new TypeError(
      "A composição deve ser uma lista de pares elemento/quantidade.",
    );
  }

  return composition.reduce((total, [element, atoms]) => {
    const atomicNumber = ATOMIC_NUMBERS[element];
    if (atomicNumber === undefined) {
      throw new RangeError("Elemento fora da tabela: " + element + ".");
    }
    if (!Number.isInteger(atoms) || atoms <= 0) {
      throw new TypeError("A quantidade de átomos deve ser inteira e positiva.");
    }
    return total + atomicNumber * atoms;
  }, 0);
}

function positiveQuantity(value, description) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(description + " deve ser um número positivo.");
  }
  return value;
}

export function positiveChargeChain(sample) {
  const volume = positiveQuantity(sample.volumeCm3, "O volume");
  const density = positiveQuantity(sample.densityGramsPerCm3, "A densidade");
  const molarMass = positiveQuantity(
    sample.molarMassGramsPerMol,
    "A massa molar",
  );
  const protons = positiveQuantity(sample.protonsPerUnit, "O número de prótons");

  const massGrams = density * volume;
  const moles = massGrams / molarMass;
  const units = moles * AVOGADRO_CONSTANT;
  const protonCount = units * protons;

  return {
    massGrams,
    moles,
    units,
    protonCount,
    chargeCoulombs: protonCount * ELEMENTARY_CHARGE,
  };
}

export function lightningEquivalent(chargeCoulombs) {
  return positiveQuantity(chargeCoulombs, "A carga") / LIGHTNING_STRIKE_COULOMBS;
}
