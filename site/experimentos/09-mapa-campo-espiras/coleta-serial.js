// Porta Web Serial vista como linhas de texto: abre, lê linha a linha e escreve texto.

export function webSerialDisponivel() {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// O Chrome abre a porta sem pulsar DTR/RTS. Na ESP32, o pulso de RTS reinicia a placa pelo pino EN; o DTR
// fica solto antes, senão ela sobe no modo de gravação (mesma sequência do coletor do experimento 7).
export async function reiniciarEsp32(porta) {
  if (typeof porta?.setSignals !== "function") return;
  try {
    await porta.setSignals({ dataTerminalReady: false, requestToSend: false });
    await espera(100);
    await porta.setSignals({ dataTerminalReady: false, requestToSend: true });
    await espera(120);
    await porta.setSignals({ dataTerminalReady: false, requestToSend: false });
  } catch {
    // Adaptador sem DTR/RTS: o usuário aperta o EN da placa.
  }
}

export async function abrirCanal(porta, { velocidade = 115200, aoLinha, aoFechar }) {
  await porta.open({ baudRate: velocidade });
  let lendo = true;
  let leitor = null;
  let bytesRecebidos = 0;

  async function ler() {
    const decodificador = new TextDecoder();
    let resto = "";
    let erro = null;
    try {
      while (porta.readable && lendo) {
        leitor = porta.readable.getReader();
        try {
          while (lendo) {
            const { value, done } = await leitor.read();
            if (done) break;
            bytesRecebidos += value.length;
            resto += decodificador.decode(value, { stream: true });
            const linhas = resto.split(/\r?\n/);
            resto = linhas.pop() ?? "";
            for (const linha of linhas) aoLinha(linha);
          }
        } finally {
          leitor.releaseLock();
          leitor = null;
        }
      }
    } catch (falha) {
      erro = falha;
    }
    if (lendo) {
      lendo = false;
      let mensagem = erro ? `Conexão perdida: ${erro.message}` : "A porta foi fechada.";
      if (erro?.name === "NetworkError" && bytesRecebidos === 0 && navigator.userAgent.includes("Linux")) {
        mensagem = "O Chrome perdeu a porta logo ao abrir. No Linux, rode no terminal: stty -F /dev/ttyUSB0 min 1 " +
          "(troque pela sua porta), depois desconecte e conecte o cabo de novo.";
      }
      aoFechar?.(mensagem);
    }
  }
  const leitura = ler();

  // Um escritor só para a conexão inteira: a resposta pode chegar antes de a escrita anterior terminar, e o
  // próximo comando sairia com a porta ainda travada se cada escrita pegasse e soltasse o seu.
  const escritor = porta.writable.getWriter();
  const codificador = new TextEncoder();

  async function escrever(texto) {
    await escritor.write(codificador.encode(texto));
  }

  // A porta só fecha com as duas pontas destravadas: cancela a leitura, espera o laço soltar o
  // leitor e só então fecha (senão o close falha e a porta fica presa até recarregar a página).
  async function fechar() {
    lendo = false;
    try {
      await leitor?.cancel();
    } catch {
      // a porta já pode ter caído
    }
    await leitura;
    try {
      escritor.releaseLock();
    } catch {
      // já solto
    }
    try {
      await porta.close();
    } catch {
      // a porta já pode ter caído
    }
  }

  return { escrever, fechar };
}
