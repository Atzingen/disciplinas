// Nota de aula do professor. A página publicada é só a porta de entrada: o conteúdo fica no
// serviço de entregas e só chega ao navegador depois do login com uma conta de professor.

import { createApi, readStoredToken, renderGoogleButton, signOut } from "./entregas-api.js";

const ELEMENTOS_ATIVOS = "script, style, iframe, object, embed, link, meta, base, form";
const ATRIBUTOS_DE_ENDERECO = new Set(["href", "src", "xlink:href", "action", "formaction"]);

// A nota é escrita pelo professor e só entra no servidor pela conta de administração: essa é
// a proteção de verdade. Esta limpeza é uma segunda barreira, para um HTML com conteúdo ativo
// não rodar na origem do site, onde está o token do professor. Ela retira os elementos que
// executam ou carregam código, os atributos de evento (onerror, onclick...) e os endereços
// javascript: ou data: que não sejam de imagem.
export function parseSemConteudoAtivo(html) {
  const documento = new DOMParser().parseFromString(html, "text/html");
  documento.querySelectorAll(ELEMENTOS_ATIVOS).forEach((elemento) => elemento.remove());

  for (const elemento of documento.body.querySelectorAll("*")) {
    for (const atributo of [...elemento.attributes]) {
      const nome = atributo.name.toLowerCase();
      const valor = atributo.value.replace(/\s+/g, "").toLowerCase();
      const eEvento = nome.startsWith("on");
      const enderecoPerigoso =
        ATRIBUTOS_DE_ENDERECO.has(nome) &&
        (/^(javascript|vbscript):/.test(valor) ||
          (valor.startsWith("data:") && !valor.startsWith("data:image/")));
      if (eEvento || enderecoPerigoso || nome === "srcdoc") {
        elemento.removeAttribute(atributo.name);
      }
    }
  }
  return [...documento.body.childNodes];
}

// O que dizer na porta de entrada para cada resposta do serviço. No 401 vale a explicação do
// próprio serviço (token recusado, conta sem e-mail verificado...).
export function gateMessage(error) {
  if (error.status === 403) {
    return "Esta conta não é de professor. Entre com a conta de professor.";
  }
  if (error.status === 404) {
    return "A nota desta aula ainda não está no servidor.";
  }
  return error.message;
}

export async function mountLessonNotes(root, { config, lesson, afterRender = () => {} }) {
  const api = createApi(config.apiUrl);
  const gate = root.querySelector("[data-nota-portao]");
  const message = root.querySelector("[data-nota-mensagem]");
  const account = root.querySelector("[data-nota-conta]");
  const content = root.querySelector("[data-nota-conteudo]");

  // Cada entrada e cada saída ganham um número. Resposta de uma tentativa antiga (por exemplo,
  // uma que chega depois de o professor sair) é descartada.
  let tentativaAtual = 0;

  function showGate(text = "") {
    account.hidden = true;
    content.hidden = true;
    content.replaceChildren();
    gate.hidden = false;
    message.textContent = text;
    renderGoogleButton(root.querySelector("[data-google-button]"), config.googleClientId, open).catch(
      (error) => {
        message.textContent = error.message;
      },
    );
  }

  async function open() {
    tentativaAtual += 1;
    const estaTentativa = tentativaAtual;

    let html;
    try {
      html = await api.text(`/notas-de-aula/${lesson}`);
    } catch (error) {
      if (estaTentativa !== tentativaAtual) {
        return;
      }
      if (error.status === 401 || error.status === 403) {
        signOut();
      }
      showGate(gateMessage(error));
      return;
    }
    if (estaTentativa !== tentativaAtual) {
      return;
    }

    content.replaceChildren(...parseSemConteudoAtivo(html));
    gate.hidden = true;
    account.hidden = false;
    content.hidden = false;
    // Fora do try: uma falha ao desenhar as fórmulas não pode apagar a nota já carregada.
    afterRender(content);
  }

  root.querySelector("[data-nota-sair]").addEventListener("click", () => {
    tentativaAtual += 1;
    signOut();
    showGate();
  });

  if (readStoredToken()) {
    await open();
  } else {
    showGate();
  }
}
