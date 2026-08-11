/**
 * Escada ("varal") de resistores: cada degrau acrescenta um resistor no fio de
 * cima, um no fio de baixo e um na vertical, entre os dois fios. Três por degrau.
 */

export const INFINITE_LADDER_FACTOR = 1 + Math.sqrt(3);
export const RESISTORS_PER_RUNG = 3;

function positiveResistance(value, description) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(description + " deve ser uma resistência positiva.");
  }
  return value;
}

function rungCount(value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError("O número de degraus deve ser um inteiro positivo.");
  }
  return value;
}

export function parallel(first, second) {
  if (first === Infinity) {
    return second;
  }
  if (second === Infinity) {
    return first;
  }
  return (first * second) / (first + second);
}

export function infiniteLadderResistance(resistance) {
  return INFINITE_LADDER_FACTOR * positiveResistance(resistance, "O resistor");
}

/**
 * Resistência vista pelos terminais de entrada. A escada é montada de fora para
 * dentro: 2R em série com o degrau seguinte, que está em paralelo com o
 * resistor vertical. `termination` é o que sobra depois do último degrau —
 * Infinity para circuito aberto.
 */
export function ladderResistance(rungs, resistance, termination = Infinity) {
  const total = rungCount(rungs);
  const unit = positiveResistance(resistance, "O resistor");
  if (termination !== Infinity) {
    positiveResistance(termination, "A terminação");
  }

  let rest = termination;
  for (let degrau = 0; degrau < total; degrau += 1) {
    rest = 2 * unit + parallel(unit, rest);
  }
  return rest;
}

export function resistorsUsed(rungs) {
  return rungCount(rungs) * RESISTORS_PER_RUNG;
}

export function relativeDeviation(value, reference) {
  return (value - reference) / reference;
}

/**
 * Tensão em cada resistor vertical, do degrau mais próximo da fonte ao mais
 * distante, para uma fonte ideal de `sourceVolts`.
 */
export function rungVoltages(rungs, resistance, sourceVolts, termination = Infinity) {
  const total = rungCount(rungs);
  const unit = positiveResistance(resistance, "O resistor");
  positiveResistance(sourceVolts, "A tensão da fonte");

  const voltages = [];
  let remaining = sourceVolts;

  for (let degrau = 0; degrau < total; degrau += 1) {
    const restantes = total - degrau - 1;
    const adiante = restantes === 0
      ? termination
      : ladderResistance(restantes, unit, termination);
    const shunt = parallel(unit, adiante);
    const entrada = 2 * unit + shunt;

    const noShunt = remaining * (shunt / entrada);
    voltages.push(noShunt);
    remaining = noShunt;
  }

  return voltages;
}

/** Fator de atenuação por degrau em uma escada infinita: 2 − √3. */
export function attenuationPerRung() {
  return 2 - Math.sqrt(3);
}

/**
 * Resistência R_AB calculada com os resistores realmente medidos, em vez do
 * valor nominal. Cada degrau é {top, bottom, shunt}, do mais próximo dos bornes
 * ao mais distante. A escada é resolvida da ponta aberta para os bornes.
 */
export function measuredLadderResistance(rungs) {
  if (!Array.isArray(rungs) || rungs.length === 0) {
    throw new TypeError("Informe ao menos um degrau medido.");
  }

  let rest = Infinity;
  for (let indice = rungs.length - 1; indice >= 0; indice -= 1) {
    const { top, bottom, shunt } = rungs[indice];
    positiveResistance(top, "O resistor do fio de cima");
    positiveResistance(bottom, "O resistor do fio de baixo");
    positiveResistance(shunt, "O resistor vertical");
    rest = top + bottom + parallel(shunt, rest);
  }
  return rest;
}

/**
 * R_AB é homogênea de grau 1: multiplicar todos os resistores por k multiplica
 * o resultado por k. Por isso a média dos resistores medidos já é uma previsão
 * melhor que o valor nominal.
 */
export function meanResistance(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError("Informe ao menos um resistor medido.");
  }
  for (const value of values) {
    positiveResistance(value, "O resistor medido");
  }
  return values.reduce((soma, value) => soma + value, 0) / values.length;
}

export function convergenceTable(maxRungs, resistance) {
  const total = rungCount(maxRungs);
  const unit = positiveResistance(resistance, "O resistor");
  const limite = infiniteLadderResistance(unit);

  return Array.from({ length: total }, (_, indice) => {
    const rungs = indice + 1;
    const value = ladderResistance(rungs, unit);
    return {
      rungs,
      resistors: resistorsUsed(rungs),
      resistance: value,
      deviation: relativeDeviation(value, limite),
    };
  });
}
