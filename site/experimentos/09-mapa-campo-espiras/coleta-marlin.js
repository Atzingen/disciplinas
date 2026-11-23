// Conversa com o Marlin pela serial: um comando por vez, e cada um só termina quando chega o "ok".
// Enquanto um movimento longo roda, o Marlin manda mensagens de ocupado ("busy"); qualquer linha recebida
// renova o prazo, então só um silêncio completo vira erro de tempo. Depois de um comando sem resposta, a
// conversa fica fora de sincronia: o "ok" dele pode chegar depois e confirmar o comando seguinte (um M400
// confirmado cedo faria medir com a cabeça andando). Por isso o link recusa tudo até ser refeito.

const PRAZO_PADRAO_MS = 120000;

export function limparComando(texto) {
  return String(texto).replace(/;.*$/, "").trim();
}

function ehOk(linha) {
  return linha === "ok" || linha.startsWith("ok ");
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
    armarRelogio(atual);
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

export function lerPosicao(linhas) {
  for (const linha of linhas) {
    const encontrado = /X:\s*(-?\d+(?:\.\d+)?)\s+Y:\s*(-?\d+(?:\.\d+)?)\s+Z:\s*(-?\d+(?:\.\d+)?)/.exec(linha);
    if (encontrado) {
      return { x: Number(encontrado[1]), y: Number(encontrado[2]), z: Number(encontrado[3]) };
    }
  }
  return null;
}
