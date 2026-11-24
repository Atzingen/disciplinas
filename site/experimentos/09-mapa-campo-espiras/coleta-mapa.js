// Aba de coleta: liga a impressora (Marlin) e a ESP32 do MLX90393 pelo Web Serial do Chrome, conduz as duas
// passadas e grava o CSV no formato mapa-campo v1.
//
// A configuração (sensor no cabeçote, bobina na mesa, plano) fica num assistente em etapas, com desenhos; a
// origem sai das medidas (coleta-setup.js), em coordenadas absolutas da impressora depois do home.
//
// Regras de segurança da tela:
// - uma operação de impressora por vez (movimento manual, home, console, passada): os botões ficam travados
//   até ela terminar, para comandos de duas operações nunca se intercalarem (um G91 no meio de movimentos
//   absolutos, por exemplo);
// - a coleta (origem, eixos da caneta, plano e dados fixos da bobina) é congelada quando a primeira passada
//   começa e vale para as duas passadas até "Descartar", inclusive depois de recarregar a página;
// - nenhuma passada começa sem a configuração concluída no assistente e sem a confirmação de que a
//   impressora fez o home desde que foi ligada (as alturas contam a partir da mesa).

import { createMarlinLink, lerLimites, lerPosicao, mudaReferencial } from "./coleta-marlin.js";
import { createSensorLink } from "./coleta-sensor.js";
import { abrirCanal, reiniciarEsp32, webSerialDisponivel } from "./coleta-serial.js";
import {
  CURSO_PADRAO, cabecalhoCsv, cantosDaGrade, conferirLimites, conferirPosicao, estimarDuracao, executarPassada, linhaCsv,
  paraEixosDaImpressora, paraImpressora, planejarVarredura,
} from "./coleta-varredura.js";
import { areaDoSensor, calibracaoDoSetup, lerFirmware, lerSetup, sugerirPlano } from "./coleta-setup.js";
import { desenhoDaBobina, desenhoDoCabecote, desenhoDoPlano } from "./coleta-desenhos.js";

const CHAVE_SALVA = "mapa-campo-coleta-v2";
const MAX_LINHAS_LOG = 400;
const DIRECOES = ["+X", "-X", "+Y", "-Y", "+Z", "-Z"];
const ALTURA_MINIMA_MANUAL_MM = 10;
const TOTAL_DE_ETAPAS = 5;
// Podem mudar depois do início da coleta: a corrente (medida no multímetro) até a passada ligada começar,
// quando ela é gravada na coleta e trava; a observação a qualquer momento fora de uma passada.
const META_EDITAVEL = ["corrente_A", "observacao"];
const MEDIDA_ZERADA = { frente: 0, esquerda: 0, cima: 0, sFrente: 0, sEsquerda: 0, sCima: 0 };
const NOMES_DO_PLANO = {
  xMin: "x mínimo", xMax: "x máximo", xPasso: "passo em x", yMin: "y mínimo", yMax: "y máximo", yPasso: "passo em y",
  refX: "referência x", refY: "referência y", refZ: "referência z", refCada: "referência a cada",
  leituras: "leituras por ponto", pausaMs: "pausa antes de medir", velocidade: "velocidade",
};
const NOMES_DA_GEOMETRIA = { circulo: "círculo", quadrado: "quadrado", u: "U", outra: "outra" };

// Os tipos de status da coleta viram os do visualizador (mapa-status): ok, aviso ou erro.
const TIPO_DO_STATUS = { ready: "ok", complete: "ok", collecting: "ok", warning: "aviso", error: "erro" };

function lerSalvo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SALVA) ?? "null");
  } catch {
    return null;
  }
}

function gravarSalvo(estado) {
  try {
    localStorage.setItem(CHAVE_SALVA, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

function formatarDuracao(segundos) {
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, "0")} min`;
}

const mm = (valor) => `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;

function descreverCurso(curso) {
  const eixo = (nome) => `${nome} ${curso.min[nome.toLowerCase()]} a ${curso.max[nome.toLowerCase()]}`;
  return `${eixo("X")}, ${eixo("Y")}, ${eixo("Z")} mm`;
}

export function setupFieldCollector(raiz) {
  const $ = (seletor) => raiz.querySelector(seletor);
  const $$ = (seletor) => [...raiz.querySelectorAll(seletor)];
  const el = {
    status: $("[data-coleta-status]"),
    baud: $("[data-coleta-baud]"),
    conectarImpressora: $$("[data-coleta-conectar-impressora]"),
    desconectarImpressora: $("[data-coleta-desconectar-impressora]"),
    estadoImpressora: $("[data-coleta-estado-impressora]"),
    conectarSensor: $("[data-coleta-conectar-sensor]"),
    desconectarSensor: $("[data-coleta-desconectar-sensor]"),
    estadoSensor: $("[data-coleta-estado-sensor]"),
    medirAqui: $$("[data-coleta-medir-aqui]"),
    home: $$("[data-coleta-home]"),
    subir: $$("[data-coleta-subir]"),
    irOrigem: $("[data-coleta-ir-origem]"),
    jogs: $$("[data-coleta-jog]"),
    posicao: $$("[data-coleta-posicao]"),
    posicaoBobina: $("[data-coleta-posicao-bobina]"),
    ultima: $$("[data-coleta-ultima]"),
    origem: $("[data-coleta-origem]"),
    resumoConfig: $$("[data-coleta-resumo-config]"),
    resumoPlano: $$("[data-coleta-resumo-plano]"),
    eixos: $$("[data-coleta-eixo]"),
    plano: $$("[data-coleta-plano]"),
    meta: $$("[data-coleta-meta]"),
    setup: $$("[data-coleta-setup]"),
    cantos: $("[data-coleta-cantos]"),
    iniciar: $$("[data-coleta-iniciar]"),
    pausar: $("[data-coleta-pausar]"),
    parar: $("[data-coleta-parar]"),
    retomar: $("[data-coleta-retomar]"),
    progresso: $("[data-coleta-progresso]"),
    andamento: $("[data-coleta-andamento]"),
    ver: $("[data-coleta-ver]"),
    baixar: $("[data-coleta-baixar]"),
    descartar: $("[data-coleta-descartar]"),
    formGcode: $("[data-coleta-form-gcode]"),
    gcode: $("[data-coleta-gcode]"),
    enviarGcode: $("[data-coleta-enviar-gcode]"),
    mostrarOk: $("[data-coleta-mostrar-ok]"),
    log: $("[data-coleta-log]"),
    // assistente
    abrirAssistente: $("[data-coleta-abrir-assistente]"),
    assistente: $("[data-coleta-assistente]"),
    etapas: $$("[data-coleta-etapa]"),
    irParaEtapa: $$("[data-coleta-etapa-ir]"),
    voltar: $("[data-coleta-assistente-voltar]"),
    proximo: $("[data-coleta-assistente-proximo]"),
    concluir: $("[data-coleta-assistente-concluir]"),
    fecharAssistente: $("[data-coleta-assistente-fechar]"),
    erroDoAssistente: $("[data-coleta-assistente-erro]"),
    congelado: $("[data-coleta-assistente-congelado]"),
    firmware: $("[data-coleta-firmware]"),
    curso: $("[data-coleta-curso]"),
    homeConfirmado: $("[data-coleta-home-confirmado]"),
    centroAqui: $("[data-coleta-centro-aqui]"),
    topoAqui: $("[data-coleta-topo-aqui]"),
    sugerir: $("[data-coleta-sugerir]"),
    desenhos: Object.fromEntries($$("[data-coleta-desenho]").map((caixa) => [caixa.dataset.coletaDesenho, caixa])),
  };
  const campoMeta = (chave) => el.meta.find((campo) => campo.dataset.coletaMeta === chave);
  const escrever = (lista, texto) => { for (const elemento of lista) elemento.textContent = texto; };

  // Estado que sobrevive a recarregar a página.
  const estado = {
    campos: null, // valores dos campos do assistente (texto), para reabrir como estavam
    setupConfirmado: false, // o assistente foi concluído com estas medidas
    homeConfirmado: false, // a impressora fez o home desde que foi ligada (volta a falso a cada conexão)
    firmware: null, // { firmware, maquina } do M115
    curso: CURSO_PADRAO, // limites do bico pelo M211
    calibracao: null, // { X0, Y0, Z0, h0 }: origem calculada das medidas
    mapeamento: { frente: "+X", esquerda: "+Y", cima: "+Z" },
    coleta: null, // congelada na primeira passada: { calibracao, mapeamento, campos, setup, plano, passos, metadados, homeRefeito }
    passadas: {}, // desligada/ligada: { inicioMs, proximo, concluida }
    linhas: [], // linhas CSV já medidas, das duas passadas
  };
  let impressora = null; // { canal, marlin }, só depois de pronta
  let sensor = null; // { canal, link }, só depois de pronto
  const conectando = { impressora: false, sensor: false };
  let operacao = null; // nome da operação de impressora ou sensor em andamento
  let executando = null; // { passada, pausado, pararPedido, retomarPausa }
  let posicaoAtual = null;
  let etapaAtual = 1;
  const linhasLog = [];

  function status(texto, tipo = "info") {
    el.status.textContent = texto;
    el.status.dataset.kind = TIPO_DO_STATUS[tipo] ?? "";
    // O status fica no topo da aba; erro de um botão lá embaixo (iniciar a passada) passaria despercebido.
    if ((tipo === "error" || tipo === "warning") && !el.assistente.open) {
      const caixa = el.status.getBoundingClientRect();
      if (caixa.top < 0 || caixa.bottom > window.innerHeight) el.status.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    // Com o assistente aberto, o status da página fica atrás dele: o mesmo aviso aparece no rodapé do assistente.
    if (el.assistente.open) avisoNoAssistente(tipo === "error" || tipo === "warning" ? texto : "", tipo);
  }

  function avisoNoAssistente(texto, tipo = "error") {
    el.erroDoAssistente.hidden = !texto;
    el.erroDoAssistente.textContent = texto;
    el.erroDoAssistente.dataset.kind = TIPO_DO_STATUS[tipo] ?? "erro";
  }

  function registrarLog({ direcao, texto }, origemTexto) {
    if (!el.mostrarOk.checked && (texto === "ok" || /busy/i.test(texto))) return;
    const seta = direcao === "enviado" ? "→" : "←";
    linhasLog.push(`${origemTexto} ${seta} ${texto}`);
    if (linhasLog.length > MAX_LINHAS_LOG) linhasLog.splice(0, linhasLog.length - MAX_LINHAS_LOG);
    el.log.textContent = linhasLog.join("\n");
    el.log.scrollTop = el.log.scrollHeight;
  }

  function salvar() {
    if (!gravarSalvo(estado)) status("Não consegui salvar o andamento no navegador; baixe o CSV de tempos em tempos.", "warning");
  }

  // --- leitura da tela ---

  function lerCampos() {
    return {
      plano: Object.fromEntries(el.plano.map((campo) => [campo.dataset.coletaPlano, campo.value])),
      meta: Object.fromEntries(el.meta.map((campo) => [campo.dataset.coletaMeta, campo.value])),
      setup: Object.fromEntries(el.setup.map((campo) => [campo.dataset.coletaSetup, campo.value])),
    };
  }

  function preencherCampos(campos) {
    if (!campos) return;
    for (const campo of el.plano) if (campo.dataset.coletaPlano in (campos.plano ?? {})) campo.value = campos.plano[campo.dataset.coletaPlano];
    for (const campo of el.setup) if (campo.dataset.coletaSetup in (campos.setup ?? {})) campo.value = campos.setup[campo.dataset.coletaSetup];
    for (const campo of el.meta) {
      const chave = campo.dataset.coletaMeta;
      if (chave in (campos.meta ?? {}) && !META_EDITAVEL.includes(chave)) campo.value = campos.meta[chave];
    }
  }

  function lerPlano(valores = lerCampos().plano) {
    const numero = (chave) => {
      const texto = String(valores[chave] ?? "").trim();
      const valor = Number(texto);
      if (texto === "" || !Number.isFinite(valor)) throw new Error(`Preencha "${NOMES_DO_PLANO[chave]}" com um número.`);
      return valor;
    };
    const alturas = String(valores.alturas ?? "").split(/[;,\s]+/).filter(Boolean).map(Number);
    if (alturas.length === 0 || alturas.some((z) => !Number.isFinite(z) || z <= 0)) {
      throw new Error("As alturas z precisam ser números maiores que zero, separados por vírgula.");
    }
    const plano = {
      x: { min: numero("xMin"), max: numero("xMax"), passo: numero("xPasso") },
      y: { min: numero("yMin"), max: numero("yMax"), passo: numero("yPasso") },
      alturas,
      referencia: { x: numero("refX"), y: numero("refY"), z: numero("refZ") },
      referenciaACadaLinhas: numero("refCada"),
      leituras: numero("leituras"),
      pausaMs: numero("pausaMs"),
      velocidade: numero("velocidade"),
    };
    if (!(Number.isInteger(plano.leituras) && plano.leituras >= 2 && plano.leituras <= 256)) {
      throw new Error("Leituras por ponto: um inteiro de 2 a 256 (com uma só não há como estimar o ruído).");
    }
    if (!(plano.pausaMs >= 0)) throw new Error("A pausa antes de medir não pode ser negativa.");
    if (!(plano.velocidade >= 100)) throw new Error("A velocidade precisa ser de pelo menos 100 mm/min.");
    return plano;
  }

  function lerSetupDaTela() {
    return lerSetup(lerCampos().setup);
  }

  function lerBobina() {
    const dimensao = Number(campoMeta("dimensao_mm").value);
    const voltas = Number(campoMeta("voltas").value);
    if (!(dimensao > 0)) throw new Error("Informe o diâmetro ou o lado da bobina, em mm.");
    if (!(Number.isInteger(voltas) && voltas >= 1)) throw new Error("Informe o número de voltas da bobina (inteiro).");
    return { geometria: campoMeta("geometria").value, dimensaoMm: dimensao, voltas };
  }

  function lerMapeamento() {
    return Object.fromEntries(el.eixos.map((select) => [select.dataset.coletaEixo, select.value]));
  }

  // Origem calculada das medidas da tela (ou nula enquanto alguma estiver inválida).
  function atualizarCalibracao() {
    try {
      estado.calibracao = calibracaoDoSetup(lerSetupDaTela());
    } catch {
      estado.calibracao = null;
    }
  }

  // Metadados fixos da bobina e da montagem, congelados com a coleta.
  function lerMetadadosFixos(plano) {
    const setup = lerSetupDaTela();
    return {
      geometria: campoMeta("geometria").value,
      dimensao_mm: campoMeta("dimensao_mm").value.trim(),
      voltas: campoMeta("voltas").value.trim(),
      leituras_por_ponto: plano.leituras,
      sensor_dx_mm: setup.dx,
      sensor_dy_mm: setup.dy,
      sensor_dz_mm: setup.dz,
      bobina_hb_mm: setup.hb,
      bobina_xc_mm: setup.xc,
      bobina_yc_mm: setup.yc,
      firmware: estado.firmware ? `${estado.firmware.firmware}${estado.firmware.maquina ? `, ${estado.firmware.maquina}` : ""}` : "",
      curso: descreverCurso(estado.curso),
      data: new Date().toISOString(),
    };
  }

  // Com uma coleta, valem a corrente gravada ao iniciar a passada ligada e a observação gravada nela.
  function metadadosDoArquivo() {
    const base = estado.coleta?.metadados ?? lerMetadadosFixos(lerPlano());
    return {
      ...base,
      corrente_A: base.corrente_A ?? campoMeta("corrente_A").value.trim(),
      observacao: base.observacao ?? campoMeta("observacao").value.trim(),
    };
  }

  function correnteGravada() {
    return estado.coleta?.metadados.corrente_A;
  }

  // --- estado dos botões ---

  function passadaParada() {
    return Object.entries(estado.passadas).find(([, p]) => !p.concluida && p.proximo > 0)?.[0] ?? null;
  }

  function atualizarBotoes() {
    const impressoraOk = Boolean(impressora) && !impressora.marlin.foraDeSincronia();
    const sensorOk = Boolean(sensor) && !sensor.link.foraDeSincronia();
    if (sensor && !sensorOk) el.estadoSensor.textContent = "Fora de sincronia: desconecte e conecte o sensor de novo.";
    const ocupado = Boolean(executando || operacao || conectando.impressora || conectando.sensor);
    const coleta = estado.coleta;

    const temSerial = webSerialDisponivel();
    for (const botao of el.conectarImpressora) botao.disabled = !temSerial || Boolean(impressora) || conectando.impressora;
    el.desconectarImpressora.disabled = !impressora || Boolean(executando) || conectando.impressora;
    el.conectarSensor.disabled = !temSerial || Boolean(sensor) || conectando.sensor;
    el.desconectarSensor.disabled = !sensor || Boolean(executando) || conectando.sensor;
    for (const botao of el.medirAqui) botao.disabled = !sensorOk || ocupado;
    for (const botao of [...el.home, ...el.subir, ...el.jogs, el.enviarGcode]) botao.disabled = !impressoraOk || ocupado;
    const calibracao = coleta?.calibracao ?? estado.calibracao;
    el.irOrigem.disabled = !impressoraOk || ocupado || !calibracao;
    el.cantos.disabled = !impressoraOk || ocupado || !calibracao || Boolean(coleta?.homeRefeito);
    el.centroAqui.disabled = !impressoraOk || ocupado || Boolean(coleta);
    el.topoAqui.disabled = !impressoraOk || ocupado || Boolean(coleta);
    el.sugerir.disabled = Boolean(coleta) || ocupado;

    // Iniciar fica clicável com tudo conectado: o que faltar (configuração, home) é explicado na mensagem.
    const pronto = impressoraOk && sensorOk && !ocupado && !coleta?.homeRefeito;
    for (const botao of el.iniciar) botao.disabled = !pronto;
    el.retomar.disabled = !pronto || !coleta || !passadaParada();
    el.pausar.disabled = !executando || executando.pararPedido;
    el.parar.disabled = !executando;
    el.pausar.textContent = executando?.pausado ? "Continuar" : "Pausar";
    el.ver.disabled = estado.linhas.length === 0;
    el.baixar.disabled = estado.linhas.length === 0;
    el.descartar.disabled = Boolean(executando) || (estado.linhas.length === 0 && !coleta);

    const travado = ocupado || Boolean(coleta);
    for (const campo of [...el.plano, ...el.eixos, ...el.setup]) campo.disabled = travado;
    for (const campo of el.meta) {
      campo.disabled = META_EDITAVEL.includes(campo.dataset.coletaMeta) ? Boolean(executando) : travado;
    }
    if (correnteGravada() !== undefined) campoMeta("corrente_A").disabled = true;
    el.congelado.hidden = !coleta;
    el.homeConfirmado.checked = estado.homeConfirmado;
  }

  function mostrarConfiguracao() {
    const itens = [];
    try {
      const setup = lerSetupDaTela();
      itens.push(["Sensor", `dx ${mm(setup.dx)}, dy ${mm(setup.dy)}, ${mm(setup.dz)} abaixo do bico`]);
      itens.push(["Bobina na mesa", `centro em X ${mm(setup.xc)}, Y ${mm(setup.yc)}; plano do fio a ${mm(setup.hb)} da mesa`]);
    } catch (erro) {
      itens.push(["Medidas", erro.message]);
    }
    const geometria = NOMES_DA_GEOMETRIA[campoMeta("geometria").value] ?? campoMeta("geometria").value;
    itens.push(["Bobina", `${geometria}, ${campoMeta("dimensao_mm").value} mm, ${campoMeta("voltas").value} voltas`]);
    itens.push(["Curso do bico", `${descreverCurso(estado.curso)}${impressora ? " (do M211)" : ""}`]);
    itens.push(["Home", estado.homeConfirmado ? "confirmado" : "não confirmado (etapa 1 do assistente)"]);
    for (const lista of el.resumoConfig) {
      lista.replaceChildren(...itens.map(([titulo, texto]) => {
        const bloco = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = titulo;
        dd.textContent = texto;
        bloco.append(dt, dd);
        return bloco;
      }));
    }

    const c = estado.coleta?.calibracao ?? estado.calibracao;
    let texto;
    if (estado.coleta?.homeRefeito) {
      texto = "Houve um comando que muda o referencial da impressora depois do início desta coleta: a origem dela não vale mais. Baixe o CSV, descarte e recomece.";
    } else if (estado.coleta) {
      texto = "Coleta em andamento: medidas, eixos e plano estão fixos até descartar a coleta.";
    } else if (!estado.setupConfirmado) {
      texto = "Experimento ainda não configurado: abra o passo a passo e conclua as cinco etapas.";
    } else {
      texto = "Experimento configurado.";
    }
    if (c) texto += ` Com o sensor sobre o centro da bobina, o bico fica em X ${c.X0.toFixed(1)}, Y ${c.Y0.toFixed(1)}.`;
    el.origem.textContent = texto;
  }

  function mostrarPosicao() {
    if (!posicaoAtual) return;
    escrever(el.posicao, `X ${posicaoAtual.x.toFixed(2)} · Y ${posicaoAtual.y.toFixed(2)} · Z ${posicaoAtual.z.toFixed(2)}`);
    const c = estado.coleta?.calibracao ?? estado.calibracao;
    el.posicaoBobina.textContent = c
      ? `${(posicaoAtual.x - c.X0).toFixed(1)} · ${(posicaoAtual.y - c.Y0).toFixed(1)} · ${(posicaoAtual.z - c.Z0 + c.h0).toFixed(1)} mm`
      : "configure o experimento";
  }

  function mostrarAndamento() {
    const total = estado.coleta?.passos.length ?? 0;
    const partes = ["desligada", "ligada"].map((passada) => {
      const p = estado.passadas[passada];
      if (!p) return `${passada}: não começou`;
      if (p.concluida) return `${passada}: concluída`;
      return `${passada}: ${p.proximo} de ${total}`;
    });
    el.andamento.textContent = estado.coleta ? `Passadas — ${partes.join("; ")}.` : "Nenhuma passada em andamento.";
    const ativa = executando?.passada ?? passadaParada();
    el.progresso.value = ativa && total ? estado.passadas[ativa].proximo / total : 0;
  }

  function mostrarFirmware() {
    el.firmware.textContent = estado.firmware
      ? `${estado.firmware.firmware}${estado.firmware.maquina ? ` · ${estado.firmware.maquina}` : ""}`
      : (impressora ? "não informado" : "impressora não conectada");
    el.curso.textContent = `${descreverCurso(estado.curso)}${impressora ? " (do M211)" : " (última conexão ou padrão)"}`;
  }

  // Desenhos do assistente com os valores da tela; valor inválido vira a mensagem no lugar do desenho.
  function desenhar() {
    const mostrar = (nome, montar) => {
      const caixa = el.desenhos[nome];
      if (!caixa) return;
      try {
        caixa.innerHTML = montar();
      } catch (erro) {
        caixa.innerHTML = "";
        const aviso = document.createElement("p");
        aviso.className = "mapa-nota";
        aviso.textContent = erro.message;
        caixa.append(aviso);
      }
    };
    mostrar("cabecote", () => desenhoDoCabecote(lerSetupDaTela()));
    mostrar("bobina", () => {
      const bobina = lerBobina();
      return desenhoDaBobina({ setup: lerSetupDaTela(), curso: estado.curso, geometria: bobina.geometria, dimensaoMm: bobina.dimensaoMm });
    });
    mostrar("plano", () => {
      const { passos, setup } = planoAtual();
      const bobina = estado.coleta ? { geometria: estado.coleta.metadados.geometria, dimensaoMm: Number(estado.coleta.metadados.dimensao_mm) } : lerBobina();
      return desenhoDoPlano({ passos, area: areaDoSensor(estado.curso, setup), geometria: bobina.geometria, dimensaoMm: bobina.dimensaoMm });
    });
  }

  // Qualquer mudança nos campos do assistente: guarda, recalcula a origem e redesenha. A configuração mudou,
  // então precisa ser concluída de novo no assistente.
  function aoMudarCampos() {
    if (estado.coleta) return;
    estado.setupConfirmado = false;
    estado.campos = lerCampos();
    estado.mapeamento = lerMapeamento();
    atualizarCalibracao();
    salvar();
    desenhar();
    conferirPlano();
    mostrarConfiguracao();
    mostrarPosicao();
  }

  async function atualizarPosicao() {
    await impressora.marlin.enviar("M400");
    posicaoAtual = lerPosicao(await impressora.marlin.enviar("M114"));
    mostrarPosicao();
  }

  // Uma operação por vez; os botões ficam travados enquanto ela roda.
  async function operar(nome, acao) {
    if (operacao || executando) return;
    operacao = nome;
    atualizarBotoes();
    try {
      await acao();
    } catch (erro) {
      status(erro.message, "error");
    } finally {
      operacao = null;
      atualizarBotoes();
    }
  }

  // --- conexões ---

  // Algumas placas reiniciam ao abrir a porta e despejam a configuração. Comando enviado nesse meio pode ter o
  // "ok" perdido ou atrasado; por isso o primeiro comando só sai depois de 1,5 s sem nenhuma linha chegando.
  async function esperarSilencio(ultimaLinha, { quietoMs = 1500, maximoMs = 15000 } = {}) {
    const inicio = Date.now();
    while (Date.now() - inicio < maximoMs) {
      if (Date.now() - ultimaLinha() >= quietoMs) return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  async function conectarImpressora() {
    let canal = null;
    let marlin = null;
    let ultimaLinha = Date.now();
    conectando.impressora = true;
    atualizarBotoes();
    try {
      const porta = await navigator.serial.requestPort();
      canal = await abrirCanal(porta, {
        velocidade: Number(el.baud.value),
        aoLinha: (linha) => {
          ultimaLinha = Date.now();
          marlin?.receber(linha);
        },
        aoFechar: (mensagem) => perdeuImpressora(mensagem, marlin),
      });
      marlin = createMarlinLink(canal.escrever, { log: (item) => registrarLog(item, "impressora") });
      el.estadoImpressora.textContent = "Porta aberta. Esperando a placa ficar quieta…";
      await esperarSilencio(() => ultimaLinha);
      el.estadoImpressora.textContent = "Conferindo a resposta…";
      await marlin.enviar("M114", { prazoMs: 10000 });
      estado.firmware = lerFirmware(await marlin.enviar("M115"));
      estado.curso = lerLimites(await marlin.enviar("M211")) ?? CURSO_PADRAO; // M211 sem S só informa
      await marlin.enviar("G90");
      await marlin.enviar("M18 S0"); // motores não desligam parados (posição e fundo magnético iguais nas duas passadas)
      impressora = { canal, marlin };
      // Não dá para saber se a impressora foi religada desde o último home: a confirmação volta a ser pedida.
      estado.homeConfirmado = false;
      salvar();
      await atualizarPosicao();
      el.estadoImpressora.textContent = estado.firmware
        ? `Conectada: ${estado.firmware.firmware}${estado.firmware.maquina ? `, ${estado.firmware.maquina}` : ""}.`
        : "Conectada e respondendo.";
      status("Impressora conectada. Confirme o home na etapa 1 do assistente antes das passadas.", "ready");
    } catch (erro) {
      impressora = null;
      marlin?.cancelarTudo();
      await canal?.fechar();
      if (erro.name !== "NotFoundError") {
        el.estadoImpressora.textContent = "Desconectada.";
        status(`Impressora: ${erro.message}`, "error");
      }
    } finally {
      conectando.impressora = false;
      mostrarFirmware();
      mostrarConfiguracao();
      desenhar();
      conferirPlano();
      atualizarBotoes();
    }
  }

  async function desconectarImpressora() {
    const atual = impressora;
    impressora = null;
    atual?.marlin.cancelarTudo();
    await atual?.canal.fechar();
    el.estadoImpressora.textContent = "Desconectada.";
    mostrarFirmware();
    atualizarBotoes();
  }

  function perdeuImpressora(mensagem, marlin) {
    marlin?.cancelarTudo(mensagem);
    if (!impressora || impressora.marlin !== marlin) return;
    impressora = null;
    el.estadoImpressora.textContent = mensagem;
    status(`Impressora: ${mensagem}`, "error");
    mostrarFirmware();
    atualizarBotoes();
  }

  async function conectarSensor() {
    let canal = null;
    let link = null;
    conectando.sensor = true;
    atualizarBotoes();
    try {
      const porta = await navigator.serial.requestPort();
      canal = await abrirCanal(porta, {
        velocidade: 115200,
        aoLinha: (linha) => {
          link?.receber(linha);
          if (linha.startsWith("obs: MLX90393 não encontrado")) el.estadoSensor.textContent = linha.slice(5);
        },
        aoFechar: (mensagem) => perdeuSensor(mensagem, link),
      });
      link = createSensorLink(canal.escrever, {
        log: (item) => {
          if (item.direcao === "enviado" || !/^(frente_uT|\d+,)/.test(item.texto)) registrarLog(item, "sensor");
        },
      });
      el.estadoSensor.textContent = "Reiniciando a placa e procurando o sensor…";
      const pronto = link.esperarPronto(12000);
      await reiniciarEsp32(porta);
      await pronto;
      await link.silenciar();
      await link.faixaFraca();
      sensor = { canal, link };
      el.estadoSensor.textContent = "Sensor pronto (faixa fraca, modo silencioso).";
      status("Sensor conectado.", "ready");
    } catch (erro) {
      sensor = null;
      link?.cancelarTudo();
      await canal?.fechar();
      if (erro.name !== "NotFoundError") {
        el.estadoSensor.textContent = "Desconectado.";
        status(`Sensor: ${erro.message} Se a placa não reiniciou, aperte o EN dela e conecte de novo.`, "error");
      }
    } finally {
      conectando.sensor = false;
      atualizarBotoes();
    }
  }

  async function desconectarSensor() {
    const atual = sensor;
    sensor = null;
    atual?.link.cancelarTudo();
    await atual?.canal.fechar();
    el.estadoSensor.textContent = "Desconectado.";
    atualizarBotoes();
  }

  function perdeuSensor(mensagem, link) {
    link?.cancelarTudo(mensagem);
    if (!sensor || sensor.link !== link) return;
    sensor = null;
    el.estadoSensor.textContent = mensagem;
    status(`Sensor: ${mensagem}`, "error");
    atualizarBotoes();
  }

  function medirAqui() {
    return operar("medir", async () => {
      const medida = await sensor.link.medir(8);
      const campo = paraEixosDaImpressora(medida, estado.coleta?.mapeamento ?? lerMapeamento());
      escrever(el.ultima, `frente ${medida.frente.toFixed(1)}, esquerda ${medida.esquerda.toFixed(1)}, cima ${medida.cima.toFixed(1)} µT → ` +
        `Bx ${campo.bx.toFixed(1)}, By ${campo.by.toFixed(1)}, Bz ${campo.bz.toFixed(1)} µT`);
    });
  }

  // --- movimento ---

  function jog(botao) {
    const direcao = botao.dataset.coletaJog;
    const passo = Number(botao.closest("[data-coleta-jog-grupo]")?.querySelector("[data-coleta-passo]")?.value ?? 10);
    return operar("jog", async () => {
      const eixo = direcao[0];
      const distancia = (direcao[1] === "-" ? -1 : 1) * passo;
      await atualizarPosicao();
      // O firmware para no limite sem avisar: o aviso vem daqui, antes de mandar o movimento.
      const destino = posicaoAtual[eixo.toLowerCase()] + distancia;
      const minimo = estado.curso.min[eixo.toLowerCase()];
      const maximo = estado.curso.max[eixo.toLowerCase()];
      if (destino < minimo || destino > maximo) {
        status(`${eixo} ${destino.toFixed(1)} fica fora do curso da impressora (${minimo} a ${maximo} mm): ela não se move. Use um passo menor.`, "warning");
        return;
      }
      const calibracao = estado.coleta?.calibracao ?? estado.calibracao;
      if (eixo === "Z" && distancia < 0 && calibracao && estado.setupConfirmado) {
        const alturaNova = destino - calibracao.Z0 + calibracao.h0;
        if (alturaNova < ALTURA_MINIMA_MANUAL_MM) {
          status(`Esse passo deixaria o sensor a ${alturaNova.toFixed(1)} mm do plano da bobina (mínimo ${ALTURA_MINIMA_MANUAL_MM} mm). Use um passo menor.`, "warning");
          return;
        }
      }
      await impressora.marlin.enviar("G91");
      let erroDoMovimento = null;
      try {
        await impressora.marlin.enviar(`G1 ${eixo}${distancia} F${eixo === "Z" ? 600 : 3000}`);
      } catch (erro) {
        erroDoMovimento = erro;
      }
      // Volta ao modo absoluto mesmo se o movimento falhou, mas só com a impressora conectada e em sincronia
      // (senão o envio falharia de novo), e sem que uma falha do G90 esconda a do movimento.
      try {
        if (impressora && !impressora.marlin.foraDeSincronia()) await impressora.marlin.enviar("G90");
      } catch (erro) {
        erroDoMovimento ??= erro;
      }
      if (erroDoMovimento) throw erroDoMovimento;
      await atualizarPosicao();
    });
  }

  // Depois do home as coordenadas voltam a ser as da mesa e a configuração (absoluta) continua valendo. Uma
  // coleta já começada é conservadora: qualquer mudança de referencial no meio dela a invalida. Uma coleta sem
  // nenhuma medida (a primeira passada falhou logo no primeiro ponto) não tem o que guardar e é desfeita direto.
  function aposMudarReferencial({ foiHome }) {
    estado.homeConfirmado = foiHome;
    if (estado.coleta && estado.linhas.length === 0) {
      estado.coleta = null;
      estado.passadas = {};
    } else if (estado.coleta) {
      estado.coleta.homeRefeito = true;
    }
    salvar();
    mostrarConfiguracao();
    mostrarAndamento();
  }

  function home() {
    const aviso = estado.coleta && estado.linhas.length > 0
      ? "Há uma coleta em andamento: depois do home a origem dela não vale mais e ela terá de ser descartada. " +
        "A mesa está vazia, sem o suporte da bobina?"
      : "A mesa está vazia, sem o suporte da bobina? O home desce o sensor de nivelamento no meio da mesa.";
    if (!globalThis.confirm(aviso)) return;
    return operar("home", async () => {
      status("Fazendo o home…");
      await impressora.marlin.enviar("G28", { prazoMs: 240000 });
      await impressora.marlin.enviar("M18 S0");
      aposMudarReferencial({ foiHome: true });
      status("Home feito. Suba o Z e coloque o suporte da bobina.", "ready");
      await atualizarPosicao();
    });
  }

  function subir() {
    return operar("subir", async () => {
      await impressora.marlin.enviar("G90");
      const z = Math.min(250, estado.curso.max.z);
      await impressora.marlin.enviar(`G1 Z${z} F600`);
      await atualizarPosicao();
    });
  }

  // Sobe primeiro e desce por último, para não arrastar o sensor perto da bobina.
  async function irPara({ x, y, z }, calibracao) {
    const { X, Y, Z } = paraImpressora({ x, y, z }, calibracao);
    await impressora.marlin.enviar("G90");
    await atualizarPosicao();
    await impressora.marlin.enviar(`G1 Z${Math.max(Z, posicaoAtual.z).toFixed(2)} F600`);
    await impressora.marlin.enviar(`G1 X${X.toFixed(2)} Y${Y.toFixed(2)} F3000`);
    await impressora.marlin.enviar(`G1 Z${Z.toFixed(2)} F600`);
    await atualizarPosicao();
  }

  function irParaOCentro() {
    const calibracao = estado.coleta?.calibracao ?? estado.calibracao;
    if (!estado.homeConfirmado) {
      status("Confirme o home (etapa 1 do assistente) antes de mandar o sensor para a bobina.", "warning");
      return;
    }
    let z = 30;
    try {
      z = Math.min(...planoAtual().plano.alturas);
    } catch {
      // plano inválido: usa 30 mm
    }
    const alvo = { x: 0, y: 0, z };
    const problemas = conferirLimites([alvo], calibracao, { curso: estado.curso, alturaMinima: ALTURA_MINIMA_MANUAL_MM });
    if (problemas.length) {
      status(`O centro da bobina não cabe no curso: ${problemas[0]}.`, "error");
      return;
    }
    return operar("centro", () => irPara(alvo, calibracao));
  }

  // Etapa 3: a posição medida pela própria impressora vira o centro ou a altura da bobina.
  function usarPosicaoComoCentro() {
    let setup;
    try {
      setup = lerSetupDaTela();
    } catch (erro) {
      status(erro.message, "error");
      return;
    }
    if (!estado.homeConfirmado) {
      status("Confirme o home (etapa 1) antes: o centro vem do X e do Y da impressora, que só valem depois do home.", "warning");
      return;
    }
    return operar("centro", async () => {
      await atualizarPosicao();
      const campo = (chave) => el.setup.find((c) => c.dataset.coletaSetup === chave);
      campo("xc").value = (posicaoAtual.x + setup.dx).toFixed(1);
      campo("yc").value = (posicaoAtual.y + setup.dy).toFixed(1);
      aoMudarCampos();
      status("Centro da bobina tirado da posição do sensor.", "ready");
    });
  }

  function usarPosicaoComoTopo() {
    let setup;
    try {
      setup = lerSetupDaTela();
    } catch (erro) {
      status(erro.message, "error");
      return;
    }
    if (!estado.homeConfirmado) {
      status("Confirme o home (etapa 1) antes: a altura hb vem do Z da impressora, que só vale depois do home.", "warning");
      return;
    }
    return operar("topo", async () => {
      await atualizarPosicao();
      const hb = posicaoAtual.z - setup.dz;
      if (!(hb >= 0)) throw new Error(`Com Z ${posicaoAtual.z} e o sensor ${setup.dz} mm abaixo do bico, o sensor estaria abaixo da mesa: confira o dz.`);
      el.setup.find((c) => c.dataset.coletaSetup === "hb").value = hb.toFixed(1);
      aoMudarCampos();
      status("Altura do plano da bobina tirada da posição do sensor.", "ready");
    });
  }

  // --- plano ---

  // Plano em uso: o congelado da coleta, ou o da tela quando ainda não há coleta.
  function planoAtual() {
    if (estado.coleta) {
      const { plano, passos, calibracao, mapeamento, setup } = estado.coleta;
      return { plano, passos, calibracao, mapeamento, setup };
    }
    const plano = lerPlano();
    const setup = lerSetupDaTela();
    return { plano, passos: planejarVarredura(plano), calibracao: calibracaoDoSetup(setup), mapeamento: lerMapeamento(), setup };
  }

  // Devolve true quando o plano pode ser executado (eixos da caneta válidos, medidas válidas e todos os pontos
  // dentro do curso).
  function conferirPlano() {
    try {
      const { plano, passos, calibracao, mapeamento } = planoAtual();
      // Dois eixos da caneta no mesmo eixo da impressora lançam erro aqui, antes de andar e medir.
      paraEixosDaImpressora(MEDIDA_ZERADA, mapeamento);
      const problemas = conferirLimites(passos, calibracao, { curso: estado.curso });
      const pontos = passos.filter((p) => p.tipo === "ponto").length;
      const duracao = estimarDuracao(passos, {
        velocidadeMmS: plano.velocidade / 60, segundosPorMedida: plano.leituras * 0.075, pausaS: plano.pausaMs / 1000,
      });
      let texto = `${pontos} pontos e ${passos.length - pontos} visitas à referência por passada; ` +
        `cerca de ${formatarDuracao(duracao)} por passada (com o eixo Z a 5 mm/s).`;
      if (problemas.length) texto += ` Problemas: ${problemas.slice(0, 4).join("; ")}. Use "Sugerir a partir da bobina" ou ajuste a grade.`;
      else texto += " Todos os pontos cabem no curso da impressora.";
      escrever(el.resumoPlano, texto);
      return problemas.length === 0;
    } catch (erro) {
      escrever(el.resumoPlano, erro.message);
      return false;
    }
  }

  function sugerir() {
    try {
      const bobina = lerBobina();
      const campos = sugerirPlano({ dimensaoMm: bobina.dimensaoMm, setup: lerSetupDaTela(), curso: estado.curso });
      for (const campo of el.plano) if (campo.dataset.coletaPlano in campos) campo.value = campos[campo.dataset.coletaPlano];
      aoMudarCampos();
      avisoNoAssistente("");
    } catch (erro) {
      avisoNoAssistente(erro.message);
    }
  }

  function percorrerCantos() {
    if (!estado.homeConfirmado) {
      status("Confirme o home (etapa 1) antes de mandar a cabeça aos cantos.", "warning");
      return;
    }
    if (!conferirPlano()) {
      status("Corrija o plano antes de percorrer os cantos (veja o resumo do plano).", "error");
      return;
    }
    const { passos, calibracao } = planoAtual();
    const cantos = cantosDaGrade(passos);
    const problemas = conferirLimites(cantos, calibracao, { curso: estado.curso });
    if (problemas.length) {
      status(`Os cantos da grade não cabem no curso da impressora: ${problemas[0]}.`, "error");
      return;
    }
    return operar("cantos", async () => {
      for (const canto of cantos) {
        status(`Indo ao canto (${canto.x}, ${canto.y}) a ${canto.z} mm…`);
        await irPara(canto, calibracao);
        await conferirPosicao(impressora.marlin, paraImpressora(canto, calibracao));
      }
      status("Cantos percorridos. Confira se nada encostou na bobina nem no suporte.", "ready");
    });
  }

  // --- assistente ---

  function validarEtapa(etapa) {
    if (etapa === 2) {
      lerSetupDaTela();
      paraEixosDaImpressora(MEDIDA_ZERADA, lerMapeamento());
    }
    if (etapa === 3) {
      lerBobina();
      lerSetupDaTela();
    }
    if (etapa === 4 && !conferirPlano()) {
      throw new Error("O plano ainda tem problemas (veja o resumo abaixo da grade).");
    }
  }

  function mostrarEtapa(etapa) {
    etapaAtual = Math.min(Math.max(etapa, 1), TOTAL_DE_ETAPAS);
    for (const secao of el.etapas) secao.hidden = Number(secao.dataset.coletaEtapa) !== etapaAtual;
    for (const botao of el.irParaEtapa) {
      const numero = Number(botao.dataset.coletaEtapaIr);
      if (numero === etapaAtual) {
        botao.setAttribute("aria-current", "step");
        // Em tela estreita a faixa de etapas rola de lado: a atual fica à vista.
        botao.scrollIntoView({ block: "nearest", inline: "nearest" });
      } else {
        botao.removeAttribute("aria-current");
      }
    }
    el.voltar.disabled = etapaAtual === 1;
    el.proximo.hidden = etapaAtual === TOTAL_DE_ETAPAS;
    el.concluir.hidden = etapaAtual !== TOTAL_DE_ETAPAS;
    avisoNoAssistente("");
    desenhar();
    conferirPlano();
    mostrarConfiguracao();
    const secao = el.assistente.querySelector(`[data-coleta-etapa="${etapaAtual}"]`);
    if (secao) secao.scrollTop = 0;
  }

  function irParaEtapa(etapa) {
    // Para a frente, a etapa atual precisa estar válida; para trás, sempre pode.
    if (etapa > etapaAtual && !estado.coleta) {
      try {
        for (let e = etapaAtual; e < etapa; e++) validarEtapa(e);
      } catch (erro) {
        avisoNoAssistente(erro.message);
        return;
      }
    }
    mostrarEtapa(etapa);
  }

  function abrirAssistente() {
    el.assistente.showModal();
    mostrarFirmware();
    mostrarEtapa(estado.setupConfirmado || estado.coleta ? TOTAL_DE_ETAPAS : 1);
  }

  function concluirAssistente() {
    if (estado.coleta) {
      el.assistente.close();
      return;
    }
    try {
      for (let e = 1; e < TOTAL_DE_ETAPAS; e++) validarEtapa(e);
    } catch (erro) {
      avisoNoAssistente(erro.message);
      return;
    }
    aoMudarCampos();
    estado.setupConfirmado = true;
    salvar();
    mostrarConfiguracao();
    el.assistente.close();
    status(estado.homeConfirmado
      ? "Experimento configurado. Pode começar pela passada desligada."
      : "Experimento configurado. Falta confirmar o home (etapa 1 do assistente) antes das passadas.", estado.homeConfirmado ? "ready" : "warning");
  }

  // --- passadas ---

  function apagarPassada(passada) {
    estado.linhas = estado.linhas.filter((linha) => !linha.startsWith(`${passada},`));
    delete estado.passadas[passada];
  }

  // Depois que a passada ligada começa, vale a corrente gravada nela (o campo da tela volta ao padrão ao recarregar).
  function confirmarFonte(passada) {
    if (passada === "ligada") {
      const corrente = correnteGravada() ?? campoMeta("corrente_A").value.trim();
      return globalThis.confirm(`A fonte está ligada, com a corrente em ${corrente} A conferida no multímetro? Nada mais pode mudar de lugar.`);
    }
    return globalThis.confirm("A fonte da bobina está desligada (corrente zero)?");
  }

  // O que falta para andar com a impressora, numa mensagem só (o botão fica clicável para a pessoa saber o porquê).
  function faltaParaPassada() {
    if (!estado.coleta && !estado.setupConfirmado) return "Configure o experimento antes (botão “Configurar o experimento”).";
    if (!estado.homeConfirmado) return "Confirme que a impressora fez o home desde que foi ligada (etapa 1 do assistente).";
    return null;
  }

  // Todas as conferências e confirmações vêm antes de mudar o estado: cancelar uma delas não pode deixar a
  // coleta congelada só na memória nem apagar as medidas da passada.
  function iniciarPassada(passada) {
    if (executando || operacao) return;
    const falta = faltaParaPassada();
    if (falta) {
      status(falta, "error");
      return;
    }
    if (!estado.coleta && !conferirPlano()) {
      status("O plano não cabe no curso ou tem campo inválido: abra o assistente na etapa 4.", "error");
      return;
    }
    const medidas = estado.linhas.filter((linha) => linha.startsWith(`${passada},`)).length;
    if (medidas > 0 && !globalThis.confirm(`Recomeçar a passada ${passada} do zero apaga as ${medidas} medidas dela. Continuar?`)) return;
    if (!confirmarFonte(passada)) return;

    if (!estado.coleta) {
      const plano = lerPlano();
      const setup = lerSetupDaTela();
      estado.coleta = {
        calibracao: calibracaoDoSetup(setup),
        mapeamento: lerMapeamento(),
        campos: lerCampos(),
        setup,
        plano,
        passos: planejarVarredura(plano),
        metadados: { ...lerMetadadosFixos(plano), observacao: campoMeta("observacao").value.trim() },
        homeRefeito: false,
      };
      estado.passadas = {};
    }
    apagarPassada(passada);
    if (passada === "ligada") estado.coleta.metadados.corrente_A = campoMeta("corrente_A").value.trim();
    estado.passadas[passada] = { inicioMs: Date.now(), proximo: 0, concluida: false };
    salvar();
    mostrarConfiguracao();
    return rodarPassada(passada);
  }

  function retomarPassada() {
    const passada = passadaParada();
    if (!passada || !estado.coleta || executando || operacao) return;
    const falta = faltaParaPassada();
    if (falta) {
      status(falta, "error");
      return;
    }
    const problemas = conferirLimites(estado.coleta.passos, estado.coleta.calibracao, { curso: estado.curso });
    if (problemas.length) {
      status(`O plano desta coleta não cabe mais no curso: ${problemas[0]}.`, "error");
      return;
    }
    if (!confirmarFonte(passada)) return;
    return rodarPassada(passada);
  }

  async function rodarPassada(passada) {
    const coleta = estado.coleta;
    const registro = estado.passadas[passada];
    const total = coleta.passos.length;
    executando = { passada, pausado: false, pararPedido: false, retomarPausa: null };
    atualizarBotoes();
    let travaTela = null;
    try {
      travaTela = await navigator.wakeLock?.request("screen");
    } catch {
      // sem trava de tela: o computador não pode dormir durante a passada
    }
    try {
      status(`Passada ${passada} em andamento. Não mexa na bobina, nos fios nem na fonte.`, "collecting");
      const resultado = await executarPassada({
        passos: coleta.passos,
        inicio: registro.proximo,
        passada,
        calibracao: coleta.calibracao,
        mapeamento: coleta.mapeamento,
        marlin: impressora.marlin,
        sensor: sensor.link,
        leituras: coleta.plano.leituras,
        pausaMs: coleta.plano.pausaMs,
        velocidadeMmMin: coleta.plano.velocidade,
        inicioDaPassadaMs: registro.inicioMs,
        controle: {
          parar: () => executando.pararPedido,
          // Com a parada pedida não há pausa a esperar; parar() também solta uma pausa que já está esperando.
          esperarSePausado: () => (executando.pausado && !executando.pararPedido
            ? new Promise((resolve) => { executando.retomarPausa = resolve; })
            : Promise.resolve()),
        },
        aoMedir: (linha, indice) => {
          estado.linhas.push(linhaCsv(linha));
          registro.proximo = indice + 1;
          salvar();
          mostrarAndamento();
          const decorrido = (Date.now() - registro.inicioMs) / 1000;
          const restante = decorrido / registro.proximo * (total - registro.proximo);
          el.andamento.textContent = `Passada ${passada}: ${registro.proximo} de ${total}; falta cerca de ${formatarDuracao(restante)}.`;
          escrever(el.ultima, `(${linha.x}, ${linha.y}, ${linha.z}) mm: Bx ${linha.bx.toFixed(1)}, By ${linha.by.toFixed(1)}, Bz ${linha.bz.toFixed(1)} µT`);
        },
      });
      registro.proximo = resultado.proximo;
      registro.concluida = resultado.estado === "concluida";
      salvar();
      if (registro.concluida) {
        status(passada === "desligada"
          ? "Passada desligada concluída. Ligue a corrente e inicie a passada ligada."
          : "Passada ligada concluída. Baixe o CSV ou veja no visualizador.", "complete");
      } else {
        status(`Passada ${passada} parada no ponto ${registro.proximo} de ${total}. Dá para retomar.`, "warning");
      }
    } catch (erro) {
      salvar();
      status(`Passada ${passada} interrompida no ponto ${registro.proximo} de ${total}: ${erro.message}`, "error");
    } finally {
      await travaTela?.release?.();
      executando = null;
      mostrarAndamento();
      atualizarBotoes();
      if (impressora && !impressora.marlin.foraDeSincronia()) await atualizarPosicao().catch(() => {});
    }
  }

  function pausarOuContinuar() {
    if (!executando || executando.pararPedido) return;
    executando.pausado = !executando.pausado;
    if (!executando.pausado) {
      executando.retomarPausa?.();
      executando.retomarPausa = null;
      status(`Passada ${executando.passada} continuando.`, "collecting");
    } else {
      status("Pausa pedida: a cabeça para depois do ponto atual.", "warning");
    }
    atualizarBotoes();
  }

  function parar() {
    if (!executando) return;
    executando.pararPedido = true;
    if (executando.pausado) {
      executando.pausado = false;
      executando.retomarPausa?.();
    }
    status("Parando depois do ponto atual…", "warning");
    atualizarBotoes();
  }

  // --- arquivo ---

  function textoCsv() {
    return cabecalhoCsv(metadadosDoArquivo()) + estado.linhas.join("\n") + "\n";
  }

  function nomeDoArquivo() {
    const data = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    return `mapa-campo-${estado.coleta?.metadados.geometria ?? "bobina"}-${data}.csv`;
  }

  function baixar() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([textoCsv()], { type: "text/csv;charset=utf-8" }));
    link.download = nomeDoArquivo();
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function verNoVisualizador() {
    const visualizador = document.querySelector("[data-mapa-campo]")?.mapaCampo;
    if (!visualizador) {
      status("O visualizador não está nesta página; baixe o CSV e abra-o na aba Visualização.", "warning");
      return;
    }
    // Substitui o que estava no visualizador: a coleta vai sempre inteira.
    visualizador.readFiles([new File([textoCsv()], "coleta-da-aba-coleta.csv", { type: "text/csv" })], { substituir: true });
    document.querySelector("#aba-visualizacao")?.click();
  }

  function descartar() {
    if (!globalThis.confirm("Apagar a coleta e os dados medidos guardados neste navegador? Baixe o CSV antes, se precisar.")) return;
    estado.linhas = [];
    estado.passadas = {};
    estado.coleta = null;
    salvar();
    mostrarConfiguracao();
    mostrarAndamento();
    atualizarBotoes();
    desenhar();
    conferirPlano();
  }

  // --- console ---

  function enviarDoConsole(evento) {
    evento.preventDefault();
    const comando = el.gcode.value.trim();
    if (!comando || !impressora) return;
    if (operacao || executando) {
      status("Espere a operação atual terminar para enviar o comando.", "warning");
      return;
    }
    // Comando que muda o referencial: com uma coleta salva, é recusado; sem coleta, só o home confirma o home.
    const mudaOReferencial = mudaReferencial(comando);
    if (mudaOReferencial && estado.coleta) {
      status("Há uma coleta salva: o console não aceita G28, G92, M206, M428, M501, M502 nem G53 a G59, que mudam o referencial " +
        "da impressora e invalidariam a origem dela. Baixe o CSV e descarte a coleta antes.", "warning");
      return;
    }
    el.gcode.value = "";
    return operar("console", async () => {
      try {
        await impressora.marlin.enviar(comando, { prazoMs: 240000 });
      } finally {
        if (mudaOReferencial) aposMudarReferencial({ foiHome: /^\s*(?:N\d+\s*)?G0*28\b/i.test(comando) });
      }
      await atualizarPosicao();
    });
  }

  // --- montagem da tela ---

  for (const select of el.eixos) {
    select.innerHTML = DIRECOES.map((d) => `<option value="${d}">${d}</option>`).join("");
  }

  const salvo = lerSalvo();
  if (salvo) {
    Object.assign(estado, salvo);
    estado.curso ??= CURSO_PADRAO;
    preencherCampos(estado.coleta?.campos ?? estado.campos);
    if (estado.coleta) {
      const { corrente_A, observacao } = estado.coleta.metadados;
      if (corrente_A !== undefined) campoMeta("corrente_A").value = corrente_A;
      if (observacao !== undefined) campoMeta("observacao").value = observacao;
    }
    if (estado.linhas.length) {
      status(`Há ${estado.linhas.length} medidas salvas neste navegador. Se a impressora não foi desligada, dá para retomar.`, "warning");
    }
  }
  const mapeamentoNaTela = estado.coleta?.mapeamento ?? estado.mapeamento;
  for (const select of el.eixos) select.value = mapeamentoNaTela[select.dataset.coletaEixo];
  if (!estado.coleta) atualizarCalibracao();
  mostrarFirmware();
  mostrarConfiguracao();
  mostrarAndamento();
  desenhar();
  conferirPlano();

  if (!webSerialDisponivel()) {
    status("Este navegador não tem Web Serial. Abra a página no Chrome, no Edge ou no Opera do computador.", "error");
  }

  for (const botao of el.conectarImpressora) botao.addEventListener("click", conectarImpressora);
  el.desconectarImpressora.addEventListener("click", desconectarImpressora);
  el.conectarSensor.addEventListener("click", conectarSensor);
  el.desconectarSensor.addEventListener("click", desconectarSensor);
  for (const botao of el.medirAqui) botao.addEventListener("click", medirAqui);
  for (const botao of el.home) botao.addEventListener("click", home);
  for (const botao of el.subir) botao.addEventListener("click", subir);
  el.irOrigem.addEventListener("click", irParaOCentro);
  for (const botao of el.jogs) botao.addEventListener("click", () => jog(botao));
  for (const campo of [...el.setup, ...el.plano, ...el.eixos]) {
    campo.addEventListener("input", aoMudarCampos);
    campo.addEventListener("change", aoMudarCampos);
  }
  for (const campo of el.meta.filter((c) => !META_EDITAVEL.includes(c.dataset.coletaMeta))) {
    campo.addEventListener("input", aoMudarCampos);
    campo.addEventListener("change", aoMudarCampos);
  }
  campoMeta("observacao").addEventListener("input", () => {
    if (!estado.coleta) return;
    estado.coleta.metadados.observacao = campoMeta("observacao").value.trim();
    salvar();
  });
  el.homeConfirmado.addEventListener("change", () => {
    estado.homeConfirmado = el.homeConfirmado.checked;
    salvar();
    mostrarConfiguracao();
  });
  el.centroAqui.addEventListener("click", usarPosicaoComoCentro);
  el.topoAqui.addEventListener("click", usarPosicaoComoTopo);
  el.sugerir.addEventListener("click", sugerir);
  el.cantos.addEventListener("click", percorrerCantos);
  el.abrirAssistente.addEventListener("click", abrirAssistente);
  el.fecharAssistente.addEventListener("click", () => el.assistente.close());
  el.voltar.addEventListener("click", () => mostrarEtapa(etapaAtual - 1));
  el.proximo.addEventListener("click", () => irParaEtapa(etapaAtual + 1));
  el.concluir.addEventListener("click", concluirAssistente);
  for (const botao of el.irParaEtapa) botao.addEventListener("click", () => irParaEtapa(Number(botao.dataset.coletaEtapaIr)));
  el.assistente.addEventListener("close", () => {
    mostrarConfiguracao();
    atualizarBotoes();
  });
  for (const botao of el.iniciar) botao.addEventListener("click", () => iniciarPassada(botao.dataset.coletaIniciar));
  el.retomar.addEventListener("click", retomarPassada);
  el.pausar.addEventListener("click", pausarOuContinuar);
  el.parar.addEventListener("click", parar);
  el.ver.addEventListener("click", verNoVisualizador);
  el.baixar.addEventListener("click", baixar);
  el.descartar.addEventListener("click", descartar);
  el.formGcode.addEventListener("submit", enviarDoConsole);

  atualizarBotoes();
  return { estado };
}

if (typeof document !== "undefined") {
  for (const raiz of document.querySelectorAll("[data-coleta]")) setupFieldCollector(raiz);
}
