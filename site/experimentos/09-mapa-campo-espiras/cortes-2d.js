// Desenho do corte 2D num canvas: mapa de cor de uma componente, setas da
// direção do campo no plano, eixos, título e barra de cores (o PNG exportado é
// este mesmo canvas, então tudo o que explica o mapa fica dentro dele).
import { formatDecimal } from "../../nucleo/formato.js";
import { COMPONENTES, GRANDEZAS, componentOf, quantityAt } from "./processamento-mapa.js";
import { currentTheme, divergingColor, rgbCss, sequentialColor, themeInk } from "./paletas.js";

const INDICE_DO_EIXO = { x: 0, y: 1, z: 2 };
const MARGEM = { esquerda: 62, direita: 92, base: 50 };

// Bordas das células: pontos médios entre valores vizinhos; nas pontas, meio passo.
function cellEdges(valores) {
  if (valores.length === 1) return [valores[0] - 5, valores[0] + 5];
  const bordas = [valores[0] - (valores[1] - valores[0]) / 2];
  for (let i = 0; i < valores.length - 1; i += 1) bordas.push((valores[i] + valores[i + 1]) / 2);
  const n = valores.length;
  bordas.push(valores[n - 1] + (valores[n - 1] - valores[n - 2]) / 2);
  return bordas;
}

function tickIndices(n, maximo = 7) {
  const passo = Math.max(1, Math.ceil(n / maximo));
  const indices = [];
  for (let i = 0; i < n; i += passo) indices.push(i);
  if (indices[indices.length - 1] !== n - 1 && n - 1 - indices[indices.length - 1] >= passo / 2) {
    indices.push(n - 1);
  }
  return indices;
}

function digitsFor(maximo) {
  if (maximo >= 100) return 0;
  if (maximo >= 10) return 1;
  return 2;
}

// Faixa da escala de cor: simétrica para componentes, de 0 ao máximo para |B|.
export function colorRange(valores, componente) {
  const finitos = valores.filter(Number.isFinite);
  const maximo = finitos.length ? Math.max(...finitos.map(Math.abs)) : 0;
  const limite = maximo > 0 ? maximo : 1;
  return componente === "modulo" ? { min: 0, max: limite } : { min: -limite, max: limite };
}

// Quebra um título em linhas, juntando as partes enquanto couberem na largura.
export function wrapParts(ctx, partes, larguraMaxima, separador = " · ") {
  const linhas = [];
  let atual = "";
  for (const parte of partes) {
    const tentativa = atual ? `${atual}${separador}${parte}` : parte;
    if (!atual || ctx.measureText(tentativa).width <= larguraMaxima) {
      atual = tentativa;
    } else {
      linhas.push(atual);
      atual = parte;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function sliceTitleParts(corte, grandeza, componente) {
  const fixo = `${corte.eixos.fixo} = ${formatDecimal(corte.valorFixo, 1)} mm`;
  return [GRANDEZAS[grandeza], COMPONENTES[componente], `plano ${corte.plano.toUpperCase()}, ${fixo}`];
}

// opcoes: { grandeza, componente, faixa (opcional), destaque: { i, j } | null }.
// Devolve { hit(xCss, yCss) } para achar a célula sob o ponteiro, ou null.
export function drawSlice(canvas, corte, opcoes) {
  const largura = canvas.clientWidth;
  if (largura < 50) return null;
  const tinta = themeInk();
  const ctx = canvas.getContext("2d");
  const fonteDoTitulo = `700 13px ${tinta.fonteTitulo}`;
  ctx.font = fonteDoTitulo;
  const linhasDoTitulo = wrapParts(ctx, sliceTitleParts(corte, opcoes.grandeza, opcoes.componente), largura - 24);
  const topo = 22 + 17 * linhasDoTitulo.length + 30;
  const { eixoH, eixoV } = corte;
  const bordasH = cellEdges(eixoH);
  const bordasV = cellEdges(eixoV);
  const larguraDados = bordasH[bordasH.length - 1] - bordasH[0];
  const alturaDados = bordasV[bordasV.length - 1] - bordasV[0];
  const larguraUtil = Math.max(60, largura - MARGEM.esquerda - MARGEM.direita);
  const escala = Math.min(larguraUtil / larguraDados, 520 / alturaDados);
  const larguraPlot = larguraDados * escala;
  const alturaPlot = alturaDados * escala;
  const altura = Math.round(topo + alturaPlot + MARGEM.base);
  const esquerda = MARGEM.esquerda + (larguraUtil - larguraPlot) / 2;

  const razao = globalThis.devicePixelRatio || 1;
  canvas.style.height = `${altura}px`;
  canvas.width = Math.round(largura * razao);
  canvas.height = Math.round(altura * razao);
  ctx.setTransform(razao, 0, 0, razao, 0, 0);
  ctx.fillStyle = tinta.fundo;
  ctx.fillRect(0, 0, largura, altura);

  const paraX = (valor) => esquerda + (valor - bordasH[0]) * escala;
  const paraY = (valor) => topo + (bordasV[bordasV.length - 1] - valor) * escala;

  const valores = corte.celulas.map((linha) =>
    linha.map((ponto) => (ponto ? componentOf(quantityAt(ponto, opcoes.grandeza), opcoes.componente) : null)),
  );
  const faixa = opcoes.faixa ?? colorRange(valores.flat().map((valor) => valor?.valor), opcoes.componente);
  const comSinal = opcoes.componente !== "modulo";
  const corDe = (valor) => (comSinal
    ? divergingColor(valor / faixa.max)
    : sequentialColor((valor - faixa.min) / (faixa.max - faixa.min)));

  // Células
  for (let j = 0; j < eixoV.length; j += 1) {
    for (let i = 0; i < eixoH.length; i += 1) {
      const x0 = paraX(bordasH[i]);
      const x1 = paraX(bordasH[i + 1]);
      const y0 = paraY(bordasV[j + 1]);
      const y1 = paraY(bordasV[j]);
      const valor = valores[j][i];
      ctx.fillStyle = valor ? rgbCss(corDe(valor.valor)) : tinta.fundoFundo;
      ctx.fillRect(x0, y0, x1 - x0 + 0.5, y1 - y0 + 0.5);
    }
  }

  // Setas: direção do campo no plano, comprimento fixo
  const [ih, iv] = [INDICE_DO_EIXO[corte.eixos.h], INDICE_DO_EIXO[corte.eixos.v]];
  const planos = corte.celulas.map((linha) => linha.map((ponto) => {
    const vetor = ponto ? quantityAt(ponto, opcoes.grandeza) : null;
    return vetor ? [vetor.b[ih], vetor.b[iv]] : null;
  }));
  const maximoNoPlano = Math.max(0, ...planos.flat().filter(Boolean).map(([a, b]) => Math.hypot(a, b)));
  const menorCelula = Math.min(
    ...bordasH.slice(1).map((borda, i) => (borda - bordasH[i]) * escala),
    ...bordasV.slice(1).map((borda, j) => (borda - bordasV[j]) * escala),
  );
  const pular = menorCelula < 12 ? Math.ceil(12 / menorCelula) : 1;
  const comprimento = Math.min(24, 0.78 * menorCelula * pular);
  const coresDaSeta = currentTheme() === "escuro"
    ? { contorno: "rgb(13 16 22 / 85%)", traco: "rgb(240 244 250 / 95%)" }
    : { contorno: "rgb(255 255 255 / 85%)", traco: "rgb(16 22 32 / 90%)" };
  if (maximoNoPlano > 0 && comprimento >= 6) {
    for (let j = 0; j < eixoV.length; j += pular) {
      for (let i = 0; i < eixoH.length; i += pular) {
        const vetor = planos[j][i];
        if (!vetor) continue;
        const modulo = Math.hypot(vetor[0], vetor[1]);
        if (modulo < 0.03 * maximoNoPlano) continue;
        drawArrow(ctx, paraX(eixoH[i]), paraY(eixoV[j]), vetor[0] / modulo, -vetor[1] / modulo, comprimento, coresDaSeta);
      }
    }
  }

  // Destaque da célula sob o ponteiro
  if (opcoes.destaque) {
    const { i, j } = opcoes.destaque;
    ctx.strokeStyle = tinta.tinta;
    ctx.lineWidth = 2;
    ctx.strokeRect(paraX(bordasH[i]), paraY(bordasV[j + 1]), (bordasH[i + 1] - bordasH[i]) * escala, (bordasV[j + 1] - bordasV[j]) * escala);
  }

  // Moldura, marcas e rótulos dos eixos
  ctx.strokeStyle = tinta.linhaForte;
  ctx.lineWidth = 1;
  ctx.strokeRect(esquerda, topo, larguraPlot, alturaPlot);
  ctx.fillStyle = tinta.tintaSuave;
  ctx.font = `11px ${tinta.fonteMono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const i of tickIndices(eixoH.length)) {
    const x = paraX(eixoH[i]);
    ctx.fillRect(x, topo + alturaPlot, 1, 4);
    ctx.fillText(formatDecimal(eixoH[i], 0), x, topo + alturaPlot + 7);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const j of tickIndices(eixoV.length, 8)) {
    const y = paraY(eixoV[j]);
    ctx.fillRect(esquerda - 4, y, 4, 1);
    ctx.fillText(formatDecimal(eixoV[j], 0), esquerda - 7, y);
  }
  ctx.fillStyle = tinta.tinta;
  ctx.font = `600 12px ${tinta.fonteMono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${corte.eixos.h} (mm)`, esquerda + larguraPlot / 2, topo + alturaPlot + 38);
  ctx.save();
  ctx.translate(16, topo + alturaPlot / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${corte.eixos.v} (mm)`, 0, 0);
  ctx.restore();

  // Título
  ctx.textAlign = "left";
  ctx.font = fonteDoTitulo;
  linhasDoTitulo.forEach((linha, i) => ctx.fillText(linha, 12, 22 + 17 * i, largura - 24));
  ctx.font = `11px ${tinta.fonteMono}`;
  ctx.fillStyle = tinta.tintaSuave;
  ctx.fillText("setas: direção do campo no plano", 12, 22 + 17 * linhasDoTitulo.length, largura - 24);

  drawColorBar(ctx, { x: esquerda + larguraPlot + 18, y: topo, altura: alturaPlot }, faixa, comSinal, tinta);

  return {
    hit(xCss, yCss) {
      const xDado = bordasH[0] + (xCss - esquerda) / escala;
      const yDado = bordasV[bordasV.length - 1] - (yCss - topo) / escala;
      const i = bordasH.findIndex((borda, k) => k < bordasH.length - 1 && xDado >= borda && xDado < bordasH[k + 1]);
      const j = bordasV.findIndex((borda, k) => k < bordasV.length - 1 && yDado >= borda && yDado < bordasV[k + 1]);
      if (i < 0 || j < 0) return null;
      return { i, j, ponto: corte.celulas[j][i] };
    },
  };
}

function drawArrow(ctx, xc, yc, dx, dy, comprimento, cores) {
  const x0 = xc - (dx * comprimento) / 2;
  const y0 = yc - (dy * comprimento) / 2;
  const x1 = xc + (dx * comprimento) / 2;
  const y1 = yc + (dy * comprimento) / 2;
  const ponta = Math.max(4, comprimento * 0.32);
  const caminho = () => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.moveTo(x1 - ponta * (dx - 0.55 * dy), y1 - ponta * (dy + 0.55 * dx));
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 - ponta * (dx + 0.55 * dy), y1 - ponta * (dy - 0.55 * dx));
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  caminho();
  ctx.strokeStyle = cores.contorno;
  ctx.lineWidth = 3.4;
  ctx.stroke();
  caminho();
  ctx.strokeStyle = cores.traco;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawColorBar(ctx, caixa, faixa, comSinal, tinta) {
  const largura = 14;
  for (let k = 0; k < caixa.altura; k += 1) {
    const t = 1 - k / caixa.altura;
    const cor = comSinal ? divergingColor(2 * t - 1) : sequentialColor(t);
    ctx.fillStyle = rgbCss(cor);
    ctx.fillRect(caixa.x, caixa.y + k, largura, 1.5);
  }
  ctx.strokeStyle = tinta.linhaForte;
  ctx.strokeRect(caixa.x, caixa.y, largura, caixa.altura);
  const casas = digitsFor(faixa.max);
  const marcas = comSinal
    ? [[faixa.max, 0], [0, 0.5], [faixa.min, 1]]
    : [[faixa.max, 0], [(faixa.max + faixa.min) / 2, 0.5], [faixa.min, 1]];
  ctx.fillStyle = tinta.tintaSuave;
  ctx.font = `11px ${tinta.fonteMono}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const [valor, posicao] of marcas) {
    const y = caixa.y + posicao * caixa.altura;
    ctx.fillRect(caixa.x + largura, y, 3, 1);
    ctx.fillText(formatDecimal(valor, casas), caixa.x + largura + 9, y);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("μT", caixa.x + largura / 2, caixa.y - 14);
}
