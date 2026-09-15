import { setupSerialChart } from "./grafico-serial.js";

const HEADER = "fase,t_ms,adc,r_nominal_ohm";
const ALLOWED_RESISTANCES = new Set([47000, 56000, 68000]);

function protocolError(state, message) {
  state.status = "error";
  return { type: "error", message };
}

export function createSerialCapture() {
  const state = {
    status: "waiting",
    headerSeen: false,
    rows: [],
    phases: new Set(),
    lastTime: new Map(),
    resistance: null,
    latest: null,
    armed: false,
  };

  function ingest(rawLine) {
    const line = String(rawLine).trim();
    if (!line) return { type: "ignore" };
    if (state.status === "error") {
      return { type: "error", message: "A coleta já foi invalidada." };
    }
    if (state.status === "complete" || state.status === "interrupted") {
      return { type: "ignore" };
    }

    if (line.startsWith("# pronto")) {
      if (state.headerSeen) {
        return protocolError(state, "O Arduino reiniciou durante a aquisição.");
      }
      state.status = "ready";
      return { type: "ready" };
    }
    if (line.startsWith("# erro")) {
      return protocolError(state, line.replace(/^# erro:\s*/, ""));
    }
    if (line === "# interrompido") {
      state.status = "interrupted";
      return { type: "interrupted" };
    }
    if (line === "# fim") {
      if (!state.phases.has("carga") || !state.phases.has("descarga")) {
        return protocolError(
          state,
          "A aquisição terminou sem as duas fases completas.",
        );
      }
      state.status = "complete";
      return { type: "complete" };
    }
    if (line.startsWith("#")) return { type: "message", message: line.slice(1).trim() };

    if (line === HEADER) {
      if (state.headerSeen) {
        return protocolError(state, "A aquisição reiniciou antes de terminar.");
      }
      state.headerSeen = true;
      state.status = "collecting";
      return { type: "header" };
    }
    if (!state.headerSeen) {
      // Antes de a aquisição ser pedida, a porta ainda carrega o que a placa
      // imprime ao reiniciar (o ESP32 despeja o log do bootloader). Descartar.
      if (!state.armed) return { type: "ignore" };
      return protocolError(state, "Foram recebidos dados antes do cabeçalho.");
    }

    const fields = line.split(",");
    if (fields.length !== 4) {
      return protocolError(state, "Linha serial com número incorreto de campos.");
    }
    const [phase, timestampText, adcText, resistanceText] = fields;
    if (!/^(0|[1-9]\d*)$/.test(timestampText) ||
        !/^(0|[1-9]\d*)$/.test(adcText) ||
        !/^(0|[1-9]\d*)$/.test(resistanceText)) {
      return protocolError(state, "Tempo, ADC ou resistor não é um inteiro válido.");
    }

    const timestamp = Number(timestampText);
    const adc = Number(adcText);
    const resistance = Number(resistanceText);
    if (phase !== "carga" && phase !== "descarga") {
      return protocolError(state, "Fase serial desconhecida.");
    }
    if (!Number.isSafeInteger(timestamp) || !Number.isSafeInteger(adc) ||
        !Number.isSafeInteger(resistance) || adc < 0 || adc > 1023) {
      return protocolError(state, "Tempo, ADC ou resistor fora do intervalo válido.");
    }
    if (!ALLOWED_RESISTANCES.has(resistance)) {
      return protocolError(state, "O resistor informado não pertence a este roteiro.");
    }
    if (state.resistance !== null && state.resistance !== resistance) {
      return protocolError(state, "O resistor mudou dentro da mesma aquisição.");
    }
    if (state.lastTime.has(phase) && timestamp <= state.lastTime.get(phase)) {
      return protocolError(state, "O tempo repetiu ou voltou dentro da fase.");
    }
    if (phase === "descarga" && !state.phases.has("carga")) {
      return protocolError(state, "A descarga apareceu antes da carga.");
    }
    if (phase === "carga" && state.phases.has("descarga")) {
      return protocolError(state, "A carga reapareceu depois do início da descarga.");
    }

    state.resistance = resistance;
    state.phases.add(phase);
    state.lastTime.set(phase, timestamp);
    state.latest = { phase, timestamp, adc, resistance };
    state.rows.push(`${phase},${timestamp},${adc},${resistance}`);
    state.status = "collecting";
    return { type: "data", ...state.latest };
  }

  function summary() {
    return {
      status: state.status,
      count: state.rows.length,
      phase: state.latest?.phase ?? null,
      elapsedMs: state.latest?.timestamp ?? null,
      adc: state.latest?.adc ?? null,
      resistance: state.resistance,
      downloadable: state.rows.length > 0,
      complete: state.status === "complete",
    };
  }

  function csv() {
    if (!state.rows.length) return "";
    return `${HEADER}\n${state.rows.join("\n")}\n`;
  }

  function arm() {
    state.armed = true;
  }

  return { ingest, summary, csv, arm };
}

function formatElapsed(milliseconds) {
  if (milliseconds === null) return "—";
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}

export function calculatePhaseProgress(elapsedMs, resistance) {
  if (elapsedMs === null || !resistance) return 0;
  const phaseDurationMs = 5 * resistance * 2200 / 1000;
  return Math.min(100, 100 * elapsedMs / phaseDurationMs);
}

function defaultDownload(contents, filename) {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function setupWebSerialCollector(
  root,
  {
    serial = globalThis.navigator?.serial,
    secureContext = globalThis.isSecureContext,
    download = defaultDownload,
  } = {},
) {
  const elements = {
    connect: root.querySelector("[data-serial-connect]"),
    start: root.querySelector("[data-serial-start]"),
    stop: root.querySelector("[data-serial-stop]"),
    disconnect: root.querySelector("[data-serial-disconnect]"),
    save: root.querySelector("[data-serial-download]"),
    status: root.querySelector("[data-serial-status]"),
    phase: root.querySelector("[data-serial-phase]"),
    time: root.querySelector("[data-serial-time]"),
    count: root.querySelector("[data-serial-count]"),
    adc: root.querySelector("[data-serial-adc]"),
    resistance: root.querySelector("[data-serial-resistance]"),
    progress: root.querySelector("[data-serial-progress]"),
  };

  let port = null;
  let reader = null;
  let reading = false;
  let readPromise = null;
  let capture = createSerialCapture();
  let lastPaint = 0;
  let saved = false;
  let readyTimer = null;
  const chartRoot = root.querySelector("[data-serial-chart]");
  const chart = chartRoot ? setupSerialChart(chartRoot, { download }) : null;

  function setStatus(message, kind = "neutral") {
    elements.status.textContent = message;
    elements.status.dataset.kind = kind;
  }

  function update(force = false) {
    const now = Date.now();
    if (!force && now - lastPaint < 200) return;
    lastPaint = now;
    const state = capture.summary();
    elements.phase.textContent = state.phase ?? "—";
    elements.time.textContent = formatElapsed(state.elapsedMs);
    elements.count.textContent = state.count.toLocaleString("pt-BR");
    elements.adc.textContent = state.adc ?? "—";
    elements.resistance.textContent = state.resistance
      ? `${state.resistance / 1000} kΩ`
      : "—";
    elements.progress.value = calculatePhaseProgress(
      state.elapsedMs,
      state.resistance,
    );
    elements.save.disabled = !state.downloadable;
  }

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  // O Chrome abre a porta sem pulsar DTR/RTS, então a placa não reinicia e o
  // "# pronto" (impresso só no setup) nunca chega. Primeiro o pulso de DTR, que
  // reinicia o Arduino; depois o de RTS, que reinicia o ESP32 pelo pino EN.
  // A ordem importa: no ESP32 o DTR controla o GPIO0, e soltar o EN com o DTR
  // ainda acionado faz a placa subir no bootloader em vez de rodar o sketch.
  async function restartBoard() {
    if (typeof port?.setSignals !== "function") return;
    try {
      await port.setSignals({ dataTerminalReady: true, requestToSend: false });
      await wait(120);
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await wait(150);
      await port.setSignals({ dataTerminalReady: false, requestToSend: true });
      await wait(120);
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    } catch (error) {
      // Adaptadores sem controle de DTR/RTS caem no aviso por tempo abaixo.
    }
  }

  // Rede de segurança: se a placa não avisar que está pronta, a tela libera o
  // início mesmo assim em vez de travar o aluno com um único botão útil.
  function waitForReady() {
    clearTimeout(readyTimer);
    readyTimer = setTimeout(() => {
      if (!port || capture.summary().status !== "waiting") return;
      setStatus(
        "A placa não avisou que está pronta. Aperte RESET nela ou clique em “Iniciar carga e descarga” mesmo assim.",
        "warning",
      );
      elements.start.disabled = false;
    }, 3000);
  }

  async function send(command) {
    if (!port?.writable) throw new Error("A porta serial não está disponível para escrita.");
    const writer = port.writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(command));
    } finally {
      writer.releaseLock();
    }
  }

  function handleEvent(event) {
    if (event.type === "ready") {
      clearTimeout(readyTimer);
      setStatus("Arduino pronto. Confira a descarga inicial e inicie a aquisição.", "ready");
      elements.start.disabled = false;
    } else if (event.type === "header") {
      setStatus("Aquisição iniciada: fase de carga.", "collecting");
      elements.start.disabled = true;
      elements.stop.disabled = false;
    } else if (event.type === "data") {
      chart?.add(event);
      setStatus(
        event.phase === "carga" ? "Coletando carga…" : "Coletando descarga…",
        "collecting",
      );
    } else if (event.type === "complete") {
      setStatus("Par completo. Baixe o CSV antes de iniciar outra coleta.", "complete");
      elements.stop.disabled = true;
      elements.save.disabled = false;
    } else if (event.type === "interrupted") {
      setStatus("Coleta interrompida. O CSV parcial pode ser baixado.", "warning");
      elements.stop.disabled = true;
      elements.save.disabled = !capture.summary().downloadable;
      elements.start.disabled = capture.summary().downloadable;
    } else if (event.type === "error") {
      setStatus(`Coleta inválida: ${event.message} Baixe o parcial, se houver.`, "error");
      elements.stop.disabled = true;
      elements.save.disabled = !capture.summary().downloadable;
      elements.start.disabled = capture.summary().downloadable;
    }
    update(true);
  }

  async function readLoop() {
    reading = true;
    const decoder = new TextDecoder();
    let buffer = "";
    let bytesReceived = 0;
    try {
      while (port?.readable && reading) {
        reader = port.readable.getReader();
        try {
          while (reading) {
            const { value, done } = await reader.read();
            if (done) break;
            bytesReceived += value.length;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? "";
            for (const line of lines) handleEvent(capture.ingest(line));
          }
        } finally {
          reader.releaseLock();
          reader = null;
        }
      }
    } catch (error) {
      if (reading && bytesReceived === 0 && error.name === "NetworkError" && navigator.userAgent.includes("Linux")) {
        // No Linux o Chromium trata read()==0 como porta perdida, e read() devolve 0
        // quando a porta ficou com VMIN=0 de um programa anterior (pyserial, esptool).
        setStatus(
          "O Chrome perdeu a porta logo ao abrir. No Linux, rode no terminal: stty -F /dev/ttyUSB0 min 1 (troque pela sua porta), depois desconecte e conecte de novo.",
          "error",
        );
      } else if (reading) {
        setStatus(`Conexão perdida: ${error.message}. Baixe o CSV parcial.`, "error");
      }
    } finally {
      reading = false;
      elements.stop.disabled = true;
      elements.start.disabled = true;
      elements.save.disabled = !capture.summary().downloadable;
      update(true);
    }
  }

  async function connect() {
    try {
      port = await serial.requestPort();
      await port.open({ baudRate: 115200 });
      // Uma nova conexão é uma coleta nova: sem isto, o estado "complete" da
      // aquisição anterior faz a tela ignorar o próximo "# pronto".
      capture = createSerialCapture();
      saved = false;
      elements.connect.disabled = true;
      elements.disconnect.disabled = false;
      elements.save.disabled = true;
      setStatus("Conectado. Reiniciando a placa e aguardando o aviso de pronto…");
      readPromise = readLoop();
      await restartBoard();
      waitForReady();
      update(true);
    } catch (error) {
      if (error.name === "NotFoundError") {
        setStatus("Nenhuma porta foi selecionada.", "warning");
      } else {
        setStatus(`Não foi possível conectar: ${error.message}`, "error");
      }
    }
  }

  async function start() {
    clearTimeout(readyTimer);
    capture = createSerialCapture();
    capture.arm();
    chart?.reset();
    saved = false;
    update(true);
    elements.start.disabled = true;
    elements.stop.disabled = false;
    elements.save.disabled = true;
    setStatus("Solicitando o início ao Arduino…");
    try {
      await send("i");
    } catch (error) {
      setStatus(`Não foi possível iniciar: ${error.message}`, "error");
      elements.stop.disabled = true;
    }
  }

  async function stop() {
    try {
      await send("x");
      setStatus("Interrupção solicitada; aguardando confirmação do Arduino…", "warning");
    } catch (error) {
      setStatus(`Falha ao interromper: ${error.message}`, "error");
    }
  }

  function save() {
    const state = capture.summary();
    if (!state.downloadable) return;
    const resistor = state.resistance ? `R${state.resistance / 1000}k` : "R-desconhecido";
    const suffix = state.complete ? "completo" : "parcial";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    download(capture.csv(), `${resistor}-${suffix}-${timestamp}.csv`);
    saved = true;
    if (state.complete || state.status === "interrupted" || state.status === "error") {
      elements.start.disabled = !port?.writable;
    }
    setStatus(
      state.complete
        ? "CSV completo baixado. Você pode iniciar outra coleta."
        : "CSV parcial baixado e identificado no nome do arquivo.",
      state.complete ? "complete" : "warning",
    );
  }

  async function disconnect() {
    if (capture.summary().downloadable && !saved) {
      setStatus("Baixe o CSV antes de desconectar ou interrompa para preservá-lo.", "warning");
      return;
    }
    clearTimeout(readyTimer);
    reading = false;
    if (reader) await reader.cancel();
    if (readPromise) await readPromise;
    if (port?.readable || port?.writable) await port.close();
    port = null;
    readPromise = null;
    elements.connect.disabled = false;
    elements.disconnect.disabled = true;
    elements.start.disabled = true;
    elements.stop.disabled = true;
    setStatus("Arduino desconectado.");
  }

  elements.connect.addEventListener("click", connect);
  elements.start.addEventListener("click", start);
  elements.stop.addEventListener("click", stop);
  elements.save.addEventListener("click", save);
  elements.disconnect.addEventListener("click", disconnect);

  if (!secureContext) {
    setStatus("O coletor serial exige HTTPS ou localhost. Use a versão publicada ou Python.", "error");
    elements.connect.disabled = true;
  } else if (!serial) {
    setStatus(
      "Web Serial não está disponível neste navegador. Use Chrome, Edge ou Chromium no computador, ou use a alternativa Python.",
      "warning",
    );
    elements.connect.disabled = true;
  } else {
    setStatus("Conecte o Arduino por USB e clique em “Conectar Arduino”.");
  }
  update(true);

  return { connect, start, stop, save, disconnect, getCapture: () => capture };
}

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-web-serial-collector]")) {
    setupWebSerialCollector(root);
  }
}
