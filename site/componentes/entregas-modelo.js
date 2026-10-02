// Regras de apresentação das entregas: sem DOM e sem rede, para rodar também nos testes.

const CAMPUS_TIME_ZONE = "America/Sao_Paulo";
const BYTES_PER_MB = 1024 * 1024;
const TOKEN_SAFETY_MARGIN_MS = 60_000;

const momentFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: CAMPUS_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const listFormatter = new Intl.ListFormat("pt-BR", {
  style: "long",
  type: "conjunction",
});

// O prazo vale no horário do câmpus, qualquer que seja o fuso do computador do aluno.
export function formatMoment(isoMoment) {
  const parts = Object.fromEntries(
    momentFormatter
      .formatToParts(new Date(isoMoment))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute}`;
}

export function formatSize(bytes) {
  if (bytes >= BYTES_PER_MB) {
    return `${(bytes / BYTES_PER_MB).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("pt-BR")} kB`;
}

export function countLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function memberNames(delivery) {
  return listFormatter.format(delivery.membros.map((member) => member.nome));
}

export function describeAcceptedFiles(activity) {
  const types = activity.extensoes.map((extension) => extension.toUpperCase()).join(", ");
  const count =
    activity.max_arquivos === 1 ? "1 arquivo" : `até ${activity.max_arquivos} arquivos`;
  return `${types} · até ${activity.tamanho_max_mb} MB cada · ${count}`;
}

// O serviço responde { detail: "mensagem" }; erros de validação vêm como lista de objetos.
export function errorMessage(body, fallback = "Não foi possível concluir. Tente de novo.") {
  const detail = body?.detail;
  if (typeof detail === "string" && detail !== "") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg ?? String(item)).join(" ");
  }
  return fallback;
}

export function decodeTokenPayload(token) {
  try {
    const payload = token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    const bytes = Uint8Array.from(atob(payload), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

// O token do Google vale uma hora. A margem evita começar um envio que venceria no caminho.
export function tokenIsFresh(token, nowMs = Date.now()) {
  const expiresAt = decodeTokenPayload(token ?? "")?.exp;
  return typeof expiresAt === "number" && expiresAt * 1000 - TOKEN_SAFETY_MARGIN_MS > nowMs;
}

export function isPastDeadline(activity, now = new Date()) {
  return now > new Date(activity.prazo);
}

// delivery: a entrega vigente do aluno, ou null. signedIn: se a situação do aluno é conhecida.
export function activityState({ activity, delivery, signedIn, now = new Date() }) {
  if (delivery) {
    return delivery.atrasada
      ? { label: "Entregue com atraso", tone: "late" }
      : { label: "Entregue", tone: "done" };
  }
  if (!activity.aberta) {
    return { label: "Encerrada", tone: "closed" };
  }
  if (isPastDeadline(activity, now)) {
    return {
      label: signedIn ? "Não entregue · prazo vencido" : "Prazo vencido",
      tone: "late",
    };
  }
  return { label: signedIn ? "Não entregue" : "Aberta", tone: "open" };
}

// Confere a seleção antes do envio, para o aluno não esperar o upload de algo que será recusado.
export function validateSelection(files, activity) {
  if (files.length === 0) {
    return "Escolha o arquivo para enviar.";
  }
  if (files.length > activity.max_arquivos) {
    return activity.max_arquivos === 1
      ? "Esta atividade aceita um único arquivo por envio."
      : `Esta atividade aceita no máximo ${activity.max_arquivos} arquivos por envio.`;
  }
  for (const file of files) {
    const extension = file.name.includes(".")
      ? file.name.split(".").pop().toLowerCase()
      : "";
    if (!activity.extensoes.includes(extension)) {
      return `O arquivo ${file.name} não é aceito. Tipos aceitos: ${activity.extensoes.join(", ")}.`;
    }
    if (file.size === 0) {
      return `O arquivo ${file.name} está vazio.`;
    }
    if (file.size > activity.tamanho_max_mb * BYTES_PER_MB) {
      return `O arquivo ${file.name} passa do limite de ${activity.tamanho_max_mb} MB.`;
    }
  }
  return "";
}
