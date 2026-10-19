const deck = document.querySelector("[data-deck]");
const slides = [...deck.querySelectorAll(".slide")];
const controles = document.querySelector("[data-deck-controles]");
const contador = controles.querySelector("[data-deck-contador]");
const progresso = controles.querySelector("[data-deck-progresso]");
let atual = 0;

function indicePeloHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const indice = slides.findIndex((slide) => slide.id === id);
  return indice >= 0 ? indice : 0;
}

function mostrar(indice) {
  atual = Math.min(Math.max(indice, 0), slides.length - 1);
  slides.forEach((slide, posicao) => slide.classList.toggle("slide--atual", posicao === atual));
  slides[atual].scrollTop = 0;
  contador.textContent = `${atual + 1} / ${slides.length}`;
  progresso.style.width = `${((atual + 1) / slides.length) * 100}%`;
  history.replaceState(null, "", `#${slides[atual].id}`);
}

function alternarTelaCheia() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

function estaEditando(alvo) {
  return alvo.closest("input, select, textarea, [contenteditable='true']") !== null;
}

document.addEventListener("keydown", (evento) => {
  if (evento.altKey || evento.ctrlKey || evento.metaKey || estaEditando(evento.target)) return;
  const sobreBotao = evento.target.closest("button, a") !== null;
  if (["ArrowRight", "PageDown"].includes(evento.key) || (evento.key === " " && !sobreBotao)) {
    evento.preventDefault();
    mostrar(atual + 1);
  } else if (["ArrowLeft", "PageUp"].includes(evento.key)) {
    evento.preventDefault();
    mostrar(atual - 1);
  } else if (evento.key === "Home") {
    mostrar(0);
  } else if (evento.key === "End") {
    mostrar(slides.length - 1);
  } else if (evento.key === "f" || evento.key === "F") {
    alternarTelaCheia();
  }
});

let toqueInicial = null;
deck.addEventListener("touchstart", (evento) => {
  toqueInicial = evento.touches.length === 1 ? evento.touches[0] : null;
}, { passive: true });
deck.addEventListener("touchend", (evento) => {
  if (!toqueInicial || estaEditando(evento.target) || evento.target.closest("svg, .table-scroll, pre")) return;
  const dx = evento.changedTouches[0].clientX - toqueInicial.clientX;
  const dy = evento.changedTouches[0].clientY - toqueInicial.clientY;
  if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) mostrar(atual + (dx < 0 ? 1 : -1));
});

controles.querySelector("[data-deck-anterior]").addEventListener("click", () => mostrar(atual - 1));
controles.querySelector("[data-deck-proximo]").addEventListener("click", () => mostrar(atual + 1));
controles.querySelector("[data-deck-tela-cheia]").addEventListener("click", alternarTelaCheia);
window.addEventListener("hashchange", () => mostrar(indicePeloHash()));

document.body.classList.add("deck-ativo");
controles.hidden = false;
mostrar(indicePeloHash());
