// Desenhos do assistente de configuração da aba Coleta: cada etapa mostra, em vista de cima e de lado, o que é
// cada medida, já com os valores digitados. SVG com as cores do tema (variáveis CSS), sem bibliotecas.

const LARGURA = 720;
const ALTURA = 300;
const MARGEM = 34;
const PAINEL = (LARGURA - 3 * MARGEM) / 2; // dois painéis lado a lado

const COR = {
  tinta: "var(--ink)",
  suave: "var(--ink-soft)",
  linha: "var(--line-strong)",
  medida: "var(--measure)",
  bobina: "var(--force-2)",
  sensor: "var(--resultant)",
  ok: "var(--force-1)",
  fora: "var(--positive)",
};

const formatar = (valor) => (Math.abs(valor) >= 100 ? valor.toFixed(0) : String(Number(valor.toFixed(1)))).replace(".", ",");

function escapar(texto) {
  return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Transformação do mundo (mm) para um painel, com a mesma escala nos dois eixos e o eixo vertical para cima.
function painel(indice, mundo) {
  const x0 = MARGEM + indice * (PAINEL + MARGEM);
  const topo = 40;
  const alturaUtil = ALTURA - topo - MARGEM;
  const largura = mundo.xMax - mundo.xMin || 1;
  const altura = mundo.yMax - mundo.yMin || 1;
  const escala = Math.min(PAINEL / largura, alturaUtil / altura);
  const sobraX = (PAINEL - largura * escala) / 2;
  const sobraY = (alturaUtil - altura * escala) / 2;
  return {
    x: (valor) => x0 + sobraX + (valor - mundo.xMin) * escala,
    y: (valor) => topo + sobraY + (mundo.yMax - valor) * escala,
    escala,
    x0,
  };
}

function caixaQueCobre(pontos, folga) {
  const xs = pontos.map((p) => p[0]);
  const ys = pontos.map((p) => p[1]);
  return {
    xMin: Math.min(...xs) - folga, xMax: Math.max(...xs) + folga,
    yMin: Math.min(...ys) - folga, yMax: Math.max(...ys) + folga,
  };
}

const texto = (x, y, conteudo, { cor = COR.suave, ancora = "middle", tamanho = 12, peso = 400 } = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${cor}" font-size="${tamanho}" font-weight="${peso}" text-anchor="${ancora}" font-family="var(--font-mono)">${escapar(conteudo)}</text>`;

const linha = (x1, y1, x2, y2, { cor = COR.linha, largura = 1.5, tracejado = "" } = {}) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${cor}" stroke-width="${largura}"${tracejado ? ` stroke-dasharray="${tracejado}"` : ""}/>`;

const retangulo = (x1, y1, x2, y2, { cor = COR.linha, preenchimento = "none", tracejado = "", largura = 1.5 } = {}) =>
  `<rect x="${Math.min(x1, x2).toFixed(1)}" y="${Math.min(y1, y2).toFixed(1)}" width="${Math.abs(x2 - x1).toFixed(1)}" height="${Math.abs(y2 - y1).toFixed(1)}" fill="${preenchimento}" stroke="${cor}" stroke-width="${largura}"${tracejado ? ` stroke-dasharray="${tracejado}"` : ""}/>`;

// Cota com setas nas duas pontas e o rótulo no meio.
function cota(x1, y1, x2, y2, rotulo, { deslocamentoRotulo = [0, -6] } = {}) {
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return texto(x1 + deslocamentoRotulo[0], y1 + deslocamentoRotulo[1], rotulo, { cor: COR.medida });
  return linha(x1, y1, x2, y2, { cor: COR.medida, largura: 1.5 }) +
    `<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="2.5" fill="${COR.medida}"/>` +
    `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2.5" fill="${COR.medida}"/>` +
    texto((x1 + x2) / 2 + deslocamentoRotulo[0], (y1 + y2) / 2 + deslocamentoRotulo[1], rotulo, { cor: COR.medida, peso: 700 });
}

function titulos(esquerda, direita) {
  return texto(MARGEM, 22, esquerda, { ancora: "start", cor: COR.tinta, peso: 700, tamanho: 13 }) +
    texto(2 * MARGEM + PAINEL, 22, direita, { ancora: "start", cor: COR.tinta, peso: 700, tamanho: 13 });
}

function eixosDoPainel(p, horizontal, vertical) {
  const x = p.x0 + 4;
  const y = ALTURA - 12;
  return linha(x, y, x + 28, y, { cor: COR.suave }) + texto(x + 34, y + 4, horizontal, { ancora: "start", tamanho: 11 }) +
    linha(x, y, x, y - 28, { cor: COR.suave }) + texto(x, y - 33, vertical, { tamanho: 11 });
}

function contornoDaBobina(p, geometria, dimensaoMm, cx, cy) {
  const raio = dimensaoMm / 2;
  if (geometria === "circulo") {
    return `<circle cx="${p.x(cx).toFixed(1)}" cy="${p.y(cy).toFixed(1)}" r="${(raio * p.escala).toFixed(1)}" fill="none" stroke="${COR.bobina}" stroke-width="3"/>`;
  }
  if (geometria === "u") {
    const pontos = [[cx - raio, cy - raio], [cx - raio, cy + raio], [cx + raio, cy + raio], [cx + raio, cy - raio]]
      .map(([px, py]) => `${p.x(px).toFixed(1)},${p.y(py).toFixed(1)}`).join(" ");
    return `<polyline points="${pontos}" fill="none" stroke="${COR.bobina}" stroke-width="3"/>`;
  }
  return retangulo(p.x(cx - raio), p.y(cy - raio), p.x(cx + raio), p.y(cy + raio), { cor: COR.bobina, largura: 3 });
}

function svg(conteudo, rotulo) {
  return `<svg viewBox="0 0 ${LARGURA} ${ALTURA}" role="img" aria-label="${escapar(rotulo)}" xmlns="http://www.w3.org/2000/svg">${conteudo}</svg>`;
}

// Legenda em HTML embaixo do desenho: os rótulos da vista de cima cruzariam linhas e uns aos outros dentro do SVG.
// marca: "linha", "tracejado", "ponto" ou "losango".
function legenda(itens) {
  const lista = itens.map(({ marca, cor, rotulo }) =>
    `<li><span class="coleta-legenda__marca coleta-legenda__marca--${marca}" style="--cor-da-marca: ${cor}"></span>${escapar(rotulo)}</li>`);
  return `<ul class="coleta-legenda">${lista.join("")}</ul>`;
}

// Etapa 2: onde fica o sensor em relação à ponta do bico.
export function desenhoDoCabecote({ dx, dy, dz }) {
  const alcance = Math.max(Math.abs(dx), Math.abs(dy), 40) * 1.35;
  const cima = painel(0, { xMin: -alcance, xMax: alcance, yMin: -alcance, yMax: alcance });
  const lado = painel(1, { xMin: -alcance, xMax: alcance, yMin: -(dz + 15), yMax: 55 });
  let s = titulos("Vista de cima", "Vista de frente");

  // De cima: cabeçote, bico e sensor.
  s += retangulo(cima.x(-25), cima.y(-20), cima.x(25), cima.y(20), { cor: COR.suave, preenchimento: "var(--paper-deep)" });
  s += texto(cima.x(0), cima.y(20) - 6, "cabeçote", { tamanho: 11 });
  s += cota(cima.x(0), cima.y(-alcance * 0.75), cima.x(dx), cima.y(-alcance * 0.75), `dx = ${formatar(dx)}`, { deslocamentoRotulo: [0, 16] });
  s += cota(cima.x(alcance * 0.8), cima.y(0), cima.x(alcance * 0.8), cima.y(dy), `dy = ${formatar(dy)}`, { deslocamentoRotulo: [30, 4] });
  s += linha(cima.x(0), cima.y(0), cima.x(0), cima.y(-alcance * 0.75), { cor: COR.medida, tracejado: "3 3", largura: 1 });
  s += linha(cima.x(dx), cima.y(dy), cima.x(dx), cima.y(-alcance * 0.75), { cor: COR.medida, tracejado: "3 3", largura: 1 });
  s += `<circle cx="${cima.x(0).toFixed(1)}" cy="${cima.y(0).toFixed(1)}" r="5" fill="${COR.tinta}"/>`;
  s += texto(cima.x(0) + 10, cima.y(0) + 4, "bico", { ancora: "start", cor: COR.tinta });
  s += retangulo(cima.x(dx - 8), cima.y(dy - 8), cima.x(dx + 8), cima.y(dy + 8), { cor: COR.sensor, preenchimento: COR.sensor });
  s += texto(cima.x(dx), cima.y(dy + 8) - 6, "sensor", { cor: COR.sensor, peso: 700 });
  s += eixosDoPainel(cima, "+X", "+Y");

  // De frente: bico com a ponta em z = 0 e o sensor dz abaixo.
  s += retangulo(lado.x(-25), lado.y(10), lado.x(25), lado.y(50), { cor: COR.suave, preenchimento: "var(--paper-deep)" });
  s += `<polygon points="${lado.x(-6).toFixed(1)},${lado.y(10).toFixed(1)} ${lado.x(6).toFixed(1)},${lado.y(10).toFixed(1)} ${lado.x(0).toFixed(1)},${lado.y(0).toFixed(1)}" fill="${COR.tinta}"/>`;
  s += linha(lado.x(-alcance), lado.y(0), lado.x(alcance), lado.y(0), { cor: COR.suave, tracejado: "4 4", largura: 1 });
  s += texto(lado.x(-alcance) + 2, lado.y(0) - 5, "ponta do bico", { ancora: "start", tamanho: 11 });
  s += retangulo(lado.x(dx - 10), lado.y(-dz - 1.5), lado.x(dx + 10), lado.y(-dz + 1.5), { cor: COR.sensor, preenchimento: COR.sensor });
  // Rótulo do sensor do lado oposto ao da cota dz, para não cruzar com ela nem com os eixos embaixo.
  const ladoDoRotulo = dx >= 0 ? -1 : 1;
  const xRotulo = lado.x(dx + ladoDoRotulo * 10) + ladoDoRotulo * 8;
  const ancoraRotulo = ladoDoRotulo > 0 ? "start" : "end";
  s += texto(xRotulo, lado.y(-dz) - 2, "sensor", { cor: COR.sensor, peso: 700, ancora: ancoraRotulo });
  s += texto(xRotulo, lado.y(-dz) + 12, "(furinho da ponteira)", { cor: COR.sensor, tamanho: 11, ancora: ancoraRotulo });
  const xCota = dx >= 0 ? Math.min(dx + 18, alcance * 0.9) : Math.max(dx - 18, -alcance * 0.9);
  s += cota(lado.x(xCota), lado.y(0), lado.x(xCota), lado.y(-dz), `dz = ${formatar(dz)}`, { deslocamentoRotulo: [dx >= 0 ? 34 : -34, 4] });
  s += eixosDoPainel(lado, "+X", "+Z");
  return svg(s, `Sensor a dx ${dx} mm, dy ${dy} mm e ${dz} mm abaixo do bico`);
}

// Etapa 3: bobina na mesa, curso do bico e alcance do sensor.
export function desenhoDaBobina({ setup, curso, geometria, dimensaoMm }) {
  const { dx, dy, xc, yc, hb } = setup;
  const raio = (dimensaoMm > 0 ? dimensaoMm : 100) / 2;
  const cantos = [
    [curso.min.x, curso.min.y], [curso.max.x, curso.max.y],
    [curso.min.x + dx, curso.min.y + dy], [curso.max.x + dx, curso.max.y + dy],
    [xc - raio, yc - raio], [xc + raio, yc + raio],
  ];
  const cima = painel(0, caixaQueCobre(cantos, 12));
  const xs = [curso.min.x, curso.max.x, xc - raio, xc + raio];
  const lado = painel(1, { xMin: Math.min(...xs) - 10, xMax: Math.max(...xs) + 10, yMin: -10, yMax: Math.max(hb + 60, 80) });
  let s = titulos("Vista de cima (mesa)", "Vista de frente");

  s += retangulo(cima.x(curso.min.x), cima.y(curso.min.y), cima.x(curso.max.x), cima.y(curso.max.y), { cor: COR.linha, preenchimento: "var(--paper-deep)" });
  s += retangulo(cima.x(curso.min.x + dx), cima.y(curso.min.y + dy), cima.x(curso.max.x + dx), cima.y(curso.max.y + dy), { cor: COR.sensor, tracejado: "6 4" });
  s += contornoDaBobina(cima, geometria, 2 * raio, xc, yc);
  s += linha(cima.x(xc) - 7, cima.y(yc), cima.x(xc) + 7, cima.y(yc), { cor: COR.bobina, largura: 2 });
  s += linha(cima.x(xc), cima.y(yc) - 7, cima.x(xc), cima.y(yc) + 7, { cor: COR.bobina, largura: 2 });
  s += eixosDoPainel(cima, "+X", "+Y");

  s += linha(lado.x(Math.min(...xs) - 10), lado.y(0), lado.x(Math.max(...xs) + 10), lado.y(0), { cor: COR.tinta, largura: 2 });
  s += texto(lado.x(Math.max(...xs) + 10) - 2, lado.y(0) + 16, "mesa (Z = 0)", { ancora: "end", tamanho: 11 });
  s += retangulo(lado.x(xc - raio - 8), lado.y(0), lado.x(xc + raio + 8), lado.y(hb), { cor: COR.linha, tracejado: "5 4" });
  s += texto(lado.x(xc), lado.y(hb / 2) + 4, "suporte", { tamanho: 11 });
  s += linha(lado.x(xc - raio), lado.y(hb), lado.x(xc + raio), lado.y(hb), { cor: COR.bobina, largura: 4 });
  s += texto(lado.x(xc), lado.y(hb) - 8, "plano do fio", { cor: COR.bobina, peso: 700 });
  s += cota(lado.x(xc + raio + 20), lado.y(0), lado.x(xc + raio + 20), lado.y(hb), `hb = ${formatar(hb)}`, { deslocamentoRotulo: [34, 4] });
  s += eixosDoPainel(lado, "+X", "+Z");
  return svg(s, `Bobina com centro em X ${xc}, Y ${yc}, plano do fio a ${hb} mm da mesa`) + legenda([
    { marca: "linha", cor: COR.linha, rotulo: "curso do bico (M211)" },
    { marca: "tracejado", cor: COR.sensor, rotulo: "alcance do sensor (o curso deslocado por dx e dy)" },
    { marca: "linha", cor: COR.bobina, rotulo: `bobina, centro (xc, yc) = (${formatar(xc)}, ${formatar(yc)}) mm` },
  ]);
}

// Etapa 4: grade do plano em coordenadas da bobina, com o que fica fora do alcance do sensor em vermelho.
export function desenhoDoPlano({ passos, area, geometria, dimensaoMm }) {
  const raio = (dimensaoMm > 0 ? dimensaoMm : 100) / 2;
  const pontos = passos.filter((p) => p.tipo === "ponto");
  const referencia = passos.find((p) => p.tipo === "ref");
  const dentro = (p, eixo) => p[eixo] >= area[eixo].min && p[eixo] <= area[eixo].max;
  const visiveis = [
    ...pontos.map((p) => [p.x, p.y]), [-raio, -raio], [raio, raio],
    ...(referencia ? [[referencia.x, referencia.y]] : []),
  ];
  const caixa = caixaQueCobre(visiveis, 15);
  const cima = painel(0, caixa);
  const zs = [...new Set(pontos.map((p) => p.z)), ...(referencia ? [referencia.z] : [])];
  const mundoDoLado = { xMin: caixa.xMin, xMax: caixa.xMax, yMin: -15, yMax: Math.max(...zs, 40) + 15 };
  const lado = painel(1, mundoDoLado);
  let s = titulos("Grade vista de cima (bobina no centro)", "Alturas, vista de frente");

  const recortar = (valor, eixo, caixaDoEixo) => Math.min(Math.max(valor, caixaDoEixo[0]), caixaDoEixo[1]);
  s += retangulo(
    cima.x(recortar(area.x.min, "x", [caixa.xMin, caixa.xMax])), cima.y(recortar(area.y.min, "y", [caixa.yMin, caixa.yMax])),
    cima.x(recortar(area.x.max, "x", [caixa.xMin, caixa.xMax])), cima.y(recortar(area.y.max, "y", [caixa.yMin, caixa.yMax])),
    { cor: COR.sensor, tracejado: "6 4" },
  );
  s += contornoDaBobina(cima, geometria, 2 * raio, 0, 0);
  const vistos = new Set();
  for (const p of pontos) {
    const chave = `${p.x}|${p.y}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const ok = dentro(p, "x") && dentro(p, "y");
    s += `<circle cx="${cima.x(p.x).toFixed(1)}" cy="${cima.y(p.y).toFixed(1)}" r="${ok ? 2.2 : 3.2}" fill="${ok ? COR.ok : COR.fora}"/>`;
  }
  if (referencia) {
    const rx = cima.x(referencia.x);
    const ry = cima.y(referencia.y);
    s += `<polygon points="${rx},${ry - 7} ${rx + 7},${ry} ${rx},${ry + 7} ${rx - 7},${ry}" fill="${COR.sensor}"/>`;
  }
  s += eixosDoPainel(cima, "x", "y");

  s += linha(lado.x(-raio), lado.y(0), lado.x(raio), lado.y(0), { cor: COR.bobina, largura: 4 });
  s += texto(lado.x(0), lado.y(0) + 16, "plano do fio (z = 0)", { cor: COR.bobina, tamanho: 11 });
  const xMinGrade = Math.min(...pontos.map((p) => p.x));
  const xMaxGrade = Math.max(...pontos.map((p) => p.x));
  for (const z of [...new Set(pontos.map((p) => p.z))]) {
    const ok = z >= area.z.min && z <= area.z.max;
    s += linha(lado.x(xMinGrade), lado.y(z), lado.x(xMaxGrade), lado.y(z), { cor: ok ? COR.ok : COR.fora, largura: ok ? 2 : 3 });
    s += texto(lado.x(xMaxGrade) + 6, lado.y(z) + 4, `${formatar(z)} mm`, { ancora: "start", tamanho: 11, cor: ok ? COR.suave : COR.fora });
  }
  if (area.z.max < mundoDoLado.yMax) {
    s += linha(lado.x(caixa.xMin), lado.y(area.z.max), lado.x(caixa.xMax), lado.y(area.z.max), { cor: COR.fora, tracejado: "6 4" });
    s += texto(lado.x(caixa.xMin) + 2, lado.y(area.z.max) - 5, "teto do curso em Z", { ancora: "start", cor: COR.fora, tamanho: 11 });
  }
  if (referencia) {
    s += `<circle cx="${lado.x(referencia.x).toFixed(1)}" cy="${lado.y(referencia.z).toFixed(1)}" r="5" fill="${COR.sensor}"/>`;
  }
  s += eixosDoPainel(lado, "x", "z");
  const algumFora = pontos.some((p) => !(dentro(p, "x") && dentro(p, "y") && dentro(p, "z")));
  return svg(s, `Grade com ${pontos.length} pontos sobre a bobina`) + legenda([
    { marca: "ponto", cor: COR.ok, rotulo: "ponto da grade" },
    ...(algumFora ? [{ marca: "ponto", cor: COR.fora, rotulo: "fora do alcance do sensor" }] : []),
    ...(referencia ? [{ marca: "losango", cor: COR.sensor, rotulo: `referência (${formatar(referencia.x)}, ${formatar(referencia.y)}, ${formatar(referencia.z)}) mm` }] : []),
    { marca: "tracejado", cor: COR.sensor, rotulo: "alcance do sensor" },
    { marca: "linha", cor: COR.bobina, rotulo: "bobina" },
  ]);
}
