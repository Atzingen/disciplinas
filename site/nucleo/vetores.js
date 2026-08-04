function assertVector(vector, name = "vetor") {
  if (
    vector === null ||
    typeof vector !== "object" ||
    !Number.isFinite(vector.x) ||
    !Number.isFinite(vector.y)
  ) {
    throw new TypeError(name + " deve possuir componentes x e y finitas.");
  }
}

export function add(a, b) {
  assertVector(a, "a");
  assertVector(b, "b");
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a, b) {
  assertVector(a, "a");
  assertVector(b, "b");
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(vector, factor) {
  assertVector(vector);
  if (!Number.isFinite(factor)) {
    throw new TypeError("O fator de escala deve ser finito.");
  }
  return { x: vector.x * factor, y: vector.y * factor };
}

export function magnitudeSquared(vector) {
  assertVector(vector);
  return vector.x ** 2 + vector.y ** 2;
}

export function magnitude(vector) {
  assertVector(vector);
  return Math.hypot(vector.x, vector.y);
}

export function dot(a, b) {
  assertVector(a, "a");
  assertVector(b, "b");
  return a.x * b.x + a.y * b.y;
}

export function determinant(a, b) {
  assertVector(a, "a");
  assertVector(b, "b");
  return a.x * b.y - a.y * b.x;
}

export function angleBetween(a, b) {
  const denominator = magnitude(a) * magnitude(b);
  if (denominator <= Number.EPSILON) {
    return null;
  }

  const cosine = Math.min(1, Math.max(-1, dot(a, b) / denominator));
  return Math.acos(cosine);
}

export function project(vector, onto) {
  assertVector(vector);
  const denominator = magnitudeSquared(onto);
  if (denominator <= Number.EPSILON) {
    return null;
  }
  return scale(onto, dot(vector, onto) / denominator);
}

export function resultantMagnitude(a, b) {
  const squared =
    magnitudeSquared(a) + magnitudeSquared(b) + 2 * dot(a, b);
  return Math.sqrt(Math.max(0, squared));
}
