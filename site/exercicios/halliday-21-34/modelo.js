function assertIonMultiple(n) {
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new RangeError("n deve ser inteiro entre 1 e 5.");
  }
}

export function equilibriumAngleDegrees(n) {
  assertIonMultiple(n);
  return (Math.acos((1 / (2 * n)) ** (1 / 3)) * 180) / Math.PI;
}

export function normalizedForceComponents(n) {
  const theta = (equilibriumAngleDegrees(n) * Math.PI) / 180;
  const horizontalOne = n * Math.cos(theta) ** 3;
  const verticalOne = n * Math.cos(theta) ** 2 * Math.sin(theta);

  return {
    theta,
    distanceRatio: 1 / Math.cos(theta),
    horizontalOne,
    verticalPair: verticalOne - verticalOne,
    horizontalResidual: 1 - 2 * horizontalOne,
  };
}
