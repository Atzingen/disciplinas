
// entrada 10x10: fundo 30, barra vertical (colunas 3-4) e horizontal (linhas 6-7) em 200
const N = 10;
const entrada = [];
for (let l = 0; l < N; l++) {
  entrada.push([]);
  for (let c = 0; c < N; c++) {
    entrada[l].push((c === 3 || c === 4 || l === 6 || l === 7) ? 200 : 30);
  }
}
const KERNELS = {
  vertical:   [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
  horizontal: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
  media:      [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]],
  identidade: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
};
let kernelAtual = "vertical";
const elEntrada = document.getElementById("entrada09");
const elKernel = document.getElementById("kernel09");
const elSaida = document.getElementById("saida09");
const elConta = document.getElementById("conta09");

function celula(valor, maximo) {
  const d = document.createElement("div");
  const v = Math.round(Math.min(255, Math.abs(valor) / maximo * 255));
  d.style.background = `rgb(${v},${v},${v})`;
  d.style.color = v > 127 ? "#000" : "#fff";
  d.textContent = Math.round(valor);
  return d;
}
function convolui(l, c, k) {   // Borda replicada explicitamente nesta demonstração.
  let soma = 0;
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const li = Math.min(N - 1, Math.max(0, l + i));
      const cj = Math.min(N - 1, Math.max(0, c + j));
      soma += entrada[li][cj] * k[i + 1][j + 1];
    }
  return soma;
}
function desenha() {
  const k = KERNELS[kernelAtual];
  elEntrada.innerHTML = elKernel.innerHTML = elSaida.innerHTML = "";
  entrada.forEach(linha => linha.forEach(v => elEntrada.appendChild(celula(v, 255))));
  k.forEach(linha => linha.forEach(v => {
    const d = document.createElement("div");
    d.textContent = kernelAtual === "media" ? "1/9" : v;
    d.style.cssText = "background:var(--papel2);color:var(--tinta)";
    elKernel.appendChild(d);
  }));
  let maximo = 255;
  if (kernelAtual === "vertical" || kernelAtual === "horizontal") {
    maximo = Math.max(1, ...entrada.flat().map((_, i) =>
      Math.abs(convolui(Math.floor(i / N), i % N, k))));
  }
  for (let l = 0; l < N; l++)
    for (let c = 0; c < N; c++) {
      const valor = convolui(l, c, k);
      const d = celula(valor, maximo);
      d.tabIndex = 0;
      d.setAttribute("role", "button");
      d.setAttribute("aria-label", `Ver conta: linha ${l}, coluna ${c}`);
      d.addEventListener("pointerenter", () => destaca(l, c, valor, k));
      d.addEventListener("focus", () => destaca(l, c, valor, k));
      d.addEventListener("click", () => destaca(l, c, valor, k));
      d.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          destaca(l, c, valor, k);
        }
      });
      elSaida.appendChild(d);
    }
  elConta.textContent = "Toque, foque ou passe o mouse sobre um pixel da saída para ver a conta.";
}
function destaca(l, c, valor, k) {
  [...elEntrada.children].forEach((d, i) => {
    const li = Math.floor(i / N), ci = i % N;
    d.classList.toggle("foco", Math.abs(li - l) <= 1 && Math.abs(ci - c) <= 1);
  });
  const termos = [];
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const kv = k[i + 1][j + 1];
      if (kv === 0) continue;
      const li = Math.min(N - 1, Math.max(0, l + i));
      const cj = Math.min(N - 1, Math.max(0, c + j));
      termos.push(`${kernelAtual === "media" ? "1/9" : kv}·${entrada[li][cj]}`);
    }
  elConta.textContent = `saída(${l},${c}) = ${termos.join(" + ").replaceAll("+ -", "− ")} = ${Math.round(valor)}`;
}
document.querySelectorAll("[data-k]").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll("[data-k]").forEach(b => b.classList.remove("ativo"));
  btn.classList.add("ativo");
  kernelAtual = btn.dataset.k;
  desenha();
}));
desenha();

const demoRoot = document.querySelector('[data-demo="convolucao"]');
function updatePressed() {
  for (const button of demoRoot.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.classList.contains('ativo')));
  }
}
demoRoot.addEventListener('click', updatePressed);
updatePressed();
