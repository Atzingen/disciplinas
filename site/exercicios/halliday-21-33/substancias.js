export const VOLUME_CM3 = 250;

export const ELEMENT_COLORS = {
  H: { fill: "#e9eff2", ink: "#0d1016" },
  C: { fill: "#94a1b2", ink: "#0d1016" },
  N: { fill: "#5c7cfa", ink: "#ffffff" },
  O: { fill: "#e8503a", ink: "#ffffff" },
  Na: { fill: "#a96be0", ink: "#ffffff" },
  Si: { fill: "#e0a85c", ink: "#2a1f10" },
  Cl: { fill: "#4fbf6a", ink: "#0d1016" },
};

export const SUBSTANCES = [
  {
    id: "h2o",
    name: "Água",
    formulaHtml: "H<sub>2</sub>O",
    formulaLabel: "H₂O",
    state: "líquido · 25 °C",
    unit: "molécula",
    accent: "var(--positive)",
    densityGramsPerCm3: 1.0,
    molarMassGramsPerMol: 18.02,
    composition: [
      ["H", 2],
      ["O", 1],
    ],
    caption:
      "Molécula angular · ângulo H–O–H de 104,5° · ligação O–H de 0,096 nm",
    note:
      "Molécula polar: o oxigênio puxa a nuvem eletrônica e deixa o lado dos hidrogênios levemente positivo. Essa assimetria explica as ligações de hidrogênio, a tensão superficial alta e o fato de o gelo flutuar.",
    diagram: {
      viewBox: "0 0 340 230",
      atoms: [
        { element: "O", x: 170, y: 150, r: 44 },
        { element: "H", x: 94, y: 88, r: 28 },
        { element: "H", x: 246, y: 88, r: 28 },
      ],
      bonds: [
        { from: 0, to: 1, order: 1 },
        { from: 0, to: 2, order: 1 },
      ],
    },
  },
  {
    id: "sio2",
    name: "Quartzo",
    formulaHtml: "SiO<sub>2</sub>",
    formulaLabel: "SiO₂",
    state: "sólido · cristalino",
    unit: "unidade de fórmula",
    accent: "var(--measure)",
    densityGramsPerCm3: 2.65,
    molarMassGramsPerMol: 60.08,
    composition: [
      ["Si", 1],
      ["O", 2],
    ],
    caption:
      "Tetraedro SiO₄ · cada oxigênio é compartilhado por dois tetraedros, o que resulta na proporção SiO₂",
    note:
      "Não é uma molécula: é uma rede covalente infinita de tetraedros SiO₄ unidos pelos vértices. Como cada oxigênio pertence a dois silícios, a proporção efetiva é 1 Si para 2 O.",
    diagram: {
      viewBox: "0 0 340 240",
      atoms: [
        { element: "Si", x: 170, y: 122, r: 42 },
        { element: "O", x: 170, y: 38, r: 28 },
        { element: "O", x: 76, y: 170, r: 28 },
        { element: "O", x: 264, y: 170, r: 28 },
        { element: "O", x: 170, y: 206, r: 26, faded: true },
      ],
      bonds: [
        { from: 0, to: 1, order: 1 },
        { from: 0, to: 2, order: 1 },
        { from: 0, to: 3, order: 1 },
        { from: 0, to: 4, order: 1, dashed: true },
      ],
    },
  },
  {
    id: "nacl",
    name: "Cloreto de sódio",
    formulaHtml: "NaCl",
    formulaLabel: "NaCl",
    state: "sólido · iônico",
    unit: "unidade de fórmula",
    accent: "var(--force-3)",
    densityGramsPerCm3: 2.16,
    molarMassGramsPerMol: 58.44,
    composition: [
      ["Na", 1],
      ["Cl", 1],
    ],
    caption:
      "Retículo cúbico de faces centradas · o par Na–Cl destacado é a unidade de fórmula que se repete",
    note:
      "Também não existem moléculas de NaCl no cristal: cada íon Na⁺ é cercado por seis Cl⁻ e vice-versa. O sódio cedeu um elétron ao cloro, mas os prótons continuam onde estavam — 11 e 17.",
    lattice: true,
    diagram: {
      viewBox: "0 0 340 240",
      atoms: [
        { element: "Na", x: 120, y: 150, r: 34 },
        { element: "Cl", x: 236, y: 150, r: 44 },
      ],
      bonds: [{ from: 0, to: 1, order: 1, dashed: true }],
    },
  },
  {
    id: "n2",
    name: "Nitrogênio",
    formulaHtml: "N<sub>2</sub>",
    formulaLabel: "N₂",
    state: "gás · CNTP",
    unit: "molécula",
    accent: "var(--negative)",
    densityGramsPerCm3: 0.001251,
    molarMassGramsPerMol: 28.01,
    composition: [["N", 2]],
    caption: "Molécula diatômica linear · ligação tripla N≡N de 0,110 nm",
    note:
      "A ligação tripla é uma das mais fortes da química (941 kJ/mol); por isso o N₂ é quase inerte e atravessa os pulmões sem reagir. Corresponde a 78% do ar atmosférico em volume.",
    diagram: {
      viewBox: "0 0 340 230",
      atoms: [
        { element: "N", x: 105, y: 115, r: 44 },
        { element: "N", x: 235, y: 115, r: 44 },
      ],
      bonds: [{ from: 0, to: 1, order: 3 }],
    },
  },
  {
    id: "o2",
    name: "Oxigênio",
    formulaHtml: "O<sub>2</sub>",
    formulaLabel: "O₂",
    state: "gás · CNTP",
    unit: "molécula",
    accent: "var(--force-2)",
    densityGramsPerCm3: 0.001429,
    molarMassGramsPerMol: 32.0,
    composition: [["O", 2]],
    caption: "Molécula diatômica linear · ligação dupla O=O de 0,121 nm",
    note:
      "É paramagnética: tem dois elétrons desemparelhados e é atraída por um ímã. Nenhum modelo simples de ligação dupla prevê isso — foi um dos primeiros triunfos da teoria dos orbitais moleculares.",
    diagram: {
      viewBox: "0 0 340 230",
      atoms: [
        { element: "O", x: 105, y: 115, r: 46 },
        { element: "O", x: 235, y: 115, r: 46 },
      ],
      bonds: [{ from: 0, to: 1, order: 2 }],
    },
  },
  {
    id: "co2",
    name: "Dióxido de carbono",
    formulaHtml: "CO<sub>2</sub>",
    formulaLabel: "CO₂",
    state: "gás · CNTP",
    unit: "molécula",
    accent: "var(--force-5)",
    densityGramsPerCm3: 0.001977,
    molarMassGramsPerMol: 44.01,
    composition: [
      ["C", 1],
      ["O", 2],
    ],
    caption:
      "Molécula linear · ângulo O=C=O de 180° · ligação C=O de 0,116 nm",
    note:
      "Perfeitamente linear e simétrica, o que anula seu momento de dipolo permanente. Ainda assim absorve infravermelho: os modos de vibração assimétricos criam um dipolo momentâneo — a origem física do efeito estufa.",
    diagram: {
      viewBox: "0 0 340 230",
      atoms: [
        { element: "O", x: 68, y: 115, r: 42 },
        { element: "C", x: 170, y: 115, r: 36 },
        { element: "O", x: 272, y: 115, r: 42 },
      ],
      bonds: [
        { from: 1, to: 0, order: 2 },
        { from: 1, to: 2, order: 2 },
      ],
    },
  },
];
