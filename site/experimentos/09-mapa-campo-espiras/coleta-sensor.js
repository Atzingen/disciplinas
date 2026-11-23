// Conversa com a ESP32 do MLX90393 (sketch sensor_mlx90393): "s" deixa a placa em silêncio e "r16" pede
// a média de 16 leituras, que volta numa linha "med,n,frente,esquerda,cima,s_frente,s_esquerda,s_cima".

export function lerMedida(linha) {
  const partes = String(linha).trim().split(",");
  if (partes[0] !== "med" || partes.length !== 8) return null;
  const numeros = partes.slice(1).map(Number);
  if (numeros.some((valor) => !Number.isFinite(valor))) return null;
  const [n, frente, esquerda, cima, sFrente, sEsquerda, sCima] = numeros;
  return { n, frente, esquerda, cima, sFrente, sEsquerda, sCima };
}

export function createSensorLink(write, { log = () => {} } = {}) {
  let pendente = null;
  let prontoEsperado = null;

  function receber(linhaBruta) {
    const linha = String(linhaBruta).trim();
    if (!linha) return;
    log({ direcao: "recebido", texto: linha });
    if (linha === "obs: pronto" && prontoEsperado) {
      prontoEsperado.resolve();
      prontoEsperado = null;
    }
    if (!pendente) return;
    const medida = lerMedida(linha);
    if (medida) {
      const atual = pendente;
      pendente = null;
      clearTimeout(atual.relogio);
      atual.resolve(medida);
    } else if (linha.startsWith("erro,")) {
      const atual = pendente;
      pendente = null;
      clearTimeout(atual.relogio);
      atual.reject(new Error(`O sensor não conseguiu medir (${linha}).`));
    }
  }

  async function enviar(texto) {
    log({ direcao: "enviado", texto });
    await write(`${texto}\n`);
  }

  // Cada leitura leva ~63 ms com o filtro do sketch; o prazo deixa folga de sobra.
  function medir(leituras = 16) {
    if (pendente) return Promise.reject(new Error("Já há uma medida em andamento."));
    return new Promise((resolve, reject) => {
      pendente = { resolve, reject };
      pendente.relogio = setTimeout(() => {
        pendente = null;
        reject(new Error("A ESP32 não respondeu à medida."));
      }, 3000 + leituras * 200);
      enviar(`r${leituras}`).catch((erro) => {
        clearTimeout(pendente?.relogio);
        pendente = null;
        reject(erro);
      });
    });
  }

  function esperarPronto(prazoMs = 8000) {
    return new Promise((resolve, reject) => {
      const relogio = setTimeout(() => {
        prontoEsperado = null;
        reject(new Error("A ESP32 não avisou que está pronta (confira se o sensor foi encontrado)."));
      }, prazoMs);
      prontoEsperado = {
        resolve: () => {
          clearTimeout(relogio);
          resolve();
        },
      };
    });
  }

  return {
    receber,
    medir,
    esperarPronto,
    silenciar: () => enviar("s"),
    faixaFraca: () => enviar("f"),
  };
}
