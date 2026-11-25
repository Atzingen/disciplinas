// Bloco 2: fluxo e circulação, as duas leis de Gauss, Faraday, o mapa das quatro leis e a força de Lorentz.
(() => {
  const { TAU, c, alfa, limitar, numero, cabeca, seta, texto, vetor, linha, disco, simbolo } = V;

  const comSinal = (valor, casas) => (valor > 0.5 * Math.pow(10, -casas) ? "+" : "") + numero(valor, casas);

  // ----- dois tipos de conta: fluxo e circulação -----

  V.reg("fluxocirc", (api) => ({
    draw(t) {
      const { ctx, W, H } = api;
      const R = 158;
      const N = 40;
      const cy = H / 2 + 6;
      const fracao = Math.min(1, (t % 10) / 7.5);
      const ate = Math.floor(fracao * N + 1e-9);

      const painel = (cx, tipo) => {
        const fluxo = tipo === "fluxo";
        const fonte = fluxo ? [cx - 55, cy + 30] : [cx + 50, cy - 28];
        const cor = fluxo ? c.e : c.b;
        const sinal = fluxo ? 1 : -1;
        texto(ctx, fluxo ? "Fluxo por superfície fechada" : "Circulação por curva fechada", cx, 34, { t: 28, neg: true });

        disco(ctx, cx, cy, R, alfa(c.a, 0.06), alfa(c.a, 0.5), 3);
        if (ate > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, (sinal * ate * TAU) / N, !fluxo);
          ctx.strokeStyle = c.a;
          ctx.lineWidth = 7;
          ctx.stroke();
        }

        let soma = 0;
        for (let i = 0; i < N; i++) {
          const an = (sinal * i * TAU) / N;
          const nx = Math.cos(an);
          const ny = Math.sin(an);
          const px = cx + R * nx;
          const py = cy + R * ny;
          const dx = px - fonte[0];
          const dy = py - fonte[1];
          const d2 = dx * dx + dy * dy;
          // fluxo: campo radial de uma carga; circulação: campo que gira em volta de um fio
          const fx = fluxo ? dx / d2 : dy / d2;
          const fy = fluxo ? dy / d2 : -dx / d2;
          // direção de referência: a normal (fluxo) ou a tangente no sentido anti-horário (circulação)
          const ux = fluxo ? nx : ny;
          const uy = fluxo ? ny : -nx;
          const componente = fx * ux + fy * uy;
          const escala = 5200;
          seta(ctx, px, py, px + fx * escala, py + fy * escala, alfa(c.muted, 0.55), 2, 8);
          if (i < ate) {
            soma += (componente * R) / N;
            seta(ctx, px, py, px + ux * componente * escala, py + uy * componente * escala, cor, 3.5, 10);
          }
        }

        if (fluxo) {
          disco(ctx, fonte[0], fonte[1], 16, c.e);
          texto(ctx, "+", fonte[0], fonte[1] + 1, { cor: "#ffffff", t: 26, neg: true });
        } else {
          disco(ctx, fonte[0], fonte[1], 16, c.card, c.i, 3.5);
          disco(ctx, fonte[0], fonte[1], 5, c.i);
          texto(ctx, "I", fonte[0] + 30, fonte[1] - 6, { cor: c.i, t: 26, it: true, serif: true, neg: true });
        }
        const anMarca = (sinal * ate * TAU) / N;
        disco(ctx, cx + R * Math.cos(anMarca), cy + R * Math.sin(anMarca), 9, c.a);

        const unidade = fluxo ? "em unidades de Q/ε₀" : "em unidades de μ₀I";
        const nome = fluxo ? "fluxo somado até aqui" : "circulação somada até aqui";
        texto(ctx, `${nome}: ${numero(soma, 2)}  (${unidade})`, cx, H - 52, { t: 24, neg: true });
        texto(ctx, fluxo ? "em cada pedaço, conta a parte do campo perpendicular à superfície" : "em cada pedaço, conta a parte do campo ao longo da curva", cx, H - 20, { t: 20, cor: c.muted });
      };

      painel(W * 0.25, "fluxo");
      painel(W * 0.75, "circ");
      linha(ctx, [[W / 2, 70], [W / 2, H - 80]], c.line, 2);
    },
  }));

  // ----- lei de Gauss: cargas arrastáveis e fluxo pela superfície -----

  V.reg("gaussE", (api) => {
    const { W, H } = api;
    const S = { x: W / 2, y: H / 2 + 14, r: 165 };
    let cargas = [];
    let linhas = [];
    let sujo = true;
    let pega = -1;

    function recomecar() {
      cargas = [{ x: S.x, y: S.y, q: 1 }];
      sujo = true;
    }
    recomecar();

    function campo(x, y) {
      let ex = 0;
      let ey = 0;
      for (const q of cargas) {
        const dx = x - q.x;
        const dy = y - q.y;
        const d2 = dx * dx + dy * dy + 1e-6;
        ex += (q.q * dx) / d2;
        ey += (q.q * dy) / d2;
      }
      return [ex, ey];
    }

    function tracar(x, y, sentido) {
      const pts = [[x, y]];
      for (let i = 0; i < 700; i++) {
        let [ex, ey] = campo(x, y);
        let m = Math.hypot(ex, ey);
        if (m < 1e-8) break;
        const h = 5 * sentido;
        [ex, ey] = campo(x + (ex / m) * h * 0.5, y + (ey / m) * h * 0.5);
        m = Math.hypot(ex, ey);
        if (m < 1e-8) break;
        x += (ex / m) * h;
        y += (ey / m) * h;
        pts.push([x, y]);
        if (x < -60 || x > W + 60 || y < -60 || y > H + 60) break;
        if (cargas.some((q) => q.q * sentido < 0 && Math.hypot(x - q.x, y - q.y) < 13)) break;
      }
      return pts;
    }

    function refazer() {
      linhas = [];
      const haPositiva = cargas.some((q) => q.q > 0);
      for (const q of cargas) {
        // as linhas saem das cargas positivas; sem positiva nenhuma, são traçadas de trás para a frente
        if (haPositiva ? q.q < 0 : q.q > 0) continue;
        const sentido = q.q > 0 ? 1 : -1;
        for (let j = 0; j < 12; j++) {
          const an = ((j + 0.5) / 12) * TAU;
          const pts = tracar(q.x + 15 * Math.cos(an), q.y + 15 * Math.sin(an), sentido);
          if (sentido < 0) pts.reverse();
          linhas.push({ pts, cum: V.acumular(pts) });
        }
      }
      sujo = false;
    }

    function acrescentar(q, x, y) {
      if (cargas.length >= 6) return;
      cargas.push({ x: x + (Math.random() - 0.5) * 50, y: y + (Math.random() - 0.5) * 40, q });
      sujo = true;
    }

    api.botao("+ carga positiva", () => acrescentar(1, S.x + 290, S.y - 170));
    api.botao("+ carga negativa", () => acrescentar(-1, S.x - 290, S.y + 170));
    api.botao("recomeçar", recomecar);
    api.dica("arraste as cargas para dentro e para fora");

    return {
      down(x, y) {
        pega = cargas.findIndex((q) => Math.hypot(x - q.x, y - q.y) < 28);
      },
      move(x, y, pressionado) {
        if (pega < 0 || !pressionado) return;
        cargas[pega].x = limitar(x, 20, W - 20);
        cargas[pega].y = limitar(y, 20, H - 20);
        sujo = true;
      },
      up() {
        pega = -1;
      },
      draw(t) {
        const ctx = api.ctx;
        if (sujo) refazer();

        for (const l of linhas) {
          linha(ctx, l.pts, alfa(c.e, 0.8), 2.2);
          V.fluxo(ctx, l.pts, l.cum, t, { cor: c.e, esp: 120, vel: 50, tam: 12, limite: [0, 0, W, H] });
        }

        disco(ctx, S.x, S.y, S.r, alfa(c.a, 0.09));
        ctx.setLineDash([11, 8]);
        disco(ctx, S.x, S.y, S.r, null, c.a, 3.5);
        ctx.setLineDash([]);
        texto(ctx, "S", S.x + S.r * 0.76 + 14, S.y + S.r * 0.76 + 10, { cor: c.a, t: 30, it: true, serif: true, neg: true });

        // fluxo pela superfície: laranja onde o campo sai, cinza onde entra
        const N = 360;
        let soma = 0;
        for (let i = 0; i < N; i++) {
          const an = (i * TAU) / N;
          const nx = Math.cos(an);
          const ny = Math.sin(an);
          const px = S.x + S.r * nx;
          const py = S.y + S.r * ny;
          const [ex, ey] = campo(px, py);
          const en = ex * nx + ey * ny;
          soma += en;
          if (i % 6 === 0) {
            const comprimento = limitar(en * 4400, -40, 40);
            ctx.strokeStyle = comprimento > 0 ? c.e : c.muted;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + nx * comprimento, py + ny * comprimento);
            ctx.stroke();
          }
        }
        const fluxoTotal = (soma * S.r) / N;

        let dentro = 0;
        for (const q of cargas) {
          const positiva = q.q > 0;
          disco(ctx, q.x, q.y, 17, positiva ? c.e : c.b, c.card, 2.5);
          texto(ctx, positiva ? "+" : "−", q.x, q.y + 1, { cor: "#ffffff", t: 26, neg: true });
          if (Math.hypot(q.x - S.x, q.y - S.y) < S.r) dentro += q.q;
        }

        ctx.fillStyle = alfa(c.card, 0.88);
        ctx.fillRect(14, 12, 560, 76);
        texto(ctx, `carga dentro da superfície: ${dentro > 0 ? "+" : ""}${dentro} q`, 26, 34, { al: "left", t: 24, neg: true });
        texto(ctx, `fluxo de E pela superfície: ${comSinal(fluxoTotal, 2)}  (em unidades de q/ε₀)`, 26, 66, { al: "left", t: 22, cor: c.e, neg: true });
      },
    };
  });

  // ----- ímã: linhas de B sempre fechadas -----
  // O ímã é modelado como um solenoide em corte: uma fileira de correntes saindo da tela
  // em cima e outra entrando embaixo. O campo resultante não tem divergência em lugar nenhum.

  function correntesDoIma(pecas, cy, h, espaco) {
    const correntes = [];
    for (const p of pecas) {
      const n = Math.max(8, Math.round((p.x1 - p.x0) / espaco));
      for (let i = 0; i < n; i++) {
        const x = p.x0 + ((i + 0.5) * (p.x1 - p.x0)) / n;
        correntes.push([x, cy - h, -1], [x, cy + h, 1]);
      }
    }
    return correntes;
  }

  function campoDoIma(correntes, x, y) {
    let bx = 0;
    let by = 0;
    for (const k of correntes) {
      const dx = x - k[0];
      const dy = y - k[1];
      const d2 = dx * dx + dy * dy + 9;
      bx += (k[2] * -dy) / d2;
      by += (k[2] * dx) / d2;
    }
    return [bx, by];
  }

  function tracarNoIma(correntes, sx, sy, sentido, limite) {
    const pts = [[sx, sy]];
    let x = sx;
    let y = sy;
    let fechou = false;
    for (let i = 0; i < limite; i++) {
      let [bx, by] = campoDoIma(correntes, x, y);
      let m = Math.hypot(bx, by) || 1;
      const h = 4 * sentido;
      [bx, by] = campoDoIma(correntes, x + (bx / m) * h * 0.5, y + (by / m) * h * 0.5);
      m = Math.hypot(bx, by) || 1;
      x += (bx / m) * h;
      y += (by / m) * h;
      pts.push([x, y]);
      if (i > 20 && Math.hypot(x - sx, y - sy) < 5) {
        pts.push([sx, sy]);
        fechou = true;
        break;
      }
      if (Math.abs(x) > 6000 || Math.abs(y) > 6000) break;
    }
    return { pts, fechou };
  }

  // Linha que não fechou dentro do limite é traçada também para trás, para o corte ficar longe da tela.
  function linhasDoIma(correntes, sementes, limite) {
    return sementes.map(([sx, sy]) => {
      const frente = tracarNoIma(correntes, sx, sy, 1, limite);
      let pts = frente.pts;
      if (!frente.fechou) {
        const tras = tracarNoIma(correntes, sx, sy, -1, limite).pts;
        tras.reverse();
        pts = tras.concat(pts.slice(1));
      }
      return { pts, cum: V.acumular(pts) };
    });
  }

  function desenharIma(ctx, x0, x1, cy, h, tamanhoDaLetra) {
    const meio = (x0 + x1) / 2;
    ctx.fillStyle = alfa(c.card, 0.9);
    ctx.fillRect(x0, cy - h, x1 - x0, 2 * h);
    ctx.fillStyle = alfa(c.muted, 0.3);
    ctx.fillRect(x0, cy - h, meio - x0, 2 * h);
    ctx.fillStyle = alfa(c.acento, 0.32);
    ctx.fillRect(meio, cy - h, x1 - meio, 2 * h);
    ctx.strokeStyle = c.fg;
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, cy - h, x1 - x0, 2 * h);
    texto(ctx, "S", (x0 + meio) / 2, cy + 1, { t: tamanhoDaLetra, neg: true });
    texto(ctx, "N", (meio + x1) / 2, cy + 1, { t: tamanhoDaLetra, neg: true });
  }

  V.reg("gaussB", (api) => {
    const { W, H } = api;
    const cy = H / 2 + 10;
    const h = 34;
    const x0 = W / 2 - 125;
    const x1 = W / 2 + 125;
    const S = { x: W / 2 + 150, y: cy, r: 115 };
    let partido = false;
    let vao = 0;
    let vaoCalculado = -99;
    let correntes = [];
    let linhas = [];
    let campoDeReferencia = 1;
    let arrastando = false;
    let desvio = [0, 0];

    function pecas() {
      if (!partido && vao < 0.5) return [{ x0, x1 }];
      return [{ x0: x0 - vao, x1: W / 2 - 5 - vao }, { x0: W / 2 + 5 + vao, x1: x1 + vao }];
    }

    function recalcular() {
      const ps = pecas();
      correntes = correntesDoIma(ps, cy, h, 6);
      const fracoes = ps.length > 1 ? [-0.62, -0.3, 0.3, 0.62] : [-0.72, -0.5, -0.3, -0.12, 0.12, 0.3, 0.5, 0.72];
      const sementes = [];
      for (const p of ps) for (const f of fracoes) sementes.push([(p.x0 + p.x1) / 2, cy + f * h]);
      linhas = linhasDoIma(correntes, sementes, 1600);
      campoDeReferencia = Math.abs(campoDoIma(correntes, (ps[0].x0 + ps[0].x1) / 2, cy)[0]) || 1;
      vaoCalculado = vao;
    }

    api.botao("partir o ímã ao meio", (botao) => {
      partido = !partido;
      botao.textContent = partido ? "juntar de novo" : "partir o ímã ao meio";
    });
    api.dica("arraste a superfície roxa para qualquer lugar");

    return {
      down(x, y) {
        if (Math.hypot(x - S.x, y - S.y) < S.r + 16) {
          arrastando = true;
          desvio = [S.x - x, S.y - y];
        }
      },
      move(x, y, pressionado) {
        if (!arrastando || !pressionado) return;
        S.x = limitar(x + desvio[0], S.r * 0.4, W - S.r * 0.4);
        S.y = limitar(y + desvio[1], S.r * 0.4, H - S.r * 0.4);
      },
      up() {
        arrastando = false;
      },
      draw(t, dt) {
        const ctx = api.ctx;
        const alvo = partido ? 55 : 0;
        vao += (alvo - vao) * Math.min(1, dt * 3);
        if (Math.abs(vao - alvo) < 0.3) vao = alvo;
        if (Math.abs(vao - vaoCalculado) > 4 || (vao === alvo && vaoCalculado !== vao)) recalcular();

        for (const l of linhas) {
          linha(ctx, l.pts, alfa(c.b, 0.85), 2.2);
          V.fluxo(ctx, l.pts, l.cum, t, { cor: c.b, esp: 130, vel: 50, tam: 12, limite: [0, 0, W, H] });
        }
        for (const p of pecas()) desenharIma(ctx, p.x0, p.x1, cy, h, 30);

        disco(ctx, S.x, S.y, S.r, alfa(c.a, 0.1));
        ctx.setLineDash([11, 8]);
        disco(ctx, S.x, S.y, S.r, null, c.a, 3.5);
        ctx.setLineDash([]);

        const N = 180;
        let soma = 0;
        for (let i = 0; i < N; i++) {
          const an = (i * TAU) / N;
          const nx = Math.cos(an);
          const ny = Math.sin(an);
          const px = S.x + S.r * nx;
          const py = S.y + S.r * ny;
          const [bx, by] = campoDoIma(correntes, px, py);
          const bn = bx * nx + by * ny;
          soma += bn;
          if (i % 4 === 0) {
            const comprimento = limitar((bn / campoDeReferencia) * 70, -42, 42);
            ctx.strokeStyle = comprimento > 0 ? c.b : c.muted;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + nx * comprimento, py + ny * comprimento);
            ctx.stroke();
          }
        }
        const fluxoTotal = (soma * ((TAU * S.r) / N)) / (campoDeReferencia * 2 * h);

        ctx.fillStyle = alfa(c.card, 0.88);
        ctx.fillRect(14, 12, 520, 76);
        texto(ctx, `fluxo de B pela superfície: ${numero(fluxoTotal, 2)}`, 26, 34, { al: "left", t: 24, neg: true, cor: c.b });
        texto(ctx, "o que sai (azul) é igual ao que entra (cinza)", 26, 66, { al: "left", t: 21, cor: c.muted });
      },
    };
  });

  // ----- lei de Faraday: ímã, espira, galvanômetro e os gráficos de fluxo e fem -----

  V.reg("faraday", (api) => {
    const { W, H } = api;
    const y0 = 232;
    const xl = 600;
    const rx = 40;
    const ry = 100;
    const L = 190;
    const hm = 30;
    let xm = 200;
    let automatico = true;
    let arrastando = false;
    let tempoAuto = 0;
    let fluxoAnterior = null;
    let fem = 0;
    let fase = 0;
    const historia = [];

    const botaoAuto = api.alterna("movimento automático", true, (ligado) => {
      automatico = ligado;
    });
    api.dica("ou arraste o ímã com o mouse");

    const u = (d) => d / Math.hypot(d, ry * 0.9);
    // fluxo de um ímã de dois polos pela espira: suave, máximo com o ímã centrado na espira
    const fluxoPelaEspira = () => 0.5 * (u(xl - xm + L / 2) - u(xl - xm - L / 2));

    function bobina(ctx, perto) {
      for (const dx of [-10, 0, 10]) {
        ctx.beginPath();
        ctx.ellipse(xl + dx, y0, rx, ry, 0, perto ? Math.PI / 2 : -Math.PI / 2, perto ? Math.PI * 1.5 : Math.PI / 2);
        ctx.strokeStyle = c.fg;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      const intensidade = Math.min(1, Math.abs(fem) * 1.3);
      if (intensidade < 0.04) return;
      for (let i = 0; i < 6; i++) {
        const psi = (i * TAU) / 6 + fase;
        if (Math.sin(psi) > 0 !== perto) continue;
        let ang = Math.atan2(ry * Math.sin(psi), -rx * Math.cos(psi));
        if (fem < 0) ang += Math.PI;
        cabeca(ctx, xl - rx * Math.sin(psi) + Math.cos(ang) * 8, y0 - ry * Math.cos(psi) + Math.sin(ang) * 8, ang, 16, alfa(c.i, 0.3 + 0.7 * intensidade));
      }
    }

    function ima(ctx) {
      for (let k = 1; k <= 3; k++) {
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(xm + L / 2, y0 + s * 8);
          ctx.bezierCurveTo(xm + L / 2 + 70 * k, y0 + s * (46 * k + 6), xm - L / 2 - 70 * k, y0 + s * (46 * k + 6), xm - L / 2, y0 + s * 8);
          ctx.strokeStyle = alfa(c.b, 0.4);
          ctx.lineWidth = 1.8;
          ctx.stroke();
          cabeca(ctx, xm - 6, y0 + s * (34.5 * k + 6.5), Math.PI, 11, alfa(c.b, 0.6));
        }
      }
      ctx.fillStyle = c.muted;
      ctx.fillRect(xm - L / 2, y0 - hm, L / 2, 2 * hm);
      ctx.fillStyle = c.acento;
      ctx.fillRect(xm, y0 - hm, L / 2, 2 * hm);
      texto(ctx, "S", xm - L / 4, y0 + 1, { cor: "#ffffff", t: 30, neg: true });
      texto(ctx, "N", xm + L / 4, y0 + 1, { cor: "#ffffff", t: 30, neg: true });
    }

    function galvanometro(ctx) {
      const gx = xl;
      const gy = 60;
      linha(ctx, [[xl - 12, y0 - ry + 4], [xl - 12, gy + 42]], c.fg, 2.5);
      linha(ctx, [[xl + 12, y0 - ry + 4], [xl + 12, gy + 42]], c.fg, 2.5);
      disco(ctx, gx, gy, 46, c.card, c.fg, 3);
      for (let k = -2; k <= 2; k++) {
        const an = -Math.PI / 2 + k * 0.42;
        linha(ctx, [[gx + 34 * Math.cos(an), gy + 24 + 34 * Math.sin(an)], [gx + 41 * Math.cos(an), gy + 24 + 41 * Math.sin(an)]], c.muted, 2);
      }
      const angulo = limitar(fem * 1.0, -0.95, 0.95);
      seta(ctx, gx, gy + 24, gx + 52 * Math.sin(angulo), gy + 24 - 52 * Math.cos(angulo), c.acento, 3.5, 11);
      disco(ctx, gx, gy + 24, 5, c.fg);
    }

    return {
      down(x) {
        arrastando = true;
        automatico = false;
        botaoAuto.classList.remove("lig");
        xm = limitar(x, 110, W - 110);
      },
      move(x, y, pressionado) {
        if (arrastando && pressionado) xm = limitar(x, 110, W - 110);
      },
      up() {
        arrastando = false;
      },
      draw(t, dt) {
        const ctx = api.ctx;
        if (automatico && !arrastando) {
          tempoAuto += dt;
          const alvo = 330 + 215 * Math.sin(0.9 * tempoAuto);
          xm += (alvo - xm) * Math.min(1, dt * 5);
        }
        const fluxoAgora = fluxoPelaEspira();
        if (fluxoAnterior !== null && dt > 0) {
          const bruta = -(fluxoAgora - fluxoAnterior) / dt;
          fem += (bruta - fem) * 0.2;
        }
        fluxoAnterior = fluxoAgora;
        fase += fem * dt * 5;
        historia.push([fluxoAgora, fem]);
        if (historia.length > 440) historia.shift();

        bobina(ctx, false);
        ima(ctx);
        bobina(ctx, true);
        galvanometro(ctx);

        // gráficos de Φ(t) e da fem
        const esquerda = 50;
        const direita = W - 50;
        const zero = H - 78;
        linha(ctx, [[esquerda, zero], [direita, zero]], c.line, 2);
        const xDe = (i) => direita - (historia.length - 1 - i) * ((direita - esquerda) / 440);
        linha(ctx, historia.map((p, i) => [xDe(i), zero - p[0] * 128]), c.b, 3);
        linha(ctx, historia.map((p, i) => [xDe(i), zero - limitar(p[1], -1.3, 1.3) * 52]), c.e, 3);
        texto(ctx, "fluxo de B pela espira", esquerda, H - 176, { al: "left", t: 22, cor: c.b, neg: true });
        texto(ctx, "fem = − (taxa de variação do fluxo)", esquerda + 290, H - 176, { al: "left", t: 22, cor: c.e, neg: true });
        texto(ctx, "tempo →", direita, H - 14, { al: "right", t: 18, cor: c.muted });
      },
    };
  });

  // ----- o mapa: as quatro leis animadas lado a lado -----

  V.reg("mapa4", (api) => {
    const { W, H } = api;
    const larg = W / 4;
    const cy = H / 2;
    const correntesMini = correntesDoIma([{ x0: -52, x1: 52 }], 0, 13, 5);
    const linhasMini = linhasDoIma(correntesMini, [[0, -8.5], [0, -4], [0, 4], [0, 8.5]], 500);

    function gauss(ctx, cx, t) {
      for (let j = 0; j < 12; j++) {
        const an = (j * TAU) / 12;
        const pts = [[cx + 18 * Math.cos(an), cy + 18 * Math.sin(an)], [cx + 128 * Math.cos(an), cy + 128 * Math.sin(an)]];
        linha(ctx, pts, alfa(c.e, 0.8), 2.2);
        V.fluxo(ctx, pts, [0, 110], t, { cor: c.e, esp: 55, vel: 30, tam: 11 });
      }
      ctx.setLineDash([8, 7]);
      disco(ctx, cx, cy, 74, alfa(c.a, 0.08), c.a, 2.5);
      ctx.setLineDash([]);
      disco(ctx, cx, cy, 15, c.e);
      texto(ctx, "+", cx, cy + 1, { cor: "#ffffff", t: 24, neg: true });
    }

    function gaussMagnetica(ctx, cx, t) {
      ctx.save();
      ctx.translate(cx - 20, cy);
      for (const l of linhasMini) {
        linha(ctx, l.pts, alfa(c.b, 0.85), 2.2);
        V.fluxo(ctx, l.pts, l.cum, t, { cor: c.b, esp: 90, vel: 34, tam: 11 });
      }
      desenharIma(ctx, -52, 52, 0, 13, 17);
      ctx.setLineDash([8, 7]);
      disco(ctx, 56, 0, 50, alfa(c.a, 0.08), c.a, 2.5);
      ctx.setLineDash([]);
      ctx.restore();
    }

    function faraday(ctx, cx, t) {
      V.painel(ctx, cx, cy, Math.min(larg * 0.4, H * 0.45), t, "faraday", false);
    }

    function ampereMaxwell(ctx, cx, t) {
      const xa = cx - 84;
      const xb = cx + 88;
      V.anelB(ctx, xa, cy + 8, 62, 19, t, 1.6, false, 1);
      V.fioComCorrente(ctx, xa, H - 30, 46, t);
      V.anelB(ctx, xa, cy + 8, 62, 19, t, 1.6, true, 1);
      V.anelB(ctx, xb, cy + 8, 62, 19, t, 1.6, false, 1);
      V.feixeE(ctx, xb, H - 30, 40, t);
      V.anelB(ctx, xb, cy + 8, 62, 19, t, 1.6, true, 1);
      texto(ctx, "+", cx + 2, cy + 8, { t: 40, neg: true });
    }

    const paineis = [gauss, gaussMagnetica, faraday, ampereMaxwell];

    return {
      draw(t) {
        const ctx = api.ctx;
        paineis.forEach((desenhar, k) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(k * larg + 2, 0, larg - 4, H);
          ctx.clip();
          desenhar(ctx, (k + 0.5) * larg, t);
          ctx.restore();
          if (k > 0) linha(ctx, [[k * larg, 16], [k * larg, H - 16]], c.line, 2);
        });
      },
    };
  });

  // ----- força de Lorentz como jogo: levar a carga até o gol ajustando os campos -----

  V.reg("lorentz", (api) => {
    const { W, H } = api;
    const velocidadeInicial = 230;
    const forcaB = 3.0; // giro em rad/s por unidade de B
    const forcaE = 160; // aceleração em px/s² por unidade de E
    const partida = [-W / 2 + 70, 0];
    // Gols: retângulos (centro, largura, altura), com origem no meio da tela e y para cima.
    const gols = [
      { x: W / 2 - 24, y: 150, w: 48, h: 120 },
      { x: 260, y: H / 2 - 24, w: 130, h: 48 },
      { x: W / 2 - 24, y: -150, w: 48, h: 120 },
      { x: -80, y: -H / 2 + 24, w: 130, h: 48 },
      { x: -W / 2 + 24, y: 160, w: 48, h: 120 },
      { x: -W / 2 + 24, y: -160, w: 48, h: 120 },
    ];
    let indice = 0;
    let placar = 0;
    let sinal = 1;
    let campoE = 0;
    let campoB = 0;
    let p = [0, 0];
    let v = [0, 0];
    let rastro = [];
    let rastroAnterior = [];
    let voando = false;
    let tempoDeVoo = 0;
    let pausa = 0;
    let festa = 0;

    // o controle anda ao quadrado: ajuste fino perto do zero, campo forte nas pontas
    const fino = (s) => s * Math.abs(s);
    const naTela = (x, y) => [W / 2 + x, H / 2 - y];

    function lancar() {
      rastroAnterior = rastro;
      rastro = [];
      p = [partida[0], partida[1]];
      v = [velocidadeInicial, 0];
      voando = true;
      tempoDeVoo = 0;
    }
    lancar();

    api.botao("carga positiva", (botao) => {
      sinal = -sinal;
      botao.textContent = sinal > 0 ? "carga positiva" : "carga negativa";
    });
    api.desliza("campo elétrico E", -1, 1, 0, 0.005, (s) => {
      campoE = fino(s);
    });
    api.desliza("campo magnético B", -1, 1, 0, 0.005, (s) => {
      campoB = fino(s);
    });
    api.botao("outro gol", () => {
      indice = (indice + 1) % gols.length;
      rastro = [];
      lancar();
    });

    return {
      draw(t, dt) {
        const ctx = api.ctx;
        const gol = gols[indice];
        const ay = sinal * forcaE * campoE;
        // B positivo sai da tela: a carga positiva gira no sentido horário
        const giro = -sinal * forcaB * campoB;

        if (festa > 0) {
          festa -= dt;
          if (festa <= 0) {
            indice = (indice + 1) % gols.length;
            rastro = [];
            lancar();
          }
        } else if (!voando) {
          pausa -= dt;
          if (pausa <= 0) lancar();
        } else {
          const subpassos = 6;
          const h = dt / subpassos;
          for (let i = 0; i < subpassos && voando; i++) {
            v[1] += (ay * h) / 2;
            const cosseno = Math.cos(giro * h);
            const seno = Math.sin(giro * h);
            v = [v[0] * cosseno - v[1] * seno, v[0] * seno + v[1] * cosseno];
            v[1] += (ay * h) / 2;
            p[0] += v[0] * h;
            p[1] += v[1] * h;
            if (Math.abs(p[0] - gol.x) < gol.w / 2 && Math.abs(p[1] - gol.y) < gol.h / 2) {
              voando = false;
              festa = 1.5;
              placar += 1;
            } else if (Math.abs(p[0]) > W / 2 || Math.abs(p[1]) > H / 2) {
              voando = false;
              pausa = 0.45;
            }
          }
          tempoDeVoo += dt;
          if (voando && tempoDeVoo > 9) {
            voando = false;
            pausa = 0.3;
          }
          rastro.push(naTela(p[0], p[1]));
        }

        // campos: B perpendicular à tela (ponto sai, xis entra), E vertical
        const temB = Math.abs(campoB) > 0.0005;
        const temE = Math.abs(campoE) > 0.0005;
        if (temB || temE) {
          const intensidadeB = Math.sign(campoB) * (0.3 + 0.7 * Math.sqrt(Math.abs(campoB)));
          const comprimentoE = 10 + 30 * Math.sqrt(Math.abs(campoE));
          const sentidoE = Math.sign(campoE);
          for (let x = 70; x < W; x += 96) {
            for (let y = 60; y < H; y += 96) {
              if (temB) simbolo(ctx, x, y, intensidadeB, c.b, 11);
              if (temE) seta(ctx, x + 48, y + 48 + (sentidoE * comprimentoE) / 2, x + 48, y + 48 - (sentidoE * comprimentoE) / 2, alfa(c.e, 0.5), 2.5, 9);
            }
          }
        }

        // o gol
        const [gx, gy] = naTela(gol.x - gol.w / 2, gol.y + gol.h / 2);
        ctx.fillStyle = alfa(c.acento, 0.14);
        ctx.fillRect(gx, gy, gol.w, gol.h);
        ctx.save();
        ctx.beginPath();
        ctx.rect(gx, gy, gol.w, gol.h);
        ctx.clip();
        ctx.strokeStyle = alfa(c.acento, 0.45);
        ctx.lineWidth = 1.2;
        for (let d = -gol.h; d < gol.w + gol.h; d += 12) {
          ctx.beginPath();
          ctx.moveTo(gx + d, gy);
          ctx.lineTo(gx + d + gol.h, gy + gol.h);
          ctx.moveTo(gx + d + gol.h, gy);
          ctx.lineTo(gx + d, gy + gol.h);
          ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = c.acento;
        ctx.lineWidth = 4;
        ctx.strokeRect(gx, gy, gol.w, gol.h);
        const emPe = gol.h > gol.w;
        const [tx, ty] = naTela(emPe ? gol.x - Math.sign(gol.x) * 64 : gol.x, emPe ? gol.y : gol.y - Math.sign(gol.y) * 46);
        texto(ctx, "GOL", tx, ty, { cor: c.acento, t: 24, neg: true });

        // ponto de partida e trajetórias
        const [px0, py0] = naTela(partida[0], partida[1]);
        linha(ctx, [[px0 - 40, py0], [px0 + 80, py0]], alfa(c.muted, 0.6), 2, [6, 6]);
        disco(ctx, px0, py0, 6, c.muted);
        linha(ctx, rastroAnterior, alfa(c.muted, 0.4), 2, [5, 6]);
        linha(ctx, rastro, alfa(c.fg, 0.75), 3);

        if (voando) {
          const [sx, sy] = naTela(p[0], p[1]);
          const forcaMagnetica = [-giro * v[1], giro * v[0]];
          const modulo = Math.hypot(forcaMagnetica[0], forcaMagnetica[1]);
          if (modulo > 1) {
            const escala = Math.min(0.22, 90 / modulo);
            seta(ctx, sx, sy, sx + forcaMagnetica[0] * escala, sy - forcaMagnetica[1] * escala, c.b, 4, 13);
          }
          if (Math.abs(ay) > 1) seta(ctx, sx, sy, sx, sy - ay * 0.35, c.e, 4, 13);
          seta(ctx, sx, sy, sx + v[0] * 0.25, sy - v[1] * 0.25, c.fg, 3, 11);
          disco(ctx, sx, sy, 14, sinal > 0 ? c.acento : c.muted, c.card, 2.5);
          texto(ctx, sinal > 0 ? "+" : "−", sx, sy + 1, { cor: "#ffffff", t: 22, neg: true });
        }

        // placar e valores dos campos
        const direcaoE = campoE > 0 ? "para cima" : campoE < 0 ? "para baixo" : "desligado";
        const direcaoB = campoB > 0 ? "saindo da tela" : campoB < 0 ? "entrando na tela" : "desligado";
        ctx.fillStyle = alfa(c.card, 0.9);
        ctx.fillRect(W / 2 - 190, 10, 380, 102);
        texto(ctx, `gols: ${placar}`, W / 2 - 176, 32, { al: "left", t: 26, neg: true, cor: c.acento });
        texto(ctx, `E = ${comSinal(campoE, 2)}  (${direcaoE})`, W / 2 - 176, 64, { al: "left", t: 21, cor: c.e, neg: true });
        texto(ctx, `B = ${comSinal(campoB, 2)}  (${direcaoB})`, W / 2 - 176, 92, { al: "left", t: 21, cor: c.b, neg: true });

        if (festa > 0) {
          const u = 1 - festa / 1.5;
          const [cx, cy] = naTela(gol.x, gol.y);
          disco(ctx, cx, cy, 30 + 160 * u, null, alfa(c.acento, 1 - u), 6);
          texto(ctx, "GOL!", W / 2, H / 2, { cor: c.acento, t: 110 + 30 * Math.sin(u * Math.PI), neg: true });
        }
      },
    };
  });
})();
