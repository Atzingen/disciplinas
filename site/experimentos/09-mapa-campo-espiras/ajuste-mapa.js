// Ajuste do modelo de Biot-Savart aos dados: fator de escala k (μ0 medido = k·μ0)
// e posição (x0, y0, z0) do centro da bobina, por mínimos quadrados ponderados
// sobre as três componentes de ΔB.
import { coilPath, pathField } from "./modelo-biot-savart.js";

// Nelder-Mead simples (reflexão, expansão, contração e encolhimento).
export function nelderMead(f, inicio, passos, opcoes = {}) {
  const maxIteracoes = opcoes.maxIteracoes ?? 400;
  const toleranciaX = opcoes.toleranciaX ?? 1e-4;
  const toleranciaF = opcoes.toleranciaF ?? 1e-10;
  const dimensao = inicio.length;
  let avaliacoes = 0;
  const avaliar = (x) => {
    avaliacoes += 1;
    return { x, f: f(x) };
  };

  let simplex = [avaliar([...inicio])];
  for (let i = 0; i < dimensao; i += 1) {
    const vertice = [...inicio];
    vertice[i] += passos[i];
    simplex.push(avaliar(vertice));
  }

  let iteracoes = 0;
  let convergiu = false;
  while (iteracoes < maxIteracoes) {
    simplex.sort((a, b) => a.f - b.f);
    const melhor = simplex[0];
    const pior = simplex[dimensao];
    const espalhamentoX = Math.max(
      ...simplex.slice(1).flatMap((vertice) => vertice.x.map((valor, i) => Math.abs(valor - melhor.x[i]))),
    );
    if (espalhamentoX < toleranciaX && Math.abs(pior.f - melhor.f) <= toleranciaF * (Math.abs(melhor.f) + toleranciaF)) {
      convergiu = true;
      break;
    }
    iteracoes += 1;

    const centroide = new Array(dimensao).fill(0);
    for (const vertice of simplex.slice(0, dimensao)) {
      vertice.x.forEach((valor, i) => { centroide[i] += valor / dimensao; });
    }
    const pontoAo = (fator) => centroide.map((valor, i) => valor + fator * (pior.x[i] - valor));

    const refletido = avaliar(pontoAo(-1));
    if (refletido.f < melhor.f) {
      const expandido = avaliar(pontoAo(-2));
      simplex[dimensao] = expandido.f < refletido.f ? expandido : refletido;
      continue;
    }
    if (refletido.f < simplex[dimensao - 1].f) {
      simplex[dimensao] = refletido;
      continue;
    }
    const contraido = refletido.f < pior.f
      ? avaliar(pontoAo(-0.5))
      : avaliar(pontoAo(0.5));
    if (contraido.f < Math.min(refletido.f, pior.f)) {
      simplex[dimensao] = contraido;
      continue;
    }
    simplex = [melhor, ...simplex.slice(1).map((vertice) =>
      avaliar(vertice.x.map((valor, i) => melhor.x[i] + 0.5 * (valor - melhor.x[i]))),
    )];
  }
  simplex.sort((a, b) => a.f - b.f);
  return { x: simplex[0].x, f: simplex[0].f, iteracoes, avaliacoes, convergiu };
}

function invertMatrix(matriz) {
  const n = matriz.length;
  const a = matriz.map((linha, i) => [...linha, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let coluna = 0; coluna < n; coluna += 1) {
    let pivo = coluna;
    for (let linha = coluna + 1; linha < n; linha += 1) {
      if (Math.abs(a[linha][coluna]) > Math.abs(a[pivo][coluna])) pivo = linha;
    }
    if (Math.abs(a[pivo][coluna]) < 1e-300) return null;
    [a[coluna], a[pivo]] = [a[pivo], a[coluna]];
    const divisor = a[coluna][coluna];
    for (let j = 0; j < 2 * n; j += 1) a[coluna][j] /= divisor;
    for (let linha = 0; linha < n; linha += 1) {
      if (linha === coluna) continue;
      const fator = a[linha][coluna];
      for (let j = 0; j < 2 * n; j += 1) a[linha][j] -= fator * a[coluna][j];
    }
  }
  return a.map((linha) => linha.slice(n));
}

// pontos: [{ x, y, z, delta: { b, u } }]. parametros: geometria, dimensaoMm,
// voltas, correnteA e o chute inicial de x0, y0, z0 (mm).
export function fitCoil(pontos, parametros) {
  const vertices = coilPath(parametros.geometria, parametros.dimensaoMm);
  if (!vertices) throw new Error("Geometria sem modelo: não há o que ajustar.");
  if (pontos.length < 2) throw new Error("São necessários pelo menos dois pontos para o ajuste.");
  const escala = parametros.voltas * parametros.correnteA;
  const n = pontos.length * 3;
  const medidos = new Float64Array(n);
  const raizDoPeso = new Float64Array(n);
  pontos.forEach((ponto, i) => {
    for (let eixo = 0; eixo < 3; eixo += 1) {
      medidos[3 * i + eixo] = ponto.delta.b[eixo];
      raizDoPeso[3 * i + eixo] = 1 / Math.max(ponto.delta.u[eixo], 1e-3);
    }
  });

  // Campo do modelo com k = 1 e centro em c, já ponderado.
  function weightedModel(c) {
    const m = new Float64Array(n);
    pontos.forEach((ponto, i) => {
      const campo = pathField(vertices, ponto.x - c[0], ponto.y - c[1], ponto.z - c[2]);
      for (let eixo = 0; eixo < 3; eixo += 1) {
        m[3 * i + eixo] = campo[eixo] * escala * raizDoPeso[3 * i + eixo];
      }
    });
    return m;
  }

  // Para c fixo, o k ótimo tem solução fechada: o modelo é linear em k.
  function bestK(m) {
    let mm = 0;
    let md = 0;
    for (let i = 0; i < n; i += 1) {
      mm += m[i] * m[i];
      md += m[i] * medidos[i] * raizDoPeso[i];
    }
    return mm > 0 ? md / mm : 0;
  }

  function chi2(c) {
    const m = weightedModel(c);
    const k = bestK(m);
    let soma = 0;
    for (let i = 0; i < n; i += 1) {
      const r = medidos[i] * raizDoPeso[i] - k * m[i];
      soma += r * r;
    }
    return soma;
  }

  const inicio = [parametros.x0 ?? 0, parametros.y0 ?? 0, parametros.z0 ?? 0];
  const busca = nelderMead(chi2, inicio, [2, 2, 2], { toleranciaX: 1e-3 });
  const c = busca.x;
  const mOtimo = weightedModel(c);
  const k = bestK(mOtimo);

  let somaQuadrados = 0;
  for (let i = 0; i < n; i += 1) {
    const r = medidos[i] - (k * mOtimo[i]) / raizDoPeso[i];
    somaQuadrados += r * r;
  }
  const graus = n - 4;
  const chi2Reduzido = graus > 0 ? busca.f / graus : NaN;

  // Jacobiano dos resíduos ponderados em (k, x0, y0, z0); derivadas em c por
  // diferença central. A covariância é escalonada por χ²/ν (incerteza aproximada).
  const h = 0.05;
  const colunas = [Float64Array.from(mOtimo, (valor) => -valor)];
  for (let eixo = 0; eixo < 3; eixo += 1) {
    const mais = [...c];
    const menos = [...c];
    mais[eixo] += h;
    menos[eixo] -= h;
    const mMais = weightedModel(mais);
    const mMenos = weightedModel(menos);
    colunas.push(Float64Array.from(mMais, (valor, i) => (-k * (valor - mMenos[i])) / (2 * h)));
  }
  const jtj = colunas.map((a) => colunas.map((b) => a.reduce((soma, valor, i) => soma + valor * b[i], 0)));
  const inversa = invertMatrix(jtj);
  const fatorDeEscala = Number.isFinite(chi2Reduzido) ? chi2Reduzido : 1;
  const incertezas = inversa
    ? inversa.map((linha, i) => Math.sqrt(Math.max(linha[i] * fatorDeEscala, 0)))
    : [NaN, NaN, NaN, NaN];

  return {
    k,
    x0: c[0],
    y0: c[1],
    z0: c[2],
    u: { k: incertezas[0], x0: incertezas[1], y0: incertezas[2], z0: incertezas[3] },
    rms: Math.sqrt(somaQuadrados / n),
    chi2: busca.f,
    graus,
    chi2Reduzido,
    pontos: pontos.length,
    avaliacoes: busca.avaliacoes + 7,
    convergiu: busca.convergiu,
  };
}
