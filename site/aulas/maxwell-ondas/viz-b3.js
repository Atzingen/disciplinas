// Bloco 3: divergente, rotacional, o cubinho e o quadradinho, os teoremas de Gauss e de Stokes.
(() => {
  const { TAU, c, alfa, limitar, numero, seta, texto, linha, disco } = V;

  // Campos de exemplo no plano: nome, F(x, y), divergente e componente z do rotacional.
  const CAMPOS = {
    fonte: { nome: "Fonte", f: (x, y) => [x, y], div: () => 2, rot: () => 0 },
    sumidouro: { nome: "Sumidouro", f: (x, y) => [-x, -y], div: () => -2, rot: () => 0 },
    uniforme: { nome: "Uniforme", f: () => [0.8, 0], div: () => 0, rot: () => 0 },
    giro: { nome: "Giro", f: (x, y) => [-y, x], div: () => 0, rot: () => 2 },
    cisalha: { nome: "Cisalhamento", f: (x, y) => [y, 0], div: () => 0, rot: () => -1 },
    variavel: { nome: "Fonte no meio", f: (x) => [0.8 * Math.sin(2 * x), 0], div: (x) => 1.6 * Math.cos(2 * x), rot: () => 0 },
    vortice: {
      nome: "Em volta de um fio",
      f: (x, y) => {
        const r2 = Math.max(0.03, x * x + y * y);
        return [(-y / r2) * 0.45, (x / r2) * 0.45];
      },
      div: () => 0,
      rot: (x, y) => (x * x + y * y < 0.03 ? 30 : 0),
    },
  };

  V.reg("campo2d", (api) => {
    const { W, H } = api;
    const esc = 250;
    const modoRot = api.modo === "rot";
    const lista = modoRot ? ["giro", "cisalha", "vortice", "fonte", "uniforme"] : ["fonte", "sumidouro", "variavel", "giro", "uniforme"];
    const velocidade = 0.7;
    const meiaLargura = W / 2 / esc;
    const meiaAltura = H / 2 / esc;
    let nome = lista[0];
    let P = { x: 0.7, y: 0.25 };
    let hs = 0.3;
    let arrastando = false;
    let angulo = 0;

    function renascer(p) {
      p.x = (Math.random() * 2 - 1) * meiaLargura;
      p.y = (Math.random() * 2 - 1) * meiaAltura;
      p.vida = 1.2 + Math.random() * 3;
      p.idade = 0;
      p.hist = [];
      return p;
    }
    const particulas = [];
    for (let i = 0; i < 260; i++) particulas.push(renascer({}));

    api.escolha(lista.map((k) => [k, CAMPOS[k].nome]), nome, (valor) => {
      nome = valor;
      particulas.forEach(renascer);
    });
    api.desliza(modoRot ? "laço" : "caixinha", 0.08, 0.5, hs, 0.01, (valor) => {
      hs = valor;
    });

    const paraTela = (x, y) => [W / 2 + x * esc, H / 2 - y * esc];

    function mover(x, y) {
      P.x = limitar((x - W / 2) / esc, -meiaLargura + 0.2, meiaLargura - 0.2);
      P.y = limitar((H / 2 - y) / esc, -meiaAltura + 0.2, meiaAltura - 0.2);
    }

    return {
      down(x, y) {
        arrastando = true;
        mover(x, y);
      },
      move(x, y, pressionado) {
        if (arrastando && pressionado) mover(x, y);
      },
      up() {
        arrastando = false;
      },
      draw(t, dt) {
        const ctx = api.ctx;
        const C = CAMPOS[nome];
        const medida = modoRot ? C.rot : C.div;

        // fundo: laranja onde a medida é positiva, azul onde é negativa
        for (let gx = -meiaLargura; gx < meiaLargura; gx += 0.25) {
          for (let gy = -meiaAltura; gy < meiaAltura; gy += 0.25) {
            const valor = medida(gx + 0.125, gy + 0.125);
            if (Math.abs(valor) < 0.02) continue;
            const [sx, sy] = paraTela(gx, gy + 0.25);
            ctx.fillStyle = alfa(valor > 0 ? c.e : c.b, Math.min(0.2, Math.abs(valor) * 0.07));
            ctx.fillRect(sx, sy, 0.25 * esc + 0.5, 0.25 * esc + 0.5);
          }
        }

        // setas do campo numa grade
        for (let gx = -1.75; gx <= 1.76; gx += 0.5) {
          for (let gy = -0.75; gy <= 0.76; gy += 0.5) {
            const [fx, fy] = C.f(gx, gy);
            const m = Math.hypot(fx, fy);
            if (m < 1e-3) continue;
            const meio = Math.min(0.2, m * 0.11) * esc;
            const [sx, sy] = paraTela(gx, gy);
            const ux = fx / m;
            const uy = -fy / m;
            seta(ctx, sx - ux * meio, sy - uy * meio, sx + ux * meio, sy + uy * meio, alfa(c.muted, 0.55), 2, 8);
          }
        }

        // partículas levadas pelo campo
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        for (const p of particulas) {
          const [fx, fy] = C.f(p.x, p.y);
          p.x += fx * dt * velocidade;
          p.y += fy * dt * velocidade;
          p.vida -= dt;
          p.idade += dt;
          p.hist.push([p.x, p.y]);
          if (p.hist.length > 8) p.hist.shift();
          if (p.vida < 0 || Math.abs(p.x) > meiaLargura + 0.1 || Math.abs(p.y) > meiaAltura + 0.1) {
            renascer(p);
            continue;
          }
          ctx.strokeStyle = alfa(c.fg, 0.6 * Math.min(1, p.vida * 2, p.idade * 2));
          ctx.beginPath();
          p.hist.forEach((ponto, i) => {
            const [sx, sy] = paraTela(ponto[0], ponto[1]);
            if (i) ctx.lineTo(sx, sy);
            else ctx.moveTo(sx, sy);
          });
          ctx.stroke();
        }

        // sonda: caixinha (fluxo) ou laço (circulação), percorrida no sentido anti-horário
        const lados = [
          [P.x - hs, P.y - hs, P.x + hs, P.y - hs, 0, -1],
          [P.x + hs, P.y - hs, P.x + hs, P.y + hs, 1, 0],
          [P.x + hs, P.y + hs, P.x - hs, P.y + hs, 0, 1],
          [P.x - hs, P.y + hs, P.x - hs, P.y - hs, -1, 0],
        ];
        let total = 0;
        for (const [xa, ya, xb, yb, nx, ny] of lados) {
          const tx = (xb - xa) / (2 * hs);
          const ty = (yb - ya) / (2 * hs);
          const parte = (s) => {
            const [fx, fy] = C.f(xa + (xb - xa) * s, ya + (yb - ya) * s);
            return modoRot ? fx * tx + fy * ty : fx * nx + fy * ny;
          };
          const n = 8;
          let soma = 0;
          for (let i = 0; i <= n; i++) soma += parte(i / n) * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
          total += (soma * 2 * hs) / (3 * n);

          for (const s of [1 / 6, 1 / 2, 5 / 6]) {
            const g = parte(s);
            const [sx, sy] = paraTela(xa + (xb - xa) * s, ya + (yb - ya) * s);
            const comprimento = limitar(g * 0.16 * esc, -60, 60);
            const dx = modoRot ? tx : nx;
            const dy = modoRot ? ty : ny;
            seta(ctx, sx, sy, sx + dx * comprimento, sy - dy * comprimento, g > 0 ? c.e : c.b, 3, 9);
          }
        }
        const razao = total / (4 * hs * hs);
        const [px, py] = paraTela(P.x, P.y);
        const lado = hs * esc;
        ctx.strokeStyle = c.a;
        ctx.lineWidth = 3.5;
        ctx.strokeRect(px - lado, py - lado, 2 * lado, 2 * lado);

        if (modoRot) {
          // rodinha de pás: gira com metade do rotacional, como um corpo levado pelo fluido
          angulo += (medida(P.x, P.y) / 2) * dt * velocidade;
          const raio = Math.min(lado * 0.8, 46);
          for (let i = 0; i < 6; i++) {
            const an = -angulo + (i * TAU) / 6;
            const ex = px + raio * Math.cos(an);
            const ey = py + raio * Math.sin(an);
            linha(ctx, [[px, py], [ex, ey]], c.fg, 4);
            linha(ctx, [[ex - Math.sin(an) * 7, ey + Math.cos(an) * 7], [ex + Math.sin(an) * 7, ey - Math.cos(an) * 7]], c.fg, 4);
            if (i === 0) disco(ctx, ex, ey, 6, c.acento);
          }
          disco(ctx, px, py, 7, c.fg);
        }

        ctx.fillStyle = alfa(c.card, 0.9);
        ctx.fillRect(14, 12, modoRot ? 660 : 440, 76);
        const exato = medida(P.x, P.y);
        if (modoRot) {
          const giro = exato > 0.02 ? "gira no sentido anti-horário" : exato < -0.02 ? "gira no sentido horário" : "não gira";
          texto(ctx, `circulação ÷ área do laço = ${numero(razao, 2)}`, 26, 34, { al: "left", t: 23, neg: true, cor: c.a });
          texto(ctx, `rotacional no centro = ${numero(exato, 2)}: a rodinha ${giro}`, 26, 66, { al: "left", t: 21 });
        } else {
          texto(ctx, `fluxo que sai ÷ área da caixinha = ${numero(razao, 2)}`, 26, 34, { al: "left", t: 23, neg: true, cor: c.a });
          texto(ctx, `divergente no centro = ${numero(exato, 2)}`, 26, 66, { al: "left", t: 21 });
        }
      },
    };
  });

  // ----- o cubinho (fluxo) e o quadradinho (circulação) -----

  V.reg("elemento", (api) => {
    const { W, H } = api;

    if (api.modo === "quadrado") {
      const x0 = 270;
      const x1 = 530;
      const yCima = 140;
      const yBaixo = 400;
      const meioX = (x0 + x1) / 2;
      const meioY = (yCima + yBaixo) / 2;
      const perimetro = [[x0, yBaixo], [x1, yBaixo], [x1, yCima], [x0, yCima], [x0, yBaixo]];
      const acumulado = V.acumular(perimetro);

      return {
        draw(t) {
          const ctx = api.ctx;
          const passo = api.passo;
          const horizontais = passo === 0 || passo === 1 || passo >= 3;
          const verticais = passo === 0 || passo >= 2;

          // um campo qualquer ao fundo
          for (let gx = 60; gx < W; gx += 100) {
            for (let gy = 50; gy < H; gy += 90) {
              const X = (gx - W / 2) / 300;
              const Y = (H / 2 - gy) / 300;
              const fx = 0.5 - 0.6 * Y;
              const fy = 0.4 + 0.7 * X;
              seta(ctx, gx - fx * 22, gy + fy * 22, gx + fx * 22, gy - fy * 22, alfa(c.muted, 0.3), 2, 7);
            }
          }

          ctx.fillStyle = alfa(c.a, 0.07);
          ctx.fillRect(x0, yCima, x1 - x0, yBaixo - yCima);
          const corDe = (ativo) => (ativo ? c.a : alfa(c.a, 0.25));
          seta(ctx, x0, yBaixo, x1, yBaixo, corDe(horizontais), 5, 16);
          seta(ctx, x1, yBaixo, x1, yCima, corDe(verticais), 5, 16);
          seta(ctx, x1, yCima, x0, yCima, corDe(horizontais), 5, 16);
          seta(ctx, x0, yCima, x0, yBaixo, corDe(verticais), 5, 16);
          V.fluxo(ctx, perimetro, acumulado, t, { cor: c.a, esp: 260, vel: 90, tam: 15 });

          // componentes do campo ao longo de cada lado
          if (passo === 1 || passo >= 3) {
            seta(ctx, meioX - 35, yBaixo + 36, meioX + 35, yBaixo + 36, c.e, 4, 13);
            seta(ctx, meioX - 58, yCima - 36, meioX + 58, yCima - 36, c.e, 4, 13);
          }
          if (passo >= 2) {
            seta(ctx, x1 + 36, meioY + 60, x1 + 36, meioY - 60, c.e, 4, 13);
            seta(ctx, x0 - 36, meioY + 35, x0 - 36, meioY - 35, c.e, 4, 13);
          }

          api.rotulo("c0", x0 - 44, yBaixo + 26);
          api.rotulo("c1", x1 + 86, yCima - 24);
          api.rotulo("baixo", meioX, yBaixo + 76, passo === 1 || passo >= 3);
          api.rotulo("cima", meioX, yCima - 78, passo === 1 || passo >= 3);
          api.rotulo("dir", x1 + 150, meioY, passo >= 2);
          api.rotulo("esq", x0 - 140, meioY, passo >= 2);
        },
      };
    }

    // cubo
    const cam = { yaw: -0.6, pitch: 0.4, esc: 118, cx: W / 2 - 10, cy: H / 2 + 14 };
    const a = [1.1, 0.8, 0.8];
    const sinais = [-1, 1];
    const arestas = [];
    for (const s1 of sinais) {
      for (const s2 of sinais) {
        arestas.push([[-a[0], s1 * a[1], s2 * a[2]], [a[0], s1 * a[1], s2 * a[2]]]);
        arestas.push([[s1 * a[0], -a[1], s2 * a[2]], [s1 * a[0], a[1], s2 * a[2]]]);
        arestas.push([[s1 * a[0], s2 * a[1], -a[2]], [s1 * a[0], s2 * a[1], a[2]]]);
      }
    }
    const face = (eixo, sinal) => {
      const outros = [0, 1, 2].filter((k) => k !== eixo);
      const cantos = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => {
        const p = [0, 0, 0];
        p[eixo] = sinal * a[eixo];
        p[outros[0]] = u * a[outros[0]];
        p[outros[1]] = v * a[outros[1]];
        return p;
      });
      return cantos.map((p) => V.proj(p, cam));
    };
    // setas de fluxo por eixo: entra menos pela face de trás, sai mais pela da frente
    const setas = [
      [[-a[0] - 1.0, 0, 0], [-a[0] - 0.1, 0, 0], [a[0] + 0.1, 0, 0], [a[0] + 1.5, 0, 0]],
      [[0, -a[1] - 0.75, 0], [0, -a[1] - 0.1, 0], [0, a[1] + 0.1, 0], [0, a[1] + 1.15, 0]],
      [[0, 0, -a[2] - 0.9], [0, 0, -a[2] - 0.1], [0, 0, a[2] + 0.1], [0, 0, a[2] + 1.4]],
    ];
    const rotulos = [
      ["fx0", [-a[0] - 0.75, 0.42, 0], "fx1", [a[0] + 1.25, 0.5, 0]],
      ["fy0", [0.95, -a[1] - 0.5, 0], "fy1", [1.15, a[1] + 0.75, 0]],
      ["fz0", [1.0, 0.36, -a[2] - 0.62], "fz1", [-0.9, 0.05, a[2] + 1.15]],
    ];

    return {
      draw(t) {
        const ctx = api.ctx;
        const passo = api.passo;
        const visivel = (eixo) => passo === eixo + 1 || passo >= 4;

        for (let eixo = 0; eixo < 3; eixo++) {
          if (!visivel(eixo)) continue;
          for (const sinal of sinais) {
            const quad = face(eixo, sinal);
            ctx.beginPath();
            quad.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
            ctx.closePath();
            ctx.fillStyle = alfa(c.a, passo >= 4 ? 0.08 : 0.2);
            ctx.fill();
          }
        }
        for (const [p, q] of arestas) {
          const A = V.proj(p, cam);
          const B = V.proj(q, cam);
          linha(ctx, [A, B], c.fg, 2.5);
        }
        for (let eixo = 0; eixo < 3; eixo++) {
          const mostra = visivel(eixo);
          if (mostra) {
            const [e0, e1, s0, s1] = setas[eixo].map((p) => V.proj(p, cam));
            seta(ctx, e0[0], e0[1], e1[0], e1[1], c.e, 4.5, 15);
            seta(ctx, s0[0], s0[1], s1[0], s1[1], c.e, 4.5, 15);
            for (const [de, ate] of [[e0, e1], [s0, s1]]) {
              const f = (t * 0.7) % 1;
              disco(ctx, de[0] + (ate[0] - de[0]) * f * 0.8, de[1] + (ate[1] - de[1]) * f * 0.8, 5, c.card, c.e, 2.5);
            }
          }
          const [n0, p0, n1, p1] = rotulos[eixo];
          const r0 = V.proj(p0, cam);
          const r1 = V.proj(p1, cam);
          api.rotulo(n0, r0[0], r0[1], mostra);
          api.rotulo(n1, r1[0], r1[1], mostra);
        }

        // a área das faces do par em destaque
        const areas = [["ax", [a[0], -0.5, 0.3]], ["ay", [-0.45, a[1], 0.3]], ["az", [-0.5, -0.45, a[2]]]];
        areas.forEach(([nome, ponto], eixo) => {
          const r = V.proj(ponto, cam);
          api.rotulo(nome, r[0], r[1], passo === eixo + 1);
        });

        // eixos de referência
        const origem = [86, H - 70];
        [["x", [1, 0, 0]], ["y", [0, 1, 0]], ["z", [0, 0, 1]]].forEach(([letra, dir]) => {
          const q = V.proj(dir, { ...cam, cx: 0, cy: 0, esc: 52 });
          seta(ctx, origem[0], origem[1], origem[0] + q[0], origem[1] + q[1], c.muted, 2.5, 9);
          texto(ctx, letra, origem[0] + q[0] * 1.32, origem[1] + q[1] * 1.32, { t: 22, it: true, serif: true, cor: c.muted });
        });
      },
    };
  });

  // ----- ladrilhos: o que é interno se cancela, sobra a fronteira -----

  V.reg("ladrilho", (api) => {
    const { H } = api;
    const circ = api.modo === "circ";
    const F = (x, y) => [0.6 * x * x + 0.5 * x - y * y - 0.3 * y + 0.4 * x * x * x, x * y + 0.3 * x + 0.4 * x * x * x];
    const medida = circ ? (x, y) => 3 * y + 0.6 + 1.2 * x * x : (x) => 2.2 * x + 0.5 + 1.2 * x * x;
    const gx = 30;
    const tamanho = 460;
    const gy = (H - tamanho) / 2;
    let n = 2;
    let cancela = 0;
    let alvoCancela = 0;
    let celulas = [];
    let somaDasCelulas = 0;
    let somaAproximada = 0;
    let naBorda = 0;

    // integral de Simpson de g(s) para s de 0 a 1, vezes o comprimento do lado
    const simpson = (g, comprimento) => ((g(0) + 4 * g(0.5) + g(1)) * comprimento) / 6;

    // contribuição de cada lado de uma célula: fluxo para fora ou circulação anti-horária
    function lados(xa, ya, h) {
      const xb = xa + h;
      const yb = ya + h;
      if (circ) {
        return [
          simpson((s) => F(xa + h * s, ya)[0], h),
          simpson((s) => F(xb, ya + h * s)[1], h),
          -simpson((s) => F(xa + h * s, yb)[0], h),
          -simpson((s) => F(xa, ya + h * s)[1], h),
        ];
      }
      return [
        -simpson((s) => F(xa + h * s, ya)[1], h),
        simpson((s) => F(xb, ya + h * s)[0], h),
        simpson((s) => F(xa + h * s, yb)[1], h),
        -simpson((s) => F(xa, ya + h * s)[0], h),
      ];
    }

    function recalcular() {
      const h = 2 / n;
      celulas = [];
      somaDasCelulas = 0;
      somaAproximada = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const xa = -1 + i * h;
          const ya = -1 + j * h;
          const partes = lados(xa, ya, h);
          const total = partes[0] + partes[1] + partes[2] + partes[3];
          celulas.push({ i, j, partes, total });
          somaDasCelulas += total;
          somaAproximada += medida(xa + h / 2, ya + h / 2) * h * h;
        }
      }
      naBorda = 0;
      const fino = 64;
      for (let k = 0; k < fino; k++) {
        const partes = lados(-1 + (k * 2) / fino, -1, 2 / fino);
        naBorda += partes[0];
        naBorda += lados(1 - 2 / fino, -1 + (k * 2) / fino, 2 / fino)[1];
        naBorda += lados(-1 + (k * 2) / fino, 1 - 2 / fino, 2 / fino)[2];
        naBorda += lados(-1, -1 + (k * 2) / fino, 2 / fino)[3];
      }
    }
    recalcular();

    function mudarN(novo) {
      n = limitar(novo, 1, 32);
      recalcular();
    }

    api.botao("menos células", () => mudarN(n / 2));
    api.botao("mais células", () => mudarN(n * 2));
    const botaoCancela = api.alterna("cancelar o que é interno", false, (ligado) => {
      alvoCancela = ligado ? 1 : 0;
    });

    return {
      passo(k) {
        const estados = [[2, 0], [2, 1], [4, 1], [8, 1], [16, 1]];
        const [novoN, novoCancela] = estados[Math.min(k, estados.length - 1)];
        alvoCancela = novoCancela;
        botaoCancela.classList.toggle("lig", novoCancela === 1);
        mudarN(novoN);
      },
      draw(t, dt) {
        const ctx = api.ctx;
        cancela += (alvoCancela - cancela) * Math.min(1, dt * 3);
        const lado = tamanho / n;
        const h = 2 / n;

        for (const cel of celulas) {
          const x = gx + cel.i * lado;
          const y = gy + (n - 1 - cel.j) * lado;
          const valor = cel.total / (h * h);
          ctx.fillStyle = alfa(valor > 0 ? c.e : c.b, Math.min(0.5, Math.abs(valor) * 0.1));
          ctx.fillRect(x, y, lado + 0.5, lado + 0.5);
          if (n <= 16) {
            ctx.strokeStyle = alfa(c.muted, 0.5);
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, lado, lado);
          }
          if (n > 8) continue;

          // marcas nos quatro lados: baixo, direita, cima, esquerda
          const cx = x + lado / 2;
          const cy = y + lado / 2;
          const normais = [[0, 1], [1, 0], [0, -1], [-1, 0]];
          const interno = [cel.j > 0, cel.i < n - 1, cel.j < n - 1, cel.i > 0];
          for (let k = 0; k < 4; k++) {
            const [nx, ny] = normais[k];
            const opacidade = interno[k] ? 1 - 0.9 * cancela : 1;
            if (opacidade < 0.05) continue;
            if (circ) {
              // seta ao longo do lado, no sentido anti-horário da célula
              const tx = ny;
              const ty = -nx;
              const bx = cx + nx * lado * 0.36;
              const by = cy + ny * lado * 0.36;
              seta(ctx, bx - tx * lado * 0.24, by - ty * lado * 0.24, bx + tx * lado * 0.24, by + ty * lado * 0.24, alfa(c.a, opacidade), n <= 4 ? 3 : 2, n <= 4 ? 11 : 7);
            } else {
              // seta atravessando o lado: laranja se sai da célula, azul se entra
              const sai = cel.partes[k] > 0;
              const perto = lado * 0.46;
              const longe = lado * 0.24;
              const de = sai ? longe : perto;
              const para = sai ? perto : longe;
              seta(ctx, cx + nx * de, cy + ny * de, cx + nx * para, cy + ny * para, alfa(sai ? c.e : c.b, opacidade), n <= 4 ? 3 : 2, n <= 4 ? 11 : 7);
            }
          }
        }

        ctx.strokeStyle = c.fg;
        ctx.lineWidth = 2 + 3 * cancela;
        ctx.strokeRect(gx, gy, tamanho, tamanho);
        if (circ && cancela > 0.5) {
          const borda = [[gx, gy + tamanho], [gx + tamanho, gy + tamanho], [gx + tamanho, gy], [gx, gy], [gx, gy + tamanho]];
          V.fluxo(ctx, borda, V.acumular(borda), t, { cor: c.fg, esp: 250, vel: 70, tam: 18 });
        }

        const xt = gx + tamanho + 34;
        const o = (extra) => ({ al: "left", ...extra });
        texto(ctx, `${n} × ${n} = ${n * n} ${n === 1 ? "célula" : "células"}`, xt, 46, o({ t: 28, neg: true }));
        texto(ctx, circ ? "soma das circulações das células" : "soma dos fluxos das células", xt, 112, o({ t: 22, cor: c.muted }));
        texto(ctx, numero(somaDasCelulas, 3), xt, 150, o({ t: 40, neg: true }));
        texto(ctx, circ ? "circulação na borda de fora" : "fluxo pela borda de fora", xt, 222, o({ t: 22, cor: c.muted }));
        texto(ctx, numero(naBorda, 3), xt, 260, o({ t: 40, neg: true }));
        texto(ctx, circ ? "soma de rotacional × área" : "soma de divergente × área", xt, 332, o({ t: 22, cor: c.muted }));
        texto(ctx, numero(somaAproximada, 3), xt, 370, o({ t: 40, neg: true, cor: c.a }));
        texto(ctx, "cor: laranja positivo, azul negativo", xt, 446, o({ t: 19, cor: c.muted }));
        texto(ctx, circ ? "seta roxa: sentido de percurso" : "seta laranja sai, seta azul entra", xt, 474, o({ t: 19, cor: c.muted }));
      },
    };
  });

  // ----- Stokes no espaço: a mesma borda, superfícies diferentes -----

  V.reg("stokes3d", (api) => {
    const { W, H } = api;
    const cam = { yaw: 0.6, pitch: 0.42, esc: 175, cx: W / 2 + 40, cy: H / 2 + 60 };
    let h = 0;
    let alvo = 0;
    let manual = false;
    let girando = true;
    let arrasto = null;
    let fluxoCalculado = { h: null, valor: 0 };

    const altura = (r2) => h * (1 - r2);
    const controle = api.desliza("deformar a superfície", -1.3, 2.1, 0, 0.01, (valor) => {
      h = valor;
      manual = true;
    });
    api.alterna("girar a vista", true, (ligado) => {
      girando = ligado;
    });

    // pontos onde as setas do rotacional furam a superfície
    const furos = [[0, 0]];
    for (let k = 0; k < 6; k++) furos.push([0.48 * Math.cos((k * TAU) / 6), 0.48 * Math.sin((k * TAU) / 6)]);
    for (let k = 0; k < 8; k++) furos.push([0.84 * Math.cos((k * TAU) / 8 + 0.3), 0.84 * Math.sin((k * TAU) / 8 + 0.3)]);

    // fluxo do rotacional (0, 1, 0) pela superfície, somado numa malha fina
    function fluxoDoRotacional() {
      if (fluxoCalculado.h === h) return fluxoCalculado.valor;
      const nr = 40;
      const nt = 180;
      const ponto = (ir, it) => {
        const r = ir / nr;
        const an = (it * TAU) / nt;
        return [r * Math.sin(an), altura(r * r), r * Math.cos(an)];
      };
      let soma = 0;
      for (let ir = 0; ir < nr; ir++) {
        for (let it = 0; it < nt; it++) {
          const A = ponto(ir, it);
          const B = ponto(ir + 1, it);
          const C = ponto(ir + 1, it + 1);
          const D = ponto(ir, it + 1);
          // componente y de metade do produto vetorial das diagonais
          soma += 0.5 * ((C[2] - A[2]) * (D[0] - B[0]) - (C[0] - A[0]) * (D[2] - B[2]));
        }
      }
      fluxoCalculado = { h, valor: Math.abs(soma) };
      return fluxoCalculado.valor;
    }

    return {
      passo(n) {
        alvo = [0, 1.3, -1.0][Math.min(n, 2)];
        manual = false;
      },
      down(x, y) {
        arrasto = [x, y];
      },
      move(x, y, pressionado) {
        if (!arrasto || !pressionado) return;
        cam.yaw += (x - arrasto[0]) * 0.01;
        cam.pitch = limitar(cam.pitch + (y - arrasto[1]) * 0.008, 0.1, 1.3);
        arrasto = [x, y];
      },
      up() {
        arrasto = null;
      },
      draw(t, dt) {
        const ctx = api.ctx;
        if (!manual) {
          h += (alvo - h) * Math.min(1, dt * 2);
          if (Math.abs(alvo - h) < 0.004) h = alvo;
          controle.value = h;
        }
        if (girando && !arrasto) cam.yaw += dt * 0.18;

        // linhas finas do campo rotacional, de baixo até em cima
        for (const [x, z] of furos) {
          const A = V.proj([x, -1.45, z], cam);
          const B = V.proj([x, 2.35, z], cam);
          linha(ctx, [A, B], alfa(c.i, 0.25), 2);
        }

        // superfície em malha, pintada de trás para a frente
        const nr = 7;
        const nt = 32;
        const quads = [];
        for (let ir = 0; ir < nr; ir++) {
          for (let it = 0; it < nt; it++) {
            const cantos = [[ir, it], [ir + 1, it], [ir + 1, it + 1], [ir, it + 1]].map(([a, b]) => {
              const r = a / nr;
              const an = (b * TAU) / nt;
              return V.proj([r * Math.sin(an), altura(r * r), r * Math.cos(an)], cam);
            });
            quads.push({ cantos, prof: (cantos[0][2] + cantos[1][2] + cantos[2][2] + cantos[3][2]) / 4 });
          }
        }
        quads.sort((a, b) => a.prof - b.prof);
        for (const q of quads) {
          ctx.beginPath();
          q.cantos.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
          ctx.closePath();
          ctx.fillStyle = alfa(c.a, 0.16);
          ctx.fill();
          ctx.strokeStyle = alfa(c.a, 0.4);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // seta do rotacional no ponto em que fura a superfície
        for (const [x, z] of furos) {
          const y = altura(x * x + z * z);
          const A = V.proj([x, y - 0.3, z], cam);
          const B = V.proj([x, y + 0.42, z], cam);
          const furo = V.proj([x, y, z], cam);
          seta(ctx, A[0], A[1], B[0], B[1], c.i, 3.5, 12);
          disco(ctx, furo[0], furo[1], 4.5, c.card, c.i, 2);
        }

        // curva C com o sentido de percurso
        const curva = [];
        for (let k = 0; k <= 96; k++) {
          const an = (k * TAU) / 96;
          const p = V.proj([Math.sin(an), 0, Math.cos(an)], cam);
          curva.push([p[0], p[1]]);
        }
        linha(ctx, curva, c.a, 5.5);
        V.fluxo(ctx, curva, V.acumular(curva), t, { cor: c.a, esp: 170, vel: 70, tam: 20 });
        const rotuloC = V.proj([0, 0, 1.18], cam);
        texto(ctx, "C", rotuloC[0], rotuloC[1] + 16, { cor: c.a, t: 32, it: true, serif: true, neg: true });

        ctx.fillStyle = alfa(c.card, 0.9);
        ctx.fillRect(14, 12, 520, 108);
        texto(ctx, `circulação de F ao longo de C: ${numero(Math.PI, 2)}`, 26, 34, { al: "left", t: 23, neg: true, cor: c.a });
        texto(ctx, `fluxo do rotacional pela superfície: ${numero(fluxoDoRotacional(), 2)}`, 26, 66, { al: "left", t: 23, neg: true, cor: c.i });
        texto(ctx, `setas que atravessam a superfície: ${furos.length}, sempre`, 26, 98, { al: "left", t: 21, cor: c.muted });
      },
    };
  });
})();
