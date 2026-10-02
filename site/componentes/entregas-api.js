// Acesso ao serviço de entregas: chamadas autenticadas, token da sessão e botão do Google.

import { errorMessage, tokenIsFresh } from "./entregas-modelo.js";

const TOKEN_KEY = "entregas-token";
const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

// O token fica só na aba (sessionStorage) e é descartado quando vence.
export function readStoredToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token && tokenIsFresh(token)) {
      return token;
    }
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // sem armazenamento disponível: o aluno entra de novo a cada página
  }
  return null;
}

export function storeToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // idem
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // idem
  }
}

export function createApi(apiUrl) {
  async function request(method, path, { json, form } = {}) {
    const headers = {};
    const token = readStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (json !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let response;
    try {
      response = await fetch(`${apiUrl}${path}`, {
        method,
        headers,
        body: json !== undefined ? JSON.stringify(json) : form,
      });
    } catch {
      throw Object.assign(
        new Error("Não foi possível falar com o serviço de entregas. Confira a conexão."),
        { status: 0 },
      );
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw Object.assign(new Error(errorMessage(body)), { status: response.status });
    }
    return response;
  }

  async function requestJson(method, path, options) {
    const response = await request(method, path, options);
    return response.status === 204 ? null : response.json();
  }

  // O download precisa do cabeçalho Authorization, que um link comum não envia.
  async function download(path, fileName) {
    const response = await request("GET", path);
    const url = URL.createObjectURL(await response.blob());
    const link = element("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return {
    get: (path) => requestJson("GET", path),
    post: (path, json) => requestJson("POST", path, { json }),
    put: (path, json) => requestJson("PUT", path, { json }),
    patch: (path, json) => requestJson("PATCH", path, { json }),
    remove: (path) => requestJson("DELETE", path),
    upload: (path, form) => requestJson("POST", path, { form }),
    download,
  };
}

let googleIdentityLoading;
let credentialHandler = () => {};

function loadGoogleIdentity(clientId) {
  googleIdentityLoading ??= new Promise((resolve, reject) => {
    const script = element("script");
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.onload = () => {
      globalThis.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => credentialHandler(response.credential),
      });
      resolve(globalThis.google.accounts.id);
    };
    script.onerror = () =>
      reject(new Error("Não foi possível carregar o login do Google."));
    document.head.append(script);
  });
  return googleIdentityLoading;
}

export async function renderGoogleButton(container, clientId, onToken) {
  const googleIdentity = await loadGoogleIdentity(clientId);
  credentialHandler = (token) => {
    storeToken(token);
    onToken(token);
  };
  container.replaceChildren();
  googleIdentity.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "pill",
    locale: "pt-BR",
  });
}

export function signOut() {
  clearToken();
  globalThis.google?.accounts.id.disableAutoSelect();
}
