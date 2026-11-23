// Plano da varredura, conversão para as coordenadas da impressora e execução de uma passada.
//
// Coordenadas da bobina (as do arquivo): origem no centro da bobina, z = altura do sensor acima do plano dela,
// eixos paralelos aos da impressora. A calibração guarda a posição da impressora (X0, Y0, Z0) em que o sensor
// estava sobre o centro da bobina a uma altura h0 medida com régua.

import { lerPosicao } from "./coleta-marlin.js";

export const CABECALHO_CSV = "passada,tipo,t_s,x_mm,y_mm,z_mm,bx_uT,by_uT,bz_uT,sx_uT,sy_uT,sz_uT,n";

const TOLERANCIA_DE_POSICAO_MM = 0.05;

export function valoresDaFaixa({ min, max, passo }) {
  if (![min, max, passo].every(Number.isFinite)) throw new Error("Faixa inválida: preencha mínimo, máximo e passo com números.");
  if (!(passo > 0) || max < min) throw new Error("Faixa inválida: o passo precisa ser positivo e o máximo maior que o mínimo.");
  const quantidade = Math.floor((max - min) / passo + 1e-6) + 1;
  return Array.from({ length: quantidade }, (_, i) => Number((min + i * passo).toFixed(3)));
}

// Linhas em zigue-zague para a cabeça não voltar ao começo a cada linha. O ponto de referência é medido no
// começo de uma linha a cada `referenciaACadaLinhas` (e no fim da passada), para acompanhar a deriva lenta do
// sensor; visitar a cada linha custa caro quando a referência fica alta, porque o eixo Z é lento.
export function planejarVarredura({ x, y, alturas, referencia, referenciaACadaLinhas = 1 }) {
  const xs = valoresDaFaixa(x);
  const ys = valoresDaFaixa(y);
  if (!alturas.length || !alturas.every((z) => Number.isFinite(z) && z > 0)) {
    throw new Error("Informe pelo menos uma altura z, em mm, maior que zero.");
  }
  if (referencia && ![referencia.x, referencia.y, referencia.z].every(Number.isFinite)) {
    throw new Error("Preencha x, y e z do ponto de referência.");
  }
  if (!(Number.isInteger(referenciaACadaLinhas) && referenciaACadaLinhas >= 1)) {
    throw new Error("A referência precisa ser visitada a cada 1 ou mais linhas (número inteiro).");
  }
  const zs = [...new Set(alturas)].sort((a, b) => a - b);
  const passos = [];
  let linha = 0;
  for (const z of zs) {
    for (const yLinha of ys) {
      if (referencia && linha % referenciaACadaLinhas === 0) passos.push({ tipo: "ref", ...referencia });
      const ordem = linha % 2 === 0 ? xs : [...xs].reverse();
      for (const xPonto of ordem) passos.push({ tipo: "ponto", x: xPonto, y: yLinha, z });
      linha++;
    }
  }
  if (referencia) passos.push({ tipo: "ref", ...referencia });
  return passos;
}

export function paraImpressora({ x, y, z }, { X0, Y0, Z0, h0 }) {
  return { X: X0 + x, Y: Y0 + y, Z: Z0 + (z - h0) };
}

export function conferirLimites(passos, calibracao, { mesa = { x: 240, y: 240, z: 300 }, alturaMinima = 15 } = {}) {
  const problemas = [];
  for (const passo of passos) {
    const { X, Y, Z } = paraImpressora(passo, calibracao);
    if (![X, Y, Z].every(Number.isFinite)) {
      problemas.push("posição que não é número (algum campo vazio)");
      continue;
    }
    if (passo.z < alturaMinima) problemas.push(`altura ${passo.z} mm abaixo do mínimo de ${alturaMinima} mm`);
    if (X < 0 || X > mesa.x) problemas.push(`X = ${X.toFixed(1)} mm fora do curso (0 a ${mesa.x})`);
    if (Y < 0 || Y > mesa.y) problemas.push(`Y = ${Y.toFixed(1)} mm fora do curso (0 a ${mesa.y})`);
    if (Z < 0 || Z > mesa.z) problemas.push(`Z = ${Z.toFixed(1)} mm fora do curso (0 a ${mesa.z})`);
  }
  return [...new Set(problemas)];
}

// Os quatro cantos da grade de fato percorrida, na menor altura: os menores e maiores x e y dos pontos. Com
// uma faixa que não é múltipla do passo, o último valor fica antes do máximo digitado (de -110 a 115 de 10 em
// 10, a grade termina em 110), e o canto digitado pode cair fora do curso da impressora.
export function cantosDaGrade(passos) {
  const pontos = passos.filter((passo) => passo.tipo === "ponto");
  const xs = pontos.map((ponto) => ponto.x);
  const ys = pontos.map((ponto) => ponto.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const z = Math.min(...pontos.map((ponto) => ponto.z));
  return [
    { tipo: "ponto", x: xMin, y: yMin, z },
    { tipo: "ponto", x: xMax, y: yMin, z },
    { tipo: "ponto", x: xMax, y: yMax, z },
    { tipo: "ponto", x: xMin, y: yMax, z },
  ];
}

// mapeamento: para cada eixo da caneta, o eixo da impressora para onde ele aponta, com sinal.
// Exemplo: { frente: "+Y", esquerda: "-X", cima: "+Z" }.
export function paraEixosDaImpressora(medida, mapeamento) {
  const destino = {};
  for (const [eixoCaneta, chaveDesvio] of [["frente", "sFrente"], ["esquerda", "sEsquerda"], ["cima", "sCima"]]) {
    const texto = mapeamento[eixoCaneta];
    const encontrado = /^([+-])([XYZ])$/.exec(texto ?? "");
    if (!encontrado) throw new Error(`Eixo da caneta "${eixoCaneta}" sem direção válida (use +X, -Y, ...).`);
    const [, sinal, eixo] = encontrado;
    if (destino[eixo]) throw new Error(`Dois eixos da caneta apontam para ${eixo}.`);
    destino[eixo] = { valor: (sinal === "-" ? -1 : 1) * medida[eixoCaneta], desvio: medida[chaveDesvio] };
  }
  return {
    bx: destino.X.valor, by: destino.Y.valor, bz: destino.Z.valor,
    sx: destino.X.desvio, sy: destino.Y.desvio, sz: destino.Z.desvio,
  };
}

// O Marlin limita a velocidade do Z (poucos mm/s em impressora cartesiana): o trecho dura o maior dos dois tempos.
export function estimarDuracao(passos, { velocidadeMmS = 50, velocidadeZMmS = 5, segundosPorMedida = 1.2, pausaS = 0.3 } = {}) {
  let total = 0;
  let anterior = null;
  for (const passo of passos) {
    if (anterior) {
      total += Math.max(
        Math.hypot(passo.x - anterior.x, passo.y - anterior.y) / velocidadeMmS,
        Math.abs(passo.z - anterior.z) / velocidadeZMmS,
      );
    }
    total += segundosPorMedida + pausaS + 0.15;
    anterior = passo;
  }
  return total;
}

export function cabecalhoCsv(metadados) {
  const linhas = ["# formato: mapa-campo v1"];
  for (const [chave, valor] of Object.entries(metadados)) {
    if (valor !== undefined && valor !== null && valor !== "") linhas.push(`# ${chave}: ${valor}`);
  }
  linhas.push(CABECALHO_CSV);
  return `${linhas.join("\n")}\n`;
}

export function linhaCsv(registro) {
  const f = (valor, casas) => Number(valor).toFixed(casas);
  return [
    registro.passada, registro.tipo, f(registro.t_s, 1),
    f(registro.x, 1), f(registro.y, 1), f(registro.z, 1),
    f(registro.bx, 3), f(registro.by, 3), f(registro.bz, 3),
    f(registro.sx, 3), f(registro.sy, 3), f(registro.sz, 3),
    registro.n,
  ].join(",");
}

export async function conferirPosicao(marlin, alvo) {
  const posicao = lerPosicao(await marlin.enviar("M114"));
  const fora = !posicao || Math.abs(posicao.x - alvo.X) > TOLERANCIA_DE_POSICAO_MM ||
    Math.abs(posicao.y - alvo.Y) > TOLERANCIA_DE_POSICAO_MM || Math.abs(posicao.z - alvo.Z) > TOLERANCIA_DE_POSICAO_MM;
  if (fora) {
    const onde = posicao ? `X ${posicao.x}, Y ${posicao.y}, Z ${posicao.z}` : "posição desconhecida";
    throw new Error(`A impressora não foi para X ${alvo.X.toFixed(2)}, Y ${alvo.Y.toFixed(2)}, Z ${alvo.Z.toFixed(2)} ` +
      `(está em ${onde}). Ela pode ter perdido o home: não refaça o home com a bobina na mesa.`);
  }
}

// Executa a passada a partir de `inicio`. Cada ponto: anda, espera o movimento acabar (M400), espera a
// vibração passar (G4) e mede. Devolve onde parou, para retomar depois. Ao retomar, passe o mesmo
// `inicioDaPassadaMs` para o t_s continuar contando desde o começo da passada (a correção de deriva usa ele).
// O primeiro movimento sobe antes de andar no plano e só desce no fim, porque a cabeça pode estar em
// qualquer lugar (por exemplo baixa, perto da bobina, depois de uma pausa e de movimento manual). A posição
// é conferida pelo M114 no primeiro ponto e em cada visita à referência: movimento recusado pelo firmware
// interrompe a passada em vez de medir no lugar errado.
export async function executarPassada({
  passos, inicio = 0, passada, calibracao, mapeamento, marlin, sensor,
  leituras = 16, pausaMs = 300, velocidadeMmMin = 3000, relogio = () => Date.now(), inicioDaPassadaMs,
  aoMedir = () => {}, controle = { parar: () => false, esperarSePausado: async () => {} },
}) {
  const t0 = inicioDaPassadaMs ?? relogio();
  await marlin.enviar("G90");
  for (let i = inicio; i < passos.length; i++) {
    // Parada conferida antes e depois da pausa: com Parar e depois Pausar durante uma medida, esperar a
    // pausa primeiro deixaria a passada presa esperando um "Continuar" que não vem.
    if (controle.parar()) return { estado: "parada", proximo: i };
    await controle.esperarSePausado();
    if (controle.parar()) return { estado: "parada", proximo: i };
    const passo = passos[i];
    const alvo = paraImpressora(passo, calibracao);
    const { X, Y, Z } = alvo;
    if (i === inicio) {
      await marlin.enviar("M400");
      const atual = lerPosicao(await marlin.enviar("M114"));
      const zSeguro = Math.max(Z, atual?.z ?? Z);
      await marlin.enviar(`G1 Z${zSeguro.toFixed(2)} F${velocidadeMmMin}`);
      await marlin.enviar(`G1 X${X.toFixed(2)} Y${Y.toFixed(2)} F${velocidadeMmMin}`);
    }
    await marlin.enviar(`G1 X${X.toFixed(2)} Y${Y.toFixed(2)} Z${Z.toFixed(2)} F${velocidadeMmMin}`);
    await marlin.enviar("M400");
    if (i === inicio || passo.tipo === "ref") await conferirPosicao(marlin, alvo);
    if (pausaMs > 0) await marlin.enviar(`G4 P${pausaMs}`);
    const medida = await sensor.medir(leituras);
    const campo = paraEixosDaImpressora(medida, mapeamento);
    aoMedir({ passada, tipo: passo.tipo, t_s: (relogio() - t0) / 1000, x: passo.x, y: passo.y, z: passo.z, ...campo, n: medida.n }, i);
  }
  return { estado: "concluida", proximo: passos.length };
}
