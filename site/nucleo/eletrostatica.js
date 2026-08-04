import { add, magnitude, scale, subtract } from "./vetores.js";

export const COULOMB_CONSTANT = 8.9875517923e9;

export class ElectrostaticSingularityError extends RangeError {
  constructor(sourceId) {
    super("A carga de prova coincide com a fonte " + sourceId + ".");
    this.name = "ElectrostaticSingularityError";
    this.sourceId = sourceId;
  }
}

function signedChargeCoulombs(charge) {
  if (
    !Number.isFinite(charge.magnitudeMicroC) ||
    charge.magnitudeMicroC < 0 ||
    ![-1, 1].includes(charge.sign)
  ) {
    throw new TypeError("A carga deve ter módulo finito e sinal +1 ou -1.");
  }
  return charge.sign * charge.magnitudeMicroC * 1e-6;
}

function positionCentimeters(charge) {
  if (!Number.isFinite(charge.xCm) || !Number.isFinite(charge.yCm)) {
    throw new TypeError("A posição da carga deve ser finita.");
  }
  return { x: charge.xCm, y: charge.yCm };
}

export function forceFromSource(source, testCharge) {
  const deltaCm = subtract(
    positionCentimeters(testCharge),
    positionCentimeters(source),
  );
  const deltaM = scale(deltaCm, 0.01);
  const distanceM = magnitude(deltaM);

  if (distanceM === 0) {
    throw new ElectrostaticSingularityError(source.id);
  }

  const coefficient =
    (COULOMB_CONSTANT *
      signedChargeCoulombs(source) *
      signedChargeCoulombs(testCharge)) /
    distanceM ** 3;

  return scale(deltaM, coefficient);
}

export function calculateForceSystem(sources, testCharge) {
  if (!Array.isArray(sources)) {
    throw new TypeError("As cargas-fonte devem ser fornecidas em uma lista.");
  }

  const individual = sources.map((source) => ({
    sourceId: source.id,
    source,
    force: forceFromSource(source, testCharge),
  }));
  const resultant = individual.reduce(
    (sum, entry) => add(sum, entry.force),
    { x: 0, y: 0 },
  );

  return { individual, resultant };
}
