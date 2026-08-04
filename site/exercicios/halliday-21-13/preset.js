export const HALLIDAY_EQUILIBRIUM_X_CM = -10 / (Math.sqrt(3) - 1);

export const HALLIDAY_PRESET = Object.freeze({
  id: "halliday-21-13",
  title: "Halliday — capítulo 21 — exercício 13",
  resetLabel: "Restaurar equilíbrio",
  maxSources: 2,
  lockSources: true,
  viewport: {
    minX: -20,
    maxX: 15,
    minY: -10,
    maxY: 10,
  },
  sources: [
    {
      id: "q1",
      label: "q₁",
      xCm: 0,
      yCm: 0,
      magnitudeMicroC: 1,
      sign: 1,
      vectorColor: "#008B95",
    },
    {
      id: "q2",
      label: "q₂",
      xCm: 10,
      yCm: 0,
      magnitudeMicroC: 3,
      sign: -1,
      vectorColor: "#E07A1F",
    },
  ],
  testCharge: {
    id: "qt",
    label: "q₃",
    xCm: HALLIDAY_EQUILIBRIUM_X_CM,
    yCm: 0,
    magnitudeMicroC: 1,
    sign: 1,
  },
});
