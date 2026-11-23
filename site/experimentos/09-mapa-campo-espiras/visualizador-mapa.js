// Aba Visualização: liga os arquivos, o processamento, o modelo, o ajuste e as
// três vistas (3D, corte 2D e perfil 1D). A lógica numérica está nos outros
// módulos desta pasta; aqui fica só o estado da página e o DOM.
import { formatDecimal } from "../../nucleo/formato.js";
import { fitCoil } from "./ajuste-mapa.js";
import { colorRange, drawSlice } from "./cortes-2d.js";
import { generateExampleCsv } from "./dados-exemplo.js";
import { formatProcessedCsv, mergeMapFiles, parseMapFile } from "./formato-mapa.js";
import { GEOMETRIAS_COM_MODELO, coilPath, createModel } from "./modelo-biot-savart.js";
import { cssGradient } from "./paletas.js";
import { drawProfile } from "./perfil-1d.js";
import {
  COMPONENTES, PLANOS, attachModel, componentOf, processMap, profileOf, quantityAt, sliceOf,
} from "./processamento-mapa.js";
import { createFieldView } from "./vista-3d.js";

const PARAMETROS_PADRAO = Object.freeze({
  geometria: "circulo", dimensaoMm: 150, voltas: 20, correnteA: 1, k: 1, x0: 0, y0: 0, z0: 0,
});
const NOMES_DOS_PARAMETROS = ["geometria", "dimensaoMm", "voltas", "correnteA", "k", "x0", "y0", "z0"];
const FIXOS_DO_PERFIL = { z: ["x", "y"], x: ["y", "z"], y: ["x", "z"] };
const NOME_DO_EXEMPLO = "exemplo-sintetico.csv";

function formatVector(vetor, casas = 2) {
  return `(${vetor.map((valor) => formatDecimal(valor, casas)).join("; ")})`;
}

function closestTo(valores, alvo) {
  return valores.reduce((melhor, valor) => (Math.abs(valor - alvo) < Math.abs(melhor - alvo) ? valor : melhor), valores[0]);
}

// Valor e incerteza com dois algarismos significativos na incerteza.
function formatWithUncertainty(valor, incerteza) {
  if (!Number.isFinite(incerteza) || incerteza <= 0) return [formatDecimal(valor, 4), "—"];
  const casas = Math.max(0, Math.min(6, 1 - Math.floor(Math.log10(incerteza))));
  return [formatDecimal(valor, casas), formatDecimal(incerteza, casas)];
}

function download(conteudo, nome) {
  const url = URL.createObjectURL(conteudo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function describeAxis(nome, valores, passo) {
  if (valores.length === 0) return `${nome}: —`;
  const extremos = `${formatDecimal(valores[0], 1)} a ${formatDecimal(valores[valores.length - 1], 1)} mm`;
  if (valores.length <= 8) {
    return `${nome}: ${valores.length} valores (${valores.map((valor) => formatDecimal(valor, 1)).join("; ")} mm)`;
  }
  const textoDoPasso = passo ? `passo ${formatDecimal(passo, 1)} mm` : "passo irregular";
  return `${nome}: ${valores.length} valores de ${extremos}, ${textoDoPasso}`;
}

export function mountFieldMap(raiz) {
  const $ = (seletor) => raiz.querySelector(seletor);
  const el = {
    soltar: $("[data-mapa-soltar]"),
    arquivo: $("[data-mapa-arquivo]"),
    exemplo: $("[data-mapa-exemplo]"),
    limpar: $("[data-mapa-limpar]"),
    status: $("[data-mapa-status]"),
    conteudo: $("[data-mapa-conteudo]"),
    vistas: $("[data-mapa-vistas]"),
    resumo: $("[data-mapa-resumo]"),
    avisosCaixa: $("[data-mapa-avisos-caixa]"),
    avisosTitulo: $("[data-mapa-avisos-titulo]"),
    avisos: $("[data-mapa-avisos]"),
    grandeza: $("[data-mapa-grandeza]"),
    deriva: $("[data-mapa-deriva]"),
    parametros: Object.fromEntries(NOMES_DOS_PARAMETROS.map((nome) => [nome, $(`[data-mapa-param="${nome}"]`)])),
    notaU: $("[data-mapa-nota-u]"),
    ajustar: $("[data-mapa-ajustar]"),
    restaurar: $("[data-mapa-restaurar]"),
    ajuste: $("[data-mapa-ajuste]"),
    vista3d: $("[data-mapa-3d]"),
    mensagem3d: $("[data-mapa-3d-mensagem]"),
    legenda3d: $("[data-mapa-3d-legenda]"),
    escala3d: $("[data-mapa-3d-escala]"),
    densidade3d: $("[data-mapa-3d-densidade]"),
    camadas3d: $("[data-mapa-3d-camadas]"),
    plano: $("[data-mapa-plano]"),
    componente: $("[data-mapa-componente]"),
    faixa: $("[data-mapa-faixa]"),
    posicao: $("[data-mapa-posicao]"),
    posicaoValor: $("[data-mapa-posicao-valor]"),
    corte: $("[data-mapa-corte]"),
    leitura: $("[data-mapa-leitura]"),
    png: $("[data-mapa-png]"),
    perfilEixo: $("[data-mapa-perfil-eixo]"),
    perfilFixos: [$("[data-mapa-perfil-fixo-1]"), $("[data-mapa-perfil-fixo-2]")],
    perfilRotulos: [$("[data-mapa-perfil-rotulo-1]"), $("[data-mapa-perfil-rotulo-2]")],
    perfilComponente: $("[data-mapa-perfil-componente]"),
    perfilLog: $("[data-mapa-perfil-log]"),
    perfil: $("[data-mapa-perfil]"),
    perfilLeitura: $("[data-mapa-perfil-leitura]"),
    csv: $("[data-mapa-csv]"),
  };

  const estado = {
    arquivos: new Map(),
    textos: new Map(), // conteúdo de cada arquivo, para reconhecer o mesmo arquivo carregado de novo
    linhas: [],
    metadados: {},
    avisosDaLeitura: [],
    processado: null,
    modelo: null,
    parametros: { ...PARAMETROS_PADRAO },
    parametrosDosMetadados: { ...PARAMETROS_PADRAO },
    ajuste: null,
    corte: null,
    hitCorte: null,
    hitPerfil: null,
    destaqueCorte: null,
    destaquePerfil: null,
    vista: null,
    vistaPedida: false,
  };

  function setStatus(texto, tipo = "") {
    el.status.textContent = texto;
    el.status.dataset.kind = tipo;
  }

  // ---------- arquivos ----------

  // Dois arquivos diferentes com o mesmo nome (por exemplo um de cada passada) ficam os dois;
  // o mesmo arquivo carregado de novo substitui o anterior em vez de dobrar os pontos.
  function uniqueName(nome, texto) {
    let candidato = nome;
    for (let i = 2; estado.textos.has(candidato) && estado.textos.get(candidato) !== texto; i += 1) {
      candidato = `${nome} (${i})`;
    }
    return candidato;
  }

  // substituir: descarta o que estava carregado (a aba Coleta manda sempre a coleta inteira).
  async function readFiles(lista, { substituir = false } = {}) {
    const arquivos = [...lista];
    if (arquivos.length === 0) return;
    if (substituir) {
      estado.arquivos.clear();
      estado.textos.clear();
    }
    // Arquivos novos se somam aos já carregados, mas nunca ao exemplo sintético.
    estado.arquivos.delete(NOME_DO_EXEMPLO);
    estado.textos.delete(NOME_DO_EXEMPLO);
    setStatus(`Lendo ${arquivos.length} arquivo(s)…`);
    for (const arquivo of arquivos) {
      try {
        const texto = await arquivo.text();
        const nome = uniqueName(arquivo.name, texto);
        estado.textos.set(nome, texto);
        estado.arquivos.set(nome, parseMapFile(texto, nome));
      } catch (erro) {
        estado.arquivos.set(arquivo.name, { nome: arquivo.name, erro: `${arquivo.name}: não foi possível ler (${erro.message}).` });
      }
    }
    loadData();
  }

  function loadExample() {
    estado.arquivos.clear();
    estado.textos.clear();
    estado.arquivos.set(NOME_DO_EXEMPLO, parseMapFile(generateExampleCsv(), NOME_DO_EXEMPLO));
    loadData();
  }

  function clearAll() {
    estado.arquivos.clear();
    estado.textos.clear();
    estado.destaqueCorte = null;
    estado.destaquePerfil = null;
    estado.linhas = [];
    estado.processado = null;
    estado.ajuste = null;
    el.conteudo.hidden = true;
    el.limpar.disabled = true;
    el.ajuste.replaceChildren();
    setStatus("Nenhum dado carregado.");
  }

  function parametersFromMetadata(metadados, avisos) {
    const parametros = { ...PARAMETROS_PADRAO };
    const mapa = { geometria: "geometria", dimensao_mm: "dimensaoMm", voltas: "voltas", corrente_A: "correnteA" };
    const valido = {
      geometria: (valor) => typeof valor === "string" && valor.length > 0,
      dimensao_mm: (valor) => valor > 0,
      voltas: (valor) => valor > 0,
      corrente_A: (valor) => Number.isFinite(valor) && valor !== 0,
    };
    for (const [chave, nome] of Object.entries(mapa)) {
      if (!(chave in metadados)) avisos.push(`Metadado "${chave}" ausente: o modelo começa com ${PARAMETROS_PADRAO[nome]}.`);
      else if (!valido[chave](metadados[chave])) avisos.push(`Metadado "${chave}" inválido (${metadados[chave]}): o modelo começa com ${PARAMETROS_PADRAO[nome]}.`);
      else parametros[nome] = metadados[chave];
    }
    return parametros;
  }

  function loadData() {
    estado.destaqueCorte = null;
    estado.destaquePerfil = null;
    const juntado = mergeMapFiles([...estado.arquivos.values()]);
    estado.linhas = juntado.linhas;
    estado.metadados = juntado.metadados;
    estado.avisosDaLeitura = juntado.avisos;
    el.limpar.disabled = estado.arquivos.size === 0;
    if (estado.linhas.length === 0) {
      el.conteudo.hidden = true;
      setStatus(juntado.avisos[0] ?? "Nenhuma linha de dados válida nos arquivos.", "erro");
      return;
    }
    estado.parametrosDosMetadados = parametersFromMetadata(estado.metadados, estado.avisosDaLeitura);
    estado.parametros = { ...estado.parametrosDosMetadados };
    estado.ajuste = null;
    el.ajuste.replaceChildren();
    fillParameters();
    el.conteudo.hidden = false;
    reprocess(true);
    const pares = estado.processado.pontos.length;
    if (pares === 0) {
      setStatus("Nenhum ponto tem as duas passadas: confira o resumo e os avisos.", "erro");
      return;
    }
    const avisos = collectWarnings().length;
    setStatus(
      `${pares} pontos pareados de ${estado.arquivos.size} arquivo(s).${avisos ? ` ${avisos} aviso(s) no resumo.` : ""}`,
      avisos ? "aviso" : "ok",
    );
    ensureView();
  }

  // ---------- modelo e processamento ----------

  function fillParameters() {
    for (const nome of NOMES_DOS_PARAMETROS) {
      const valor = estado.parametros[nome];
      el.parametros[nome].value = nome === "geometria" ? valor : String(Number(valor.toFixed(4)));
    }
    el.notaU.hidden = estado.parametros.geometria !== "u";
  }

  function readParameters() {
    const lidos = { geometria: el.parametros.geometria.value };
    for (const nome of NOMES_DOS_PARAMETROS.slice(1)) {
      const valor = Number(el.parametros[nome].value);
      lidos[nome] = Number.isFinite(valor) ? valor : estado.parametros[nome];
    }
    if (!(lidos.dimensaoMm > 0)) lidos.dimensaoMm = estado.parametros.dimensaoMm;
    if (!(lidos.voltas > 0)) lidos.voltas = estado.parametros.voltas;
    return lidos;
  }

  function currentModel() {
    return GEOMETRIAS_COM_MODELO.includes(estado.parametros.geometria) ? createModel(estado.parametros) : null;
  }

  function reprocess(reiniciarControles = false) {
    estado.modelo = currentModel();
    estado.processado = processMap(estado.linhas, {
      corrigirDeriva: el.deriva.checked,
      campoDaBobina: estado.modelo,
    });
    attachModel(estado.processado.pontos, estado.modelo);
    el.vistas.hidden = estado.processado.pontos.length === 0;
    if (reiniciarControles) resetViewControls();
    updateAvailability();
    drawSummary();
    drawAll();
  }

  function updateAvailability() {
    const semModelo = !estado.modelo;
    for (const opcao of el.grandeza.options) {
      if (opcao.value === "modelo" || opcao.value === "residuo") opcao.disabled = semModelo;
    }
    if (semModelo && (el.grandeza.value === "modelo" || el.grandeza.value === "residuo")) {
      el.grandeza.value = "delta";
    }
    el.ajustar.disabled = semModelo || estado.processado.pontos.length < 2;
  }

  // ---------- resumo ----------

  function collectWarnings() {
    const avisos = [...estado.avisosDaLeitura];
    const processado = estado.processado;
    if (!processado) return avisos;
    const { soLigada, soDesligada, repetidos } = processado.pareamento;
    const listar = (pontos) => {
      const exemplos = pontos.slice(0, 3).map((ponto) => formatVector([ponto.x, ponto.y, ponto.z], 1)).join(", ");
      return pontos.length > 3 ? `${exemplos} e mais ${pontos.length - 3}` : exemplos;
    };
    if (soLigada.length) avisos.push(`${soLigada.length} ponto(s) sem par na passada desligada: ${listar(soLigada)} mm.`);
    if (soDesligada.length) avisos.push(`${soDesligada.length} ponto(s) sem par na passada ligada: ${listar(soDesligada)} mm.`);
    if (repetidos.length) avisos.push(`${repetidos.length} linha(s) repetem uma posição já medida na mesma passada; vale a primeira.`);
    avisos.push(...processado.deriva.avisos);
    return avisos;
  }

  function drawSummary() {
    const { processado } = estado;
    const contar = (passada, tipo) => estado.linhas.filter((linha) => linha.passada === passada && linha.tipo === tipo).length;
    const { grade, pareamento, ruido, deriva } = processado;
    const meta = estado.metadados;
    const textoDosMetadados = [
      `geometria: ${meta.geometria ?? "—"}`,
      `dimensão: ${meta.dimensao_mm !== undefined ? `${formatDecimal(meta.dimensao_mm, 1)} mm` : "—"}`,
      `voltas: ${meta.voltas ?? "—"}`,
      `corrente: ${meta.corrente_A !== undefined ? `${formatDecimal(meta.corrente_A, 3)} A` : "—"}`,
      `leituras por ponto: ${meta.leituras_por_ponto ?? "—"}`,
      meta.data ? `data: ${meta.data}` : null,
      meta.observacao ? `observação: ${meta.observacao}` : null,
    ].filter(Boolean);

    let textoDaDeriva;
    if (!el.deriva.checked) {
      textoDaDeriva = ["correção desligada: ΔB = ligada − desligada, direto"];
    } else {
      textoDaDeriva = [];
      for (const passada of ["desligada", "ligada"]) {
        const trilha = deriva.trilhas[passada];
        if (!trilha) continue;
        const primeira = trilha.visitas[0].b;
        const ultima = trilha.visitas[trilha.visitas.length - 1].b;
        textoDaDeriva.push(`${passada}: ${trilha.visitas.length} visitas; última − primeira ${formatVector(ultima.map((valor, i) => valor - primeira[i]))} μT`);
      }
      if (deriva.referencia) {
        textoDaDeriva.push(`salto entre passadas descontado: ${formatVector(deriva.salto)} μT`);
      }
      if (textoDaDeriva.length === 0) textoDaDeriva.push("sem pontos de referência: nada a corrigir");
    }

    const itens = [
      ["Arquivos", [...estado.arquivos.keys()]],
      ["Passada desligada", [`${contar("desligada", "ponto")} pontos da grade`, `${contar("desligada", "ref")} leituras da referência`]],
      ["Passada ligada", [`${contar("ligada", "ponto")} pontos da grade`, `${contar("ligada", "ref")} leituras da referência`]],
      ["Pares", [
        `${processado.pontos.length} pontos com as duas passadas`,
        `sem par: ${pareamento.soLigada.length} só na ligada, ${pareamento.soDesligada.length} só na desligada`,
      ]],
      ["Grade detectada", [
        describeAxis("x", grade.x, grade.passo.x),
        describeAxis("y", grade.y, grade.passo.y),
        describeAxis("z", grade.z, grade.passo.z),
        `${processado.pontos.length} de ${grade.nos} nós preenchidos`,
      ]],
      ["Metadados", textoDosMetadados],
      ["Ruído estimado", [
        `por leitura (mediana de s): ${formatDecimal(ruido.porLeitura, 2)} μT`,
        `incerteza típica de ΔB por componente: ${formatDecimal(ruido.deltaB, 2)} μT`,
      ]],
      ["Deriva", textoDaDeriva],
    ];
    el.resumo.replaceChildren(...itens.map(([titulo, linhas]) => {
      const bloco = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = titulo;
      bloco.append(dt);
      for (const linha of linhas) {
        const dd = document.createElement("dd");
        dd.textContent = linha;
        bloco.append(dd);
      }
      return bloco;
    }));

    const avisos = collectWarnings();
    el.avisosCaixa.hidden = avisos.length === 0;
    el.avisosCaixa.open = avisos.length > 0 && avisos.length <= 4;
    el.avisosTitulo.textContent = `Avisos (${avisos.length})`;
    el.avisos.replaceChildren(...avisos.map((texto) => {
      const item = document.createElement("li");
      item.textContent = texto;
      return item;
    }));
  }

  // ---------- ajuste ----------

  function drawFit() {
    const ajuste = estado.ajuste;
    if (!ajuste) {
      el.ajuste.replaceChildren();
      return;
    }
    const linhas = [
      ["k (μ0 medido / μ0)", ...formatWithUncertainty(ajuste.k, ajuste.u.k)],
      ["μ0 medido (10⁻⁷ T·m/A)", ...formatWithUncertainty(4 * Math.PI * ajuste.k, 4 * Math.PI * ajuste.u.k)],
      ["x0 (mm)", ...formatWithUncertainty(ajuste.x0, ajuste.u.x0)],
      ["y0 (mm)", ...formatWithUncertainty(ajuste.y0, ajuste.u.y0)],
      ["z0 (mm)", ...formatWithUncertainty(ajuste.z0, ajuste.u.z0)],
      ["resíduo RMS (μT)", formatDecimal(ajuste.rms, 3), "—"],
      ["χ²/ν", formatDecimal(ajuste.chi2Reduzido, 2), `ν = ${ajuste.graus}`],
      ["pontos usados", String(ajuste.pontos), `${ajuste.pontos * 3} componentes`],
    ];
    const tabela = document.createElement("table");
    tabela.className = "data-table";
    tabela.innerHTML = `<caption>Resultado do ajuste (${ajuste.comDeriva ? "com" : "sem"} correção de deriva)</caption><thead><tr><th scope="col">Parâmetro</th><th scope="col">Valor</th><th scope="col">Incerteza</th></tr></thead>`;
    const corpo = document.createElement("tbody");
    for (const celulas of linhas) {
      const tr = document.createElement("tr");
      for (const texto of celulas) {
        const td = document.createElement("td");
        td.textContent = texto;
        tr.append(td);
      }
      corpo.append(tr);
    }
    tabela.append(corpo);
    const envoltorio = document.createElement("div");
    envoltorio.className = "data-table-wrapper";
    envoltorio.append(tabela);
    const notas = [
      "Incerteza estatística aproximada: covariância do ajuste escalonada por χ²/ν. Ela não inclui a calibração da corrente, a contagem de voltas nem a escala do sensor.",
    ];
    if (ajuste.comDeriva) {
      notas.push("Com a correção de deriva, os pontos de uma mesma linha da grade compartilham as mesmas leituras da referência: os erros ficam correlacionados e a incerteza acima fica subestimada (no exemplo sintético, cerca de três vezes).");
    }
    if (ajuste.k < 0) {
      notas.push("k negativo: a corrente circulou no sentido horário visto de cima, oposto à convenção do modelo. Use corrente negativa e ajuste de novo.");
    }
    if (!ajuste.convergiu) {
      notas.push("A busca parou no limite de iterações sem convergir; confira o chute inicial de x0, y0 e z0.");
    }
    el.ajuste.replaceChildren(envoltorio, ...notas.map((texto) => {
      const p = document.createElement("p");
      p.className = "mapa-nota";
      p.textContent = texto;
      return p;
    }));
  }

  function runFit() {
    if (!estado.modelo) return;
    el.ajustar.disabled = true;
    el.ajuste.replaceChildren(Object.assign(document.createElement("p"), { className: "mapa-nota", textContent: "Ajustando…" }));
    setTimeout(() => {
      try {
        // Com a correção entre passadas, o ajuste usa o campo relativo à referência, que não
        // depende do modelo; depois o ΔB mostrado é refeito com os parâmetros ajustados.
        const { deriva, pontos } = estado.processado;
        const referencia = deriva.modo === "relativa" ? deriva.referencia : null;
        const resultado = fitCoil(pontos, estado.parametros, { referencia });
        estado.parametros = { ...estado.parametros, k: resultado.k, x0: resultado.x0, y0: resultado.y0, z0: resultado.z0 };
        estado.ajuste = { ...resultado, comDeriva: el.deriva.checked };
        fillParameters();
        reprocess();
        drawFit();
      } catch (erro) {
        el.ajuste.replaceChildren(Object.assign(document.createElement("p"), { className: "mapa-nota", textContent: `Não foi possível ajustar: ${erro.message}` }));
      } finally {
        updateAvailability();
      }
    }, 30);
  }

  // ---------- controles das vistas ----------

  function fixedAxisValues() {
    return estado.processado.grade[PLANOS[el.plano.value][2]];
  }

  function resetSliceSlider() {
    const valores = fixedAxisValues();
    const alvo = el.plano.value === "xy" ? 50 : 0;
    el.posicao.max = String(Math.max(0, valores.length - 1));
    el.posicao.value = String(Math.max(0, valores.indexOf(closestTo(valores, alvo))));
  }

  function fillProfileSelects() {
    const grade = estado.processado.grade;
    const eixos = FIXOS_DO_PERFIL[el.perfilEixo.value];
    eixos.forEach((eixo, i) => {
      const select = el.perfilFixos[i];
      const valores = grade[eixo];
      el.perfilRotulos[i].textContent = `${eixo} (mm)`;
      select.replaceChildren(...valores.map((valor) => new Option(formatDecimal(valor, 1), String(valor))));
      select.value = String(closestTo(valores, eixo === "z" ? 50 : 0));
    });
  }

  function resetViewControls() {
    resetSliceSlider();
    fillProfileSelects();
  }

  function currentSlice() {
    const valores = fixedAxisValues();
    const valor = valores[Math.min(valores.length - 1, Number(el.posicao.value))];
    return { plano: el.plano.value, valor };
  }

  function globalRange() {
    const valores = estado.processado.pontos.map((ponto) =>
      componentOf(quantityAt(ponto, el.grandeza.value), el.componente.value)?.valor);
    return colorRange(valores, el.componente.value);
  }

  function drawSliceView() {
    if (!estado.processado || estado.processado.pontos.length === 0) return;
    const { plano, valor } = currentSlice();
    el.posicaoValor.textContent = `${PLANOS[plano][2]} = ${formatDecimal(valor, 1)} mm`;
    estado.corte = sliceOf(estado.processado, plano, valor);
    estado.hitCorte = drawSlice(el.corte, estado.corte, {
      grandeza: el.grandeza.value,
      componente: el.componente.value,
      faixa: el.faixa.value === "global" ? globalRange() : null,
      destaque: estado.destaqueCorte,
    });
  }

  function profileFixedValues() {
    const eixos = FIXOS_DO_PERFIL[el.perfilEixo.value];
    return Object.fromEntries(eixos.map((eixo, i) => [eixo, Number(el.perfilFixos[i].value)]));
  }

  function drawProfileView() {
    if (!estado.processado || estado.processado.pontos.length === 0) return;
    const fixos = profileFixedValues();
    const pontos = profileOf(estado.processado, el.perfilEixo.value, fixos);
    estado.hitPerfil = drawProfile(el.perfil, pontos, {
      grandeza: el.grandeza.value,
      componente: el.perfilComponente.value,
      eixo: el.perfilEixo.value,
      fixos,
      log: el.perfilLog.checked,
      modelo: estado.modelo,
      destaque: estado.destaquePerfil,
    });
  }

  function describePoint(ponto) {
    if (!ponto) return "Sem medida neste ponto da grade.";
    const vetor = quantityAt(ponto, el.grandeza.value);
    const posicao = `x = ${formatDecimal(ponto.x, 1)}, y = ${formatDecimal(ponto.y, 1)}, z = ${formatDecimal(ponto.z, 1)} mm`;
    if (!vetor) return posicao;
    const partes = Object.entries(COMPONENTES).map(([chave, nome]) => {
      const { valor, u } = componentOf(vetor, chave);
      return u > 0 ? `${nome} = ${formatDecimal(valor, 2)} ± ${formatDecimal(u, 2)}` : `${nome} = ${formatDecimal(valor, 2)}`;
    });
    return `${posicao} · ${partes.join("; ")} μT`;
  }

  // ---------- vista 3D ----------

  function ensureView() {
    if (estado.vistaPedida) {
      update3D();
      return;
    }
    estado.vistaPedida = true;
    createFieldView(el.vista3d)
      .then((vista) => {
        estado.vista = vista;
        el.mensagem3d.hidden = true;
        update3D();
      })
      .catch((erro) => {
        el.mensagem3d.hidden = false;
        el.mensagem3d.textContent = `Não foi possível abrir a vista 3D (${erro.message}). O corte 2D e o perfil continuam disponíveis.`;
      });
  }

  function update3D() {
    if (!estado.vista || !estado.processado || estado.processado.pontos.length === 0) return;
    const corte = currentSlice();
    const eixoFixo = PLANOS[corte.plano][2];
    const vertices = estado.modelo ? coilPath(estado.parametros.geometria, estado.parametros.dimensaoMm) : null;
    const info = estado.vista.setData({
      pontos: estado.processado.pontos,
      grade: estado.processado.grade,
      grandeza: el.grandeza.value,
      escala: el.escala3d.value,
      densidade: Number(el.densidade3d.value),
      filtro: el.camadas3d.value === "corte" ? (ponto) => ponto[eixoFixo] === corte.valor : null,
      bobina: vertices ? { vertices, centro: [estado.parametros.x0, estado.parametros.y0, estado.parametros.z0] } : null,
      corte,
    });
    drawLegend3D(info);
  }

  function drawLegend3D(info) {
    const log = el.escala3d.value === "log";
    const minimo = log ? info.maximo / 300 : 0;
    const barra = document.createElement("span");
    barra.className = "mapa-legenda__barra";
    barra.style.background = cssGradient("sequencial", undefined, 0.3);
    const texto = (conteudo) => Object.assign(document.createElement("span"), { textContent: conteudo });
    el.legenda3d.replaceChildren(
      texto("|B| das setas:"),
      texto(`${formatDecimal(minimo, 2)} μT`),
      barra,
      texto(`${formatDecimal(info.maximo, 1)} μT`),
      texto(`· ${info.quantidade} setas · comprimento e cor em escala ${log ? "logarítmica" : "linear"}`),
    );
  }

  function drawAll() {
    drawSliceView();
    drawProfileView();
    update3D();
  }

  // ---------- exportação ----------

  function exportCsv() {
    if (!estado.processado) return;
    const p = estado.parametros;
    const texto = formatProcessedCsv(estado.processado.pontos, {
      origem: [...estado.arquivos.keys()].join("; "),
      correcao_de_deriva: el.deriva.checked ? "sim" : "não",
      geometria: p.geometria,
      dimensao_mm: p.dimensaoMm,
      voltas: p.voltas,
      corrente_A: p.correnteA,
      modelo_k: p.k,
      modelo_x0_mm: p.x0,
      modelo_y0_mm: p.y0,
      modelo_z0_mm: p.z0,
      gerado_em: new Date().toISOString(),
    });
    download(new Blob([texto], { type: "text/csv;charset=utf-8" }), "mapa-campo-processado.csv");
  }

  function exportPng() {
    if (!estado.corte) return;
    const { plano, valor } = currentSlice();
    const nome = `corte-${plano}-${PLANOS[plano][2]}${Math.round(valor)}mm-${el.grandeza.value}-${el.componente.value}.png`;
    el.corte.toBlob((blob) => blob && download(blob, nome), "image/png");
  }

  // ---------- eventos ----------

  el.arquivo.addEventListener("change", () => {
    readFiles(el.arquivo.files);
    el.arquivo.value = "";
  });
  el.soltar.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    el.soltar.classList.add("is-arrastando");
  });
  el.soltar.addEventListener("dragleave", () => el.soltar.classList.remove("is-arrastando"));
  el.soltar.addEventListener("drop", (evento) => {
    evento.preventDefault();
    el.soltar.classList.remove("is-arrastando");
    readFiles(evento.dataTransfer?.files ?? []);
  });
  el.exemplo.addEventListener("click", loadExample);
  el.limpar.addEventListener("click", clearAll);

  el.deriva.addEventListener("change", () => reprocess());
  el.grandeza.addEventListener("change", drawAll);
  for (const nome of NOMES_DOS_PARAMETROS) {
    el.parametros[nome].addEventListener("change", () => {
      estado.parametros = readParameters();
      estado.ajuste = null;
      drawFit();
      fillParameters();
      reprocess();
    });
  }
  el.ajustar.addEventListener("click", runFit);
  el.restaurar.addEventListener("click", () => {
    estado.parametros = { ...estado.parametrosDosMetadados };
    estado.ajuste = null;
    drawFit();
    fillParameters();
    reprocess();
  });

  for (const controle of [el.escala3d, el.densidade3d, el.camadas3d]) {
    controle.addEventListener("change", update3D);
  }
  el.plano.addEventListener("change", () => {
    estado.destaqueCorte = null;
    resetSliceSlider();
    drawSliceView();
    update3D();
  });
  el.posicao.addEventListener("input", () => {
    drawSliceView();
    if (el.camadas3d.value === "corte") update3D();
    else estado.vista?.setSlice(currentSlice());
  });
  for (const controle of [el.componente, el.faixa]) {
    controle.addEventListener("change", drawSliceView);
  }
  el.perfilEixo.addEventListener("change", () => {
    fillProfileSelects();
    drawProfileView();
  });
  for (const controle of [...el.perfilFixos, el.perfilComponente, el.perfilLog]) {
    controle.addEventListener("change", drawProfileView);
  }

  el.corte.addEventListener("pointermove", (evento) => {
    if (!estado.hitCorte) return;
    const caixa = el.corte.getBoundingClientRect();
    const alvo = estado.hitCorte.hit(evento.clientX - caixa.left, evento.clientY - caixa.top);
    const anterior = estado.destaqueCorte;
    estado.destaqueCorte = alvo ? { i: alvo.i, j: alvo.j } : null;
    if (alvo) el.leitura.textContent = describePoint(alvo.ponto);
    if (anterior?.i !== estado.destaqueCorte?.i || anterior?.j !== estado.destaqueCorte?.j) drawSliceView();
  });
  el.corte.addEventListener("pointerleave", () => {
    if (!estado.destaqueCorte) return;
    estado.destaqueCorte = null;
    drawSliceView();
  });
  el.perfil.addEventListener("pointermove", (evento) => {
    if (!estado.hitPerfil) return;
    const caixa = el.perfil.getBoundingClientRect();
    const alvo = estado.hitPerfil.hit(evento.clientX - caixa.left);
    const anterior = estado.destaquePerfil;
    estado.destaquePerfil = alvo?.ponto ?? null;
    if (alvo) el.perfilLeitura.textContent = describePoint(alvo.ponto);
    if (anterior !== estado.destaquePerfil) drawProfileView();
  });
  el.perfil.addEventListener("pointerleave", () => {
    if (!estado.destaquePerfil) return;
    estado.destaquePerfil = null;
    drawProfileView();
  });

  el.csv.addEventListener("click", exportCsv);
  el.png.addEventListener("click", exportPng);

  // Redesenha quando o canvas muda de largura (inclusive quando a aba aparece).
  const larguras = new Map();
  const observador = new ResizeObserver((entradas) => {
    for (const entrada of entradas) {
      const largura = Math.round(entrada.contentRect.width);
      if (larguras.get(entrada.target) === largura) continue;
      larguras.set(entrada.target, largura);
      if (entrada.target === el.corte) drawSliceView();
      else drawProfileView();
    }
  });
  observador.observe(el.corte);
  observador.observe(el.perfil);

  new MutationObserver(() => {
    if (!estado.processado) return;
    estado.vista?.refreshTheme();
    drawAll();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  return { loadExample, readFiles };
}

if (typeof document !== "undefined") {
  // A aba Coleta usa readFiles para abrir aqui o que acabou de medir.
  for (const raiz of document.querySelectorAll("[data-mapa-campo]")) {
    raiz.mapaCampo = mountFieldMap(raiz);
  }
}
