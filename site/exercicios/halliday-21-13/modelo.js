import { calculateForceSystem } from "../../nucleo/eletrostatica.js";
import { scale } from "../../nucleo/vetores.js";
import { HALLIDAY_EQUILIBRIUM_X_CM, HALLIDAY_PRESET } from "./preset.js";

export function fieldVectorsAt(xCm, yCm) {
  const testCharge = {
    ...HALLIDAY_PRESET.testCharge,
    xCm,
    yCm,
  };
  const system = calculateForceSystem(HALLIDAY_PRESET.sources, testCharge);
  const testChargeC = testCharge.sign * testCharge.magnitudeMicroC * 1e-6;

  return {
    individual: system.individual.map((entry) => ({
      sourceId: entry.sourceId,
      field: scale(entry.force, 1 / testChargeC),
    })),
    resultant: scale(system.resultant, 1 / testChargeC),
  };
}

export function equilibriumStoryFrames() {
  return Object.freeze([
    {
      id: "off-axis",
      xCm: -13.66,
      yCm: 5,
      title: "Fora do eixo, os campos não são colineares",
      explanation: "Com y ≠ 0, E₁ e E₂ não têm a mesma direção. Mesmo com módulos próximos, suas componentes transversais não se cancelam.",
      region: "Fora do eixo x",
    },
    {
      id: "between",
      xCm: 5,
      yCm: 0,
      title: "Entre as cargas, os campos se somam",
      explanation: "Entre q₁ positiva e q₂ negativa, E₁ e E₂ apontam para a direita. Vetores com o mesmo sentido não podem produzir campo nulo.",
      region: "0 < x < 10 cm",
    },
    {
      id: "right",
      xCm: 15,
      yCm: 0,
      title: "À direita, a carga de maior módulo domina",
      explanation: "Os campos são opostos, mas q₂ está mais perto e tem módulo três vezes maior. Assim, |E₂| > |E₁| em toda essa região.",
      region: "x > 10 cm",
    },
    {
      id: "left-far",
      xCm: -20,
      yCm: 0,
      title: "À esquerda, longe demais, E₂ ainda vence",
      explanation: "Em x = −20 cm, os campos são opostos, porém |E₂|/|E₁| = 4/3. A resultante aponta para q₂.",
      region: "x < 0 · longe",
    },
    {
      id: "left-near",
      xCm: -5,
      yCm: 0,
      title: "Mais perto de q₁, E₁ passa a dominar",
      explanation: "Em x = −5 cm, |E₂|/|E₁| = 1/3. Como a dominância se inverteu, existe uma única raiz entre −20 cm e −5 cm.",
      region: "x < 0 · perto",
    },
    {
      id: "equilibrium",
      xCm: HALLIDAY_EQUILIBRIUM_X_CM,
      yCm: 0,
      title: "A única raiz: campos iguais e opostos",
      explanation: "x = −13,66 cm, y = 0, |E₁|/|E₂| = 1 e resultante nula. O equilíbrio independe do valor não nulo de q₃.",
      region: "Equilíbrio em x < 0",
    },
  ]);
}
