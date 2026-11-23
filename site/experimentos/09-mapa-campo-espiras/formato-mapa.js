// Leitura e escrita do formato "mapa-campo v1" (CSV com metadados em comentários).
// O formato está descrito no README.md desta pasta e na aba Dados da página.

export const FORMATO = "mapa-campo v1";

export const COLUNAS = [
  "passada", "tipo", "t_s", "x_mm", "y_mm", "z_mm",
  "bx_uT", "by_uT", "bz_uT", "sx_uT", "sy_uT", "sz_uT", "n",
];
const COLUNAS_NUMERICAS = COLUNAS.slice(2);

export const PASSADAS = ["desligada", "ligada"];
export const TIPOS = ["ponto", "ref"];
export const GEOMETRIAS = ["circulo", "quadrado", "u", "outra"];

const METADADOS_NUMERICOS = ["dimensao_mm", "voltas", "corrente_A", "leituras_por_ponto"];
// Metadados que descrevem a montagem: precisam coincidir entre arquivos.
// "data" e "observacao" podem mudar de um arquivo para outro.
const METADADOS_DA_MONTAGEM = ["formato", "geometria", ...METADADOS_NUMERICOS];

function parseMetadataLine(texto) {
  const corpo = texto.replace(/^#\s?/, "");
  const separador = corpo.indexOf(":");
  if (separador <= 0) return null;
  const chave = corpo.slice(0, separador).trim();
  if (!/^[a-z_A-Z0-9]+$/.test(chave)) return null;
  return { chave, valor: corpo.slice(separador + 1).trim() };
}

function normalizeMetadata(bruto, avisos, nome) {
  const metadados = { ...bruto };
  for (const chave of METADADOS_NUMERICOS) {
    if (!(chave in bruto)) continue;
    const numero = Number(bruto[chave]);
    if (Number.isFinite(numero)) {
      metadados[chave] = numero;
    } else {
      avisos.push(`${nome}: metadado "${chave}" não é um número ("${bruto[chave]}").`);
      delete metadados[chave];
    }
  }
  if ("geometria" in bruto) {
    const geometria = bruto.geometria.toLowerCase();
    if (GEOMETRIAS.includes(geometria)) {
      metadados.geometria = geometria;
    } else {
      avisos.push(`${nome}: geometria "${bruto.geometria}" desconhecida; tratada como "outra".`);
      metadados.geometria = "outra";
    }
  }
  return metadados;
}

// Lê um arquivo. Devolve { nome, metadados, colunas, linhas, avisos, erro }.
// Cada linha válida vira { passada, tipo, t_s, x_mm, ..., n, arquivo, linha }.
export function parseMapFile(texto, nome = "arquivo") {
  const avisos = [];
  const metadadosBrutos = {};
  const linhas = [];
  let colunas = null;
  let indices = null;

  const conteudo = texto.replace(/^﻿/, "").split(/\r?\n/);
  conteudo.forEach((bruta, posicao) => {
    const numeroDaLinha = posicao + 1;
    const linha = bruta.trim();
    if (linha === "") return;
    if (linha.startsWith("#")) {
      // Metadados só no topo, antes do cabeçalho; depois disso é comentário.
      if (colunas) return;
      const par = parseMetadataLine(linha);
      if (par) metadadosBrutos[par.chave] = par.valor;
      return;
    }
    const campos = linha.split(",").map((campo) => campo.trim());
    if (!colunas) {
      colunas = campos;
      indices = Object.fromEntries(COLUNAS.map((coluna) => [coluna, campos.indexOf(coluna)]));
      return;
    }
    if (campos.length !== colunas.length) {
      avisos.push(`${nome}, linha ${numeroDaLinha}: ${campos.length} campos, esperados ${colunas.length}; linha ignorada.`);
      return;
    }
    const registro = {
      passada: campos[indices.passada].toLowerCase(),
      tipo: campos[indices.tipo].toLowerCase(),
      arquivo: nome,
      linha: numeroDaLinha,
    };
    if (!PASSADAS.includes(registro.passada)) {
      avisos.push(`${nome}, linha ${numeroDaLinha}: passada "${campos[indices.passada]}" desconhecida; linha ignorada.`);
      return;
    }
    if (!TIPOS.includes(registro.tipo)) {
      avisos.push(`${nome}, linha ${numeroDaLinha}: tipo "${campos[indices.tipo]}" desconhecido; linha ignorada.`);
      return;
    }
    for (const coluna of COLUNAS_NUMERICAS) {
      const valor = Number(campos[indices[coluna]]);
      if (campos[indices[coluna]] === "" || !Number.isFinite(valor)) {
        avisos.push(`${nome}, linha ${numeroDaLinha}: "${coluna}" não é um número; linha ignorada.`);
        return;
      }
      registro[coluna] = valor;
    }
    if (registro.n < 1) {
      avisos.push(`${nome}, linha ${numeroDaLinha}: n deve ser pelo menos 1; linha ignorada.`);
      return;
    }
    linhas.push(registro);
  });

  if (!colunas) {
    return { nome, metadados: {}, colunas: [], linhas: [], avisos, erro: `${nome}: nenhum cabeçalho de colunas encontrado.` };
  }
  const faltando = COLUNAS.filter((coluna) => !colunas.includes(coluna));
  if (faltando.length > 0) {
    return {
      nome, metadados: {}, colunas, linhas: [], avisos,
      erro: `${nome}: faltam as colunas ${faltando.join(", ")}; arquivo ignorado.`,
    };
  }
  const extras = colunas.filter((coluna) => !COLUNAS.includes(coluna));
  if (extras.length > 0) {
    avisos.unshift(`${nome}: colunas desconhecidas ignoradas (${extras.join(", ")}).`);
  }
  if (!metadadosBrutos.formato) {
    avisos.unshift(`${nome}: sem a linha "# formato: ${FORMATO}".`);
  } else if (metadadosBrutos.formato !== FORMATO) {
    avisos.unshift(`${nome}: formato "${metadadosBrutos.formato}", esperado "${FORMATO}".`);
  }
  const metadados = normalizeMetadata(metadadosBrutos, avisos, nome);
  return { nome, metadados, colunas, linhas, avisos, erro: null };
}

// Junta arquivos já lidos. Arquivos com erro ficam de fora e o erro vira aviso.
export function mergeMapFiles(arquivos) {
  const avisos = [];
  const metadados = {};
  const origemDoMetadado = {};
  const linhas = [];
  let colunasDeReferencia = null;

  for (const arquivo of arquivos) {
    if (arquivo.erro) {
      avisos.push(arquivo.erro);
      continue;
    }
    avisos.push(...arquivo.avisos);
    if (colunasDeReferencia === null) {
      colunasDeReferencia = arquivo.colunas;
    } else if (arquivo.colunas.join(",") !== colunasDeReferencia.join(",")) {
      avisos.push(`${arquivo.nome}: as colunas não estão na mesma ordem ou não são as mesmas do primeiro arquivo; foram lidas pelo nome.`);
    }
    for (const [chave, valor] of Object.entries(arquivo.metadados)) {
      if (!(chave in metadados)) {
        metadados[chave] = valor;
        origemDoMetadado[chave] = arquivo.nome;
        continue;
      }
      if (METADADOS_DA_MONTAGEM.includes(chave) && metadados[chave] !== valor) {
        avisos.push(
          `Metadado "${chave}" diferente entre arquivos: ${metadados[chave]} (${origemDoMetadado[chave]}) e ${valor} (${arquivo.nome}); mantido o primeiro.`,
        );
      }
    }
    linhas.push(...arquivo.linhas);
  }
  return { metadados, linhas, avisos };
}

function fixed(valor, casas) {
  return Number.isFinite(valor) ? valor.toFixed(casas) : "";
}

// CSV do ΔB processado. pontos: [{ x, y, z, delta: { b, u }, modelo }].
export function formatProcessedCsv(pontos, cabecalho) {
  const linhas = ["# formato: mapa-campo-processado v1"];
  for (const [chave, valor] of Object.entries(cabecalho)) {
    linhas.push(`# ${chave}: ${valor}`);
  }
  const comModelo = pontos.some((ponto) => ponto.modelo);
  const colunas = [
    "x_mm", "y_mm", "z_mm",
    "dbx_uT", "dby_uT", "dbz_uT", "ux_uT", "uy_uT", "uz_uT",
  ];
  if (comModelo) {
    colunas.push("modelo_bx_uT", "modelo_by_uT", "modelo_bz_uT");
  }
  linhas.push(colunas.join(","));
  for (const ponto of pontos) {
    const campos = [
      fixed(ponto.x, 1), fixed(ponto.y, 1), fixed(ponto.z, 1),
      ...ponto.delta.b.map((valor) => fixed(valor, 3)),
      ...ponto.delta.u.map((valor) => fixed(valor, 3)),
    ];
    if (comModelo) {
      campos.push(...(ponto.modelo ?? [NaN, NaN, NaN]).map((valor) => fixed(valor, 3)));
    }
    linhas.push(campos.join(","));
  }
  return `${linhas.join("\n")}\n`;
}
