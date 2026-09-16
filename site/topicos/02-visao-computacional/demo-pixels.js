
// Cena sintética 12x12: fundo azul, bolinha laranja, trena clara (coluna 3)
const B = [157, 71, 35], LARANJA = [55, 187, 255], TRENA = [200, 210, 215]; // em BGR
const pixels = [];
for (let l = 0; l < 12; l++) {
  const linha = [];
  for (let c = 0; c < 12; c++) {
    const dist = Math.hypot(l - 7, c - 8);
    let cor = c === 3 ? TRENA : B;
    if (dist < 2.4) cor = LARANJA;
    // pequena variação para parecer real
    linha.push(cor.map(v => Math.max(0, Math.min(255, v + ((l * 7 + c * 13) % 11) - 5))));
  }
  pixels.push(linha);
}
const ctx = document.getElementById("cena").getContext("2d");
pixels.forEach((linha, l) => linha.forEach(([b, g, r], c) => {
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(c, l, 1, 1);
}));
const grade = document.getElementById("grade");
function mostra(canal) {
  grade.innerHTML = "";
  pixels.forEach(linha => linha.forEach(([b, g, r]) => {
    const v = canal === "cinza" ? Math.round(0.114 * b + 0.587 * g + 0.299 * r) : [b, g, r][canal];
    const celula = document.createElement("div");
    celula.textContent = v;
    celula.style.cssText = `background:rgb(${v},${v},${v});color:${v > 127 ? "#000" : "#fff"};padding:2px 0;border-radius:2px`;
    grade.appendChild(celula);
  }));
  document.getElementById("dica01").textContent =
    canal === "cinza" ? "cinza = 0.30 R + 0.59 G + 0.11 B" : "cada número é a intensidade deste canal, 0 a 255";
}
document.querySelectorAll("[data-canal]").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll("[data-canal]").forEach(b => b.classList.remove("ativo"));
  btn.classList.add("ativo");
  const c = btn.dataset.canal;
  mostra(c === "cinza" ? "cinza" : Number(c));
}));
mostra(2);

const demoRoot = document.querySelector('[data-demo="pixels"]');
function updatePressed() {
  for (const button of demoRoot.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.classList.contains('ativo')));
  }
}
demoRoot.addEventListener('click', updatePressed);
updatePressed();
