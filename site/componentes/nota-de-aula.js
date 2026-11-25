// Nota de aula do professor. A página publicada é só a porta de entrada: o conteúdo fica no
// serviço de entregas e só chega ao navegador depois do login com uma conta de professor.

import { createApi, readStoredToken, renderGoogleButton, signOut } from "./entregas-api.js";

// O que dizer na porta de entrada para cada resposta do serviço.
export function gateMessage(error) {
  if (error.status === 401) {
    return "O login expirou. Entre de novo.";
  }
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
    try {
      const html = await api.text(`/notas-de-aula/${lesson}`);
      // O HTML é escrito pelo próprio professor e vem do serviço autenticado. Inserido assim,
      // nenhum <script> que ele contenha é executado.
      content.innerHTML = html;
      gate.hidden = true;
      account.hidden = false;
      content.hidden = false;
      afterRender(content);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        signOut();
      }
      showGate(gateMessage(error));
    }
  }

  root.querySelector("[data-nota-sair]").addEventListener("click", () => {
    signOut();
    showGate();
  });

  if (readStoredToken()) {
    await open();
  } else {
    showGate();
  }
}
