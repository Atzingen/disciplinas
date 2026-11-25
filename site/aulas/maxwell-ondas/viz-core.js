// Macros do KaTeX usadas nos slides e na nota de aula: E em laranja, B em azul.
const MACROS_DA_AULA = {
  "\\cE": "\\htmlClass{cE}{#1}",
  "\\cB": "\\htmlClass{cB}{#1}",
  "\\cI": "\\htmlClass{cI}{#1}",
  "\\vE": "\\htmlClass{cE}{\\vec E}",
  "\\vB": "\\htmlClass{cB}{\\vec B}",
  "\\dl": "d\\vec\\ell",
  "\\dA": "d\\vec A",
  "\\rot": "\\nabla\\times",
  "\\dive": "\\nabla\\cdot",
};

// Núcleo das visualizações: registro, laço de animação, ponteiro, controles e
// funções de desenho compartilhadas. Cada visualização é uma fábrica que recebe
// `api` e devolve { draw(t, dt), passo(n), down, move, up }.
const V = (() => {
  const fabricas = {};
  const instancias = [];
  const c = {};
  const TAU = Math.PI * 2;
  let slideAtivo = null;
  let tempoAnterior = 0;

  function cores() {
    const estilo = getComputedStyle(document.documentElement);
    ["bg", "card", "fg", "muted", "line", "e", "b", "i", "a", "acento"].forEach((nome) => {
      c[nome] = estilo.getPropertyValue("--" + nome).trim();
    });
  }

  function alfa(hex, opacidade) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${opacidade})`;
  }

  function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
  }

  function numero(valor, casas) {
    const texto = (Math.abs(valor) < 0.5 * Math.pow(10, -casas) ? 0 : valor).toFixed(casas);
    return texto.replace(".", ",");
  }

  // ----- desenho -----

  function cabeca(ctx, x, y, angulo, tamanho, cor) {
    const bx = x - Math.cos(angulo) * tamanho;
    const by = y - Math.sin(angulo) * tamanho;
    const lx = -Math.sin(angulo) * tamanho * 0.45;
    const ly = Math.cos(angulo) * tamanho * 0.45;
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(bx + lx, by + ly);
    ctx.lineTo(bx - lx, by - ly);
    ctx.closePath();
    ctx.fill();
  }

  function seta(ctx, x1, y1, x2, y2, cor, largura = 2.5, tamanhoDaCabeca = 11) {
    const comprimento = Math.hypot(x2 - x1, y2 - y1);
    if (comprimento < 1) return;
    const angulo = Math.atan2(y2 - y1, x2 - x1);
    const cab = Math.min(tamanhoDaCabeca, comprimento * 0.7);
    ctx.strokeStyle = cor;
    ctx.lineWidth = largura;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(angulo) * cab * 0.85, y2 - Math.sin(angulo) * cab * 0.85);
    ctx.stroke();
    cabeca(ctx, x2, y2, angulo, cab, cor);
  }

  function texto(ctx, conteudo, x, y, opcoes = {}) {
    const tamanho = opcoes.t || 22;
    const peso = opcoes.neg ? "700" : "500";
    const estilo = opcoes.it ? "italic " : "";
    const familia = opcoes.serif ? "Georgia, 'Times New Roman', serif" : "'Space Grotesk', system-ui, sans-serif";
    ctx.font = `${estilo}${peso} ${tamanho}px ${familia}`;
    ctx.fillStyle = opcoes.cor || c.fg;
    ctx.textAlign = opcoes.al || "center";
    ctx.textBaseline = opcoes.base || "middle";
    ctx.fillText(conteudo, x, y);
  }

  // Letra de vetor (E, B, F) com a setinha em cima.
  function vetor(ctx, letra, x, y, cor, tamanho = 28) {
    texto(ctx, letra, x, y, { cor, t: tamanho, it: true, serif: true, neg: true });
    const meio = tamanho * 0.34;
    seta(ctx, x - meio, y - tamanho * 0.66, x + meio, y - tamanho * 0.66, cor, 1.8, 6);
  }

  function linha(ctx, pontos, cor, largura = 2, tracejado = null) {
    if (pontos.length < 2) return;
    ctx.strokeStyle = cor;
    ctx.lineWidth = largura;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.setLineDash(tracejado || []);
    ctx.beginPath();
    ctx.moveTo(pontos[0][0], pontos[0][1]);
    for (let i = 1; i < pontos.length; i++) ctx.lineTo(pontos[i][0], pontos[i][1]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function disco(ctx, x, y, raio, preenchimento, contorno = null, largura = 2) {
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, TAU);
    if (preenchimento) {
      ctx.fillStyle = preenchimento;
      ctx.fill();
    }
    if (contorno) {
      ctx.strokeStyle = contorno;
      ctx.lineWidth = largura;
      ctx.stroke();
    }
  }

  // Campo perpendicular à tela: ponto (saindo) ou xis (entrando), com tamanho pela intensidade.
  function simbolo(ctx, x, y, intensidade, cor, raioBase) {
    const modulo = Math.abs(intensidade);
    if (modulo < 0.05) return;
    const raio = raioBase * (0.45 + 0.55 * modulo);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * modulo;
    ctx.strokeStyle = cor;
    ctx.fillStyle = cor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, TAU);
    ctx.stroke();
    if (intensidade > 0) {
      ctx.beginPath();
      ctx.arc(x, y, raio * 0.3, 0, TAU);
      ctx.fill();
    } else {
      const d = raio * 0.6;
      ctx.beginPath();
      ctx.moveTo(x - d, y - d);
      ctx.lineTo(x + d, y + d);
      ctx.moveTo(x + d, y - d);
      ctx.lineTo(x - d, y + d);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Comprimentos acumulados de uma linha poligonal, para andar por ela.
  function acumular(pontos) {
    const acumulado = [0];
    for (let i = 1; i < pontos.length; i++) {
      acumulado.push(acumulado[i - 1] + Math.hypot(pontos[i][0] - pontos[i - 1][0], pontos[i][1] - pontos[i - 1][1]));
    }
    return acumulado;
  }

  function pontoEm(pontos, acumulado, s) {
    let baixo = 0;
    let alto = acumulado.length - 1;
    while (alto - baixo > 1) {
      const meio = (baixo + alto) >> 1;
      if (acumulado[meio] <= s) baixo = meio;
      else alto = meio;
    }
    const trecho = acumulado[alto] - acumulado[baixo] || 1;
    const f = (s - acumulado[baixo]) / trecho;
    const a = pontos[baixo];
    const b = pontos[alto];
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }

  // Cabeças de seta andando ao longo de uma linha: mostra o sentido do campo.
  function fluxo(ctx, pontos, acumulado, t, opcoes) {
    const total = acumulado[acumulado.length - 1];
    const espaco = opcoes.esp || 110;
    const velocidade = opcoes.vel === undefined ? 45 : opcoes.vel;
    const tamanho = opcoes.tam || 11;
    const limite = opcoes.limite;
    let s = (((t * velocidade) % espaco) + espaco) % espaco;
    for (; s < total; s += espaco) {
      const p = pontoEm(pontos, acumulado, s);
      if (limite && (p.x < limite[0] || p.x > limite[2] || p.y < limite[1] || p.y > limite[3])) continue;
      const angulo = velocidade < 0 ? p.ang + Math.PI : p.ang;
      cabeca(ctx, p.x + Math.cos(angulo) * tamanho * 0.5, p.y + Math.sin(angulo) * tamanho * 0.5, angulo, tamanho, opcoes.cor);
    }
  }

  // Projeção ortográfica: x para a direita, y para cima, z para o observador.
  function proj(p, cam) {
    const cy = Math.cos(cam.yaw);
    const sy = Math.sin(cam.yaw);
    const cp = Math.cos(cam.pitch);
    const sp = Math.sin(cam.pitch);
    const x1 = p[0] * cy + p[2] * sy;
    const z1 = -p[0] * sy + p[2] * cy;
    const y2 = p[1] * cp - z1 * sp;
    const z2 = p[1] * sp + z1 * cp;
    return [cam.cx + x1 * cam.esc, cam.cy - y2 * cam.esc, z2];
  }

  // ----- registro e ciclo de vida -----

  function reg(nome, fabrica) {
    fabricas[nome] = fabrica;
  }

  // Depois de um clique com o mouse, o foco sai do botão e o teclado volta a comandar os slides.
  // Acionado pelo teclado (evento.detail === 0), o botão mantém o foco.
  function soltarFocoSeMouse(evento, botao) {
    if (evento.detail > 0) botao.blur();
  }

  function criarApi(cv, largura, altura, controles) {
    const rotulos = {};
    const api = {
      cv,
      W: largura,
      H: altura,
      ctx: cv.getContext("2d"),
      modo: cv.dataset.modo || "",
      passo: 0,
      k: 1,
      botao(rotulo, aoClicar) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = rotulo;
        b.addEventListener("click", (evento) => {
          aoClicar(b);
          soltarFocoSeMouse(evento, b);
        });
        controles.append(b);
        return b;
      },
      alterna(rotulo, inicial, aoMudar) {
        const b = api.botao(rotulo, () => {
          b.classList.toggle("lig");
          aoMudar(b.classList.contains("lig"));
        });
        b.classList.toggle("lig", Boolean(inicial));
        return b;
      },
      escolha(opcoes, inicial, aoEscolher) {
        const grupo = document.createElement("div");
        grupo.className = "grupo";
        opcoes.forEach(([valor, rotulo]) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = rotulo;
          b.classList.toggle("lig", valor === inicial);
          b.addEventListener("click", (evento) => {
            grupo.querySelectorAll("button").forEach((outro) => outro.classList.remove("lig"));
            b.classList.add("lig");
            aoEscolher(valor);
            soltarFocoSeMouse(evento, b);
          });
          grupo.append(b);
        });
        controles.append(grupo);
        return grupo;
      },
      desliza(rotulo, minimo, maximo, valor, incremento, aoMudar) {
        const caixa = document.createElement("label");
        caixa.className = "desl";
        const nome = document.createElement("span");
        nome.textContent = rotulo;
        const entrada = document.createElement("input");
        entrada.type = "range";
        entrada.min = minimo;
        entrada.max = maximo;
        entrada.step = incremento;
        entrada.value = valor;
        // Arrastado com o mouse, o controle solta o foco no fim, e o teclado volta a comandar os
        // slides. Usado pelo teclado, mantém o foco, para as setas continuarem ajustando o valor.
        let porPonteiro = false;
        entrada.addEventListener("pointerdown", () => {
          porPonteiro = true;
        });
        entrada.addEventListener("keydown", () => {
          porPonteiro = false;
        });
        entrada.addEventListener("input", () => aoMudar(Number(entrada.value)));
        entrada.addEventListener("change", () => {
          if (porPonteiro) entrada.blur();
        });
        caixa.append(nome, entrada);
        controles.append(caixa);
        return entrada;
      },
      dica(conteudo) {
        const el = document.createElement("span");
        el.className = "dica";
        el.textContent = conteudo;
        controles.append(el);
        return el;
      },
      // Posiciona um rótulo em KaTeX (span.rot[data-r]) sobre o canvas.
      rotulo(nome, x, y, visivel = true) {
        if (!(nome in rotulos)) rotulos[nome] = cv.parentElement.querySelector(`.rot[data-r="${nome}"]`);
        const el = rotulos[nome];
        if (!el) return;
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.opacity = visivel ? "1" : "0";
      },
    };
    return api;
  }

  function montar() {
    cores();
    document.querySelectorAll("canvas[data-viz]").forEach((cv) => {
      const largura = Number(cv.getAttribute("width"));
      const altura = Number(cv.getAttribute("height"));
      cv.style.width = largura + "px";
      cv.style.height = altura + "px";
      cv.classList.add("viz");

      const controles = document.createElement("div");
      controles.className = "ctl";
      controles.style.maxWidth = largura + "px";
      const ancora = cv.parentElement.classList.contains("palco-viz") ? cv.parentElement : cv;
      ancora.after(controles);

      const api = criarApi(cv, largura, altura, controles);
      const fabrica = fabricas[cv.dataset.viz];
      if (!fabrica) {
        console.error("visualização não registrada:", cv.dataset.viz);
        return;
      }
      const objeto = fabrica(api) || {};
      instancias.push({ cv, api, objeto, slide: cv.closest(".slide"), falhou: false });

      const posicao = (evento) => {
        const r = cv.getBoundingClientRect();
        return [((evento.clientX - r.left) * largura) / r.width, ((evento.clientY - r.top) * altura) / r.height];
      };
      cv.addEventListener("pointerdown", (evento) => {
        cv.setPointerCapture(evento.pointerId);
        const [x, y] = posicao(evento);
        if (objeto.down) objeto.down(x, y);
        evento.preventDefault();
      });
      cv.addEventListener("pointermove", (evento) => {
        const [x, y] = posicao(evento);
        if (objeto.move) objeto.move(x, y, evento.buttons > 0);
      });
      cv.addEventListener("pointerup", () => {
        if (objeto.up) objeto.up();
      });
    });
    requestAnimationFrame(quadro);
  }

  function redimensionar() {
    const fator = limitar(Deck.escala * (window.devicePixelRatio || 1), 1, 3);
    instancias.forEach((inst) => {
      inst.api.k = fator;
      inst.cv.width = Math.round(inst.api.W * fator);
      inst.cv.height = Math.round(inst.api.H * fator);
    });
  }

  function ativar(slide) {
    slideAtivo = slide;
    instancias.forEach((inst) => {
      if (inst.slide === slide && inst.objeto.entra) inst.objeto.entra();
    });
  }

  function passo(slide, n) {
    instancias.forEach((inst) => {
      if (inst.slide !== slide) return;
      inst.api.passo = n;
      if (inst.objeto.passo) inst.objeto.passo(n);
    });
  }

  function quadro(agora) {
    const t = agora / 1000;
    const dt = Math.min(0.05, Math.max(0, t - tempoAnterior));
    tempoAnterior = t;
    for (const inst of instancias) {
      if (inst.slide !== slideAtivo || !inst.objeto.draw || inst.falhou) continue;
      const ctx = inst.api.ctx;
      ctx.setTransform(inst.api.k, 0, 0, inst.api.k, 0, 0);
      ctx.clearRect(0, 0, inst.api.W, inst.api.H);
      ctx.save();
      try {
        inst.objeto.draw(t, dt);
      } catch (erro) {
        inst.falhou = true;
        console.error("erro na visualização", inst.cv.dataset.viz, erro);
      }
      ctx.restore();
    }
    requestAnimationFrame(quadro);
  }

  return {
    TAU, c, cores, alfa, limitar, numero,
    cabeca, seta, texto, vetor, linha, disco, simbolo, acumular, pontoEm, fluxo, proj,
    reg, montar, redimensionar, ativar, passo,
  };
})();
