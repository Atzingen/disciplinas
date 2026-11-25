// Bloco 1: indução nos dois sentidos, lei de Ampère, paradoxo do capacitor, campo entre as placas.
(() => {
  const { TAU, c, alfa, limitar, numero, cabeca, seta, texto, vetor, linha, disco, simbolo } = V;

  // Um campo perpendicular à tela que varia no tempo e o outro campo circulando em volta.
  // tipo: "faraday" (B dentro, E em volta), "maxwell" (E dentro, B em volta) ou "pergunta".
  V.painel = function (ctx, cx, cy, R, t, tipo, comLegenda = true) {
    const w = 1.15;
    const a = Math.sin(w * t);
    const taxa = Math.cos(w * t);
    const faraday = tipo === "faraday";
    const corDentro = faraday ? c.b : c.e;
    const corFora = faraday ? c.e : c.b;
    const r0 = R * 0.5;
    const rr = R * 0.86;

    disco(ctx, cx, cy, r0, alfa(corDentro, 0.05 + 0.13 * Math.abs(a)));
    ctx.setLineDash([9, 7]);
    disco(ctx, cx, cy, r0, null, c.a, 2.5);
    ctx.setLineDash([]);
    const g = r0 * 0.44;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) simbolo(ctx, cx + i * g, cy + j * g, a, corDentro, R * 0.07);
    }

    if (tipo === "pergunta") {
      ctx.setLineDash([4, 12]);
      disco(ctx, cx, cy, rr, null, c.muted, 2.5);
      ctx.setLineDash([]);
      for (let i = 0; i < 4; i++) {
        const an = (i * TAU) / 4 + TAU / 8;
        const x = cx + rr * Math.cos(an);
        const y = cy + rr * Math.sin(an);
        disco(ctx, x, y, R * 0.17, c.card);
        texto(ctx, "?", x, y + 2, { cor: c.acento, t: R * 0.32, neg: true });
      }
    } else {
      const intensidade = Math.abs(taxa);
      // Faraday: B saindo e aumentando faz E circular no sentido horário. Ampère–Maxwell: o oposto.
      const sentido = (faraday ? 1 : -1) * (taxa >= 0 ? 1 : -1);
      const fase = (faraday ? 1 : -1) * 1.5 * Math.sin(w * t);
      const tamanho = R * 0.11 * (0.55 + 0.45 * intensidade);
      disco(ctx, cx, cy, rr, null, alfa(corFora, 0.2 + 0.8 * intensidade), 2 + 3 * intensidade);
      for (let i = 0; i < 8; i++) {
        const an = (i * TAU) / 8 + fase;
        const dir = an + (sentido * Math.PI) / 2;
        const x = cx + rr * Math.cos(an);
        const y = cy + rr * Math.sin(an);
        cabeca(ctx, x + Math.cos(dir) * tamanho * 0.5, y + Math.sin(dir) * tamanho * 0.5, dir, tamanho, alfa(corFora, 0.25 + 0.75 * intensidade));
      }
      vetor(ctx, faraday ? "E" : "B", cx + rr * 0.707 + R * 0.14, cy - rr * 0.707 - R * 0.08, corFora, R * 0.2);
    }
    vetor(ctx, faraday ? "B" : "E", cx + r0 * 0.707 + R * 0.13, cy - r0 * 0.707 - R * 0.05, corDentro, R * 0.2);

    if (comLegenda) {
      const letra = faraday ? "B" : "E";
      const frase = `${letra} ${a > 0 ? "saindo da tela" : "entrando na tela"} e ${a * taxa > 0 ? "aumentando" : "diminuindo"}`;
      texto(ctx, frase, cx, cy + R + 26, { cor: c.muted, t: Math.max(18, R * 0.115) });
    }
  };

  V.reg("dueto", (api) => ({
    draw(t) {
      const { ctx, W, H } = api;
      const R = Math.min(W / 4.6, H / 2.62);
      const cy = H * 0.5 + 8;
      const resposta = api.modo === "resposta";
      texto(ctx, "B variando faz E circular", W * 0.27, 34, { t: 28, neg: true });
      texto(ctx, resposta ? "E variando faz B circular" : "E variando faz o quê?", W * 0.73, 34, { t: 28, neg: true });
      V.painel(ctx, W * 0.27, cy, R, t, "faraday");
      V.painel(ctx, W * 0.73, cy, R, t, resposta ? "maxwell" : "pergunta");
    },
  }));

  // ----- lei de Ampère -----

  // Metade de um anel de campo magnético visto de cima e de lado (elipse), com as setas andando.
  function anelB(ctx, cx, cy, rx, ry, t, velocidade, frente, forca) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, frente ? 0 : Math.PI, frente ? Math.PI : TAU);
    ctx.strokeStyle = alfa(c.b, 0.3 + 0.7 * forca);
    ctx.lineWidth = 3;
    ctx.stroke();
    const n = Math.max(4, Math.round(rx / 28));
    for (let i = 0; i < n; i++) {
      const f = ((((i / n) * TAU - t * velocidade) % TAU) + TAU) % TAU;
      if (Math.sin(f) > 0 !== frente) continue;
      const ang = Math.atan2(-ry * Math.cos(f), rx * Math.sin(f));
      const x = cx + rx * Math.cos(f);
      const y = cy + ry * Math.sin(f);
      cabeca(ctx, x + Math.cos(ang) * 7, y + Math.sin(ang) * 7, ang, 14, alfa(c.b, 0.45 + 0.55 * forca));
    }
  }

  function fioComCorrente(ctx, x, yBaixo, yCima, t) {
    ctx.strokeStyle = alfa(c.i, 0.35);
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, yBaixo);
    ctx.lineTo(x, yCima);
    ctx.stroke();
    const vao = yBaixo - yCima;
    for (let k = 0; k * 44 < vao; k++) {
      disco(ctx, x, yBaixo - ((t * 70 + k * 44) % vao), 5, c.i);
    }
    cabeca(ctx, x, yCima - 16, -Math.PI / 2, 22, c.i);
  }

  // Três setas de campo elétrico que crescem repetidamente: "E aumentando".
  function feixeE(ctx, x, yBaixo, yCima, t) {
    const u = (t * 0.35) % 1;
    const visivel = u > 0.88 ? (1 - u) / 0.12 : Math.min(1, u / 0.08);
    for (const dx of [-30, 0, 30]) {
      seta(ctx, x + dx, yBaixo, x + dx, yBaixo - (yBaixo - yCima) * (0.3 + 0.7 * u), alfa(c.e, visivel), 4.5, 16);
    }
  }

  V.anelB = anelB;
  V.fioComCorrente = fioComCorrente;
  V.feixeE = feixeE;

  V.reg("ampere", (api) => ({
    draw(t) {
      const { ctx, W, H } = api;

      if (api.modo === "ambos") {
        const xa = W * 0.27;
        const xb = W * 0.73;
        const yBaixo = H - 86;
        const yCima = 70;
        const cy = H * 0.5;
        anelB(ctx, xa, cy, 150, 45, t, 1.3, false, 1);
        fioComCorrente(ctx, xa, yBaixo, yCima, t);
        anelB(ctx, xa, cy, 150, 45, t, 1.3, true, 1);
        anelB(ctx, xb, cy, 150, 45, t, 1.3, false, 1);
        feixeE(ctx, xb, yBaixo, yCima, t);
        anelB(ctx, xb, cy, 150, 45, t, 1.3, true, 1);
        texto(ctx, "+", W * 0.5, cy, { t: 60, neg: true });
        texto(ctx, "corrente elétrica", xa, H - 36, { t: 25, cor: c.i, neg: true });
        texto(ctx, "campo elétrico aumentando", xb, H - 36, { t: 25, cor: c.e, neg: true });
        vetor(ctx, "B", xa - 180, cy - 8, c.b, 32);
        vetor(ctx, "B", xb + 180, cy - 8, c.b, 32);
        return;
      }

      const x = W / 2;
      const cy = H * 0.56;
      const raios = [120, 220, 320];
      const comCurva = api.passo >= 1;
      const metade = (frente) => {
        if (comCurva) {
          ctx.beginPath();
          ctx.ellipse(x, cy, 220, 66, 0, frente ? 0 : Math.PI, frente ? Math.PI : TAU);
          ctx.strokeStyle = alfa(c.a, 0.42);
          ctx.lineWidth = 13;
          ctx.stroke();
        }
        raios.forEach((rx) => anelB(ctx, x, cy, rx, rx * 0.3, t, (1.4 * 120) / rx, frente, 120 / rx));
      };
      metade(false);
      fioComCorrente(ctx, x, H - 30, 60, t);
      metade(true);
      texto(ctx, "I", x + 30, 62, { cor: c.i, t: 36, it: true, serif: true, neg: true });
      vetor(ctx, "B", x + 320 + 44, cy - 6, c.b, 34);
      if (comCurva) texto(ctx, "C", x - 220 - 34, cy + 6, { cor: c.a, t: 34, it: true, serif: true, neg: true });
    },
  }));

  // ----- o paradoxo do capacitor -----

  V.reg("capacitor", (api) => {
    const { W } = api;
    const cy = 225;
    const xc = 230;
    const a = 160;
    const xp1 = 480;
    const xp2 = 610;
    const alturaPlaca = 116;
    const esp = 12;
    const xMeio = (xp1 + esp + xp2) / 2;
    const ordemDasLinhas = [3, 2, 4, 1, 5, 0, 6];
    let m = 0;
    let alvo = 0;
    let manual = false;

    const controle = api.desliza("mover a superfície", 0, 1, 0, 0.01, (valor) => {
      m = valor;
      manual = true;
    });
    controle.parentElement.style.visibility = "hidden";

    function barra(ctx, rotulo, fracao, cor, y, valor) {
      texto(ctx, rotulo, 40, y, { al: "left", t: 21, cor: c.muted });
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 2;
      ctx.strokeRect(590, y - 13, 280, 26);
      ctx.fillStyle = cor;
      ctx.fillRect(590, y - 13, 280 * fracao, 26);
      texto(ctx, valor, 896, y + 1, { t: 28, it: true, serif: true, neg: true, al: "left" });
    }

    return {
      passo(n) {
        alvo = n >= 2 ? 1 : 0;
        manual = false;
        controle.parentElement.style.visibility = n >= 2 ? "visible" : "hidden";
      },
      draw(t, dt) {
        const ctx = api.ctx;
        const passo = api.passo;
        if (!manual) {
          m += (alvo - m) * Math.min(1, dt * 2.4);
          controle.value = m;
        }
        const periodo = 7;
        const q = (t % periodo) / periodo;
        const visivel = q > 0.94 ? (1 - q) / 0.06 : 1;
        const xr = xc + m * (xMeio - xc);

        // superfície apoiada na curva C: do disco plano (m = 0) ao balão entre as placas (m = 1)
        if (passo >= 1) {
          ctx.beginPath();
          ctx.moveTo(xc, cy - a);
          ctx.bezierCurveTo(xc + (xr - xc) * 0.9, cy - a * 1.28, xr, cy - a * 0.75, xr, cy);
          ctx.bezierCurveTo(xr, cy + a * 0.75, xc + (xr - xc) * 0.9, cy + a * 1.28, xc, cy + a);
          ctx.closePath();
          ctx.fillStyle = alfa(c.a, 0.14);
          ctx.fill();
          if (m > 0.03) {
            ctx.setLineDash([9, 7]);
            ctx.strokeStyle = c.a;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.beginPath();
          ctx.ellipse(xc, cy, 26, a, 0, 0, TAU);
          ctx.fillStyle = alfa(c.a, 0.16);
          ctx.fill();
        }

        // fios e corrente
        ctx.strokeStyle = c.fg;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(30, cy);
        ctx.lineTo(xp1, cy);
        ctx.moveTo(xp2 + esp, cy);
        ctx.lineTo(W - 30, cy);
        ctx.stroke();
        const trechos = [[30, xp1 - 4], [xp2 + esp + 4, W - 30]];
        for (const [inicio, fim] of trechos) {
          const vao = fim - inicio;
          for (let k = 0; k * 52 < vao; k++) disco(ctx, inicio + ((t * 80 + k * 52) % vao), cy, 5.5, c.i);
        }
        seta(ctx, 70, cy - 30, 134, cy - 30, c.i, 3.5, 13);
        texto(ctx, "I", 102, cy - 54, { cor: c.i, t: 30, it: true, serif: true, neg: true });
        seta(ctx, W - 150, cy - 30, W - 86, cy - 30, c.i, 3.5, 13);
        texto(ctx, "I", W - 118, cy - 54, { cor: c.i, t: 30, it: true, serif: true, neg: true });

        // placas, cargas acumuladas e campo elétrico crescendo
        ctx.fillStyle = c.fg;
        ctx.fillRect(xp1, cy - alturaPlaca, esp, 2 * alturaPlaca);
        ctx.fillRect(xp2, cy - alturaPlaca, esp, 2 * alturaPlaca);
        const quantas = Math.floor(q * 7) + 1;
        for (let k = 0; k < quantas; k++) {
          const y = cy - alturaPlaca + (ordemDasLinhas[k] + 0.5) * ((2 * alturaPlaca) / 7);
          texto(ctx, "+", xp1 - 17, y, { t: 25, neg: true, cor: alfa(c.fg, visivel) });
          texto(ctx, "−", xp2 + esp + 17, y, { t: 25, neg: true, cor: alfa(c.fg, visivel) });
          seta(ctx, xp1 + esp + 7, y, xp2 - 7, y, alfa(c.e, visivel), 3, 12);
        }
        vetor(ctx, "E", xMeio, cy - alturaPlaca - 24, c.e, 30);

        // curva C com o campo B circulando nela
        if (passo >= 1) {
          ctx.beginPath();
          ctx.ellipse(xc, cy, 26, a, 0, 0, TAU);
          ctx.strokeStyle = c.a;
          ctx.lineWidth = 4.5;
          ctx.stroke();
          for (let i = 0; i < 5; i++) {
            const psi = (i * TAU) / 5 + t * 0.9;
            const ang = Math.atan2(a * Math.sin(psi), -26 * Math.cos(psi));
            cabeca(ctx, xc - 26 * Math.sin(psi) + Math.cos(ang) * 7, cy - a * Math.cos(psi) + Math.sin(ang) * 7, ang, 14, c.b);
          }
          texto(ctx, "C", xc - 48, cy + a + 2, { cor: c.a, t: 30, it: true, serif: true, neg: true });
          vetor(ctx, "B", xc - 64, cy - a + 46, c.b, 28);
          if (m < 0.05) {
            texto(ctx, "S₁: disco plano", xc + 22, cy - a - 20, { cor: c.a, t: 23, neg: true, al: "left" });
          } else {
            texto(ctx, "S₂: balão com a mesma borda", Math.max(xc + 40, xr - 250), cy - a * 1.2 - 16, { cor: c.a, t: 23, neg: true, al: "left" });
          }

          const corta = xr < xp1 + esp / 2 ? 1 : 0;
          const yBarra = 428;
          barra(ctx, "corrente de cargas que atravessa a superfície", corta, c.i, yBarra, corta ? "I" : "0");
          if (passo >= 3) {
            barra(ctx, "ε₀ · dΦ/dt do campo elétrico que atravessa", 1 - corta, c.e, yBarra + 46, corta ? "0" : "I");
            texto(ctx, "A soma dá I, qualquer que seja a superfície.", 40, yBarra + 90, { al: "left", t: 22, neg: true });
          } else if (passo === 2 && !corta) {
            texto(ctx, "Nenhuma corrente atravessa S₂. Então B seria zero sobre C?", 40, yBarra + 50, { al: "left", t: 23, neg: true, cor: c.acento });
          }
        }
      },
    };
  });

  // ----- campo magnético entre as placas -----

  V.reg("placas", (api) => {
    const { H } = api;
    const cx = 290;
    const cy = H / 2 - 10;
    const Rp = 140;
    const rMax = 265;
    let r = 90;
    let arrastando = false;
    const campo = (raio) => (raio <= Rp ? raio / Rp : Rp / raio);

    const controle = api.desliza("raio r da curva", 15, rMax, r, 1, (valor) => {
      r = valor;
    });
    api.dica("ou arraste a curva roxa");

    function pegar(x, y) {
      r = limitar(Math.hypot(x - cx, y - cy), 15, rMax);
      controle.value = r;
    }

    return {
      down(x, y) {
        if (x < 580) {
          arrastando = true;
          pegar(x, y);
        }
      },
      move(x, y, pressionado) {
        if (arrastando && pressionado) pegar(x, y);
      },
      up() {
        arrastando = false;
      },
      draw(t) {
        const ctx = api.ctx;
        const u = (t * 0.3) % 1;
        const intensidade = 0.35 + 0.65 * u;

        // campo elétrico entrando na tela e crescendo
        for (let i = -3; i <= 3; i++) {
          for (let j = -3; j <= 3; j++) {
            if (Math.hypot(i * 44, j * 44) > Rp - 12) continue;
            simbolo(ctx, cx + i * 44, cy + j * 44, -intensidade, c.e, 13);
          }
        }
        disco(ctx, cx, cy, Rp, null, c.fg, 3.5);

        // linhas de campo magnético: mais fortes onde B é maior
        for (const raio of [50, 95, 140, 185, 230]) {
          const b = campo(raio);
          disco(ctx, cx, cy, raio, null, alfa(c.b, 0.2 + 0.8 * b), 1.5 + 2.5 * b);
          const n = Math.max(3, Math.round(raio / 40));
          for (let i = 0; i < n; i++) {
            const an = (i * TAU) / n + (t * 1.3 * b * Rp) / raio;
            const dir = an + Math.PI / 2;
            cabeca(ctx, cx + raio * Math.cos(an) + Math.cos(dir) * 6, cy + raio * Math.sin(an) + Math.sin(dir) * 6, dir, 12, alfa(c.b, 0.3 + 0.7 * b));
          }
        }

        // curva de Ampère de raio r
        ctx.setLineDash([10, 7]);
        disco(ctx, cx, cy, r, null, c.a, 4);
        ctx.setLineDash([]);
        const xr = cx + r * Math.cos(-0.5);
        const yr = cy + r * Math.sin(-0.5);
        linha(ctx, [[cx, cy], [xr, yr]], c.a, 2);
        texto(ctx, "r", (cx + xr) / 2 - 4, (cy + yr) / 2 - 16, { cor: c.a, t: 26, it: true, serif: true, neg: true });
        texto(ctx, "× campo elétrico entrando na tela e crescendo", 24, H - 24, { al: "left", t: 20, cor: c.e });

        // gráfico de B em função de r
        const ox = 650;
        const oy = H - 110;
        const larg = 300;
        const alt = 300;
        seta(ctx, ox, oy, ox + larg + 26, oy, c.fg, 2.5, 11);
        seta(ctx, ox, oy, ox, oy - alt - 22, c.fg, 2.5, 11);
        const xDe = (raio) => ox + (raio / (2 * Rp)) * larg;
        const yDe = (b) => oy - b * alt * 0.9;
        const curva = [];
        for (let raio = 0; raio <= 2 * Rp; raio += 4) curva.push([xDe(raio), yDe(campo(raio))]);
        linha(ctx, curva, c.b, 4);
        linha(ctx, [[xDe(Rp), oy], [xDe(Rp), yDe(1)]], c.muted, 1.5, [5, 6]);
        texto(ctx, "R", xDe(Rp), oy + 22, { t: 24, it: true, serif: true });
        texto(ctx, "r", ox + larg + 40, oy, { t: 26, it: true, serif: true });
        vetor(ctx, "B", ox - 28, oy - alt - 4, c.b, 28);
        linha(ctx, [[xDe(r), oy], [xDe(r), yDe(campo(r))]], c.a, 2, [5, 6]);
        disco(ctx, xDe(r), yDe(campo(r)), 9, c.a);

        texto(ctx, `r = ${numero(r / Rp, 2)} R`, ox, 52, { al: "left", t: 26, neg: true });
        texto(ctx, `B = ${numero(campo(r), 2)} × B(R)`, ox, 86, { al: "left", t: 26, neg: true, cor: c.b });
        texto(ctx, r <= Rp ? "entre as placas: B cresce com r" : "fora das placas: B cai com 1/r", ox - 20, oy + 64, { al: "left", t: 21, cor: c.muted });
      },
    };
  });
})();
