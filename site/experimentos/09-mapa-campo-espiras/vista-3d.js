// Vista 3D com three.js: bobina, setas do campo (InstancedMesh), eixos
// rotulados e o plano translúcido do corte 2D. As coordenadas da cena são as
// dos dados, em mm, com z para cima. Só redesenha quando algo muda.
import { quantityAt } from "./processamento-mapa.js";
import { currentTheme, sequentialColor, themeInk } from "./paletas.js";

const COR_DOS_EIXOS = { x: 0xd94841, y: 0x2d8659, z: 0x246bce };

// Cor e comprimento das setas a partir do módulo: escala linear ou logarítmica
// (duas décadas e meia abaixo do máximo). Devolve t entre 0 e 1.
function arrowScale(modulo, maximo, tipo) {
  if (!(maximo > 0) || !(modulo > 0)) return 0;
  if (tipo === "linear") return Math.min(1, modulo / maximo);
  const minimo = maximo / 300;
  return Math.min(1, Math.max(0, Math.log10(modulo / minimo) / Math.log10(maximo / minimo)));
}

export async function createFieldView(container) {
  const THREE = await import("three");
  const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(globalThis.devicePixelRatio || 1);
  container.append(renderer.domElement);
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "Vista 3D das setas do campo magnético sobre a bobina");

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 20000);
  camera.up.set(0, 0, 1);
  const controles = new OrbitControls(camera, renderer.domElement);
  cena.add(new THREE.AmbientLight(0xffffff, 1.6));
  const luz = new THREE.DirectionalLight(0xffffff, 2.2);
  luz.position.set(-300, -500, 900);
  cena.add(luz);

  const geometriaDaSeta = new THREE.LatheGeometry([
    new THREE.Vector2(0, -0.5),
    new THREE.Vector2(0.05, -0.5),
    new THREE.Vector2(0.05, 0.16),
    new THREE.Vector2(0.15, 0.16),
    new THREE.Vector2(0, 0.5),
  ], 10);
  const materialDaSeta = new THREE.MeshLambertMaterial({ color: 0xffffff });

  const grupoFixo = new THREE.Group(); // eixos, caixa e grade, refeitos com a grade e o tema
  const grupoBobina = new THREE.Group();
  cena.add(grupoFixo, grupoBobina);
  let setas = null;
  let plano = null;
  let ultimaGrade = null;
  let assinaturaDaGrade = "";
  let enquadrado = false;

  function render() {
    renderer.render(cena, camera);
  }
  controles.addEventListener("change", render);

  function resize() {
    const largura = container.clientWidth;
    const altura = container.clientHeight;
    if (largura < 10 || altura < 10) return;
    renderer.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
    render();
  }
  const observador = new ResizeObserver(resize);
  observador.observe(container);

  function disposeGroup(grupo) {
    for (const filho of [...grupo.children]) {
      filho.traverse((objeto) => {
        objeto.geometry?.dispose();
        if (objeto.material) {
          objeto.material.map?.dispose();
          objeto.material.dispose();
        }
      });
      grupo.remove(filho);
    }
  }

  // Rótulo com fundo opaco, para continuar legível sobre as setas.
  function textSprite(texto, cor, fundo, alturaMm = 9) {
    const tela = document.createElement("canvas");
    const ctx = tela.getContext("2d");
    const fonte = `600 40px ${themeInk().fonteMono}`;
    ctx.font = fonte;
    tela.width = Math.ceil(ctx.measureText(texto).width) + 24;
    tela.height = 56;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = fundo;
    ctx.beginPath();
    ctx.roundRect(0, 0, tela.width, tela.height, 12);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = fonte;
    ctx.fillStyle = cor;
    ctx.textBaseline = "middle";
    ctx.fillText(texto, 12, 29);
    const textura = new THREE.CanvasTexture(tela);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, depthTest: false, transparent: true }));
    sprite.scale.set((alturaMm * tela.width) / tela.height, alturaMm, 1);
    sprite.renderOrder = 10;
    return sprite;
  }

  function buildFixed(grade) {
    disposeGroup(grupoFixo);
    const tinta = themeInk();
    renderer.setClearColor(new THREE.Color(tinta.fundoFundo), 1);
    const [xMin, xMax] = [grade.x[0], grade.x[grade.x.length - 1]];
    const [yMin, yMax] = [grade.y[0], grade.y[grade.y.length - 1]];
    const zMax = grade.z[grade.z.length - 1];
    const lado = Math.max(xMax - xMin, yMax - yMin, 100);

    const grelha = new THREE.GridHelper(lado + 40, Math.round((lado + 40) / 20), tinta.linhaForte, tinta.linha);
    grelha.rotation.x = Math.PI / 2;
    grelha.position.set((xMin + xMax) / 2, (yMin + yMax) / 2, 0);
    grupoFixo.add(grelha);

    const caixa = new THREE.Box3(new THREE.Vector3(xMin, yMin, grade.z[0]), new THREE.Vector3(xMax, yMax, zMax));
    grupoFixo.add(new THREE.Box3Helper(caixa, new THREE.Color(tinta.linhaForte)));

    const origem = new THREE.Vector3(xMin - 20, yMin - 20, 0);
    const eixos = [
      ["x", new THREE.Vector3(1, 0, 0), xMax - xMin + 40],
      ["y", new THREE.Vector3(0, 1, 0), yMax - yMin + 40],
      ["z", new THREE.Vector3(0, 0, 1), zMax + 20],
    ];
    // Nomes dos eixos ao lado do meio de cada eixo (o fim do eixo y fica atrás das setas).
    const posicoesDosNomes = {
      x: new THREE.Vector3((xMin + xMax) / 2, yMin - 56, 0),
      y: new THREE.Vector3(xMin - 60, (yMin + yMax) / 2, 0),
      z: new THREE.Vector3(xMin - 20, yMin - 20, zMax + 36),
    };
    for (const [nome, direcao, comprimento] of eixos) {
      grupoFixo.add(new THREE.ArrowHelper(direcao, origem, comprimento, COR_DOS_EIXOS[nome], 10, 5));
      const rotulo = textSprite(`${nome} (mm)`, tinta.tinta, tinta.fundo, 12);
      rotulo.position.copy(posicoesDosNomes[nome]);
      grupoFixo.add(rotulo);
    }
    const marcas = [
      ...[xMin, 0, xMax].map((valor) => [`${Math.round(valor)}`, new THREE.Vector3(valor, yMin - 32, 0)]),
      ...[yMin, 0, yMax].map((valor) => [`${Math.round(valor)}`, new THREE.Vector3(xMin - 34, valor, 0)]),
      ...[grade.z[0], zMax].map((valor) => [`${Math.round(valor)}`, new THREE.Vector3(xMin - 34, yMin - 20, valor)]),
    ];
    for (const [texto, posicao] of marcas) {
      const marca = textSprite(texto.replace("-", "−"), tinta.tintaSuave, tinta.fundo, 7);
      marca.position.copy(posicao);
      grupoFixo.add(marca);
    }

    if (!enquadrado) {
      const centro = new THREE.Vector3((xMin + xMax) / 2, (yMin + yMax) / 2, zMax / 3);
      controles.target.copy(centro);
      camera.position.set(centro.x + 0.9 * lado, centro.y - 1.8 * lado, centro.z + 1.15 * lado);
      controles.update();
      enquadrado = true;
    }
  }

  function buildCoil(bobina) {
    disposeGroup(grupoBobina);
    if (!bobina) return;
    const caminho = new THREE.CurvePath();
    for (let i = 0; i < bobina.vertices.length - 1; i += 1) {
      const [a, b] = [bobina.vertices[i], bobina.vertices[i + 1]];
      caminho.add(new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b)));
    }
    const segmentos = Math.max(64, Math.min(720, bobina.vertices.length * 2));
    const tubo = new THREE.Mesh(
      new THREE.TubeGeometry(caminho, segmentos, 1.6, 8, false),
      new THREE.MeshLambertMaterial({ color: 0xc8742a }),
    );
    grupoBobina.add(tubo);
    grupoBobina.position.set(...bobina.centro);
  }

  function buildArrows(dados) {
    if (setas) {
      cena.remove(setas);
      setas.dispose();
      setas = null;
    }
    const { grade, densidade } = dados;
    const indiceX = new Map(grade.x.map((valor, i) => [valor, i]));
    const indiceY = new Map(grade.y.map((valor, i) => [valor, i]));
    const selecionados = [];
    for (const ponto of dados.pontos) {
      if (indiceX.get(ponto.x) % densidade !== 0 || indiceY.get(ponto.y) % densidade !== 0) continue;
      if (dados.filtro && !dados.filtro(ponto)) continue;
      const vetor = quantityAt(ponto, dados.grandeza);
      if (!vetor) continue;
      selecionados.push({ ponto, b: vetor.b, modulo: Math.hypot(...vetor.b) });
    }
    const maximo = Math.max(0, ...selecionados.map((item) => item.modulo));
    const passo = Math.min(grade.passo.x ?? 10, grade.passo.y ?? 10);
    const comprimentoMaximo = 0.9 * passo * densidade;
    const largura = 0.9 * comprimentoMaximo;

    setas = new THREE.InstancedMesh(geometriaDaSeta, materialDaSeta, Math.max(1, selecionados.length));
    setas.count = selecionados.length;
    const matriz = new THREE.Matrix4();
    const rotacao = new THREE.Quaternion();
    const cima = new THREE.Vector3(0, 1, 0);
    const direcao = new THREE.Vector3();
    const escala = new THREE.Vector3();
    const posicao = new THREE.Vector3();
    const cor = new THREE.Color();
    const tema = currentTheme();
    selecionados.forEach((item, i) => {
      const t = arrowScale(item.modulo, maximo, dados.escala);
      const comprimento = comprimentoMaximo * Math.max(0.12, t);
      if (item.modulo > 0) direcao.set(...item.b).normalize();
      else direcao.set(0, 0, 1);
      rotacao.setFromUnitVectors(cima, direcao);
      escala.set(largura, comprimento, largura);
      posicao.set(item.ponto.x, item.ponto.y, item.ponto.z);
      matriz.compose(posicao, rotacao, escala);
      setas.setMatrixAt(i, matriz);
      const [r, g, b] = sequentialColor(0.3 + 0.7 * t, tema);
      cor.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
      setas.setColorAt(i, cor);
    });
    setas.instanceMatrix.needsUpdate = true;
    if (setas.instanceColor) setas.instanceColor.needsUpdate = true;
    cena.add(setas);
    return { maximo, quantidade: selecionados.length };
  }

  function setSlice(corte) {
    if (plano) {
      cena.remove(plano);
      plano.geometry.dispose();
      plano.material.dispose();
      plano = null;
    }
    if (!corte || !ultimaGrade) {
      render();
      return;
    }
    const grade = ultimaGrade;
    const faixa = (valores) => [valores[0] - 5, valores[valores.length - 1] + 5];
    const [x0, x1] = faixa(grade.x);
    const [y0, y1] = faixa(grade.y);
    const [z0, z1] = [0, grade.z[grade.z.length - 1] + 5];
    let geometria;
    if (corte.plano === "xy") {
      geometria = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
      geometria.translate((x0 + x1) / 2, (y0 + y1) / 2, corte.valor);
    } else if (corte.plano === "xz") {
      geometria = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
      geometria.rotateX(Math.PI / 2);
      geometria.translate((x0 + x1) / 2, corte.valor, (z0 + z1) / 2);
    } else {
      geometria = new THREE.PlaneGeometry(z1 - z0, y1 - y0);
      geometria.rotateY(Math.PI / 2);
      geometria.translate(corte.valor, (y0 + y1) / 2, (z0 + z1) / 2);
    }
    plano = new THREE.Mesh(geometria, new THREE.MeshBasicMaterial({
      color: new THREE.Color(themeInk().destaque),
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    }));
    cena.add(plano);
    render();
  }

  return {
    // dados: { pontos, grade, grandeza, escala, densidade, filtro, bobina, corte }
    setData(dados) {
      const assinatura = JSON.stringify([dados.grade.x, dados.grade.y, dados.grade.z]);
      ultimaGrade = dados.grade;
      if (assinatura !== assinaturaDaGrade) {
        assinaturaDaGrade = assinatura;
        enquadrado = false;
        buildFixed(dados.grade);
      }
      buildCoil(dados.bobina);
      const resultado = buildArrows(dados);
      setSlice(dados.corte);
      resize();
      return resultado;
    },
    setSlice,
    refreshTheme() {
      if (ultimaGrade) buildFixed(ultimaGrade);
      render();
    },
    dispose() {
      observador.disconnect();
      controles.dispose();
      renderer.dispose();
    },
  };
}
