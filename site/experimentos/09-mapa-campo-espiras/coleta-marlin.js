// Conversa com o Marlin pela serial: um comando por vez, e cada um só termina quando chega o "ok".
// Enquanto um movimento longo roda, o Marlin manda mensagens de ocupado ("busy"); só elas renovam o prazo.
// Qualquer outra linha não renova: com a porta da ESP32 escolhida por engano, o fluxo contínuo de leituras
// dela manteria o comando esperando para sempre. Depois de um comando sem resposta, a
// conversa fica fora de sincronia: o "ok" dele pode chegar depois e confirmar o comando seguinte (um M400
// confirmado cedo faria medir com a cabeça andando). Por isso o link recusa tudo até ser refeito.

const PRAZO_PADRAO_MS = 120000;

export function limparComando(texto) {
  return String(texto).replace(/;.*$/, "").trim();
}

// Comandos que mudam o referencial da impressora: home (G28), deslocamento das coordenadas (G92, M206, M428,
// e M501/M502, que recarregam ou zeram o deslocamento do M206)
// e sistemas de coordenadas de trabalho (G53 a G59, inclusive G59.1 a G59.3). Depois deles, a mesma
// coordenada lógica pode ser outro lugar físico, e o M114 confere a coordenada já deslocada.
const COMANDOS_QUE_MUDAM_O_REFERENCIAL = [
  "G28", "G92", "M206", "M428", "M501", "M502", "G53", "G54", "G55", "G56", "G57", "G58", "G59",
];

export function mudaReferencial(texto) {
  const encontrado = /^(?:N\d+\s*)?([GM])\s*(\d+)/i.exec(limparComando(texto));
  if (!encontrado) return false;
  const codigo = `${encontrado[1].toUpperCase()}${Number(encontrado[2])}`; // "G092" é o mesmo G92
  return COMANDOS_QUE_MUDAM_O_REFERENCIAL.includes(codigo);
}

function ehOk(linha) {
  return linha === "ok" || linha.startsWith("ok ");
}

// Mensagem de ocupado do Marlin, como "echo:busy: processing"; a forma sem o "echo:" também vale.
function ehOcupado(linha) {
  return /^echo:\s*busy/i.test(linha) || /^busy:/i.test(linha);
}

// "echo:Home XYZ First" aparece quando a impressora perdeu o home: o Marlin recusa o movimento e
// mesmo assim responde "ok".
function ehErro(linha) {
  return linha.startsWith("Error:") || linha.startsWith("!!") || /^echo:\s*Unknown command/i.test(linha) ||
    /^echo:\s*Home\b.*\bfirst/i.test(linha);
}

export function createMarlinLink(write, { log = () => {}, prazoMs = PRAZO_PADRAO_MS } = {}) {
  const fila = [];
  let atual = null;
  let foraDeSincronia = false;
  const MENSAGEM_SEM_SINCRONIA = "A conversa com a impressora saiu de sincronia (um comando ficou sem resposta). " +
    "Desconecte e conecte a impressora de novo antes de continuar.";

  function terminarAtual(erro) {
    const comando = atual;
    atual = null;
    clearTimeout(comando.relogio);
    if (erro) comando.reject(erro);
    else comando.resolve(comando.linhas);
    enviarProximo();
  }

  function armarRelogio(comando) {
    clearTimeout(comando.relogio);
    comando.relogio = setTimeout(() => {
      if (atual !== comando) return;
      foraDeSincronia = true;
      cancelarTudo(`O Marlin não respondeu a "${comando.texto}" em ${comando.prazoMs / 1000} s. ${MENSAGEM_SEM_SINCRONIA}`);
    }, comando.prazoMs);
  }

  async function enviarProximo() {
    if (atual || fila.length === 0) return;
    atual = fila.shift();
    log({ direcao: "enviado", texto: atual.texto });
    armarRelogio(atual);
    try {
      await write(`${atual.texto}\n`);
    } catch (erro) {
      if (atual) terminarAtual(erro);
    }
  }

  function receber(linhaBruta) {
    const linha = String(linhaBruta).trim();
    if (!linha) return;
    log({ direcao: "recebido", texto: linha });
    if (!atual) return;
    if (ehOcupado(linha)) armarRelogio(atual);
    if (ehOk(linha)) {
      terminarAtual(atual.erro ? new Error(atual.erro) : null);
      return;
    }
    if (ehErro(linha)) atual.erro = atual.erro ?? `O Marlin recusou "${atual.texto}": ${linha}`;
    atual.linhas.push(linha);
  }

  // Devolve as linhas que o Marlin mandou antes do "ok" (por exemplo a posição no M114).
  function enviar(texto, { prazoMs: prazoComando = prazoMs } = {}) {
    const comando = limparComando(texto);
    if (foraDeSincronia) return Promise.reject(new Error(MENSAGEM_SEM_SINCRONIA));
    if (!comando) return Promise.resolve([]);
    return new Promise((resolve, reject) => {
      fila.push({ texto: comando, prazoMs: prazoComando, linhas: [], erro: null, resolve, reject });
      enviarProximo();
    });
  }

  function cancelarTudo(motivo = "Conexão com o Marlin encerrada.") {
    const pendentes = fila.splice(0);
    if (atual) {
      const comando = atual;
      atual = null;
      clearTimeout(comando.relogio);
      comando.reject(new Error(motivo));
    }
    for (const comando of pendentes) comando.reject(new Error(motivo));
  }

  return {
    enviar, receber, cancelarTudo,
    ocupado: () => Boolean(atual) || fila.length > 0,
    foraDeSincronia: () => foraDeSincronia,
  };
}

// Curso real da impressora, pelos limites por software que o M211 informa. A Kywoo responde numa linha
// "Min:  X-14.00 Y0.00 Z0.00   Max:  X240.00 Y250.00 Z300.00"; o Marlin padrão põe o mesmo texto depois de
// "echo:Soft endstops: On".
export function lerLimites(linhas) {
  const numero = String.raw`(-?\d+(?:\.\d+)?)`;
  const padrao = new RegExp(
    `Min:\\s*X\\s*${numero}\\s+Y\\s*${numero}\\s+Z\\s*${numero}\\s+Max:\\s*X\\s*${numero}\\s+Y\\s*${numero}\\s+Z\\s*${numero}`,
  );
  for (const linha of linhas) {
    const encontrado = padrao.exec(linha);
    if (encontrado) {
      const [xMin, yMin, zMin, xMax, yMax, zMax] = encontrado.slice(1).map(Number);
      return { min: { x: xMin, y: yMin, z: zMin }, max: { x: xMax, y: yMax, z: zMax } };
    }
  }
  return null;
}

export function lerPosicao(linhas) {
  for (const linha of linhas) {
    const encontrado = /X:\s*(-?\d+(?:\.\d+)?)\s+Y:\s*(-?\d+(?:\.\d+)?)\s+Z:\s*(-?\d+(?:\.\d+)?)/.exec(linha);
    if (encontrado) {
      return { x: Number(encontrado[1]), y: Number(encontrado[2]), z: Number(encontrado[3]) };
    }
  }
  return null;
}
