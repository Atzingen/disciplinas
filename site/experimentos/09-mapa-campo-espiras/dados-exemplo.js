// Dados sintéticos no formato mapa-campo v1, para experimentar o visualizador
// sem a montagem. O campo "verdadeiro" é: bobina (Biot-Savart, com k e centro
// deslocado) + campo da Terra + dipolo fixo (aço da impressora) + desvio fixo do
// sensor + deriva linear do zero no tempo + ruído gaussiano em cada leitura.
import { FORMATO } from "./formato-mapa.js";
import { createModel } from "./modelo-biot-savart.js";

export const EXEMPLO = Object.freeze({
  geometria: "circulo",
  dimensaoMm: 150,
  voltas: 20,
  correnteA: 1,
  leiturasPorPonto: 16,
  // valores "verdadeiros" que o ajuste deve recuperar
  k: 0.985,
  x0: 2.0,
  y0: -1.5,
  z0: 1.0,
  grade: {
    x: { de: -120, ate: 120, passo: 10 },
    y: { de: -120, ate: 120, passo: 10 },
    z: [20, 30, 50, 80, 120, 180],
  },
  referencia: [-120, -120, 180],
  terra: [8.8, 15.24, 14.4], // 17,6 µT na horizontal, 14,4 µT para cima
  dipolo: { posicao: [80, 260, -60], momento: [0.05, -0.15, 0.3] }, // mm e A·m²
  desvioDoSensor: [4.0, -3.0, 2.5],
  derivaPorHora: [0.4, -0.25, 0.6],
  ruidoPorLeitura: 0.45,
  segundosPorPonto: 3.0,
  segundosPorReferencia: 8.0,
  intervaloEntrePassadas: 600,
  semente: 2026,
});

// Gerador pseudoaleatório com semente (mulberry32), para o exemplo ser sempre igual.
function createRandom(semente) {
  let estado = semente >>> 0;
  return function aleatorio() {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createGaussian(aleatorio) {
  return function gaussiano() {
    const u1 = Math.max(aleatorio(), 1e-12);
    const u2 = aleatorio();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}

// Campo de um dipolo em µT, com posições em mm e momento em A·m².
function dipoleField(dipolo, x, y, z) {
  const r = [x - dipolo.posicao[0], y - dipolo.posicao[1], z - dipolo.posicao[2]];
  const distancia = Math.hypot(...r);
  const unitario = r.map((valor) => valor / distancia);
  const mr = dipolo.momento.reduce((soma, valor, i) => soma + valor * unitario[i], 0);
  // μ0/(4π) = 1e-7; 1 T = 1e6 µT; 1/r³ com r em mm: 1e9/r³.
  return dipolo.momento.map((valor, i) => (1e8 * (3 * mr * unitario[i] - valor)) / distancia ** 3);
}

function range({ de, ate, passo }) {
  const valores = [];
  for (let valor = de; valor <= ate + 1e-9; valor += passo) valores.push(valor);
  return valores;
}

export function generateExampleCsv(opcoes = EXEMPLO) {
  const aleatorio = createRandom(opcoes.semente);
  const gaussiano = createGaussian(aleatorio);
  const bobina = createModel(opcoes);
  const xs = range(opcoes.grade.x);
  const ys = range(opcoes.grade.y);
  const n = opcoes.leiturasPorPonto;

  function fundo(x, y, z) {
    const dipolo = dipoleField(opcoes.dipolo, x, y, z);
    return [0, 1, 2].map((eixo) => opcoes.terra[eixo] + dipolo[eixo] + opcoes.desvioDoSensor[eixo]);
  }

  function measure(passada, tipo, tPassada, tSessao, [x, y, z]) {
    const base = fundo(x, y, z);
    const campoBobina = passada === "ligada" ? bobina(x, y, z) : [0, 0, 0];
    const medias = [];
    const desvios = [];
    for (let eixo = 0; eixo < 3; eixo += 1) {
      const verdadeiro = base[eixo] + campoBobina[eixo] + (opcoes.derivaPorHora[eixo] * tSessao) / 3600;
      const leituras = Array.from({ length: n }, () => verdadeiro + opcoes.ruidoPorLeitura * gaussiano());
      const media = leituras.reduce((soma, valor) => soma + valor, 0) / n;
      const variancia = leituras.reduce((soma, valor) => soma + (valor - media) ** 2, 0) / (n - 1);
      medias.push(media);
      desvios.push(Math.sqrt(variancia));
    }
    return [
      passada, tipo, tPassada.toFixed(1), x.toFixed(1), y.toFixed(1), z.toFixed(1),
      ...medias.map((valor) => valor.toFixed(2)),
      ...desvios.map((valor) => valor.toFixed(2)),
      n,
    ].join(",");
  }

  const linhas = [
    `# formato: ${FORMATO}`,
    `# geometria: ${opcoes.geometria}`,
    `# dimensao_mm: ${opcoes.dimensaoMm}`,
    `# voltas: ${opcoes.voltas}`,
    `# corrente_A: ${opcoes.correnteA.toFixed(3)}`,
    `# leituras_por_ponto: ${n}`,
    "# data: 2026-11-24T14:30:00-03:00",
    `# observacao: dados sintéticos gerados no navegador; valores verdadeiros k = ${opcoes.k}, centro da bobina em (${opcoes.x0}; ${opcoes.y0}; ${opcoes.z0}) mm`,
    "passada,tipo,t_s,x_mm,y_mm,z_mm,bx_uT,by_uT,bz_uT,sx_uT,sy_uT,sz_uT,n",
  ];

  let tSessao = 0;
  for (const passada of ["desligada", "ligada"]) {
    let tPassada = 0;
    const avancar = (segundos) => {
      tPassada += segundos;
      tSessao += segundos;
    };
    for (const z of opcoes.grade.z) {
      ys.forEach((y, indiceDaLinha) => {
        linhas.push(measure(passada, "ref", tPassada, tSessao, opcoes.referencia));
        avancar(opcoes.segundosPorReferencia);
        const ordem = indiceDaLinha % 2 === 0 ? xs : [...xs].reverse();
        for (const x of ordem) {
          linhas.push(measure(passada, "ponto", tPassada, tSessao, [x, y, z]));
          avancar(opcoes.segundosPorPonto);
        }
      });
    }
    linhas.push(measure(passada, "ref", tPassada, tSessao, opcoes.referencia));
    tSessao += opcoes.intervaloEntrePassadas;
  }
  return `${linhas.join("\n")}\n`;
}
