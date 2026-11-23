// Campo de bobinas planas por Biot-Savart, somando segmentos retos.
// Unidades: posições em mm e campo em µT. A bobina fica no plano z = 0,
// centrada na origem; a corrente positiva circula no sentido anti-horário
// visto de cima (+z), de modo que Bz > 0 no centro.

export const GEOMETRIAS_COM_MODELO = ["circulo", "quadrado", "u"];
export const LADOS_DO_CIRCULO = 360;

// μ0/(4π) = 1e-7 T·m/A. Com comprimentos em mm, o termo geométrico do
// segmento sai em 1/mm = 1000/m; convertendo T para µT: 1e-7 · 1e3 · 1e6 = 100.
const FATOR_UT_MM = 100;

export function coilPath(geometria, dimensaoMm, ladosDoCirculo = LADOS_DO_CIRCULO) {
  const meio = dimensaoMm / 2;
  if (geometria === "circulo") {
    const vertices = [];
    for (let i = 0; i <= ladosDoCirculo; i += 1) {
      const angulo = (2 * Math.PI * i) / ladosDoCirculo;
      vertices.push([meio * Math.cos(angulo), meio * Math.sin(angulo), 0]);
    }
    return vertices;
  }
  if (geometria === "quadrado") {
    return [
      [-meio, -meio, 0],
      [meio, -meio, 0],
      [meio, meio, 0],
      [-meio, meio, 0],
      [-meio, -meio, 0],
    ];
  }
  if (geometria === "u") {
    // Três lados do quadrado; o lado aberto (y = −meio) fica voltado para −Y.
    return [
      [meio, -meio, 0],
      [meio, meio, 0],
      [-meio, meio, 0],
      [-meio, -meio, 0],
    ];
  }
  return null;
}

// Campo de um segmento reto (início → fim) no ponto P, por unidade de μ0·I/(4π).
// Com a = início − P e b = fim − P:
// B ∝ (a × b)(|a| + |b|) / (|a||b|(|a||b| + a·b)).
function addSegmentField(ax, ay, az, bx, by, bz, soma) {
  const na = Math.sqrt(ax * ax + ay * ay + az * az);
  const nb = Math.sqrt(bx * bx + by * by + bz * bz);
  const denominador = na * nb * (na * nb + ax * bx + ay * by + az * bz);
  if (denominador < 1e-12) return;
  const fator = (na + nb) / denominador;
  soma[0] += (ay * bz - az * by) * fator;
  soma[1] += (az * bx - ax * bz) * fator;
  soma[2] += (ax * by - ay * bx) * fator;
}

export function segmentField(inicio, fim, ponto) {
  const soma = [0, 0, 0];
  addSegmentField(
    inicio[0] - ponto[0], inicio[1] - ponto[1], inicio[2] - ponto[2],
    fim[0] - ponto[0], fim[1] - ponto[1], fim[2] - ponto[2],
    soma,
  );
  return soma.map((valor) => valor * FATOR_UT_MM);
}

// Campo em µT por ampère-volta de um caminho de vértices, no ponto (x, y, z) em mm.
export function pathField(vertices, x, y, z) {
  const soma = [0, 0, 0];
  for (let i = 0; i < vertices.length - 1; i += 1) {
    const inicio = vertices[i];
    const fim = vertices[i + 1];
    addSegmentField(
      inicio[0] - x, inicio[1] - y, inicio[2] - z,
      fim[0] - x, fim[1] - y, fim[2] - z,
      soma,
    );
  }
  return [soma[0] * FATOR_UT_MM, soma[1] * FATOR_UT_MM, soma[2] * FATOR_UT_MM];
}

// Parâmetros do modelo completo:
// { geometria, dimensaoMm, voltas, correnteA, k, x0, y0, z0 }.
// k multiplica μ0; (x0, y0, z0) é a posição do centro da bobina em mm.
export function createModel(parametros) {
  const vertices = coilPath(parametros.geometria, parametros.dimensaoMm);
  if (!vertices) return null;
  const escala = (parametros.k ?? 1) * parametros.voltas * parametros.correnteA;
  const x0 = parametros.x0 ?? 0;
  const y0 = parametros.y0 ?? 0;
  const z0 = parametros.z0 ?? 0;
  return function campoDoModelo(x, y, z) {
    const campo = pathField(vertices, x - x0, y - y0, z - z0);
    return [campo[0] * escala, campo[1] * escala, campo[2] * escala];
  };
}

const MU0 = 4e-7 * Math.PI;

// Fórmulas analíticas no eixo (µT), com dimensões em mm.
export function axisFieldCircle(diametroMm, z, voltas = 1, correnteA = 1) {
  const r = diametroMm / 2000;
  const zm = z / 1000;
  return (MU0 * voltas * correnteA * r * r) / (2 * (r * r + zm * zm) ** 1.5) * 1e6;
}

export function axisFieldSquare(ladoMm, z, voltas = 1, correnteA = 1) {
  const a = ladoMm / 1000;
  const zm = z / 1000;
  return (
    (MU0 * voltas * correnteA * a * a) /
    (2 * Math.PI * (zm * zm + (a * a) / 4) * Math.sqrt(zm * zm + (a * a) / 2))
  ) * 1e6;
}
