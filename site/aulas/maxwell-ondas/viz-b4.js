// Bloco 4: onda na corda, o pulso que não fica parado (simulação das equações de Maxwell em 1D) e a onda plana.
(() => {
  const { TAU, c, alfa, seta, texto, vetor, linha, disco } = V;

  // ----- onda na corda -----

  V.reg("corda", (api) => {
    const { W, H } = api;
    const cy = H / 2 + 40;
    const amplitude = 110;
    const largura = 70;
    let velocidade = 180;
    let posicao = 200;

    api.desliza("velocidade v", 60, 420, velocidade, 10, (valor) => {
      velocidade = valor;
    });

    const forma = (u) => amplitude * Math.exp(-(u * u) / (largura * largura));
    // derivada segunda da forma: é ela que manda na aceleração de cada ponto da corda
    const curvatura = (u) => forma(u) * ((4 * u * u) / Math.pow(largura, 4) - 2 / (largura * largura));

    return {
      draw(t, dt) {
        const ctx = api.ctx;
        posicao += velocidade * dt;
        if (posicao > W + 260) posicao = -260;

        linha(ctx, [[0, cy], [W, cy]], c.line, 2, [6, 8]);
        const pontos = [];
        for (let x = 0; x <= W; x += 6) pontos.push([x, cy - forma(x - posicao)]);
        linha(ctx, pontos, c.fg, 4.5);

        for (let x = 20; x < W; x += 36) {
          const y = cy - forma(x - posicao);
          if (api.passo >= 1) {
            const comprimento = curvatura(x - posicao) * largura * largura * 0.45;
            if (Math.abs(comprimento) > 4) seta(ctx, x, y, x, y - comprimento, c.a, 3.5, 11);
          }
          disco(ctx, x, y, 6, c.fg);
        }

        seta(ctx, posicao - 46, cy - amplitude - 36, posicao + 46, cy - amplitude - 36, c.acento, 4, 14);
        texto(ctx, "v", posicao, cy - amplitude - 60, { cor: c.acento, t: 30, it: true, serif: true, neg: true });
        texto(ctx, "cada ponto da corda só sobe e desce; o que anda para o lado é a forma", 24, 30, { al: "left", t: 22, cor: c.muted });
        if (api.passo >= 1) {
          texto(ctx, "setas roxas: aceleração de cada ponto, proporcional à curvatura da corda ali", 24, 60, { al: "left", t: 22, cor: c.a, neg: true });
        }
      },
    };
  });

  // ----- desenho comum de E (vertical) e B (em profundidade) ao longo do eixo x -----

  // valores: função i -> [E, B] para n amostras igualmente espaçadas entre x0 e x1 (em pixels).
  function desenharCampos(ctx, n, x0, x1, cy, escala, valores, opcoes) {
    const oblX = -0.38;
    const oblY = 0.38;
    const curvaE = [];
    const curvaB = [];
    const passoSeta = opcoes.passoSeta || 5;
    const pares = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / (n - 1);
      const [e, b] = valores(i);
      curvaE.push([x, cy - e * escala]);
      curvaB.push([x + b * escala * oblX, cy + b * escala * oblY]);
      pares.push([x, e, b]);
    }
    if (opcoes.comB) {
      pares.forEach(([x, , b], i) => {
        if (i % passoSeta === 0 && Math.abs(b) * escala > 7) {
          seta(ctx, x, cy, x + b * escala * oblX, cy + b * escala * oblY, alfa(c.b, 0.6), 1.6, 7);
        }
      });
      linha(ctx, curvaB, c.b, 3.5);
    }
    seta(ctx, x0 - 20, cy, x1 + 34, cy, c.fg, 2, 11);
    if (opcoes.comE) {
      pares.forEach(([x, e], i) => {
        if (i % passoSeta === 0 && Math.abs(e) * escala > 7) {
          seta(ctx, x, cy, x, cy - e * escala, alfa(c.e, 0.6), 1.6, 7);
        }
      });
      linha(ctx, curvaE, c.e, 3.5);
    }
  }

  function eixos(ctx, x0, cy, comB) {
    seta(ctx, x0 - 20, cy, x0 - 20, cy - 150, c.fg, 2, 10);
    vetor(ctx, "E", x0 - 44, cy - 132, c.e, 28);
    if (comB) {
      seta(ctx, x0 - 20, cy, x0 - 20 - 66, cy + 66, c.fg, 2, 10);
      vetor(ctx, "B", x0 - 106, cy + 80, c.b, 28);
    }
  }

  // ----- as equações de Maxwell em uma dimensão, resolvidas passo a passo -----
  // Unidades com c = 1 e B multiplicado por c. Esquema de Yee (E e B em malhas intercaladas)
  // com número de Courant 0,5: a cada passo de tempo a onda anda meio passo de espaço.

  V.reg("fdtd", (api) => {
    const { W, H } = api;
    const N = 360;
    const E = new Float64Array(N);
    const B = new Float64Array(N);
    const courant = 0.5;
    const mur = (courant - 1) / (courant + 1);
    let rodando = false;
    let lento = false;
    let antena = false;
    let passos = 0;
    let acumulado = 0;
    let vazioDesde = null;

    function pulso() {
      for (let i = 0; i < N; i++) {
        const u = (i - N / 2) / 13;
        E[i] = 1.5 * Math.exp(-u * u);
        B[i] = 0;
      }
      passos = 0;
      vazioDesde = null;
    }
    pulso();

    function avancar() {
      // dB/dt = -dE/dx
      for (let i = 0; i < N - 1; i++) B[i] -= courant * (E[i + 1] - E[i]);
      const antes = [E[0], E[1], E[N - 2], E[N - 1]];
      // dE/dt = -dB/dx (é aqui que entra o termo de Maxwell)
      for (let i = 1; i < N - 1; i++) E[i] -= courant * (B[i] - B[i - 1]);
      // bordas que deixam a onda sair sem refletir (condição de Mur)
      E[0] = antes[1] + mur * (E[1] - antes[0]);
      E[N - 1] = antes[2] + mur * (E[N - 2] - antes[3]);
      passos += 1;
      if (antena) E[N / 2] += 0.9 * Math.sin(passos * 0.0524);
    }

    const botaoRodar = api.alterna("rodar", false, (ligado) => {
      rodando = ligado;
    });
    api.botao("novo pulso de E", () => {
      antena = false;
      botaoAntena.classList.remove("lig");
      pulso();
    });
    const botaoAntena = api.alterna("antena no centro", false, (ligado) => {
      antena = ligado;
      if (ligado) {
        E.fill(0);
        B.fill(0);
        passos = 0;
        rodando = true;
        botaoRodar.classList.add("lig");
      }
    });
    api.alterna("câmera lenta", false, (ligado) => {
      lento = ligado;
    });

    return {
      passo(n) {
        if (n === 0) {
          antena = false;
          botaoAntena.classList.remove("lig");
          pulso();
        }
        rodando = n >= 1;
        botaoRodar.classList.toggle("lig", rodando);
      },
      draw(t, dt) {
        const ctx = api.ctx;
        if (rodando) {
          acumulado += dt * (lento ? 28 : 160);
          while (acumulado >= 1) {
            avancar();
            acumulado -= 1;
          }
          // depois que o pulso sai da tela, espera um pouco e começa de novo
          if (!antena) {
            let maior = 0;
            for (let i = 0; i < N; i++) maior = Math.max(maior, Math.abs(E[i]));
            if (maior < 0.01) {
              if (vazioDesde === null) vazioDesde = t;
              if (t - vazioDesde > 1.2) pulso();
            }
          }
        }

        const cy = H / 2 + 20;
        desenharCampos(ctx, N, 150, W - 60, cy, 150, (i) => [E[i], B[i]], { comE: true, comB: true, passoSeta: 5 });
        eixos(ctx, 150, cy, true);
        texto(ctx, "x", W - 14, cy, { t: 26, it: true, serif: true });
        if (antena) disco(ctx, 150 + ((W - 210) * (N / 2)) / (N - 1), cy, 8, c.i);

        const legenda = !rodando && passos === 0
          ? "Um pulso de campo elétrico, parado, sem campo magnético. O que acontece quando o tempo passa?"
          : "E variando cria B, B variando cria E: o pulso se divide em dois e cada metade viaja com velocidade c.";
        texto(ctx, antena ? "Uma carga oscilando no centro: as ondas saem para os dois lados." : legenda, 24, 30, { al: "left", t: 22, cor: c.muted });
      },
    };
  });

  // ----- onda plana -----

  V.reg("ondaplana", (api) => {
    const { W, H } = api;
    const capa = api.modo === "capa";
    const N = 240;
    let comprimentoDeOnda = 4;
    let pausado = false;
    let fase = 0;

    if (!capa) {
      api.desliza("comprimento de onda", 2, 7, comprimentoDeOnda, 0.1, (valor) => {
        comprimentoDeOnda = valor;
      });
      api.alterna("pausar", false, (ligado) => {
        pausado = ligado;
      });
    }

    return {
      draw(t, dt) {
        const ctx = api.ctx;
        if (!pausado) fase += dt * 2.2;
        const x0 = capa ? 60 : 150;
        const x1 = W - (capa ? 60 : 120);
        const cy = capa ? H / 2 : H / 2 - 6;
        const escala = capa ? 95 : 125;
        const k = TAU / comprimentoDeOnda;
        const passo = capa ? 2 : api.passo;
        const valores = (i) => {
          const x = (i / (N - 1)) * 13;
          const valor = Math.sin(k * x - fase);
          return [valor, valor];
        };
        desenharCampos(ctx, N, x0, x1, cy, escala, valores, { comE: true, comB: passo >= 1, passoSeta: 4 });
        if (capa) return;

        eixos(ctx, x0, cy, passo >= 1);
        texto(ctx, "x", x1 + 52, cy, { t: 26, it: true, serif: true });
        seta(ctx, W - 330, 44, W - 210, 44, c.fg, 4, 15);
        texto(ctx, "velocidade c", W - 190, 45, { al: "left", t: 24, neg: true });

        if (passo >= 2) {
          // a tríade E, B e direção de propagação
          const ox = W - 250;
          const oy = H - 48;
          seta(ctx, ox, oy, ox, oy - 64, c.e, 4.5, 14);
          seta(ctx, ox, oy, ox - 38, oy + 38, c.b, 4.5, 14);
          seta(ctx, ox, oy, ox + 96, oy, c.fg, 4.5, 14);
          vetor(ctx, "E", ox - 24, oy - 50, c.e, 26);
          vetor(ctx, "B", ox - 62, oy + 30, c.b, 26);
          texto(ctx, "propagação", ox + 108, oy + 1, { t: 20, al: "left" });
          texto(ctx, "E, B e a direção de propagação são perpendiculares entre si", 24, H - 26, { al: "left", t: 22, cor: c.muted });
        }
      },
    };
  });

  // ----- por que B é perpendicular a E: a circulação de E num retângulo do plano xy -----

  V.reg("retangulo", (api) => {
    const { W, H } = api;
    const cam = { yaw: -0.5, pitch: 0.3, esc: 84, cx: W / 2 + 16, cy: H / 2 + 30 };
    const P = (x, y, z) => {
      const q = V.proj([x, y, z], cam);
      return [q[0], q[1]];
    };
    const k = 1.05;
    const x1 = 0.3;
    const x2 = 1.5;
    const altura = 1.25;
    let faseDoLaco = 0;

    return {
      draw(t, dt) {
        const ctx = api.ctx;
        const passo = api.passo;
        const fase = t * 0.8;
        const campo = (x) => 1.75 * Math.sin(k * x - fase);

        seta(ctx, ...P(-3.6, 0, 0), ...P(4.0, 0, 0), c.fg, 2, 10);
        seta(ctx, ...P(-3.6, 0, 0), ...P(-3.6, 2.6, 0), c.fg, 2, 10);
        seta(ctx, ...P(-3.6, 0, 0), ...P(-3.6, 0, 2.3), c.fg, 2, 10);
        texto(ctx, "x", ...P(4.3, 0, 0), { t: 24, it: true, serif: true });
        texto(ctx, "y", ...P(-3.6, 2.85, 0), { t: 24, it: true, serif: true });
        texto(ctx, "z", ...P(-3.6, 0, 2.65), { t: 24, it: true, serif: true });

        if (passo >= 2) {
          const cantos = [P(x1, 0, 0), P(x2, 0, 0), P(x2, altura, 0), P(x1, altura, 0)];
          ctx.beginPath();
          cantos.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
          ctx.closePath();
          ctx.fillStyle = alfa(c.a, 0.16);
          ctx.fill();
          ctx.strokeStyle = c.a;
          ctx.lineWidth = 3.5;
          ctx.stroke();
          // o campo é mais forte de um lado do retângulo que do outro: sobra circulação
          const circulacao = (campo(x2) - campo(x1)) * altura;
          faseDoLaco += circulacao * dt * 40;
          const volta = cantos.concat([cantos[0]]);
          const sentido = circulacao >= 0 ? 1 : -1;
          V.fluxo(ctx, volta, V.acumular(volta), faseDoLaco * sentido, { cor: c.a, esp: 110, vel: sentido, tam: 15 });
        }

        const curva = [];
        for (let x = -3.6; x <= 4.0; x += 0.1) curva.push(P(x, campo(x), 0));
        for (let x = -3.25; x <= 3.8; x += 0.5) {
          const e = campo(x);
          if (Math.abs(e) > 0.12) seta(ctx, ...P(x, 0, 0), ...P(x, e, 0), alfa(c.e, 0.7), 2.5, 9);
        }
        linha(ctx, curva, c.e, 3.5);
        vetor(ctx, "E", ...P(-2.9, 2.35, 0), c.e, 28);

        if (passo >= 2) {
          for (const x of [x1, x2]) seta(ctx, ...P(x, 0, 0), ...P(x, campo(x), 0), c.e, 5, 13);
          const xc = (x1 + x2) / 2;
          const bz = 1.6 * Math.sin(k * xc - fase);
          const base = P(xc, altura / 2, 0);
          const ponta = P(xc, altura / 2, bz);
          seta(ctx, base[0], base[1], ponta[0], ponta[1], c.b, 5, 14);
          disco(ctx, base[0], base[1], 5, c.b);
          vetor(ctx, "B", ponta[0] - 22, ponta[1] + 22, c.b, 28);
          texto(ctx, "a circulação de E no retângulo acompanha a variação de B", 20, H - 24, { al: "left", t: 20, cor: c.muted });
        }
      },
    };
  });
})();
