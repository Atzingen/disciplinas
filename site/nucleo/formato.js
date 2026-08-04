function normalizedNumber(value) {
  return Object.is(value, -0) ? 0 : value;
}

export function formatDecimal(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "indefinido";
  }
  return normalizedNumber(value)
    .toFixed(digits)
    .replace("-", "−")
    .replace(".", ",");
}

export function formatVector(vector, digits = 2) {
  if (
    vector === null ||
    !Number.isFinite(vector.x) ||
    !Number.isFinite(vector.y)
  ) {
    return "indefinido";
  }
  return (
    "(" +
    formatDecimal(vector.x, digits) +
    "; " +
    formatDecimal(vector.y, digits) +
    ")"
  );
}

export function formatDegrees(radians, digits = 1) {
  if (!Number.isFinite(radians)) {
    return "indefinido";
  }
  return formatDecimal((radians * 180) / Math.PI, digits) + "°";
}

function superscript(integer) {
  const characters = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };
  return String(integer)
    .split("")
    .map((character) => characters[character])
    .join("");
}

export function formatScientific(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "indefinido";
  }
  if (value === 0) {
    return formatDecimal(0, digits);
  }

  const [coefficient, exponent] = value.toExponential(digits).split("e");
  return (
    coefficient.replace("-", "−").replace(".", ",") +
    " × 10" +
    superscript(Number(exponent))
  );
}
