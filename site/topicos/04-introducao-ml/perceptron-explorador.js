import { ativar, classe, completarEpoca, criarTreino, proximaPassada } from "./perceptron-modelo.js";

const raiz = document.querySelector("[data-perceptron-explorer]");
const formulario = raiz.querySelector("[data-perceptron-form]");
const plano = raiz.querySelector("[data-perceptron-plano]");
const graficoEpocas = raiz.querySelector("[data-perceptron-epocas]");
const status = raiz.querySelector("[data-perceptron-status]");
const conta = raiz.querySelector("[data-perceptron-conta]");
const botaoTreinar = raiz.querySelector('[data-perceptron-acao="treinar"]');

const TAXA_PADRAO = { degrau: 0.25, sigmoide: 1 };
// Degrau anima passada por passada; sigmoide precisa de muitas épocas e anima uma época por quadro.
const ANIMACAO = {
  degrau: { intervalo: 160, epocasPorClique: 25 },
  sigmoide: { intervalo: 40, epocasPorClique: 500 },
};
const LADO = 360;
const MARGEM = 30;
const DOMINIO = [-0.5, 1.5];
const CELULAS = 32;

let treino;
let temporizador = null;

function px(x) {
  return MARGEM + ((x - DOMINIO[0]) / (DOMINIO[1] - DOMINIO[0])) * (LADO - 2 * MARGEM);
}

function py(y) {
  return LADO - px(y);
}

function svg(tag, atributos = {}, texto) {
  const elemento = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [nome, valor] of Object.entries(atributos)) elemento.setAttribute(nome, valor);
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function numero(valor) {
  const casas = treino.ativacao === "sigmoide" ? 3 : 2;
  const texto = valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  return texto.replace("-", "−");
}

function entreParenteses(valor) {
  return valor < 0 ? `(${numero(valor)})` : numero(valor);
}

function lerFormulario() {
  const dados = new FormData(formulario);
  const ler = (nome, padrao) => {
    const valor = Number.parseFloat(String(dados.get(nome)).replace(",", "."));
    return Number.isFinite(valor) ? valor : padrao;
  };
  return {
    problema: dados.get("problema"),
    ativacao: dados.get("ativacao"),
    taxa: Math.max(ler("taxa", 0.25), 0.001),
    pesos: { w1: ler("w1", 0), w2: ler("w2", 0), b: ler("b", 0) },
  };
}

function parar() {
  clearInterval(temporizador);
  temporizador = null;
  botaoTreinar.textContent = "Treinar até convergir";
}

function reiniciar() {
  parar();
  treino = criarTreino(lerFormulario());
  desenhar();
}

function retaDeDecisao(pesos, classeCss) {
  const norma = pesos.w1 ** 2 + pesos.w2 ** 2;
  if (norma < 1e-12) return null;
  // Ponto da reta mais próximo da origem e direção ao longo da reta.
  const x0 = (-pesos.b * pesos.w1) / norma;
  const y0 = (-pesos.b * pesos.w2) / norma;
  const comprimento = 10 / Math.sqrt(norma);
  return svg("line", {
    x1: px(x0 - pesos.w2 * comprimento),
    y1: py(y0 + pesos.w1 * comprimento),
    x2: px(x0 + pesos.w2 * comprimento),
    y2: py(y0 - pesos.w1 * comprimento),
    class: classeCss,
    "clip-path": "url(#perceptron-recorte)",
  });
}

function desenharPlano() {
  const { pesos, ativacao, amostras } = treino;
  const ultimo = treino.passos.at(-1);
  plano.replaceChildren();

  const defs = svg("defs");
  const recorte = svg("clipPath", { id: "perceptron-recorte" });
  recorte.append(svg("rect", { x: px(DOMINIO[0]), y: py(DOMINIO[1]), width: px(DOMINIO[1]) - px(DOMINIO[0]), height: px(DOMINIO[1]) - px(DOMINIO[0]) }));
  defs.append(recorte);
  plano.append(defs);

  const regioes = svg("g");
  const passo = (DOMINIO[1] - DOMINIO[0]) / CELULAS;
  const tamanho = px(DOMINIO[0] + passo) - px(DOMINIO[0]);
  for (let i = 0; i < CELULAS; i += 1) {
    for (let j = 0; j < CELULAS; j += 1) {
      const x = DOMINIO[0] + (i + 0.5) * passo;
      const y = DOMINIO[0] + (j + 0.5) * passo;
      const saida = ativar(pesos.w1 * x + pesos.w2 * y + pesos.b, ativacao);
      const intensidade = ativacao === "sigmoide" ? 0.06 + 0.5 * Math.abs(saida - 0.5) : 0.2;
      regioes.append(svg("rect", {
        x: px(x) - tamanho / 2,
        y: py(y) - tamanho / 2,
        width: tamanho + 0.5,
        height: tamanho + 0.5,
        class: classe(saida) === 1 ? "regiao-1" : "regiao-0",
        "fill-opacity": intensidade.toFixed(3),
      }));
    }
  }
  plano.append(regioes);

  for (const valor of [0, 1]) {
    plano.append(svg("line", { x1: px(DOMINIO[0]), y1: py(valor), x2: px(DOMINIO[1]), y2: py(valor), class: "grade" }));
    plano.append(svg("line", { x1: px(valor), y1: py(DOMINIO[0]), x2: px(valor), y2: py(DOMINIO[1]), class: "grade" }));
    plano.append(svg("text", { x: px(valor), y: LADO - 8, class: "eixo-texto" }, String(valor)));
    plano.append(svg("text", { x: 12, y: py(valor) + 5, class: "eixo-texto" }, String(valor)));
  }
  plano.append(svg("text", { x: px(DOMINIO[1]) - 6, y: LADO - 8, class: "eixo-texto" }, "x₁"));
  plano.append(svg("text", { x: 14, y: py(DOMINIO[1]) + 12, class: "eixo-texto" }, "x₂"));

  if (ultimo && (ultimo.antes.w1 !== ultimo.depois.w1 || ultimo.antes.w2 !== ultimo.depois.w2 || ultimo.antes.b !== ultimo.depois.b)) {
    const anterior = retaDeDecisao(ultimo.antes, "reta-anterior");
    if (anterior) plano.append(anterior);
  }
  const reta = retaDeDecisao(pesos, "reta-atual");
  if (reta) plano.append(reta);

  const destaque = ultimo ? ultimo.indice : treino.indice;
  amostras.forEach((amostra, indice) => {
    const [x1, x2] = amostra.x;
    const saida = ativar(pesos.w1 * x1 + pesos.w2 * x2 + pesos.b, ativacao);
    if (indice === destaque) plano.append(svg("circle", { cx: px(x1), cy: py(x2), r: 20, class: "ponto-destaque" }));
    const errado = classe(saida) !== amostra.d;
    plano.append(svg("circle", { cx: px(x1), cy: py(x2), r: 11, class: `ponto-${amostra.d}${errado ? " ponto--errado" : ""}` }));
  });
}

function desenharEpocas() {
  graficoEpocas.replaceChildren();
  const epocas = treino.epocas.slice(-40);
  const largura = 320 / Math.max(epocas.length, 12);
  graficoEpocas.append(svg("line", { x1: 0, y1: 60, x2: 320, y2: 60, class: "grade" }));
  epocas.forEach((epoca, posicao) => {
    const erros = epoca.total - epoca.acertos;
    const altura = (erros / epoca.total) * 52;
    graficoEpocas.append(svg("rect", {
      x: posicao * largura + 1,
      y: 60 - Math.max(altura, 2),
      width: largura - 2,
      height: Math.max(altura, 2),
      class: erros === 0 ? "barra barra--zero" : "barra",
    }));
  });
  if (epocas.length > 0) {
    graficoEpocas.append(svg("text", { x: 0, y: 70, class: "eixo-texto eixo-texto--pequeno", "text-anchor": "start" }, `época ${epocas[0].epoca}`));
    graficoEpocas.append(svg("text", { x: 320, y: 70, class: "eixo-texto eixo-texto--pequeno", "text-anchor": "end" }, `época ${epocas.at(-1).epoca}`));
  }
}

function linhaConta(rotulo, texto) {
  const linha = document.createElement("p");
  const etapa = document.createElement("strong");
  etapa.textContent = rotulo;
  linha.append(etapa, document.createTextNode(texto));
  return linha;
}

function desenharConta() {
  const ultimo = treino.passos.at(-1);
  if (!ultimo) {
    const [x1, x2] = treino.amostras[0].x;
    conta.replaceChildren(linhaConta("Pronto. ", `A primeira amostra é x = (${x1}, ${x2}), com d = ${treino.amostras[0].d}. Clique em “Uma passada”.`));
    return;
  }
  const { amostra, antes, depois, v, y, erro, delta } = ultimo;
  const [x1, x2] = amostra.x;
  const sigmoide = treino.ativacao === "sigmoide";
  const yTexto = sigmoide ? numero(y) : String(y);
  const cabecalho = linhaConta(`Época ${ultimo.epoca} · amostra ${ultimo.indice + 1} de ${treino.amostras.length}: `, `x = (${x1}, ${x2}), d = ${amostra.d}`);
  const propagacao = linhaConta("1. Propagação  ", `v = ${entreParenteses(antes.w1)}·${x1} + ${entreParenteses(antes.w2)}·${x2} + ${entreParenteses(antes.b)} = ${numero(v)}  →  y = φ(v) = ${yTexto}`);
  const erroLinha = linhaConta("2. Erro  ", `e = d − y = ${amostra.d} − ${yTexto} = ${sigmoide ? numero(erro) : String(erro).replace("-", "−")}`);
  const deltaTexto = sigmoide
    ? `δ = e·y(1 − y) = ${entreParenteses(erro)}·${numero(y)}·${numero(1 - y)} = ${numero(delta)}`
    : `δ = e = ${String(delta).replace("-", "−")}${delta === 0 ? " → acertou, nada muda" : ""}`;
  const correcao = linhaConta("3. Correção  ", deltaTexto);
  const taxa = treino.taxa.toLocaleString("pt-BR");
  const deltaFator = sigmoide ? entreParenteses(delta) : delta < 0 ? `(−${-delta})` : String(delta);
  const ajustes = document.createElement("p");
  ajustes.className = "perceptron__ajustes";
  ajustes.textContent = [
    `w₁ ← ${numero(antes.w1)} + ${taxa}·${deltaFator}·${x1} = ${numero(depois.w1)}`,
    `w₂ ← ${numero(antes.w2)} + ${taxa}·${deltaFator}·${x2} = ${numero(depois.w2)}`,
    `b ← ${numero(antes.b)} + ${taxa}·${deltaFator} = ${numero(depois.b)}`,
  ].join("\n");
  conta.replaceChildren(cabecalho, propagacao, erroLinha, correcao, ajustes);
}

function desenharStatus() {
  const { pesos, epocas } = treino;
  const pesosTexto = `w₁ = ${numero(pesos.w1)}, w₂ = ${numero(pesos.w2)}, b = ${numero(pesos.b)}`;
  const ultimaEpoca = epocas.at(-1);
  if (treino.convergiu && treino.indice === 0) {
    status.textContent = `Convergiu na época ${ultimaEpoca.epoca}: uma época inteira sem erro. Reta final: ${pesosTexto}.`;
    status.dataset.estado = "convergiu";
    return;
  }
  status.dataset.estado = "";
  const anterior = ultimaEpoca ? ` · época ${ultimaEpoca.epoca}: ${ultimaEpoca.acertos} de ${ultimaEpoca.total} certas` : "";
  status.textContent = `Época ${treino.epoca}, próxima amostra ${treino.indice + 1} de ${treino.amostras.length}${anterior}. Pesos atuais: ${pesosTexto}.`;
}

function desenhar() {
  desenharPlano();
  desenharEpocas();
  desenharConta();
  desenharStatus();
}

function avisarSemConvergir() {
  const xor = treino.problema === "xor";
  status.textContent = `${treino.epocas.length} épocas sem convergir. ${xor ? "Nenhuma reta separa as classes do XOR: um neurônio sozinho não resolve." : "Tente outra taxa de aprendizado ou continue treinando."}`;
  status.dataset.estado = "falhou";
}

function treinarAnimado() {
  if (temporizador) {
    parar();
    return;
  }
  if (treino.convergiu && treino.indice === 0) return;
  const { intervalo, epocasPorClique } = ANIMACAO[treino.ativacao];
  const limite = treino.epocas.length + epocasPorClique;
  botaoTreinar.textContent = "Pausar";
  temporizador = setInterval(() => {
    if (treino.ativacao === "sigmoide") completarEpoca(treino);
    else proximaPassada(treino);
    desenhar();
    const fimDeEpoca = treino.indice === 0;
    if (fimDeEpoca && treino.convergiu) {
      parar();
    } else if (fimDeEpoca && treino.epocas.length >= limite) {
      parar();
      avisarSemConvergir();
    }
  }, intervalo);
}

raiz.addEventListener("click", (evento) => {
  const acao = evento.target.closest("[data-perceptron-acao]")?.dataset.perceptronAcao;
  if (!acao) return;
  if (acao === "treinar") {
    treinarAnimado();
    return;
  }
  parar();
  if (acao === "passada") proximaPassada(treino);
  if (acao === "epoca") completarEpoca(treino);
  if (acao === "reiniciar") treino = criarTreino(lerFormulario());
  desenhar();
});

formulario.addEventListener("change", (evento) => {
  if (evento.target.name === "ativacao") formulario.elements.taxa.value = TAXA_PADRAO[evento.target.value];
  reiniciar();
});
formulario.addEventListener("submit", (evento) => evento.preventDefault());

reiniciar();
