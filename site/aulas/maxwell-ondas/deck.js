// Motor da apresentação: escala o palco de 1600x900, navega por slides e por passos,
// e avisa as visualizações (V) de qual slide e qual passo estão na tela.
const Deck = (() => {
  const palco = document.getElementById("palco");
  const slides = [...palco.querySelectorAll(".slide")];
  const rodapeBloco = document.getElementById("rod-bloco");
  const rodapeNumero = document.getElementById("rod-num");
  const barra = document.getElementById("barra");
  const nomesDosBlocos = {
    1: "Bloco 1 · O que falta na lei de Ampère",
    2: "Bloco 2 · O mapa das quatro equações",
    3: "Bloco 3 · Da integral à derivada",
    4: "Bloco 4 · Das quatro equações à luz",
  };

  const api = { escala: 1, slides };
  let atual = -1;
  let passo = 0;

  function ultimoPasso(slide) {
    let maior = Number(slide.dataset.passos || 0);
    slide.querySelectorAll("[data-step]").forEach((el) => {
      maior = Math.max(maior, Number(el.dataset.step));
    });
    return maior;
  }

  function ajustar() {
    const escala = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    const dx = (window.innerWidth - 1600 * escala) / 2;
    const dy = (window.innerHeight - 900 * escala) / 2;
    api.escala = escala;
    palco.style.transform = `translate(${dx}px, ${dy}px) scale(${escala})`;
    V.redimensionar();
  }

  function aplicarPasso() {
    const slide = slides[atual];
    slide.dataset.passoAtual = String(passo);
    slide.querySelectorAll("[data-step]").forEach((el) => {
      const desde = Number(el.dataset.step);
      const ate = el.dataset.ate === undefined ? Infinity : Number(el.dataset.ate);
      el.classList.toggle("on", passo >= desde && passo <= ate);
    });
    V.passo(slide, passo);

    const id = slide.id.replace(/^s-/, "");
    history.replaceState(null, "", "#" + id + (passo ? "/" + passo : ""));
    rodapeBloco.textContent = nomesDosBlocos[slide.dataset.bloco] || "";
    rodapeNumero.textContent = `${atual + 1} / ${slides.length}`;
    barra.style.width = `${((atual + 1) / slides.length) * 100}%`;
    document.title = `${atual + 1}. ${slide.dataset.titulo || "Das quatro leis à luz"}`;
  }

  function ir(indice, novoPasso) {
    const destino = Math.max(0, Math.min(slides.length - 1, indice));
    if (destino !== atual) {
      if (atual >= 0) {
        slides[atual].classList.remove("atual");
        slides[atual].dataset.passoAtual = "0";
      }
      atual = destino;
      slides[atual].classList.add("atual");
      V.ativar(slides[atual]);
    }
    passo = Math.max(0, Math.min(ultimoPasso(slides[atual]), novoPasso || 0));
    aplicarPasso();
  }

  function avancar() {
    if (passo < ultimoPasso(slides[atual])) {
      passo += 1;
      aplicarPasso();
    } else if (atual < slides.length - 1) {
      ir(atual + 1, 0);
    }
  }

  function voltar() {
    if (passo > 0) {
      passo -= 1;
      aplicarPasso();
    } else if (atual > 0) {
      ir(atual - 1, ultimoPasso(slides[atual - 1]));
    }
  }

  function lerEndereco() {
    const texto = decodeURIComponent(location.hash.slice(1));
    if (!texto) return ir(0, 0);
    const [alvo, passoDoEndereco] = texto.split("/");
    let indice = /^\d+$/.test(alvo) ? Number(alvo) - 1 : slides.findIndex((s) => s.id === "s-" + alvo);
    if (indice < 0) indice = 0;
    ir(indice, Number(passoDoEndereco) || 0);
  }

  function alternarTema() {
    const raiz = document.documentElement;
    const escuro = raiz.dataset.theme === "escuro";
    if (escuro) delete raiz.dataset.theme;
    else raiz.dataset.theme = "escuro";
    try { localStorage.setItem("tema-aula", escuro ? "claro" : "escuro"); } catch (erro) { /* sem armazenamento */ }
    V.cores();
  }

  function aoTeclar(evento) {
    if (evento.target.matches("input, select, textarea")) return;
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    const tecla = evento.key;
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(tecla)) {
      evento.preventDefault();
      avancar();
    } else if (["ArrowLeft", "PageUp", "Backspace"].includes(tecla)) {
      evento.preventDefault();
      voltar();
    } else if (tecla === "Home") {
      ir(0, 0);
    } else if (tecla === "End") {
      ir(slides.length - 1, 0);
    } else if (tecla === "f" || tecla === "F") {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } else if (tecla === "t" || tecla === "T") {
      alternarTema();
    } else if (tecla === "n" || tecla === "N") {
      // a nota de aula só existe na cópia do professor: <html data-notas="notas.html">
      const notas = document.documentElement.dataset.notas;
      if (notas) window.open(notas + "#" + slides[atual].id, "_blank");
    }
  }

  function iniciar() {
    try {
      if (localStorage.getItem("tema-aula") === "escuro") document.documentElement.dataset.theme = "escuro";
    } catch (erro) { /* sem armazenamento */ }

    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
      macros: MACROS_DA_AULA,
      trust: true,
      strict: false,
      throwOnError: false,
    });

    // <span data-ref="id"> vira "slide N", para as referências não ficarem velhas se a ordem mudar
    slides.forEach((s) => { s.dataset.passoAtual = "0"; });
    document.querySelectorAll("[data-ref]").forEach((el) => {
      const indice = slides.findIndex((s) => s.id === "s-" + el.dataset.ref);
      el.textContent = indice >= 0 ? `slide ${indice + 1}` : "";
    });

    V.montar();
    ajustar();
    lerEndereco();

    window.addEventListener("resize", ajustar);
    window.addEventListener("keydown", aoTeclar);
    window.addEventListener("hashchange", lerEndereco);
    // no celular e no tablet, arrastar para o lado troca de slide (fora das animações e dos controles)
    let toque = null;
    palco.addEventListener("pointerdown", (evento) => {
      const emControle = evento.target.closest("canvas, input, button, a");
      toque = evento.pointerType === "mouse" || emControle ? null : { x: evento.clientX, y: evento.clientY };
    });
    palco.addEventListener("pointerup", (evento) => {
      if (!toque) return;
      const dx = evento.clientX - toque.x;
      const dy = evento.clientY - toque.y;
      toque = null;
      if (Math.abs(dx) < 70 || Math.abs(dx) < 2 * Math.abs(dy)) return;
      if (dx < 0) avancar();
      else voltar();
    });
    document.getElementById("nav-volta").addEventListener("click", voltar);
    document.getElementById("nav-avanca").addEventListener("click", avancar);
  }

  api.iniciar = iniciar;
  api.ir = ir;
  return api;
})();

Deck.iniciar();
