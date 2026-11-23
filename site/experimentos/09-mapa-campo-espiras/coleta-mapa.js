// Aba de coleta: liga a impressora (Marlin) e a ESP32 do MLX90393 pelo Web Serial do Chrome, conduz as duas
// passadas e grava o CSV no formato mapa-campo v1.

import { createMarlinLink, lerPosicao } from "./coleta-marlin.js";
import { createSensorLink } from "./coleta-sensor.js";
import { abrirCanal, reiniciarEsp32, webSerialDisponivel } from "./coleta-serial.js";
import {
  cabecalhoCsv, conferirLimites, estimarDuracao, executarPassada, linhaCsv, paraEixosDaImpressora,
  paraImpressora, planejarVarredura,
} from "./coleta-varredura.js";

const CHAVE_SALVA = "mapa-campo-coleta-v1";
const MAX_LINHAS_LOG = 400;
const DIRECOES = ["+X", "-X", "+Y", "-Y", "+Z", "-Z"];

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

// Os tipos de status da coleta viram os do visualizador (mapa-status): ok, aviso ou erro.
const TIPO_DO_STATUS = { ready: "ok", complete: "ok", collecting: "ok", warning: "aviso", error: "erro" };

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

  // Estado que sobrevive a recarregar a página (a impressora guarda a posição enquanto não fizer home).
  const estado = {
    calibracao: null, // { X0, Y0, Z0, h0 }
    mapeamento: { frente: "+X", esquerda: "+Y", cima: "+Z" },
    passadas: {}, // desligada/ligada: { inicioMs, proximo, concluida, plano }
    linhas: [], // linhas CSV já medidas, das duas passadas
    metadados: null,
  };
  let impressora = null; // { canal, marlin }
  let sensor = null; // { canal, link }
  let executando = null; // { passada, pausado, pararPedido, retomarPausa }
  let posicaoAtual = null;
  const linhasLog = [];

  function status(texto, tipo = "info") {
    el.status.textContent = texto;
    el.status.dataset.kind = TIPO_DO_STATUS[tipo] ?? "";
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

  function lerPlano() {
    const valores = Object.fromEntries(el.plano.map((campo) => [campo.dataset.coletaPlano, campo.value]));
    const alturas = valores.alturas.split(/[;,\s]+/).filter(Boolean).map(Number);
    if (alturas.some((z) => !Number.isFinite(z))) throw new Error("As alturas precisam ser números separados por vírgula.");
    return {
      x: { min: Number(valores.xMin), max: Number(valores.xMax), passo: Number(valores.xPasso) },
      y: { min: Number(valores.yMin), max: Number(valores.yMax), passo: Number(valores.yPasso) },
      alturas,
      referencia: { x: Number(valores.refX), y: Number(valores.refY), z: Number(valores.refZ) },
      leituras: Number(valores.leituras),
      pausaMs: Number(valores.pausaMs),
      velocidade: Number(valores.velocidade),
    };
  }

  function lerMetadados() {
    const meta = Object.fromEntries(el.meta.map((campo) => [campo.dataset.coletaMeta, campo.value.trim()]));
    return { ...meta, leituras_por_ponto: lerPlano().leituras, data: new Date().toISOString() };
  }

  function lerMapeamento() {
    return Object.fromEntries(el.eixos.map((select) => [select.dataset.coletaEixo, select.value]));
  }

  function atualizarBotoes() {
    const temImpressora = Boolean(impressora);
    const temSensor = Boolean(sensor);
    const ocupado = Boolean(executando);
    el.conectarImpressora.disabled = temImpressora;
    el.desconectarImpressora.disabled = !temImpressora || ocupado;
    el.conectarSensor.disabled = temSensor;
    el.desconectarSensor.disabled = !temSensor || ocupado;
    el.medirAqui.disabled = !temSensor || ocupado;
    for (const botao of [el.home, el.subir, ...el.jogs, el.marcarOrigem, el.enviarGcode]) {
      botao.disabled = !temImpressora || ocupado;
    }
    el.irOrigem.disabled = !temImpressora || ocupado || !estado.calibracao;
    el.cantos.disabled = !temImpressora || ocupado || !estado.calibracao;
    const pronto = temImpressora && temSensor && Boolean(estado.calibracao) && !ocupado;
    for (const botao of el.iniciar) {
      const passada = estado.passadas[botao.dataset.coletaIniciar];
      botao.disabled = !pronto || Boolean(passada?.concluida);
    }
    const parada = Object.entries(estado.passadas).find(([, p]) => !p.concluida && p.proximo > 0);
    el.retomar.disabled = !pronto || !parada;
    el.pausar.disabled = !ocupado;
    el.parar.disabled = !ocupado;
    el.pausar.textContent = executando?.pausado ? "Continuar" : "Pausar";
    el.baixar.disabled = estado.linhas.length === 0;
    el.ver.disabled = estado.linhas.length === 0;
    el.descartar.disabled = estado.linhas.length === 0 || ocupado;
    for (const campo of [...el.plano, ...el.meta, ...el.eixos, el.h0]) campo.disabled = ocupado;
  }

  function mostrarOrigem() {
    const c = estado.calibracao;
    el.origem.textContent = c
      ? `Origem: impressora em X ${c.X0.toFixed(2)}, Y ${c.Y0.toFixed(2)}, Z ${c.Z0.toFixed(2)}, com o sensor a ${c.h0} mm acima da bobina.`
      : "Origem ainda não marcada.";
  }

  function mostrarPosicao() {
    if (!posicaoAtual) return;
    el.posicao.textContent = `X ${posicaoAtual.x.toFixed(2)} · Y ${posicaoAtual.y.toFixed(2)} · Z ${posicaoAtual.z.toFixed(2)}`;
    const c = estado.calibracao;
    el.posicaoBobina.textContent = c
      ? `${(posicaoAtual.x - c.X0).toFixed(1)} · ${(posicaoAtual.y - c.Y0).toFixed(1)} · ${(posicaoAtual.z - c.Z0 + c.h0).toFixed(1)} mm`
      : "marque a origem";
  }

  async function atualizarPosicao() {
    await impressora.marlin.enviar("M400");
    posicaoAtual = lerPosicao(await impressora.marlin.enviar("M114"));
    mostrarPosicao();
  }

  async function comImpressora(acao) {
    try {
      await acao();
    } catch (erro) {
      status(erro.message, "error");
    }
  }

  // --- conexões ---

  // Algumas placas reiniciam ao abrir a porta e despejam a configuração. Comando enviado nesse meio pode ter o
  // "ok" perdido ou atrasado, e um "ok" atrasado faria todos os seguintes andarem um passo fora de ordem.
  // Por isso o primeiro comando só sai depois de 1,5 s sem nenhuma linha chegando.
  async function esperarSilencio(ultimaLinha, { quietoMs = 1500, maximoMs = 15000 } = {}) {
    const inicio = Date.now();
    while (Date.now() - inicio < maximoMs) {
      if (Date.now() - ultimaLinha() >= quietoMs) return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  async function conectarImpressora() {
    try {
      const porta = await navigator.serial.requestPort();
      let ultimaLinha = Date.now();
      const canal = await abrirCanal(porta, {
        velocidade: Number(el.baud.value),
        aoLinha: (linha) => {
          ultimaLinha = Date.now();
          impressora?.marlin.receber(linha);
        },
        aoFechar: (mensagem) => perdeuImpressora(mensagem),
      });
      const marlin = createMarlinLink(canal.escrever, { log: (item) => registrarLog(item, "impressora") });
      impressora = { canal, marlin };
      el.estadoImpressora.textContent = "Conectada. Esperando a placa ficar quieta…";
      atualizarBotoes();
      await esperarSilencio(() => ultimaLinha);
      el.estadoImpressora.textContent = "Conectada. Conferindo a resposta…";
      await marlin.enviar("M114", { prazoMs: 10000 });
      await marlin.enviar("G90");
      await marlin.enviar("M18 S0"); // motores não desligam parados (posição e fundo magnético iguais nas duas passadas)
      await atualizarPosicao();
      el.estadoImpressora.textContent = "Conectada e respondendo.";
      status("Impressora conectada.", "ready");
    } catch (erro) {
      if (erro.name === "NotFoundError") return; // o usuário fechou a lista de portas
      status(`Impressora: ${erro.message}`, "error");
      await desconectarImpressora();
    }
    atualizarBotoes();
  }

  async function desconectarImpressora() {
    impressora?.marlin.cancelarTudo();
    await impressora?.canal.fechar();
    impressora = null;
    el.estadoImpressora.textContent = "Desconectada.";
    atualizarBotoes();
  }

  function perdeuImpressora(mensagem) {
    impressora?.marlin.cancelarTudo(mensagem);
    impressora = null;
    el.estadoImpressora.textContent = mensagem;
    status(`Impressora: ${mensagem}`, "error");
    atualizarBotoes();
  }

  async function conectarSensor() {
    try {
      const porta = await navigator.serial.requestPort();
      const canal = await abrirCanal(porta, {
        velocidade: 115200,
        aoLinha: (linha) => {
          sensor?.link.receber(linha);
          if (linha.startsWith("obs: MLX90393 não encontrado")) el.estadoSensor.textContent = linha.slice(5);
        },
        aoFechar: (mensagem) => perdeuSensor(mensagem),
      });
      const link = createSensorLink(canal.escrever, {
        log: (item) => {
          if (item.direcao === "enviado" || !/^(frente_uT|\d+,)/.test(item.texto)) registrarLog(item, "sensor");
        },
      });
      sensor = { canal, link };
      el.estadoSensor.textContent = "Conectado. Reiniciando a placa e procurando o sensor…";
      atualizarBotoes();
      const pronto = link.esperarPronto(12000);
      await reiniciarEsp32(porta);
      await pronto;
      await link.silenciar();
      await link.faixaFraca();
      el.estadoSensor.textContent = "Sensor pronto (faixa fraca, modo silencioso).";
      status("Sensor conectado.", "ready");
    } catch (erro) {
      if (erro.name === "NotFoundError") return;
      status(`Sensor: ${erro.message} Se a placa não reiniciou, aperte o EN dela e conecte de novo.`, "error");
      await desconectarSensor();
    }
    atualizarBotoes();
  }

  async function desconectarSensor() {
    await sensor?.canal.fechar();
    sensor = null;
    el.estadoSensor.textContent = "Desconectado.";
    atualizarBotoes();
  }

  function perdeuSensor(mensagem) {
    sensor = null;
    el.estadoSensor.textContent = mensagem;
    status(`Sensor: ${mensagem}`, "error");
    atualizarBotoes();
  }

  async function medirAqui() {
    try {
      const medida = await sensor.link.medir(8);
      const campo = paraEixosDaImpressora(medida, lerMapeamento());
      el.ultima.textContent = `frente ${medida.frente.toFixed(1)}, esquerda ${medida.esquerda.toFixed(1)}, cima ${medida.cima.toFixed(1)} µT → ` +
        `Bx ${campo.bx.toFixed(1)}, By ${campo.by.toFixed(1)}, Bz ${campo.bz.toFixed(1)} µT`;
    } catch (erro) {
      status(erro.message, "error");
    }
  }

  // --- movimento e origem ---

  async function jog(direcao) {
    const eixo = direcao[0];
    const sinal = direcao[1] === "-" ? -1 : 1;
    const distancia = sinal * Number(el.passo.value);
    if (eixo === "Z" && sinal < 0 && estado.calibracao && posicaoAtual) {
      const alturaNova = posicaoAtual.z + distancia - estado.calibracao.Z0 + estado.calibracao.h0;
      if (alturaNova < 10) {
        status("Esse passo deixaria o sensor a menos de 10 mm da bobina. Use um passo menor.", "warning");
        return;
      }
    }
    await comImpressora(async () => {
      await impressora.marlin.enviar("G91");
      try {
        await impressora.marlin.enviar(`G1 ${eixo}${distancia} F${eixo === "Z" ? 600 : 3000}`);
      } finally {
        await impressora.marlin.enviar("G90");
      }
      await atualizarPosicao();
    });
  }

  async function home() {
    const confirmado = globalThis.confirm(
      "A mesa está vazia, sem o suporte da bobina? O home desce o sensor de nivelamento no meio da mesa.",
    );
    if (!confirmado) return;
    await comImpressora(async () => {
      status("Fazendo o home…");
      await impressora.marlin.enviar("G28", { prazoMs: 240000 });
      await impressora.marlin.enviar("M18 S0");
      if (estado.calibracao) status("Home feito. A origem marcada antes não vale mais: marque de novo.", "warning");
      else status("Home feito. Suba o Z e coloque o suporte da bobina.", "ready");
      estado.calibracao = null;
      salvar();
      mostrarOrigem();
      await atualizarPosicao();
    });
    atualizarBotoes();
  }

  async function marcarOrigem() {
    const h0 = Number(el.h0.value);
    if (!(h0 >= 5)) {
      status("Informe a altura do sensor acima da bobina (mm), medida com régua.", "warning");
      return;
    }
    await comImpressora(async () => {
      await atualizarPosicao();
      estado.calibracao = { X0: posicaoAtual.x, Y0: posicaoAtual.y, Z0: posicaoAtual.z, h0 };
      salvar();
      mostrarOrigem();
      mostrarPosicao();
      status("Origem marcada.", "ready");
    });
    atualizarBotoes();
  }

  async function irPara({ x, y, z }) {
    const { X, Y, Z } = paraImpressora({ x, y, z }, estado.calibracao);
    // sobe primeiro e desce por último, para não arrastar o sensor perto da bobina
    await impressora.marlin.enviar(`G1 Z${Math.max(Z, posicaoAtual?.z ?? Z).toFixed(2)} F600`);
    await impressora.marlin.enviar(`G1 X${X.toFixed(2)} Y${Y.toFixed(2)} F3000`);
    await impressora.marlin.enviar(`G1 Z${Z.toFixed(2)} F600`);
    await atualizarPosicao();
  }

  // --- plano ---

  function montarPlano() {
    const plano = lerPlano();
    const passos = planejarVarredura(plano);
    const problemas = estado.calibracao ? conferirLimites(passos, estado.calibracao) : [];
    return { plano, passos, problemas };
  }

  function conferirPlano() {
    try {
      const { plano, passos, problemas } = montarPlano();
      const pontos = passos.filter((p) => p.tipo === "ponto").length;
      const duracao = estimarDuracao(passos, { velocidadeMmS: plano.velocidade / 60, segundosPorMedida: plano.leituras * 0.075, pausaS: plano.pausaMs / 1000 });
      let texto = `${pontos} pontos e ${passos.length - pontos} visitas à referência por passada; cerca de ${formatarDuracao(duracao)} por passada.`;
      if (!estado.calibracao) texto += " Marque a origem para conferir os limites da impressora.";
      else if (problemas.length) texto += ` Problemas: ${problemas.slice(0, 4).join("; ")}.`;
      else texto += " Todos os pontos cabem no curso da impressora.";
      el.resumoPlano.textContent = texto;
      return problemas.length === 0;
    } catch (erro) {
      el.resumoPlano.textContent = erro.message;
      return false;
    }
  }

  async function percorrerCantos() {
    const { plano } = montarPlano();
    const z = Math.min(...plano.alturas);
    await comImpressora(async () => {
      for (const [x, y] of [[plano.x.min, plano.y.min], [plano.x.max, plano.y.min], [plano.x.max, plano.y.max], [plano.x.min, plano.y.max]]) {
        status(`Indo ao canto (${x}, ${y}) a ${z} mm…`);
        await irPara({ x, y, z });
      }
      status("Cantos percorridos. Confira se nada encostou na bobina nem no suporte.", "ready");
    });
  }

  // --- passadas ---

  async function rodarPassada(passada, retomando) {
    if (!retomando && !conferirPlano()) {
      status("Corrija o plano antes de começar (veja o resumo do plano).", "error");
      return;
    }
    if (!retomando && passada === "ligada") {
      const corrente = el.meta.find((campo) => campo.dataset.coletaMeta === "corrente_A").value;
      if (!globalThis.confirm(`Ligue a fonte e confira a corrente em ${corrente} A. Nada mais pode mudar de lugar. Começar?`)) return;
    }
    if (!retomando && passada === "desligada" && !globalThis.confirm("A fonte da bobina está desligada (corrente zero)? Começar?")) return;

    if (!retomando) {
      const { passos } = montarPlano();
      if (!estado.metadados) estado.metadados = lerMetadados();
      estado.mapeamento = lerMapeamento();
      estado.passadas[passada] = { inicioMs: Date.now(), proximo: 0, concluida: false, passos, plano: lerPlano() };
      salvar();
    }
    const registro = estado.passadas[passada];
    executando = { passada, pausado: false, pararPedido: false, retomarPausa: null };
    atualizarBotoes();
    let travaTela = null;
    try {
      travaTela = await navigator.wakeLock?.request("screen");
    } catch {
      // sem trava de tela: o computador não pode dormir durante a passada
    }
    const total = registro.passos.length;
    try {
      status(`Passada ${passada} em andamento. Não mexa na bobina, nos fios nem na fonte.`, "collecting");
      const resultado = await executarPassada({
        passos: registro.passos,
        inicio: registro.proximo,
        passada,
        calibracao: estado.calibracao,
        mapeamento: estado.mapeamento,
        marlin: impressora.marlin,
        sensor: sensor.link,
        leituras: registro.plano.leituras,
        pausaMs: registro.plano.pausaMs,
        velocidadeMmMin: registro.plano.velocidade,
        inicioDaPassadaMs: registro.inicioMs,
        controle: {
          parar: () => executando.pararPedido,
          esperarSePausado: () => (executando.pausado ? new Promise((resolve) => { executando.retomarPausa = resolve; }) : Promise.resolve()),
        },
        aoMedir: (linha, indice) => {
          estado.linhas.push(linhaCsv(linha));
          registro.proximo = indice + 1;
          salvar();
          el.progresso.value = registro.proximo / total;
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
          : "Passada ligada concluída. Baixe o CSV.", "complete");
      } else {
        status(`Passada ${passada} parada no ponto ${registro.proximo} de ${total}. Dá para retomar.`, "warning");
      }
    } catch (erro) {
      status(`Passada ${passada} interrompida no ponto ${registro.proximo} de ${total}: ${erro.message} Dá para retomar.`, "error");
    } finally {
      await travaTela?.release?.();
      executando = null;
      atualizarBotoes();
      if (impressora) await atualizarPosicao().catch(() => {});
    }
  }

  function pausarOuContinuar() {
    if (!executando) return;
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
  }

  function textoCsv() {
    return cabecalhoCsv(estado.metadados ?? lerMetadados()) + estado.linhas.join("\n") + "\n";
  }

  function nomeDoArquivo() {
    const data = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    return `mapa-campo-${estado.metadados?.geometria ?? "bobina"}-${data}.csv`;
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
    visualizador.readFiles([new File([textoCsv()], nomeDoArquivo(), { type: "text/csv" })]);
    document.querySelector("#aba-visualizacao")?.click();
  }

  function descartar() {
    if (!globalThis.confirm("Apagar os dados medidos guardados neste navegador? Baixe o CSV antes, se precisar.")) return;
    estado.linhas = [];
    estado.passadas = {};
    estado.metadados = null;
    salvar();
    el.progresso.value = 0;
    el.andamento.textContent = "Nenhuma passada em andamento.";
    atualizarBotoes();
  }

  // --- montagem da tela ---

  for (const select of el.eixos) {
    select.innerHTML = DIRECOES.map((d) => `<option value="${d}">${d}</option>`).join("");
  }

  const salvo = lerSalvo();
  if (salvo) {
    Object.assign(estado, salvo);
    if (estado.linhas.length) {
      status(`Há ${estado.linhas.length} medidas salvas neste navegador. Se a impressora não foi desligada nem fez home, dá para retomar.`, "warning");
    }
  }
  for (const select of el.eixos) select.value = estado.mapeamento[select.dataset.coletaEixo];
  mostrarOrigem();

  if (!webSerialDisponivel()) {
    status("Este navegador não tem Web Serial. Abra a página no Chrome, no Edge ou no Opera do computador.", "error");
    for (const botao of [el.conectarImpressora, el.conectarSensor]) botao.disabled = true;
  }

  el.conectarImpressora.addEventListener("click", conectarImpressora);
  el.desconectarImpressora.addEventListener("click", desconectarImpressora);
  el.conectarSensor.addEventListener("click", conectarSensor);
  el.desconectarSensor.addEventListener("click", desconectarSensor);
  el.medirAqui.addEventListener("click", medirAqui);
  el.home.addEventListener("click", home);
  el.subir.addEventListener("click", () => comImpressora(async () => {
    await impressora.marlin.enviar("G1 Z250 F600");
    await atualizarPosicao();
  }));
  el.irOrigem.addEventListener("click", () => comImpressora(() => irPara({ x: 0, y: 0, z: estado.calibracao.h0 })));
  for (const botao of el.jogs) botao.addEventListener("click", () => jog(botao.dataset.coletaJog));
  el.marcarOrigem.addEventListener("click", marcarOrigem);
  for (const select of el.eixos) select.addEventListener("change", () => { estado.mapeamento = lerMapeamento(); salvar(); });
  el.conferir.addEventListener("click", conferirPlano);
  el.cantos.addEventListener("click", percorrerCantos);
  for (const botao of el.iniciar) botao.addEventListener("click", () => rodarPassada(botao.dataset.coletaIniciar, false));
  el.retomar.addEventListener("click", () => {
    const parada = Object.entries(estado.passadas).find(([, p]) => !p.concluida && p.proximo > 0);
    if (parada) rodarPassada(parada[0], true);
  });
  el.pausar.addEventListener("click", pausarOuContinuar);
  el.parar.addEventListener("click", parar);
  el.ver.addEventListener("click", verNoVisualizador);
  el.baixar.addEventListener("click", baixar);
  el.descartar.addEventListener("click", descartar);
  el.formGcode.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const comando = el.gcode.value.trim();
    if (!comando || !impressora || executando) return;
    el.gcode.value = "";
    comImpressora(async () => {
      await impressora.marlin.enviar(comando, { prazoMs: 240000 });
      if (/^G28/i.test(comando)) {
        estado.calibracao = null;
        salvar();
        mostrarOrigem();
      }
    });
  });

  atualizarBotoes();
  return { estado };
}

if (typeof document !== "undefined") {
  for (const raiz of document.querySelectorAll("[data-coleta]")) setupFieldCollector(raiz);
}
