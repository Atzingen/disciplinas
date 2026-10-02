// Endereço do serviço de entregas e client ID do Google. São valores públicos: o segredo
// do sistema é a verificação feita no servidor, não estes dados.

const runningLocally = ["localhost", "127.0.0.1"].includes(globalThis.location.hostname);

export const ENTREGAS_CONFIG = {
  apiUrl: runningLocally ? "http://localhost:8100" : "https://entregas.iatzingen.com.br",
  googleClientId: "791313619489-of0rs4ic8ccqd8i8bkcoqjqd8qcnjmp3.apps.googleusercontent.com",
};
