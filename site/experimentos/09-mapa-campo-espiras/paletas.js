// Paletas de cor dos mapas. Sequencial (|B|): um só matiz, do fundo para o
// intenso. Divergente (componentes com sinal): azul (negativo), cinza neutro no
// zero e vermelho (positivo). Cada tema tem os próprios degraus.

const PALETAS = {
  claro: {
    sequencial: ["#e6f0fc", "#b7d3f6", "#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281", "#0d366b"],
    divergente: ["#184f95", "#3987e5", "#9ec5f4", "#f0efec", "#f2a7a3", "#d94841", "#8f241f"],
  },
  escuro: {
    sequencial: ["#1b2533", "#1c3a63", "#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4", "#cde2fb"],
    divergente: ["#9ec5f4", "#3987e5", "#1c4f8f", "#383835", "#9a302b", "#e8564c", "#f6b9b4"],
  },
};

export function currentTheme() {
  return globalThis.document?.documentElement?.dataset?.theme === "escuro" ? "escuro" : "claro";
}

function hexToRgb(hex) {
  const valor = Number.parseInt(hex.slice(1), 16);
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}

function interpolate(paradas, t) {
  const limitado = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  const posicao = limitado * (paradas.length - 1);
  const i = Math.min(paradas.length - 2, Math.floor(posicao));
  const w = posicao - i;
  const a = hexToRgb(paradas[i]);
  const b = hexToRgb(paradas[i + 1]);
  return a.map((canal, eixo) => Math.round(canal + w * (b[eixo] - canal)));
}

// t de 0 a 1.
export function sequentialColor(t, tema = currentTheme()) {
  return interpolate(PALETAS[tema].sequencial, t);
}

// t de −1 a 1; 0 é o cinza neutro.
export function divergingColor(t, tema = currentTheme()) {
  return interpolate(PALETAS[tema].divergente, (t + 1) / 2);
}

export function rgbCss([r, g, b]) {
  return `rgb(${r} ${g} ${b})`;
}

// Gradiente CSS para legendas: "sequencial" ou "divergente"; início opcional (0 a 1).
export function cssGradient(tipo, tema = currentTheme(), inicio = 0, direcao = "to right") {
  const paradas = [];
  for (let i = 0; i <= 10; i += 1) {
    const t = inicio + ((1 - inicio) * i) / 10;
    const cor = tipo === "divergente" ? divergingColor(2 * t - 1, tema) : sequentialColor(t, tema);
    paradas.push(`${rgbCss(cor)} ${i * 10}%`);
  }
  return `linear-gradient(${direcao}, ${paradas.join(", ")})`;
}

// Cores de texto e linhas lidas dos tokens do tema.
export function themeInk() {
  const estilo = globalThis.getComputedStyle?.(document.documentElement);
  const ler = (nome, reserva) => estilo?.getPropertyValue(nome).trim() || reserva;
  return {
    fundo: ler("--surface", "#ffffff"),
    fundoFundo: ler("--paper-deep", "#eef2f7"),
    tinta: ler("--ink", "#101620"),
    tintaSuave: ler("--ink-soft", "#556072"),
    linha: ler("--line", "#dde4ec"),
    linhaForte: ler("--line-strong", "#c2ccd8"),
    destaque: ler("--accent", "#e8503a"),
    fonteMono: ler("--font-mono", "monospace"),
    fonteTitulo: ler("--font-display", "sans-serif"),
  };
}

// Duas séries do perfil (medido e modelo): azul e laranja, um degrau por tema.
export function seriesColors(tema = currentTheme()) {
  return tema === "escuro"
    ? { medido: "#3987e5", modelo: "#e8763f" }
    : { medido: "#2a78d6", modelo: "#d95926" };
}
