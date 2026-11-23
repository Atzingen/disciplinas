// Perfil 1D: a grandeza escolhida ao longo de uma reta da grade, com barras de
// incerteza, contra a curva contínua do modelo.
import { formatDecimal } from "../../nucleo/formato.js";
import { COMPONENTES, GRANDEZAS, componentOf, quantityAt } from "./processamento-mapa.js";
import { wrapParts } from "./cortes-2d.js";
import { seriesColors, themeInk } from "./paletas.js";

const MARGEM = { esquerda: 66, direita: 18, base: 50 };
const LEGENDAS = {
  medido: "medido ± incerteza",
  calculado: "calculado nos pontos da grade",
  modelo: "modelo de Biot-Savart",
};

function niceStep(intervalo, alvo = 6) {
  const bruto = intervalo / alvo;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const fracao = bruto / potencia;
  const passo = fracao < 1.5 ? 1 : fracao < 3 ? 2 : fracao < 7 ? 5 : 10;
  return passo * potencia;
}

function linearTicks(min, max) {
  const passo = niceStep(max - min);
  const ticks = [];
  for (let valor = Math.ceil(min / passo) * passo; valor <= max + passo * 1e-9; valor += passo) {
    ticks.push(Math.abs(valor) < passo * 1e-9 ? 0 : valor);
  }
  return { ticks, casas: Math.max(0, -Math.floor(Math.log10(passo))) };
}

function logTicks(min, max) {
  const ticks = [];
  const decadas = Math.log10(max) - Math.log10(min);
  const mantissas = decadas < 2.5 ? [1, 2, 5] : [1];
  for (let expoente = Math.floor(Math.log10(min)); expoente <= Math.ceil(Math.log10(max)); expoente += 1) {
    for (const m of mantissas) {
      const valor = m * 10 ** expoente;
      if (valor >= min && valor <= max) ticks.push(valor);
    }
  }
  return ticks;
}

function formatTick(valor) {
  if (valor === 0) return "0";
  const casas = Math.max(0, Math.min(3, -Math.floor(Math.log10(Math.abs(valor)))));
  return formatDecimal(valor, casas);
}

// opcoes: { grandeza, componente, eixo, fixos, log, modelo (função ou null), destaque }.
// pontos: pontos processados ao longo da reta, já ordenados pelo eixo.
export function drawProfile(canvas, pontos, opcoes) {
  const largura = canvas.clientWidth;
  if (largura < 50) return null;
  const altura = Math.round(Math.min(440, Math.max(310, largura * 0.62)));
  const razao = globalThis.devicePixelRatio || 1;
  canvas.style.height = `${altura}px`;
  canvas.width = Math.round(largura * razao);
  canvas.height = Math.round(altura * razao);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(razao, 0, 0, razao, 0, 0);
  const tinta = themeInk();
  const cores = seriesColors();
  ctx.fillStyle = tinta.fundo;
  ctx.fillRect(0, 0, largura, altura);

  const { eixo, componente, grandeza, log } = opcoes;
  const medidos = pontos
    .map((ponto) => ({ ponto, s: ponto[eixo], valor: componentOf(quantityAt(ponto, grandeza), componente) }))
    .filter((item) => item.valor && Number.isFinite(item.valor.valor));

  const comModelo = Boolean(opcoes.modelo) && (grandeza === "delta" || grandeza === "modelo");
  const curva = [];
  if (comModelo && medidos.length > 0) {
    const inicio = medidos[0].s;
    const fim = medidos[medidos.length - 1].s;
    for (let k = 0; k <= 240; k += 1) {
      const s = inicio + ((fim - inicio) * k) / 240;
      const posicao = { ...opcoes.fixos, [eixo]: s };
      const campo = opcoes.modelo(posicao.x, posicao.y, posicao.z);
      curva.push({ s, valor: componentOf({ b: campo, u: [0, 0, 0] }, componente).valor });
    }
  }

  ctx.fillStyle = tinta.tinta;
  ctx.font = `700 13px ${tinta.fonteTitulo}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const fixos = Object.entries(opcoes.fixos).map(([nome, valor]) => `${nome} = ${formatDecimal(valor, 1)} mm`).join(", ");
  const linhasDoTitulo = wrapParts(ctx, [GRANDEZAS[grandeza], `${COMPONENTES[componente]} ao longo de ${eixo}`, `(${fixos})`], largura - 24);
  linhasDoTitulo.forEach((linha, i) => ctx.fillText(linha, 12, 22 + 17 * i, largura - 24));

  // Com a grandeza "modelo" os pontos são o próprio modelo: calculados, sem incerteza.
  const pontosCalculados = grandeza === "modelo";
  const entradaDosPontos = pontosCalculados ? "calculado" : "medido";

  // Posição das entradas da legenda: na mesma linha quando cabem.
  ctx.font = `12px ${tinta.fonteMono}`;
  const entradas = curva.length > 0 ? [entradaDosPontos, "modelo"] : [entradaDosPontos];
  const posicoesDaLegenda = [];
  let xLegenda = 12;
  let yLegenda = 22 + 17 * linhasDoTitulo.length + 4;
  for (const entrada of entradas) {
    const larguraDaEntrada = 24 + ctx.measureText(LEGENDAS[entrada]).width;
    if (xLegenda > 12 && xLegenda + larguraDaEntrada > largura - 12) {
      xLegenda = 12;
      yLegenda += 18;
    }
    posicoesDaLegenda.push({ entrada, x: xLegenda, y: yLegenda });
    xLegenda += larguraDaEntrada + 18;
  }

  if (medidos.length === 0) {
    ctx.fillStyle = tinta.tintaSuave;
    ctx.font = `13px ${tinta.fonteMono}`;
    ctx.fillText("Nenhum ponto medido nesta reta.", 12, yLegenda + 24);
    return null;
  }

  const transformar = (valor) => (log ? Math.abs(valor) : valor);
  const todos = [
    ...medidos.flatMap((item) => {
      const v = transformar(item.valor.valor);
      return log ? [v, v + item.valor.u] : [v - item.valor.u, v + item.valor.u];
    }),
    ...curva.map((item) => transformar(item.valor)),
  ].filter((valor) => Number.isFinite(valor) && (!log || valor > 0));
  if (todos.length === 0) {
    ctx.fillStyle = tinta.tintaSuave;
    ctx.font = `13px ${tinta.fonteMono}`;
    ctx.fillText("Todos os valores desta reta são zero: não há o que mostrar em escala logarítmica.", 12, yLegenda + 24);
    return null;
  }
  let yMin = Math.min(...todos);
  let yMax = Math.max(...todos);
  if (log) {
    yMin = Math.max(yMin, yMax / 1e5) / 1.4;
    yMax *= 1.4;
  } else {
    if (yMin > 0) yMin = 0;
    if (yMax < 0) yMax = 0;
    const folga = (yMax - yMin || 1) * 0.08;
    yMin -= folga;
    yMax += folga;
  }
  const sMin = medidos[0].s;
  const sMax = medidos[medidos.length - 1].s;
  const sFolga = (sMax - sMin || 10) * 0.04;
  const esquerda = MARGEM.esquerda;
  const direita = largura - MARGEM.direita;
  const topo = yLegenda + 18;
  const base = altura - MARGEM.base;
  const paraX = (s) => esquerda + ((s - (sMin - sFolga)) / (sMax - sMin + 2 * sFolga)) * (direita - esquerda);
  const paraY = (valor) => {
    if (log) {
      const v = Math.max(valor, yMin);
      return base - ((Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * (base - topo);
    }
    return base - ((valor - yMin) / (yMax - yMin)) * (base - topo);
  };

  // Grade e eixos
  ctx.strokeStyle = tinta.linha;
  ctx.lineWidth = 1;
  ctx.fillStyle = tinta.tintaSuave;
  ctx.font = `11px ${tinta.fonteMono}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const ticksY = log ? logTicks(yMin, yMax) : linearTicks(yMin, yMax).ticks;
  for (const valor of ticksY) {
    const y = paraY(valor);
    ctx.beginPath();
    ctx.moveTo(esquerda, y);
    ctx.lineTo(direita, y);
    ctx.stroke();
    ctx.fillText(formatTick(valor), esquerda - 6, y);
  }
  if (!log && yMin < 0 && yMax > 0) {
    ctx.strokeStyle = tinta.linhaForte;
    ctx.beginPath();
    ctx.moveTo(esquerda, paraY(0));
    ctx.lineTo(direita, paraY(0));
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const s of linearTicks(sMin - sFolga, sMax + sFolga).ticks) {
    ctx.fillText(formatTick(s), paraX(s), base + 7);
  }
  ctx.strokeStyle = tinta.linhaForte;
  ctx.strokeRect(esquerda, topo, direita - esquerda, base - topo);
  ctx.fillStyle = tinta.tinta;
  ctx.font = `600 12px ${tinta.fonteMono}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${eixo} (mm)`, (esquerda + direita) / 2, altura - 10);
  ctx.save();
  ctx.translate(16, (topo + base) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(log ? `|${COMPONENTES[componente]}| (μT, escala log)` : `${COMPONENTES[componente]} (μT)`, 0, 0);
  ctx.restore();

  // Curva do modelo
  ctx.save();
  ctx.beginPath();
  ctx.rect(esquerda, topo, direita - esquerda, base - topo);
  ctx.clip();
  if (curva.length > 0) {
    ctx.strokeStyle = cores.modelo;
    ctx.lineWidth = 2;
    ctx.beginPath();
    curva.forEach((item, k) => {
      const x = paraX(item.s);
      const y = paraY(transformar(item.valor));
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // Pontos com barras de incerteza (os calculados não têm barra)
  ctx.strokeStyle = cores.medido;
  ctx.fillStyle = cores.medido;
  ctx.lineWidth = 1.5;
  for (const item of medidos) {
    const x = paraX(item.s);
    const v = transformar(item.valor.valor);
    if (log && !(v > 0)) continue;
    if (!pontosCalculados) {
      const baixo = log ? Math.max(v - item.valor.u, yMin) : v - item.valor.u;
      ctx.beginPath();
      ctx.moveTo(x, paraY(baixo));
      ctx.lineTo(x, paraY(v + item.valor.u));
      ctx.moveTo(x - 4, paraY(baixo));
      ctx.lineTo(x + 4, paraY(baixo));
      ctx.moveTo(x - 4, paraY(v + item.valor.u));
      ctx.lineTo(x + 4, paraY(v + item.valor.u));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, paraY(v), opcoes.destaque === item.ponto ? 6 : 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = tinta.fundo;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = cores.medido;
    ctx.lineWidth = 1.5;
  }
  ctx.restore();

  // Legenda
  ctx.font = `12px ${tinta.fonteMono}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const { entrada, x, y } of posicoesDaLegenda) {
    if (entrada !== "modelo") {
      ctx.fillStyle = cores.medido;
      ctx.beginPath();
      ctx.arc(x + 9, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.strokeStyle = cores.modelo;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18, y);
      ctx.stroke();
    }
    ctx.fillStyle = tinta.tinta;
    ctx.fillText(LEGENDAS[entrada], x + 24, y);
  }

  return {
    hit(xCss) {
      let melhor = null;
      for (const item of medidos) {
        const distancia = Math.abs(paraX(item.s) - xCss);
        if (!melhor || distancia < melhor.distancia) melhor = { distancia, item };
      }
      return melhor && melhor.distancia < 30 ? melhor.item : null;
    },
  };
}
