// Aba de coleta: liga a impressora (Marlin) e a ESP32 do MLX90393 pelo Web Serial do Chrome, conduz as duas
// passadas e grava o CSV no formato mapa-campo v1.
//
// Regras de segurança da tela:
// - uma operação de impressora por vez (movimento manual, home, console, passada): os botões ficam travados
//   até ela terminar, para comandos de duas operações nunca se intercalarem (um G91 no meio de movimentos
//   absolutos, por exemplo);
// - a coleta (origem, eixos da caneta, plano e dados fixos da bobina) é congelada quando a primeira passada
//   começa e vale para as duas passadas até "Descartar", inclusive depois de recarregar a página.

import { createMarlinLink, lerLimites, lerPosicao, mudaReferencial } from "./coleta-marlin.js";
import { createSensorLink } from "./coleta-sensor.js";
import { abrirCanal, reiniciarEsp32, webSerialDisponivel } from "./coleta-serial.js";
import {
  CURSO_PADRAO, cabecalhoCsv, cantosDaGrade, conferirLimites, conferirPosicao, estimarDuracao, executarPassada, linhaCsv,
  paraEixosDaImpressora, paraImpressora, planejarVarredura,
} from "./coleta-varredura.js";

const CHAVE_SALVA = "mapa-campo-coleta-v2";
const MAX_LINHAS_LOG = 400;
const DIRECOES = ["+X", "-X", "+Y", "-Y", "+Z", "-Z"];
const ALTURA_MINIMA_MANUAL_MM = 10;
// Podem mudar depois do início da coleta: a corrente (medida no multímetro) até a passada ligada começar,
// quando ela é gravada na coleta e trava; a observação a qualquer momento fora de uma passada.
const META_EDITAVEL = ["corrente_A", "observacao"];
const MEDIDA_ZERADA = { frente: 0, esquerda: 0, cima: 0, sFrente: 0, sEsquerda: 0, sCima: 0 };
const NOMES_DO_PLANO = {
  xMin: "x mínimo", xMax: "x máximo", xPasso: "passo em x", yMin: "y mínimo", yMax: "y máximo", yPasso: "passo em y",
  refX: "referência x", refY: "referência y", refZ: "referência z", refCada: "referência a cada",
  leituras: "leituras por ponto", pausaMs: "pausa antes de medir", velocidade: "velocidade",
};

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

export function setupFieldCollector(raiz) {
  const $ = (seletor) => raiz.querySelector(seletor);
  const $$ = (seletor) => [...raiz.querySelectorAll(seletor)];
  const el = {
    status: $("[data-coleta-status]"),
    baud: $("[data-coleta-baud]"),
    conectarImpressora: $("[data-coleta-conectar-impressora]"),
    desconectarImpressora: $("[data-coleta-desconectar-impressora]"),
    estadoImpressora: $("[data-coleta-estado-impressora]"),
    conectarSensor: $("[data-coleta-conectar-sensor]"),
    desconectarSensor: $("[data-coleta-desconectar-sensor]"),
    estadoSensor: $("[data-coleta-estado-sensor]"),
    medirAqui: $("[data-coleta-medir-aqui]"),
    home: $("[data-coleta-home]"),
    subir: $("[data-coleta-subir]"),
    irOrigem: $("[data-coleta-ir-origem]"),
    passo: $("[data-coleta-passo]"),
    jogs: $$("[data-coleta-jog]"),
    posicao: $("[data-coleta-posicao]"),
    posicaoBobina: $("[data-coleta-posicao-bobina]"),
    ultima: $("[data-coleta-ultima]"),
    h0: $("[data-coleta-h0]"),
    marcarOrigem: $("[data-coleta-marcar-origem]"),
    origem: $("[data-coleta-origem]"),
    eixos: $$("[data-coleta-eixo]"),
    plano: $$("[data-coleta-plano]"),
    meta: $$("[data-coleta-meta]"),
    conferir: $("[data-coleta-conferir]"),
    cantos: $("[data-coleta-cantos]"),
    resumoPlano: $("[data-coleta-resumo-plano]"),
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
  };
  const campoMeta = (chave) => el.meta.find((campo) => campo.dataset.coletaMeta === chave);

  // Estado que sobrevive a recarregar a página (a impressora guarda a posição enquanto não fizer home).
  const estado = {
    calibracao: null, // { X0, Y0, Z0, h0 }: origem atual, usada no movimento manual
    mapeamento: { frente: "+X", esquerda: "+Y", cima: "+Z" },
    coleta: null, // congelada na primeira passada: { calibracao, mapeamento, campos, plano, passos, metadados, homeRefeito }
    passadas: {}, // desligada/ligada: { inicioMs, proximo, concluida }
    linhas: [], // linhas CSV já medidas, das duas passadas
  };
  let impressora = null; // { canal, marlin }, só depois de pronta
  let sensor = null; // { canal, link }, só depois de pronto
  const conectando = { impressora: false, sensor: false };
  let operacao = null; // nome da operação de impressora ou sensor em andamento
  let executando = null; // { passada, pausado, pararPedido, retomarPausa }
  let posicaoAtual = null;
  let cursoDaImpressora = CURSO_PADRAO; // trocado pelo que o M211 informa ao conectar
  const linhasLog = [];

  function status(texto, tipo = "info") {
    el.status.textContent = texto;
    el.status.dataset.kind = TIPO_DO_STATUS[tipo] ?? "";
    // O status fica no topo da aba; erro de um botão lá embaixo (iniciar a passada) passaria despercebido.
    if (tipo === "error" || tipo === "warning") {
      const caixa = el.status.getBoundingClientRect();
      if (caixa.top < 0 || caixa.bottom > window.innerHeight) el.status.scrollIntoView({ block: "center", behavior: "smooth" });
    }
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
      h0: el.h0.value,
    };
  }

  function preencherCampos(campos) {
    for (const campo of el.plano) if (campo.dataset.coletaPlano in campos.plano) campo.value = campos.plano[campo.dataset.coletaPlano];
    for (const campo of el.meta) {
      const chave = campo.dataset.coletaMeta;
      if (chave in campos.meta && !META_EDITAVEL.includes(chave)) campo.value = campos.meta[chave];
    }
    el.h0.value = campos.h0;
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

  function lerMapeamento() {
    return Object.fromEntries(el.eixos.map((select) => [select.dataset.coletaEixo, select.value]));
  }

  // Metadados fixos da bobina, congelados com a coleta.
  function lerMetadadosFixos(plano) {
    return {
      geometria: campoMeta("geometria").value,
      dimensao_mm: campoMeta("dimensao_mm").value.trim(),
      voltas: campoMeta("voltas").value.trim(),
      leituras_por_ponto: plano.leituras,
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
    el.conectarImpressora.disabled = !temSerial || Boolean(impressora) || conectando.impressora;
    el.desconectarImpressora.disabled = !impressora || Boolean(executando) || conectando.impressora;
    el.conectarSensor.disabled = !temSerial || Boolean(sensor) || conectando.sensor;
    el.desconectarSensor.disabled = !sensor || Boolean(executando) || conectando.sensor;
    el.medirAqui.disabled = !sensorOk || ocupado;
    for (const botao of [el.home, el.subir, ...el.jogs, el.enviarGcode]) botao.disabled = !impressoraOk || ocupado;
    el.marcarOrigem.disabled = !impressoraOk || ocupado || Boolean(coleta);
    el.irOrigem.disabled = !impressoraOk || ocupado || !estado.calibracao;
    el.cantos.disabled = !impressoraOk || ocupado || !(coleta?.calibracao ?? estado.calibracao) || Boolean(coleta?.homeRefeito);

    const origemValida = coleta ? !coleta.homeRefeito : Boolean(estado.calibracao);
    const pronto = impressoraOk && sensorOk && !ocupado && origemValida;
    for (const botao of el.iniciar) botao.disabled = !pronto;
    el.retomar.disabled = !pronto || !coleta || !passadaParada();
    el.pausar.disabled = !executando || executando.pararPedido;
    el.parar.disabled = !executando;
    el.pausar.textContent = executando?.pausado ? "Continuar" : "Pausar";
    el.ver.disabled = estado.linhas.length === 0;
    el.baixar.disabled = estado.linhas.length === 0;
    el.descartar.disabled = Boolean(executando) || (estado.linhas.length === 0 && !coleta);

    const travado = ocupado || Boolean(coleta);
    for (const campo of [...el.plano, ...el.eixos, el.h0]) campo.disabled = travado;
    for (const campo of el.meta) {
      campo.disabled = META_EDITAVEL.includes(campo.dataset.coletaMeta) ? Boolean(executando) : travado;
    }
    if (correnteGravada() !== undefined) campoMeta("corrente_A").disabled = true;
  }

  function mostrarOrigem() {
    const c = estado.coleta?.calibracao ?? estado.calibracao;
    let texto = c
      ? `Origem: impressora em X ${c.X0.toFixed(2)}, Y ${c.Y0.toFixed(2)}, Z ${c.Z0.toFixed(2)}, com o sensor a ${c.h0} mm acima da bobina.`
      : "Origem ainda não marcada.";
    if (estado.coleta?.homeRefeito) {
      texto += " Houve home depois do início desta coleta: a origem dela não vale mais. Baixe o CSV, descarte e recomece.";
    } else if (estado.coleta) {
      texto += " Origem, eixos e plano estão fixos até descartar a coleta.";
    }
    el.origem.textContent = texto;
  }

  function mostrarPosicao() {
    if (!posicaoAtual) return;
    el.posicao.textContent = `X ${posicaoAtual.x.toFixed(2)} · Y ${posicaoAtual.y.toFixed(2)} · Z ${posicaoAtual.z.toFixed(2)}`;
    const c = estado.calibracao;
    el.posicaoBobina.textContent = c
      ? `${(posicaoAtual.x - c.X0).toFixed(1)} · ${(posicaoAtual.y - c.Y0).toFixed(1)} · ${(posicaoAtual.z - c.Z0 + c.h0).toFixed(1)} mm`
      : "marque a origem";
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
      cursoDaImpressora = lerLimites(await marlin.enviar("M211")) ?? CURSO_PADRAO; // M211 sem S só informa
      await marlin.enviar("G90");
      await marlin.enviar("M18 S0"); // motores não desligam parados (posição e fundo magnético iguais nas duas passadas)
      impressora = { canal, marlin };
      await atualizarPosicao();
      el.estadoImpressora.textContent = "Conectada e respondendo.";
      status("Impressora conectada.", "ready");
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
      atualizarBotoes();
    }
  }

  async function desconectarImpressora() {
    const atual = impressora;
    impressora = null;
    atual?.marlin.cancelarTudo();
    await atual?.canal.fechar();
    el.estadoImpressora.textContent = "Desconectada.";
    atualizarBotoes();
  }

  function perdeuImpressora(mensagem, marlin) {
    marlin?.cancelarTudo(mensagem);
    if (!impressora || impressora.marlin !== marlin) return;
    impressora = null;
    el.estadoImpressora.textContent = mensagem;
    status(`Impressora: ${mensagem}`, "error");
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
      el.ultima.textContent = `frente ${medida.frente.toFixed(1)}, esquerda ${medida.esquerda.toFixed(1)}, cima ${medida.cima.toFixed(1)} µT → ` +
        `Bx ${campo.bx.toFixed(1)}, By ${campo.by.toFixed(1)}, Bz ${campo.bz.toFixed(1)} µT`;
    });
  }

  // --- movimento e origem ---

  function jog(direcao) {
    return operar("jog", async () => {
      const eixo = direcao[0];
      const sinal = direcao[1] === "-" ? -1 : 1;
      const distancia = sinal * Number(el.passo.value);
      const calibracao = estado.coleta?.calibracao ?? estado.calibracao;
      if (eixo === "Z" && sinal < 0 && calibracao) {
        await atualizarPosicao();
        const alturaNova = posicaoAtual.z + distancia - calibracao.Z0 + calibracao.h0;
        if (alturaNova < ALTURA_MINIMA_MANUAL_MM) {
          status(`Esse passo deixaria o sensor a ${alturaNova.toFixed(1)} mm da bobina (mínimo ${ALTURA_MINIMA_MANUAL_MM} mm). Use um passo menor.`, "warning");
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

  // Depois do home (ou de outro comando que mude o referencial) a origem marcada não vale mais. Uma coleta sem
  // nenhuma medida (a primeira passada falhou logo no primeiro ponto) não tem o que guardar e é desfeita direto,
  // sem exigir "Descartar".
  function aposHome() {
    estado.calibracao = null;
    if (estado.coleta && estado.linhas.length === 0) {
      estado.coleta = null;
      estado.passadas = {};
    } else if (estado.coleta) {
      estado.coleta.homeRefeito = true;
    }
    salvar();
    mostrarOrigem();
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
      aposHome();
      status("Home feito. Suba o Z, coloque o suporte da bobina e marque a origem.", "ready");
      await atualizarPosicao();
    });
  }

  function marcarOrigem() {
    const h0 = Number(el.h0.value);
    if (!(h0 >= 5)) {
      status("Informe a altura do sensor acima da bobina (mm), medida com régua.", "warning");
      return;
    }
    return operar("origem", async () => {
      await atualizarPosicao();
      estado.calibracao = { X0: posicaoAtual.x, Y0: posicaoAtual.y, Z0: posicaoAtual.z, h0 };
      salvar();
      mostrarOrigem();
      mostrarPosicao();
      status("Origem marcada.", "ready");
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

  // --- plano ---

  // Plano em uso: o congelado da coleta, ou o da tela quando ainda não há coleta.
  function planoAtual() {
    if (estado.coleta) {
      const { plano, passos, calibracao, mapeamento } = estado.coleta;
      return { plano, passos, calibracao, mapeamento };
    }
    const plano = lerPlano();
    return { plano, passos: planejarVarredura(plano), calibracao: estado.calibracao, mapeamento: lerMapeamento() };
  }

  // Devolve true quando o plano pode ser executado (eixos da caneta válidos, origem marcada e todos os pontos
  // dentro dos limites).
  function conferirPlano() {
    try {
      const { plano, passos, calibracao, mapeamento } = planoAtual();
      // Dois eixos da caneta no mesmo eixo da impressora lançam erro aqui, antes de andar e medir.
      paraEixosDaImpressora(MEDIDA_ZERADA, mapeamento);
      const problemas = calibracao ? conferirLimites(passos, calibracao, { curso: cursoDaImpressora }) : [];
      const pontos = passos.filter((p) => p.tipo === "ponto").length;
      const duracao = estimarDuracao(passos, {
        velocidadeMmS: plano.velocidade / 60, segundosPorMedida: plano.leituras * 0.075, pausaS: plano.pausaMs / 1000,
      });
      let texto = `${pontos} pontos e ${passos.length - pontos} visitas à referência por passada; ` +
        `cerca de ${formatarDuracao(duracao)} por passada (com o eixo Z a 5 mm/s).`;
      if (!calibracao) texto += " Marque a origem para conferir os limites da impressora.";
      else if (problemas.length) texto += ` Problemas: ${problemas.slice(0, 4).join("; ")}.`;
      else texto += " Todos os pontos cabem no curso da impressora.";
      el.resumoPlano.textContent = texto;
      return Boolean(calibracao) && problemas.length === 0;
    } catch (erro) {
      el.resumoPlano.textContent = erro.message;
      return false;
    }
  }

  function percorrerCantos() {
    if (!conferirPlano()) {
      status("Corrija o plano antes de percorrer os cantos (veja o resumo do plano).", "error");
      return;
    }
    const { passos, calibracao } = planoAtual();
    const cantos = cantosDaGrade(passos);
    const problemas = conferirLimites(cantos, calibracao, { curso: cursoDaImpressora });
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

  // Todas as conferências e confirmações vêm antes de mudar o estado: cancelar uma delas não pode deixar a
  // coleta congelada só na memória nem apagar as medidas da passada.
  function iniciarPassada(passada) {
    if (executando || operacao) return;
    if (!estado.coleta && !conferirPlano()) {
      status("Corrija o plano antes de começar (veja o resumo do plano).", "error");
      return;
    }
    const medidas = estado.linhas.filter((linha) => linha.startsWith(`${passada},`)).length;
    if (medidas > 0 && !globalThis.confirm(`Recomeçar a passada ${passada} do zero apaga as ${medidas} medidas dela. Continuar?`)) return;
    if (!confirmarFonte(passada)) return;

    if (!estado.coleta) {
      const plano = lerPlano();
      estado.coleta = {
        calibracao: { ...estado.calibracao },
        mapeamento: lerMapeamento(),
        campos: lerCampos(),
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
    mostrarOrigem();
    return rodarPassada(passada);
  }

  function retomarPassada() {
    const passada = passadaParada();
    if (!passada || !estado.coleta || executando || operacao) return;
    const problemas = conferirLimites(estado.coleta.passos, estado.coleta.calibracao, { curso: cursoDaImpressora });
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
          el.ultima.textContent = `(${linha.x}, ${linha.y}, ${linha.z}) mm: Bx ${linha.bx.toFixed(1)}, By ${linha.by.toFixed(1)}, Bz ${linha.bz.toFixed(1)} µT`;
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
    mostrarOrigem();
    mostrarAndamento();
    atualizarBotoes();
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
    // Comando que muda o referencial: com uma coleta salva, é recusado; sem coleta, invalida a origem marcada.
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
        if (mudaOReferencial) aposHome();
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
    if (estado.coleta) {
      preencherCampos(estado.coleta.campos);
      const { corrente_A, observacao } = estado.coleta.metadados;
      if (corrente_A !== undefined) campoMeta("corrente_A").value = corrente_A;
      if (observacao !== undefined) campoMeta("observacao").value = observacao;
    }
    if (estado.linhas.length) {
      status(`Há ${estado.linhas.length} medidas salvas neste navegador. Se a impressora não foi desligada nem fez home, dá para retomar.`, "warning");
    }
  }
  if (!estado.coleta && estado.calibracao) el.h0.value = estado.calibracao.h0;
  const mapeamentoNaTela = estado.coleta?.mapeamento ?? estado.mapeamento;
  for (const select of el.eixos) select.value = mapeamentoNaTela[select.dataset.coletaEixo];
  mostrarOrigem();
  mostrarAndamento();

  if (!webSerialDisponivel()) {
    status("Este navegador não tem Web Serial. Abra a página no Chrome, no Edge ou no Opera do computador.", "error");
  }

  el.conectarImpressora.addEventListener("click", conectarImpressora);
  el.desconectarImpressora.addEventListener("click", desconectarImpressora);
  el.conectarSensor.addEventListener("click", conectarSensor);
  el.desconectarSensor.addEventListener("click", desconectarSensor);
  el.medirAqui.addEventListener("click", medirAqui);
  el.home.addEventListener("click", home);
  el.subir.addEventListener("click", () => operar("subir", async () => {
    await impressora.marlin.enviar("G90");
    await impressora.marlin.enviar("G1 Z250 F600");
    await atualizarPosicao();
  }));
  el.irOrigem.addEventListener("click", () => operar("origem", () => irPara({ x: 0, y: 0, z: estado.calibracao.h0 }, estado.calibracao)));
  for (const botao of el.jogs) botao.addEventListener("click", () => jog(botao.dataset.coletaJog));
  el.marcarOrigem.addEventListener("click", marcarOrigem);
  for (const select of el.eixos) select.addEventListener("change", () => { estado.mapeamento = lerMapeamento(); salvar(); });
  campoMeta("observacao").addEventListener("input", () => {
    if (!estado.coleta) return;
    estado.coleta.metadados.observacao = campoMeta("observacao").value.trim();
    salvar();
  });
  el.conferir.addEventListener("click", conferirPlano);
  el.cantos.addEventListener("click", percorrerCantos);
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
