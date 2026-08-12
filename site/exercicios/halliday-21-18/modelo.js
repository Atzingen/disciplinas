export function solveMeasuredForces(sumN, differenceN) {
  if (!(sumN > differenceN && differenceN > 0)) {
    throw new RangeError("As medidas devem satisfazer S > D > 0.");
  }

  const forceB = (sumN - differenceN) / 2;
  const forceC = (sumN + differenceN) / 2;
  return { forceB, forceC, chargeRatio: forceC / forceB };
}

export function forceSceneAt(progress, forceB, forceC) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const angle = Math.PI * clampedProgress;
  const bPosition = { x: Math.cos(angle), y: -Math.sin(angle) };
  const cPosition = { x: 1, y: 0 };
  const bForce = {
    x: -forceB * bPosition.x,
    y: -forceB * bPosition.y,
  };
  const cForce = { x: -forceC, y: 0 };
  const isSumConfiguration = clampedProgress === 0;
  const isDifferenceConfiguration = clampedProgress === 1;

  return {
    bPosition,
    cPosition,
    bForce,
    cForce,
    resultant: { x: bForce.x + cForce.x, y: bForce.y },
    measured: isSumConfiguration || isDifferenceConfiguration,
    equation: isSumConfiguration
      ? "F_B + F_C = S"
      : isDifferenceConfiguration
        ? "F_C - F_B = D"
        : null,
  };
}
