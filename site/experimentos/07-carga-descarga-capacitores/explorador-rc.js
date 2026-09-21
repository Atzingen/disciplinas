// Explorador interativo da resposta RC: recalcula V_C(t) e i(t) de carga e
// descarga a partir de R, C e V_s, com leitura por instante ao passar o mouse.
// O modelo é puro (testável em Node); a montagem no DOM fica em setupExplorer.

export const PONTOS = 200;
export const FIM_EM_TAU = 5;

export function modeloRC({ resistenciaOhm, capacitanciaFarad, tensaoVolt }) {
  const tau = resistenciaOhm * capacitanciaFarad;
  const correnteInicial = tensaoVolt / resistenciaOhm;
  const decaimento = (t) => Math.exp(-t / tau);
  return {
    tau,
    correnteInicial,
    cargaFinal: capacitanciaFarad * tensaoVolt,
    energiaFinal: 0.5 * capacitanciaFarad * tensaoVolt * tensaoVolt,
    tensaoCarga: (t) => tensaoVolt * (1 - decaimento(t)),
    tensaoDescarga: (t) => tensaoVolt * decaimento(t),
    correnteCarga: (t) => correnteInicial * decaimento(t),
    correnteDescarga: (t) => -correnteInicial * decaimento(t),
  };
}

export function amostrasRC(modelo, pontos = PONTOS, fimEmTau = FIM_EM_TAU) {
  const fim = fimEmTau * modelo.tau;
  const amostras = { fim, t: [], vCarga: [], vDescarga: [], iCarga: [], iDescarga: [] };
  for (let k = 0; k <= pontos; k += 1) {
    const t = (fim * k) / pontos;
    amostras.t.push(t);
    amostras.vCarga.push(modelo.tensaoCarga(t));
    amostras.vDescarga.push(modelo.tensaoDescarga(t));
    amostras.iCarga.push(modelo.correnteCarga(t));
    amostras.iDescarga.push(modelo.correnteDescarga(t));
  }
  return amostras;
}

const formatarNumero = (valor, casas) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export function formatarTempo(segundos) {
  if (segundos === 0) return "0";
  if (segundos >= 60) return `${formatarNumero(segundos / 60, 2)} min`;
  if (segundos >= 1) return `${formatarNumero(segundos, 1)} s`;
  return `${formatarNumero(segundos * 1e3, 0)} ms`;
}

export function formatarCorrente(amperes) {
  if (amperes === 0) return "0";
  const modulo = Math.abs(amperes);
  if (modulo >= 1e-3) return `${formatarNumero(amperes * 1e3, 2)} mA`;
  return `${formatarNumero(amperes * 1e6, 1)} µA`;
}

export function formatarCarga(coulombs) {
  if (coulombs >= 1e-3) return `${formatarNumero(coulombs * 1e3, 2)} mC`;
  return `${formatarNumero(coulombs * 1e6, 1)} µC`;
}

export function formatarEnergia(joules) {
  if (joules >= 1e-3) return `${formatarNumero(joules * 1e3, 2)} mJ`;
  return `${formatarNumero(joules * 1e6, 1)} µJ`;
}

function marcasNiveis(minimo, maximo, quantidade) {
  const extensao = maximo - minimo;
  const bruto = extensao / quantidade;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((p) => extensao / p <= quantidade) ?? magnitude * 10;
  const marcas = [];
  for (let v = Math.ceil(minimo / passo) * passo; v <= maximo + 1e-9; v += passo) marcas.push(Number(v.toFixed(10)));
  return marcas;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const LARGURA = 860;
const ALTURA = 320;
const MARGEM = { topo: 18, direita: 96, base: 44, esquerda: 70 };
const AREA_X = LARGURA - MARGEM.esquerda - MARGEM.direita;
const AREA_Y = ALTURA - MARGEM.topo - MARGEM.base;

function elementoSvg(tag, atributos, pai) {
  const elemento = document.createElementNS(SVG_NS, tag);
  for (const [nome, valor] of Object.entries(atributos)) elemento.setAttribute(nome, valor);
  pai.append(elemento);
  return elemento;
}

function criarGrafico(container, opcoes) {
  const svg = container.querySelector("svg");
  const tooltip = container.querySelector("[data-rc-tooltip]");
  let estado = null;

  function desenhar(amostras, modelo) {
    svg.textContent = "";
    const yMin = opcoes.yMin(modelo);
    const yMax = opcoes.yMax(modelo);
    const px = (t) => MARGEM.esquerda + (t / amostras.fim) * AREA_X;
    const py = (y) => MARGEM.topo + (1 - (y - yMin) / (yMax - yMin)) * AREA_Y;

    const grade = elementoSvg("g", { class: "rc-explorer__grid" }, svg);
    const eixos = elementoSvg("g", { class: "rc-explorer__axis" }, svg);
    for (const nivel of marcasNiveis(yMin, yMax, opcoes.divisoesY)) {
      elementoSvg("line", { x1: MARGEM.esquerda, x2: MARGEM.esquerda + AREA_X, y1: py(nivel), y2: py(nivel) }, grade);
      elementoSvg("text", { x: MARGEM.esquerda - 8, y: py(nivel) + 4, "text-anchor": "end" }, eixos).textContent = opcoes.rotuloY(nivel);
    }
    for (let k = 0; k <= FIM_EM_TAU; k += 1) {
      const x = px(k * modelo.tau);
      elementoSvg("line", { x1: x, x2: x, y1: MARGEM.topo, y2: MARGEM.topo + AREA_Y }, grade);
      elementoSvg("text", { x, y: MARGEM.topo + AREA_Y + 18, "text-anchor": "middle" }, eixos).textContent = k === 0 ? "0" : k === 1 ? "τ" : `${k}τ`;
      elementoSvg("text", { x, y: MARGEM.topo + AREA_Y + 34, "text-anchor": "middle", class: "rc-explorer__tick-time" }, eixos).textContent = formatarTempo(k * modelo.tau);
    }
    if (yMin < 0 && yMax > 0) {
      elementoSvg("line", { x1: MARGEM.esquerda, x2: MARGEM.esquerda + AREA_X, y1: py(0), y2: py(0), class: "rc-explorer__zero" }, eixos);
    }
    elementoSvg("path", { d: `M${MARGEM.esquerda} ${MARGEM.topo} V${MARGEM.topo + AREA_Y} H${MARGEM.esquerda + AREA_X}` }, eixos);
    elementoSvg("line", { class: "rc-explorer__tau", x1: px(modelo.tau), x2: px(modelo.tau), y1: MARGEM.topo, y2: MARGEM.topo + AREA_Y }, svg);

    const caminho = (serie) => serie.map((y, i) => `${i ? "L" : "M"}${px(amostras.t[i]).toFixed(1)} ${py(y).toFixed(1)}`).join("");
    elementoSvg("path", { class: "rc-explorer__series rc-explorer__series--carga", d: caminho(amostras[opcoes.serieCarga]) }, svg);
    elementoSvg("path", { class: "rc-explorer__series rc-explorer__series--descarga", d: caminho(amostras[opcoes.serieDescarga]) }, svg);

    const ultimo = amostras.t.length - 1;
    const rotuloCarga = elementoSvg("text", { class: "rc-explorer__label", x: MARGEM.esquerda + AREA_X + 8, y: py(amostras[opcoes.serieCarga][ultimo]) + 4 }, svg);
    rotuloCarga.textContent = "Carga";
    const rotuloDescarga = elementoSvg("text", { class: "rc-explorer__label", x: MARGEM.esquerda + AREA_X + 8, y: py(amostras[opcoes.serieDescarga][ultimo]) + 4 }, svg);
    rotuloDescarga.textContent = "Descarga";
    const yCarga = Number(rotuloCarga.getAttribute("y"));
    const yDescarga = Number(rotuloDescarga.getAttribute("y"));
    if (Math.abs(yCarga - yDescarga) < 14) {
      const meio = (yCarga + yDescarga) / 2;
      rotuloCarga.setAttribute("y", meio - 7);
      rotuloDescarga.setAttribute("y", meio + 7);
    }

    const indiceTau = Math.round(ultimo / FIM_EM_TAU);
    elementoSvg("circle", { class: "rc-explorer__dot rc-explorer__dot--carga", cx: px(amostras.t[indiceTau]), cy: py(amostras[opcoes.serieCarga][indiceTau]), r: 4 }, svg);
    elementoSvg("circle", { class: "rc-explorer__dot rc-explorer__dot--descarga", cx: px(amostras.t[indiceTau]), cy: py(amostras[opcoes.serieDescarga][indiceTau]), r: 4 }, svg);

    const camada = elementoSvg("g", { style: "display:none" }, svg);
    const cursor = elementoSvg("line", { class: "rc-explorer__cursor", y1: MARGEM.topo, y2: MARGEM.topo + AREA_Y }, camada);
    const pontoCarga = elementoSvg("circle", { class: "rc-explorer__dot rc-explorer__dot--carga", r: 5 }, camada);
    const pontoDescarga = elementoSvg("circle", { class: "rc-explorer__dot rc-explorer__dot--descarga", r: 5 }, camada);
    const alvo = elementoSvg("rect", { x: MARGEM.esquerda, y: MARGEM.topo, width: AREA_X, height: AREA_Y, fill: "transparent", style: "cursor:crosshair" }, svg);

    estado = { amostras, modelo, px, py, camada, cursor, pontoCarga, pontoDescarga };
    alvo.addEventListener("pointermove", aoMover);
    alvo.addEventListener("pointerleave", aoSair);
  }

  function linhaTooltip(valor, nome, classe) {
    const linha = document.createElement("div");
    linha.className = "rc-explorer__tooltip-row";
    const chave = document.createElement("i");
    chave.className = classe;
    const numero = document.createElement("b");
    numero.textContent = valor;
    const rotulo = document.createElement("span");
    rotulo.textContent = nome;
    linha.append(chave, numero, rotulo);
    return linha;
  }

  function aoMover(evento) {
    if (!estado) return;
    const caixa = svg.getBoundingClientRect();
    const xSvg = ((evento.clientX - caixa.left) * LARGURA) / caixa.width;
    const ultimo = estado.amostras.t.length - 1;
    const k = Math.max(0, Math.min(ultimo, Math.round(((xSvg - MARGEM.esquerda) / AREA_X) * ultimo)));
    const t = estado.amostras.t[k];
    const valorCarga = estado.amostras[opcoes.serieCarga][k];
    const valorDescarga = estado.amostras[opcoes.serieDescarga][k];
    const x = estado.px(t);

    estado.camada.style.display = "";
    estado.cursor.setAttribute("x1", x);
    estado.cursor.setAttribute("x2", x);
    estado.pontoCarga.setAttribute("cx", x);
    estado.pontoCarga.setAttribute("cy", estado.py(valorCarga));
    estado.pontoDescarga.setAttribute("cx", x);
    estado.pontoDescarga.setAttribute("cy", estado.py(valorDescarga));

    tooltip.textContent = "";
    const cabecalho = document.createElement("div");
    cabecalho.className = "rc-explorer__tooltip-time";
    cabecalho.textContent = `t = ${formatarTempo(t)} (${formatarNumero(t / estado.modelo.tau, 2)} τ)`;
    tooltip.append(
      cabecalho,
      linhaTooltip(opcoes.formatar(valorCarga), "Carga", "rc-explorer__key--carga"),
      linhaTooltip(opcoes.formatar(valorDescarga), "Descarga", "rc-explorer__key--descarga"),
    );
    tooltip.hidden = false;
    const xTela = (x / LARGURA) * caixa.width;
    const cabeADireita = xTela + 16 + tooltip.offsetWidth <= container.clientWidth;
    tooltip.style.left = `${cabeADireita ? xTela + 16 : xTela - tooltip.offsetWidth - 12}px`;
    tooltip.style.top = `${evento.clientY - caixa.top + 10}px`;
  }

  function aoSair() {
    if (estado) estado.camada.style.display = "none";
    tooltip.hidden = true;
  }

  return { desenhar };
}

function preencherTabela(corpo, amostras, modelo) {
  corpo.textContent = "";
  const ultimo = amostras.t.length - 1;
  for (let k = 0; k <= 10; k += 1) {
    const indice = Math.round((k * ultimo) / 10);
    const linha = document.createElement("tr");
    const celulas = [
      formatarTempo(amostras.t[indice]),
      formatarNumero(amostras.t[indice] / modelo.tau, 1),
      formatarNumero(amostras.vCarga[indice], 3),
      formatarNumero(amostras.vDescarga[indice], 3),
      formatarNumero(amostras.iCarga[indice] * 1e6, 1),
      formatarNumero(amostras.iDescarga[indice] * 1e6, 1),
    ];
    celulas.forEach((texto) => {
      const celula = document.createElement("td");
      celula.textContent = texto;
      linha.append(celula);
    });
    corpo.append(linha);
  }
}

export function setupExplorer(root) {
  const entradaR = root.querySelector("[data-rc-r]");
  const entradaC = root.querySelector("[data-rc-c]");
  const entradaV = root.querySelector("[data-rc-v]");
  const saidas = {
    r: root.querySelector("[data-rc-r-valor]"),
    c: root.querySelector("[data-rc-c-valor]"),
    v: root.querySelector("[data-rc-v-valor]"),
    tau: root.querySelector("[data-rc-tau]"),
    meiaVida: root.querySelector("[data-rc-meia-vida]"),
    correnteInicial: root.querySelector("[data-rc-i0]"),
    cargaFinal: root.querySelector("[data-rc-q0]"),
    energia: root.querySelector("[data-rc-energia]"),
  };
  const graficoTensao = criarGrafico(root.querySelector("[data-rc-grafico-tensao]"), {
    serieCarga: "vCarga",
    serieDescarga: "vDescarga",
    yMin: () => 0,
    yMax: (modelo) => modelo.tensaoCarga(Infinity),
    divisoesY: 5,
    rotuloY: (v) => `${formatarNumero(v, 1)} V`,
    formatar: (v) => `${formatarNumero(v, 3)} V`,
  });
  const graficoCorrente = criarGrafico(root.querySelector("[data-rc-grafico-corrente]"), {
    serieCarga: "iCarga",
    serieDescarga: "iDescarga",
    yMin: (modelo) => -modelo.correnteInicial,
    yMax: (modelo) => modelo.correnteInicial,
    divisoesY: 6,
    rotuloY: formatarCorrente,
    formatar: formatarCorrente,
  });
  const corpoTabela = root.querySelector("[data-rc-tabela] tbody");

  function atualizar() {
    const modelo = modeloRC({
      resistenciaOhm: Number(entradaR.value) * 1e3,
      capacitanciaFarad: Number(entradaC.value) * 1e-6,
      tensaoVolt: Number(entradaV.value),
    });
    saidas.r.textContent = formatarNumero(Number(entradaR.value), 0);
    saidas.c.textContent = formatarNumero(Number(entradaC.value), 0);
    saidas.v.textContent = formatarNumero(Number(entradaV.value), 1);
    saidas.tau.textContent = formatarTempo(modelo.tau);
    saidas.meiaVida.textContent = formatarTempo(modelo.tau * Math.LN2);
    saidas.correnteInicial.textContent = formatarCorrente(modelo.correnteInicial);
    saidas.cargaFinal.textContent = formatarCarga(modelo.cargaFinal);
    saidas.energia.textContent = formatarEnergia(modelo.energiaFinal);

    const amostras = amostrasRC(modelo);
    graficoTensao.desenhar(amostras, modelo);
    graficoCorrente.desenhar(amostras, modelo);
    preencherTabela(corpoTabela, amostras, modelo);
  }

  for (const entrada of [entradaR, entradaC, entradaV]) entrada.addEventListener("input", atualizar);
  atualizar();
  return { atualizar };
}

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-explorador-rc]")) {
    setupExplorer(root);
  }
}
