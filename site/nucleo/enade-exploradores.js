// SI: h, c and e are exact defining constants. Electron mass is rounded.
export const H = 6.62607015e-34;
export const C = 299792458;
export const E = 1.602176634e-19;
const ELECTRON_MASS = 9.1093837e-31;

export function lamps(count, internalResistance) {
  const external = 6 / count;
  const current = 6 / (internalResistance + external);
  const voltage = current * external;
  return {current, voltage, branchCurrent: voltage / 6, branchPower: voltage ** 2 / 6,
    internalPower: current ** 2 * internalResistance, sourcePower: 6 * current};
}

export const networks = {
  A: {series: [1, {parallel: [1, 1, {series: [1, 1]}]}]},
  B: {parallel: [1, {series: [1, 1, 1]}, 1]},
  C: {parallel: [{series: [1, 1]}, 1, {series: [1, 1]}]},
  D: {parallel: [1, {series: [1, {parallel: [1, {series: [1, 1]}]}]}]},
};

export function equivalent(network, resistance = 1) {
  if (typeof network === 'number') return network * resistance;
  if (network.series) return network.series.reduce((sum, part) => sum + equivalent(part, resistance), 0);
  return 1 / network.parallel.reduce((sum, part) => sum + 1 / equivalent(part, resistance), 0);
}

// Smooth, relative flux through a coil, not a calibrated finite-solenoid model.
export function flux(position, polarity = 1) {
  return polarity / (1 + position ** 2) ** 1.5;
}
export function inducedEmf(from, to, seconds, polarity = 1) {
  return seconds > 0 ? -(flux(to, polarity) - flux(from, polarity)) / seconds : 0;
}

// Typical surface values, OpenStax University Physics 3, table 6.1.
export const metals = {sodio: {label: 'Sódio', work: 2.46}, aluminio: {label: 'Alumínio', work: 4.08},
  zinco: {label: 'Zinco', work: 4.31}, cobre: {label: 'Cobre', work: 4.70}};
export function photoelectric(wavelengthNm, work, intensity) {
  const photonEnergy = H * C / (wavelengthNm * 1e-9 * E);
  const allowed = photonEnergy >= work;
  return {photonEnergy, thresholdNm: H * C / (work * E) * 1e9,
    emitting: allowed && intensity > 0, kinetic: allowed && intensity > 0 ? photonEnergy - work : 0};
}

export function standingWave(harmonic, length, x, phase = 0) {
  return Math.sin(harmonic * Math.PI * x / length) * Math.cos(phase);
}
export function orbit(beta, field = 1) {
  if (beta < 0 || beta >= 1 || field <= 0) throw new RangeError('Use 0 ≤ v/c < 1 e B > 0.');
  const gamma = 1 / Math.sqrt(1 - beta ** 2);
  const classical = ELECTRON_MASS * beta * C / (E * field);
  return {gamma, classical, relativistic: gamma * classical};
}

export function energyKwh(powerW, hours, count = 1, days = 1) {
  return powerW * hours * count * days / 1000;
}
