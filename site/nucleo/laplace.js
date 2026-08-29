const DEFAULT_ASPECT = 1.5;

function assertFinite(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} precisa ser um número finito.`);
  }
}

function normalizedElectrode(electrode, index) {
  const normalized = {
    ...electrode,
    id: String(electrode.id ?? `eletrodo-${index + 1}`),
    type: electrode.type,
    x: Number(electrode.x),
    y: Number(electrode.y),
    potential: Number(electrode.potential),
  };

  if (normalized.type === "circle") {
    normalized.radius = Number(electrode.radius);
  } else if (normalized.type === "rectangle") {
    normalized.width = Number(electrode.width);
    normalized.height = Number(electrode.height);
  }

  return normalized;
}

export function electrodeContains(electrode, x, y, aspect = DEFAULT_ASPECT) {
  if (electrode.type === "circle") {
    const dx = (x - electrode.x) * aspect;
    const dy = y - electrode.y;
    return dx * dx + dy * dy <= electrode.radius * electrode.radius;
  }

  if (electrode.type === "rectangle") {
    return (
      Math.abs(x - electrode.x) <= electrode.width / 2 &&
      Math.abs(y - electrode.y) <= electrode.height / 2
    );
  }

  return false;
}

export function electrodesOverlap(first, second, aspect = DEFAULT_ASPECT) {
  if (first.type === "circle" && second.type === "circle") {
    const dx = (first.x - second.x) * aspect;
    const dy = first.y - second.y;
    const minimumDistance = first.radius + second.radius;
    return dx * dx + dy * dy <= minimumDistance * minimumDistance;
  }

  if (first.type === "rectangle" && second.type === "rectangle") {
    return (
      Math.abs(first.x - second.x) <= (first.width + second.width) / 2 &&
      Math.abs(first.y - second.y) <= (first.height + second.height) / 2
    );
  }

  const circle = first.type === "circle" ? first : second;
  const rectangle = first.type === "rectangle" ? first : second;
  const circleX = circle.x * aspect;
  const rectangleX = rectangle.x * aspect;
  const halfWidth = (rectangle.width * aspect) / 2;
  const halfHeight = rectangle.height / 2;
  const closestX = Math.max(
    rectangleX - halfWidth,
    Math.min(circleX, rectangleX + halfWidth),
  );
  const closestY = Math.max(
    rectangle.y - halfHeight,
    Math.min(circle.y, rectangle.y + halfHeight),
  );
  const dx = circleX - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function validateElectrodes(electrodes, aspect = DEFAULT_ASPECT) {
  const errors = [];

  if (!Array.isArray(electrodes) || electrodes.length === 0) {
    return ["Adicione pelo menos um eletrodo antes de calcular."];
  }

  const ids = new Set();
  for (const [index, electrode] of electrodes.entries()) {
    const label = electrode.id || `eletrodo ${index + 1}`;

    if (ids.has(electrode.id)) {
      errors.push(`O identificador ${label} está repetido.`);
    }
    ids.add(electrode.id);

    if (!["circle", "rectangle"].includes(electrode.type)) {
      errors.push(`${label} tem uma forma desconhecida.`);
      continue;
    }

    for (const [field, value] of [
      ["x", electrode.x],
      ["y", electrode.y],
      ["potencial", electrode.potential],
    ]) {
      if (!Number.isFinite(value)) {
        errors.push(`${label}: ${field} precisa ser um número finito.`);
      }
    }

    if (electrode.type === "circle") {
      if (!Number.isFinite(electrode.radius) || electrode.radius <= 0) {
        errors.push(`${label}: o raio precisa ser positivo.`);
      } else {
        const horizontalRadius = electrode.radius / aspect;
        if (
          electrode.x - horizontalRadius < 0 ||
          electrode.x + horizontalRadius > 1 ||
          electrode.y - electrode.radius < 0 ||
          electrode.y + electrode.radius > 1
        ) {
          errors.push(`${label} ultrapassa a borda da cuba.`);
        }
      }
    }

    if (electrode.type === "rectangle") {
      if (!Number.isFinite(electrode.width) || electrode.width <= 0) {
        errors.push(`${label}: a largura precisa ser positiva.`);
      }
      if (!Number.isFinite(electrode.height) || electrode.height <= 0) {
        errors.push(`${label}: a altura precisa ser positiva.`);
      }
      if (
        Number.isFinite(electrode.width) &&
        Number.isFinite(electrode.height) &&
        (electrode.x - electrode.width / 2 < 0 ||
          electrode.x + electrode.width / 2 > 1 ||
          electrode.y - electrode.height / 2 < 0 ||
          electrode.y + electrode.height / 2 > 1)
      ) {
        errors.push(`${label} ultrapassa a borda da cuba.`);
      }
    }
  }

  for (let first = 0; first < electrodes.length; first += 1) {
    for (let second = first + 1; second < electrodes.length; second += 1) {
      if (electrodesOverlap(electrodes[first], electrodes[second], aspect)) {
        errors.push(
          `${electrodes[first].id} e ${electrodes[second].id} estão sobrepostos.`,
        );
      }
    }
  }

  return errors;
}

export function createPotentialGrid({
  width = 121,
  height = 81,
  aspect = DEFAULT_ASPECT,
  electrodes,
  source = null,
  initialPotential = "minimum",
} = {}) {
  if (!Number.isInteger(width) || width < 5) {
    throw new RangeError("A malha precisa ter ao menos cinco colunas.");
  }
  if (!Number.isInteger(height) || height < 5) {
    throw new RangeError("A malha precisa ter ao menos cinco linhas.");
  }
  assertFinite(aspect, "A razão de aspecto");
  if (aspect <= 0) {
    throw new RangeError("A razão de aspecto precisa ser positiva.");
  }

  const normalized = (electrodes ?? []).map(normalizedElectrode);
  const errors = validateElectrodes(normalized, aspect);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const size = width * height;
  if (source !== null && source.length !== size) {
    throw new RangeError("O termo-fonte precisa ter o mesmo tamanho da malha.");
  }

  const potentials = normalized.map((electrode) => electrode.potential);
  const minimumPotential = Math.min(...potentials);
  const maximumPotential = Math.max(...potentials);
  const meanPotential =
    potentials.reduce((total, potential) => total + potential, 0) /
    potentials.length;
  const startingPotential =
    initialPotential === "minimum"
      ? minimumPotential
      : initialPotential === "mean"
        ? meanPotential
        : Number(initialPotential);
  assertFinite(startingPotential, "O potencial inicial");

  const values = new Float64Array(size);
  const fixed = new Uint8Array(size);
  const fixedValues = new Float64Array(size);
  const owners = new Int16Array(size);
  const sourceValues = source
    ? Float64Array.from(source)
    : new Float64Array(size);
  owners.fill(-1);
  values.fill(startingPotential);

  for (let row = 0; row < height; row += 1) {
    const y = row / (height - 1);
    for (let column = 0; column < width; column += 1) {
      const x = column / (width - 1);
      const index = row * width + column;

      for (let electrodeIndex = 0; electrodeIndex < normalized.length; electrodeIndex += 1) {
        const electrode = normalized[electrodeIndex];
        if (!electrodeContains(electrode, x, y, aspect)) {
          continue;
        }
        fixed[index] = 1;
        fixedValues[index] = electrode.potential;
        values[index] = electrode.potential;
        owners[index] = electrodeIndex;
        break;
      }
    }
  }

  return {
    width,
    height,
    aspect,
    electrodes: normalized,
    values,
    fixed,
    fixedValues,
    owners,
    source: sourceValues,
    minimumPotential,
    maximumPotential,
    iteration: 0,
    lastDelta: Number.POSITIVE_INFINITY,
  };
}

export function relaxGaussSeidel(state, sweeps = 1, omega = 1) {
  if (!Number.isInteger(sweeps) || sweeps < 1) {
    throw new RangeError("O número de varreduras precisa ser um inteiro positivo.");
  }
  assertFinite(omega, "O fator de relaxação");
  if (omega <= 0 || omega >= 2) {
    throw new RangeError("O fator de relaxação precisa estar entre 0 e 2.");
  }

  const { width, height, values, fixed, source, aspect } = state;
  const dx = aspect / (width - 1);
  const dy = 1 / (height - 1);
  const xWeight = 1 / (dx * dx);
  const yWeight = 1 / (dy * dy);
  const denominator = 2 * (xWeight + yWeight);
  let batchMaximum = 0;
  let finalSweepMaximum = 0;

  for (let sweep = 0; sweep < sweeps; sweep += 1) {
    let sweepMaximum = 0;

    for (let row = 0; row < height; row += 1) {
      const previousRow = row === 0 ? 1 : row - 1;
      const nextRow = row === height - 1 ? height - 2 : row + 1;

      for (let column = 0; column < width; column += 1) {
        const index = row * width + column;
        if (fixed[index]) {
          continue;
        }

        const previousColumn = column === 0 ? 1 : column - 1;
        const nextColumn = column === width - 1 ? width - 2 : column + 1;
        const horizontal =
          values[row * width + previousColumn] +
          values[row * width + nextColumn];
        const vertical =
          values[previousRow * width + column] +
          values[nextRow * width + column];
        const gaussSeidelValue =
          (xWeight * horizontal + yWeight * vertical - source[index]) /
          denominator;
        const oldValue = values[index];
        const nextValue = oldValue + omega * (gaussSeidelValue - oldValue);
        const delta = Math.abs(nextValue - oldValue);
        values[index] = nextValue;
        sweepMaximum = Math.max(sweepMaximum, delta);
      }
    }

    state.iteration += 1;
    finalSweepMaximum = sweepMaximum;
    batchMaximum = Math.max(batchMaximum, sweepMaximum);
  }

  state.lastDelta = finalSweepMaximum;
  return {
    iteration: state.iteration,
    lastDelta: finalSweepMaximum,
    maxDelta: batchMaximum,
  };
}

export function solveUntil(
  state,
  { tolerance = 1e-4, maxIterations = 20_000, omega = 1 } = {},
) {
  assertFinite(tolerance, "A tolerância");
  if (tolerance <= 0) {
    throw new RangeError("A tolerância precisa ser positiva.");
  }

  while (state.iteration < maxIterations) {
    const result = relaxGaussSeidel(state, 1, omega);
    if (result.lastDelta <= tolerance) {
      return { ...result, converged: true };
    }
  }

  return {
    iteration: state.iteration,
    lastDelta: state.lastDelta,
    maxDelta: state.lastDelta,
    converged: false,
  };
}

export function samplePotential(state, x, y) {
  const clampedX = Math.max(0, Math.min(1, x));
  const clampedY = Math.max(0, Math.min(1, y));
  const gridX = clampedX * (state.width - 1);
  const gridY = clampedY * (state.height - 1);
  const left = Math.floor(gridX);
  const top = Math.floor(gridY);
  const right = Math.min(state.width - 1, left + 1);
  const bottom = Math.min(state.height - 1, top + 1);
  const horizontalMix = gridX - left;
  const verticalMix = gridY - top;
  const topValue =
    state.values[top * state.width + left] * (1 - horizontalMix) +
    state.values[top * state.width + right] * horizontalMix;
  const bottomValue =
    state.values[bottom * state.width + left] * (1 - horizontalMix) +
    state.values[bottom * state.width + right] * horizontalMix;
  return topValue * (1 - verticalMix) + bottomValue * verticalMix;
}

export function electricFieldAt(state, x, y) {
  const stepX = 1 / (state.width - 1);
  const stepY = 1 / (state.height - 1);
  const left = samplePotential(state, x - stepX, y);
  const right = samplePotential(state, x + stepX, y);
  const top = samplePotential(state, x, y - stepY);
  const bottom = samplePotential(state, x, y + stepY);

  return {
    x: -(right - left) / (2 * stepX * state.aspect),
    y: -(bottom - top) / (2 * stepY),
  };
}
