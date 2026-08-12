import { COULOMB_CONSTANT } from "../../nucleo/eletrostatica.js";

export function pendulumState({
  lengthM,
  massKg,
  separationM,
  gravity = 9.81,
}) {
  if (
    !(
      lengthM > 0 &&
      massKg > 0 &&
      separationM > 0 &&
      separationM < 2 * lengthM &&
      gravity > 0
    )
  ) {
    throw new RangeError(
      "Dimensões e massa devem ser positivas, com x < 2L.",
    );
  }

  const halfSeparationM = separationM / 2;
  const theta = Math.asin(halfSeparationM / lengthM);
  const approximateChargeC = Math.sqrt(
    (massKg * gravity * separationM ** 3) /
      (2 * lengthM * COULOMB_CONSTANT),
  );
  const exactChargeC = Math.sqrt(
    (Math.tan(theta) * massKg * gravity * separationM ** 2) /
      COULOMB_CONSTANT,
  );

  return {
    halfSeparationM,
    theta,
    thetaDegrees: (theta * 180) / Math.PI,
    approximateChargeC,
    exactChargeC,
    relativeChargeError:
      Math.abs(exactChargeC - approximateChargeC) / exactChargeC,
  };
}
