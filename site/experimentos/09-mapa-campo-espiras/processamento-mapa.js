// Pareamento das passadas, correção de deriva e ΔB = ligada − desligada.
// Posições em mm, campos em µT. Os vetores são arrays [x, y, z].

export const GRANDEZAS = {
  delta: "ΔB medido (ligada − desligada)",
  ligada: "Passada ligada",
  desligada: "Passada desligada (fundo)",
  modelo: "Modelo de Biot-Savart",
  residuo: "Resíduo (medido − modelo)",
};

export const COMPONENTES = { bx: "Bx", by: "By", bz: "Bz", modulo: "|B|" };

// Pareamento por posição arredondada a 0,1 mm.
export function roundPosition(valor) {
  return Math.round(valor * 10) / 10;
}

export function positionKey(x, y, z) {
  return `${Math.round(x * 10)}|${Math.round(y * 10)}|${Math.round(z * 10)}`;
}

function meanAndUncertainty(linha) {
  const raiz = Math.sqrt(linha.n);
  return {
    b: [linha.bx_uT, linha.by_uT, linha.bz_uT],
    u: [linha.sx_uT / raiz, linha.sy_uT / raiz, linha.sz_uT / raiz],
  };
}

// Separa pontos da grade e referências e junta as duas passadas de cada posição.
export function pairPasses(linhas) {
  const porPosicao = new Map();
  const referencias = { ligada: [], desligada: [] };
  const repetidos = [];

  for (const linha of linhas) {
    if (linha.tipo === "ref") {
      referencias[linha.passada].push(linha);
      continue;
    }
    const chave = positionKey(linha.x_mm, linha.y_mm, linha.z_mm);
    let ponto = porPosicao.get(chave);
    if (!ponto) {
      ponto = {
        chave,
        x: roundPosition(linha.x_mm),
        y: roundPosition(linha.y_mm),
        z: roundPosition(linha.z_mm),
        ligada: null,
        desligada: null,
      };
      porPosicao.set(chave, ponto);
    }
    if (ponto[linha.passada]) {
      repetidos.push(linha);
      continue;
    }
    ponto[linha.passada] = linha;
  }

  const posicoes = [...porPosicao.values()];
  return {
    posicoes,
    pares: posicoes.filter((ponto) => ponto.ligada && ponto.desligada),
    soLigada: posicoes.filter((ponto) => ponto.ligada && !ponto.desligada),
    soDesligada: posicoes.filter((ponto) => !ponto.ligada && ponto.desligada),
    referencias,
    repetidos,
  };
}

function uniqueSorted(valores) {
  return [...new Set(valores.map(roundPosition))].sort((a, b) => a - b);
}

function uniformStep(valores) {
  if (valores.length < 2) return null;
  const passo = valores[1] - valores[0];
  const uniforme = valores.every(
    (valor, indice) => indice === 0 || Math.abs(valor - valores[indice - 1] - passo) < 0.051,
  );
  return uniforme ? roundPosition(passo) : null;
}

export function detectGrid(posicoes) {
  const x = uniqueSorted(posicoes.map((ponto) => ponto.x));
  const y = uniqueSorted(posicoes.map((ponto) => ponto.y));
  const z = uniqueSorted(posicoes.map((ponto) => ponto.z));
  return {
    x, y, z,
    passo: { x: uniformStep(x), y: uniformStep(y), z: uniformStep(z) },
    nos: x.length * y.length * z.length,
  };
}

// Trilha temporal do ponto de referência de uma passada: interpolação linear em t,
// constante antes da primeira e depois da última visita.
export function referenceTrack(referencias) {
  if (referencias.length === 0) return null;
  const visitas = [...referencias]
    .sort((a, b) => a.t_s - b.t_s)
    .map((linha) => ({ t: linha.t_s, ...meanAndUncertainty(linha) }));
  const media = [0, 1, 2].map(
    (eixo) => visitas.reduce((soma, visita) => soma + visita.b[eixo], 0) / visitas.length,
  );

  function at(t) {
    if (t <= visitas[0].t) return visitas[0];
    const ultima = visitas[visitas.length - 1];
    if (t >= ultima.t) return ultima;
    let i = 1;
    while (visitas[i].t < t) i += 1;
    const antes = visitas[i - 1];
    const depois = visitas[i];
    const w = depois.t === antes.t ? 0 : (t - antes.t) / (depois.t - antes.t);
    return {
      t,
      b: [0, 1, 2].map((eixo) => (1 - w) * antes.b[eixo] + w * depois.b[eixo]),
      u: [0, 1, 2].map((eixo) => Math.hypot((1 - w) * antes.u[eixo], w * depois.u[eixo])),
    };
  }

  return { visitas, media, at };
}

function mostCommonPosition(referencias) {
  const contagem = new Map();
  for (const linha of referencias) {
    const chave = positionKey(linha.x_mm, linha.y_mm, linha.z_mm);
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  let melhor = null;
  for (const [chave, n] of contagem) {
    if (!melhor || n > melhor.n) melhor = { chave, n };
  }
  return { chave: melhor?.chave ?? null, posicoes: contagem.size };
}

// Prepara a correção de deriva das duas passadas.
// campoDaBobina(x, y, z) dá o campo previsto da bobina (µT); serve para descontar,
// no salto entre passadas, o campo da bobina no próprio ponto de referência.
export function buildDriftCorrection(referencias, campoDaBobina) {
  const avisos = [];
  const trilhas = {};
  const chaves = {};
  for (const passada of ["desligada", "ligada"]) {
    const lista = referencias[passada];
    if (lista.length === 0) {
      avisos.push(`A passada ${passada} não tem pontos de referência: a deriva dela não foi corrigida.`);
      continue;
    }
    const { chave, posicoes } = mostCommonPosition(lista);
    if (posicoes > 1) {
      avisos.push(`A passada ${passada} tem pontos de referência em ${posicoes} posições; só a mais visitada foi usada.`);
    }
    chaves[passada] = chave;
    trilhas[passada] = referenceTrack(
      lista.filter((linha) => positionKey(linha.x_mm, linha.y_mm, linha.z_mm) === chave),
    );
    if (trilhas[passada].visitas.length < 2) {
      avisos.push(`A passada ${passada} tem uma só visita ao ponto de referência: só o deslocamento de zero foi corrigido, não a deriva ao longo do tempo.`);
    }
  }

  let salto = [0, 0, 0];
  let referencia = null;
  if (trilhas.ligada && trilhas.desligada) {
    if (chaves.ligada === chaves.desligada) {
      const [rx, ry, rz] = chaves.ligada.split("|").map((valor) => Number(valor) / 10);
      referencia = { x: rx, y: ry, z: rz };
      const bobina = campoDaBobina ? campoDaBobina(rx, ry, rz) : [0, 0, 0];
      if (!campoDaBobina) {
        avisos.push("Sem modelo da bobina: o campo dela no ponto de referência não foi descontado do salto entre passadas.");
      }
      salto = [0, 1, 2].map(
        (eixo) => trilhas.ligada.media[eixo] - trilhas.desligada.media[eixo] - bobina[eixo],
      );
    } else {
      avisos.push("O ponto de referência não está na mesma posição nas duas passadas: só a deriva dentro de cada passada foi corrigida.");
    }
  }
  return { trilhas, salto, referencia, avisos };
}

function correctedReading(linha, trilha) {
  const leitura = meanAndUncertainty(linha);
  if (!trilha) return leitura;
  const ref = trilha.at(linha.t_s);
  return {
    b: [0, 1, 2].map((eixo) => leitura.b[eixo] - (ref.b[eixo] - trilha.media[eixo])),
    u: [0, 1, 2].map((eixo) => Math.hypot(leitura.u[eixo], ref.u[eixo])),
  };
}

function median(valores) {
  if (valores.length === 0) return NaN;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

// Processa os dados juntados: { linhas }.
// opcoes: { corrigirDeriva, campoDaBobina }.
export function processMap(linhas, opcoes = {}) {
  const pareamento = pairPasses(linhas);
  const grade = detectGrid(pareamento.posicoes);
  const deriva = opcoes.corrigirDeriva
    ? buildDriftCorrection(pareamento.referencias, opcoes.campoDaBobina)
    : { trilhas: {}, salto: [0, 0, 0], referencia: null, avisos: [] };

  const pontos = pareamento.pares.map((par) => {
    const ligada = correctedReading(par.ligada, deriva.trilhas.ligada);
    const desligada = correctedReading(par.desligada, deriva.trilhas.desligada);
    return {
      chave: par.chave,
      x: par.x,
      y: par.y,
      z: par.z,
      ligada,
      desligada,
      delta: {
        b: [0, 1, 2].map((eixo) => ligada.b[eixo] - desligada.b[eixo] - deriva.salto[eixo]),
        u: [0, 1, 2].map((eixo) => Math.hypot(ligada.u[eixo], desligada.u[eixo])),
      },
      modelo: null,
    };
  });

  const linhasDaGrade = linhas.filter((linha) => linha.tipo === "ponto");
  const ruidoPorLeitura = median(
    linhasDaGrade.flatMap((linha) => [linha.sx_uT, linha.sy_uT, linha.sz_uT]),
  );
  const incertezaTipica = median(pontos.flatMap((ponto) => ponto.delta.u));

  return {
    pontos,
    porChave: new Map(pontos.map((ponto) => [ponto.chave, ponto])),
    grade,
    pareamento,
    deriva,
    ruido: { porLeitura: ruidoPorLeitura, deltaB: incertezaTipica },
  };
}

export function attachModel(pontos, campoDoModelo) {
  for (const ponto of pontos) {
    ponto.modelo = campoDoModelo ? campoDoModelo(ponto.x, ponto.y, ponto.z) : null;
  }
}

// Valor vetorial de uma grandeza num ponto: { b, u } ou null.
export function quantityAt(ponto, grandeza) {
  if (grandeza === "delta") return ponto.delta;
  if (grandeza === "ligada") return ponto.ligada;
  if (grandeza === "desligada") return ponto.desligada;
  if (!ponto.modelo) return null;
  if (grandeza === "modelo") return { b: ponto.modelo, u: [0, 0, 0] };
  if (grandeza === "residuo") {
    return {
      b: [0, 1, 2].map((eixo) => ponto.delta.b[eixo] - ponto.modelo[eixo]),
      u: ponto.delta.u,
    };
  }
  return null;
}

// Componente escalar de um vetor com incerteza.
export function componentOf(vetor, componente) {
  if (!vetor) return null;
  const indice = { bx: 0, by: 1, bz: 2 }[componente];
  if (indice !== undefined) return { valor: vetor.b[indice], u: vetor.u[indice] };
  const modulo = Math.hypot(...vetor.b);
  const u = modulo > 0
    ? Math.sqrt(vetor.b.reduce((soma, b, eixo) => soma + (b * vetor.u[eixo]) ** 2, 0)) / modulo
    : Math.hypot(...vetor.u);
  return { valor: modulo, u };
}

// Eixos de cada plano de corte: [horizontal, vertical, fixo].
export const PLANOS = {
  xy: ["x", "y", "z"],
  xz: ["x", "z", "y"],
  yz: ["y", "z", "x"],
};

export function sliceOf(processado, plano, valorFixo) {
  const [h, v, fixo] = PLANOS[plano];
  const eixoH = processado.grade[h];
  const eixoV = processado.grade[v];
  const celulas = eixoV.map((valorV) =>
    eixoH.map((valorH) => {
      const posicao = { [h]: valorH, [v]: valorV, [fixo]: valorFixo };
      return processado.porChave.get(positionKey(posicao.x, posicao.y, posicao.z)) ?? null;
    }),
  );
  return { plano, eixos: { h, v, fixo }, valorFixo, eixoH, eixoV, celulas };
}

export function profileOf(processado, eixo, fixos) {
  return processado.grade[eixo]
    .map((valor) => {
      const posicao = { ...fixos, [eixo]: valor };
      return processado.porChave.get(positionKey(posicao.x, posicao.y, posicao.z)) ?? null;
    })
    .filter(Boolean);
}
