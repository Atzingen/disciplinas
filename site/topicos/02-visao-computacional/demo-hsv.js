
// Cena sintética 48x36 (BGR): fundo azul com ruído, bolinha laranja com sombra, trena clara
const cena = [];
for (let l = 0; l < 36; l++) {
  const linha = [];
  for (let c = 0; c < 48; c++) {
    const ruido = ((l * 13 + c * 7) % 15) - 7;
    let px = [157 + ruido, 71 + ruido, 35 + ruido];               // fundo azul
    if (c >= 14 && c <= 16) px = [205 + ruido, 212 + ruido, 214 + ruido];   // trena
    const d = Math.hypot(l - 24, c - 33);
    if (d < 4.4) {                                                 // bolinha com gradiente de brilho
      const brilho = 1 - 0.55 * (d / 4.4) * ((l - 24 > 0) ? 1 : 0.3);
      px = [55 * brilho, 187 * brilho, 255 * brilho];
    }
    linha.push(px.map(v => Math.max(0, Math.min(255, Math.round(v)))));
  }
  cena.push(linha);
}
function bgrParaHsv(b, g, r) {   // a mesma conversão do OpenCV (H em 0-179)
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return [h / 2, max === 0 ? 0 : (d / max) * 255, max * 255];
}
const defs = [["Hmin", 0, 179, 0], ["Hmax", 25, 179, 179], ["Smin", 120, 255, 0], ["Smax", 255, 255, 255], ["Vmin", 120, 255, 0], ["Vmax", 255, 255, 255]];
const caixa = {};
const barra = document.getElementById("sliders04");
defs.forEach(([nome, inicial, maximo]) => {
  caixa[nome] = inicial;
  const rotulo = document.createElement("label");
  rotulo.innerHTML = `${nome} <input type="range" min="0" max="${maximo}" value="${inicial}"> <output>${inicial}</output>`;
  const entrada = rotulo.querySelector("input");
  entrada.addEventListener("input", () => {
    caixa[nome] = Number(entrada.value);
    rotulo.querySelector("output").textContent = entrada.value;
    desenha();
  });
  barra.appendChild(rotulo);
});
const ctxCena = document.getElementById("cena04").getContext("2d");
const ctxMasc = document.getElementById("mascara04").getContext("2d");
function desenha() {
  let passaram = 0;
  cena.forEach((linha, l) => linha.forEach(([b, g, r], c) => {
    ctxCena.fillStyle = `rgb(${r},${g},${b})`;
    ctxCena.fillRect(c, l, 1, 1);
    const [h, s, v] = bgrParaHsv(b, g, r);
    const passa = h >= caixa.Hmin && h <= caixa.Hmax && s >= caixa.Smin && s <= caixa.Smax && v >= caixa.Vmin && v <= caixa.Vmax;
    if (passa) passaram++;
    ctxMasc.fillStyle = passa ? "#fff" : "#000";
    ctxMasc.fillRect(c, l, 1, 1);
  }));
  document.getElementById("pct04").textContent = (100 * passaram / (48 * 36)).toFixed(1);
}
desenha();

const demoRoot = document.querySelector('[data-demo="hsv"]');
function updatePressed() {
  for (const button of demoRoot.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.classList.contains('ativo')));
  }
}
demoRoot.addEventListener('click', updatePressed);
updatePressed();
