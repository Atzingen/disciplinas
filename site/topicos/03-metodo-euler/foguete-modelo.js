export function acceleration(t, velocity) {
  const mass = 50 - 0.5 * t;
  return (1500 - mass * 9.8 - 0.5 * velocity ** 2 + 0.5 * velocity) / mass;
}

export function analyticVelocity(t, initialVelocity) {
  // Coeficientes da solução analítica u(s), com s = t/100.
  const coefficients = [1, initialVelocity];
  const A = 980;
  const B = 3000;
  for (let n = 0; n < 158; n += 1) {
    const previous = n === 0 ? 0 : coefficients[n - 1];
    coefficients.push(
      (2 * (n + 1) ** 2 * coefficients[n + 1]
        + (B - A - n * (n + 1)) * coefficients[n] + A * previous)
        / ((n + 2) * (n + 1)),
    );
  }
  const s = t / 100;
  let u = coefficients.at(-1);
  let derivative = 0;
  for (let n = coefficients.length - 2; n >= 0; n -= 1) {
    derivative = derivative * s + u;
    u = u * s + coefficients[n];
  }
  return (1 - s) * derivative / u;
}

export function rocketStep(t, v, h, method) {
  const stages = [];
  function stage(time, velocity) {
    const slope = acceleration(time, velocity);
    stages.push({ t: time, v: velocity, slope });
    return slope;
  }
  const k1 = stage(t, v);
  let averageSlope;
  if (method === "euler") {
    averageSlope = k1;
  } else if (method === "rk2") {
    const k2 = stage(t + h / 2, v + h * k1 / 2);
    averageSlope = k2;
  } else if (method === "rk4") {
    const k2 = stage(t + h / 2, v + h * k1 / 2);
    const k3 = stage(t + h / 2, v + h * k2 / 2);
    const k4 = stage(t + h, v + h * k3);
    averageSlope = (k1 + 2 * k2 + 2 * k3 + k4) / 6;
  } else {
    throw new RangeError("Escolha Euler, RK2 ou RK4.");
  }
  return { t, v, h, stages, averageSlope, nextVelocity: v + h * averageSlope };
}

export function integrateRocket({ initialVelocity, step, finalTime, method }) {
  if (![initialVelocity, step, finalTime].every(Number.isFinite)
    || initialVelocity < 0 || initialVelocity > 60
    || step < 0.1 || step > 2 || finalTime < 1 || finalTime > 20
    || !["euler", "rk2", "rk4"].includes(method)) {
    throw new RangeError("Use 0 ≤ v₀ ≤ 60 m/s, 0,1 ≤ h ≤ 2 s e 1 ≤ tempo final ≤ 20 s.");
  }
  const points = [{ t: 0, v: initialVelocity }];
  const steps = [];
  const count = Math.ceil(finalTime / step - 1e-12);
  for (let n = 0; n < count; n += 1) {
    const current = points.at(-1);
    const nextTime = Math.min((n + 1) * step, finalTime);
    const result = rocketStep(current.t, current.v, nextTime - current.t, method);
    steps.push(result);
    points.push({ t: nextTime, v: result.nextVelocity });
  }
  return { points, steps };
}
