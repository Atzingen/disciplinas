export const PROBLEMAS = {
  and: {
    nome: "AND",
    amostras: [
      { x: [0, 0], d: 0 },
      { x: [0, 1], d: 0 },
      { x: [1, 0], d: 0 },
      { x: [1, 1], d: 1 },
    ],
  },
  or: {
    nome: "OR",
    amostras: [
      { x: [0, 0], d: 0 },
      { x: [0, 1], d: 1 },
      { x: [1, 0], d: 1 },
      { x: [1, 1], d: 1 },
    ],
  },
  xor: {
    nome: "XOR",
    amostras: [
      { x: [0, 0], d: 0 },
      { x: [0, 1], d: 1 },
      { x: [1, 0], d: 1 },
      { x: [1, 1], d: 0 },
    ],
  },
};

export function ativar(v, ativacao) {
  if (ativacao === "sigmoide") return 1 / (1 + Math.exp(-v));
  return v >= 0 ? 1 : 0;
}

// No degrau a derivada não existe; a regra do perceptron usa 1 no lugar dela.
export function derivada(y, ativacao) {
  if (ativacao === "sigmoide") return y * (1 - y);
  return 1;
}

export function classe(y) {
  return y >= 0.5 ? 1 : 0;
}

// Arredonda resíduos de ponto flutuante (0,1 + 0,2 ≠ 0,3) que decidiriam empates do degrau.
function limpar(numero) {
  return Math.round(numero * 1e12) / 1e12;
}

// Uma passada: propaga a amostra, mede o erro e corrige pesos e bias.
export function passada(pesos, amostra, ativacao, taxa) {
  const [x1, x2] = amostra.x;
  const v = limpar(pesos.w1 * x1 + pesos.w2 * x2 + pesos.b);
  const y = ativar(v, ativacao);
  const erro = amostra.d - y;
  const delta = erro * derivada(y, ativacao);
  const depois = {
    w1: limpar(pesos.w1 + taxa * delta * x1),
    w2: limpar(pesos.w2 + taxa * delta * x2),
    b: limpar(pesos.b + taxa * delta),
  };
  return { amostra, antes: { ...pesos }, v, y, erro, delta, depois };
}

export function criarTreino({ problema, ativacao, taxa, pesos }) {
  const amostras = PROBLEMAS[problema].amostras;
  return {
    problema,
    ativacao,
    taxa,
    amostras,
    pesos: { ...pesos },
    epoca: 1,
    indice: 0,
    acertosNaEpoca: 0,
    erroNaEpoca: 0,
    passos: [],
    epocas: [],
    convergiu: false,
  };
}

export function proximaPassada(treino) {
  const amostra = treino.amostras[treino.indice];
  const passo = passada(treino.pesos, amostra, treino.ativacao, treino.taxa);
  passo.epoca = treino.epoca;
  passo.indice = treino.indice;
  treino.passos.push(passo);
  treino.pesos = passo.depois;
  treino.indice += 1;
  if (classe(passo.y) === amostra.d) treino.acertosNaEpoca += 1;
  treino.erroNaEpoca += 0.5 * passo.erro ** 2;
  // Critério clássico: a época termina sem nenhuma amostra classificada errada.
  if (treino.indice === treino.amostras.length) {
    const acertos = treino.acertosNaEpoca;
    treino.convergiu = acertos === treino.amostras.length;
    treino.epocas.push({ epoca: treino.epoca, acertos, total: treino.amostras.length, erroQuadratico: treino.erroNaEpoca });
    treino.acertosNaEpoca = 0;
    treino.erroNaEpoca = 0;
    treino.indice = 0;
    treino.epoca += 1;
  }
  return passo;
}

export function completarEpoca(treino) {
  do {
    proximaPassada(treino);
  } while (treino.indice !== 0);
}

export function treinarAteConvergir(treino, maximoEpocas) {
  if (treino.indice !== 0) completarEpoca(treino);
  while (!treino.convergiu && treino.epocas.length < maximoEpocas) {
    completarEpoca(treino);
  }
  return treino.convergiu;
}
