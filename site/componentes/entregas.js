// Seção "Entregas" da página de cada disciplina: lista as atividades e recebe os arquivos
// do aluno sem sair da página.

import {
  createApi,
  element,
  readStoredToken,
  renderGoogleButton,
  signOut,
} from "./entregas-api.js";
import {
  activityState,
  describeAcceptedFiles,
  formatMoment,
  formatSize,
  isPastDeadline,
  memberNames,
  validateSelection,
} from "./entregas-modelo.js";

export async function mountSubmissions(root, { config, rootPath = "./" }) {
  const discipline = root.dataset.discipline;
  const list = root.querySelector("[data-submissions-list]");
  const account = root.querySelector("[data-submissions-account]");
  const api = createApi(config.apiUrl);

  const state = {
    activities: [],
    // null enquanto a situação do aluno não é conhecida (sem login ou fora da turma)
    deliveries: null,
    studentName: "",
    notice: "",
  };

  const dialog = element("dialog", "submission-dialog");
  dialog.setAttribute("aria-labelledby", "submission-dialog-title");
  root.append(dialog);

  async function loadDeliveries() {
    state.deliveries = null;
    state.studentName = "";
    if (!readStoredToken()) {
      return "";
    }
    try {
      const body = await api.get(`/disciplinas/${discipline}/minhas-entregas`);
      state.deliveries = new Map(
        body.entregas.map((delivery) => [delivery.atividade_id, delivery]),
      );
      state.studentName = body.nome;
      return "";
    } catch (error) {
      return error.message;
    }
  }

  function renderAccount() {
    account.replaceChildren();
    if (state.deliveries === null) {
      account.textContent = "O login com a conta do IFSP é pedido na hora de enviar.";
      return;
    }
    const leave = element("button", "submission-link-button", "Sair");
    leave.type = "button";
    leave.addEventListener("click", () => {
      signOut();
      state.deliveries = null;
      state.notice = "";
      render();
    });
    account.append(`${state.studentName} · `, leave);
  }

  function renderDelivery(delivery) {
    const box = element("div", "submission-card__delivery");
    const group = delivery.membros.length > 1 ? ` Grupo: ${memberNames(delivery)}.` : "";
    box.append(
      element(
        "p",
        "",
        `Enviada em ${formatMoment(delivery.enviada_em)} por ${delivery.enviada_por}.${group}`,
      ),
    );
    const files = element("ul", "submission-files");
    for (const file of delivery.arquivos) {
      const item = element("li");
      const open = element(
        "button",
        "submission-link-button",
        `${file.nome} (${formatSize(file.tamanho)})`,
      );
      open.type = "button";
      open.addEventListener("click", async () => {
        try {
          await api.download(`/arquivos/${file.id}`, file.nome);
        } catch (error) {
          state.notice = error.message;
          render();
        }
      });
      item.append(open);
      files.append(item);
    }
    box.append(files);
    return box;
  }

  function renderActivity(activity) {
    const delivery = state.deliveries?.get(activity.id) ?? null;
    const signedIn = state.deliveries !== null;
    const status = activityState({ activity, delivery, signedIn });

    const card = element("article", "submission-card");
    card.dataset.tone = status.tone;

    const header = element("header", "submission-card__header");
    header.append(
      element("h3", "submission-card__title", activity.titulo),
      element("span", `submission-status submission-status--${status.tone}`, status.label),
    );
    card.append(header);

    const facts = element("dl", "submission-card__facts");
    for (const [term, value] of [
      ["Prazo", formatMoment(activity.prazo)],
      ["Autoria", activity.em_grupo ? "Em grupo" : "Individual"],
      ["Arquivos", describeAcceptedFiles(activity)],
    ]) {
      const fact = element("div");
      fact.append(element("dt", "", term), element("dd", "", value));
      facts.append(fact);
    }
    card.append(facts);

    if (activity.descricao) {
      card.append(element("p", "submission-card__description", activity.descricao));
    }
    if (activity.material) {
      const material = element("a", "submission-card__material", "Abrir o material desta atividade");
      material.href = `${rootPath}${activity.material}`;
      card.append(material);
    }
    if (delivery) {
      card.append(renderDelivery(delivery));
    }
    if (activity.aberta) {
      const send = element(
        "button",
        "submission-button",
        delivery ? "Enviar nova versão" : "Enviar",
      );
      send.type = "button";
      send.addEventListener("click", () => openDialog(activity));
      card.append(send);
    }
    return card;
  }

  function render() {
    renderAccount();
    list.replaceChildren();
    if (state.notice) {
      list.append(element("p", "submission-notice", state.notice));
    }
    if (state.activities.length === 0) {
      list.append(
        element("p", "submission-empty", "Não há entregas abertas nesta disciplina."),
      );
      return;
    }
    for (const activity of state.activities) {
      list.append(renderActivity(activity));
    }
  }

  function showLogin(activity, body, message) {
    body.replaceChildren(
      element(
        "p",
        "",
        "Entre com a sua conta Google do IFSP (@aluno.ifsp.edu.br) para enviar.",
      ),
    );
    const buttonHolder = element("div", "submission-google");
    const problem = element("p", "submission-error", message);
    problem.setAttribute("role", "alert");
    const privacy = element("p", "submission-hint", "O portal recebe do Google só o seu nome e e-mail. ");
    const privacyLink = element("a", "", "Como os dados são usados");
    privacyLink.href = `${rootPath}entregas/privacidade/`;
    privacy.append(privacyLink, ".");
    body.append(buttonHolder, problem, privacy);

    renderGoogleButton(buttonHolder, config.googleClientId, async () => {
      const refusal = await loadDeliveries();
      render();
      if (refusal) {
        signOut();
        showLogin(activity, body, refusal);
        return;
      }
      await showForm(activity, body);
    }).catch((error) => {
      problem.textContent = error.message;
    });
  }

  async function showForm(activity, body) {
    const delivery = state.deliveries.get(activity.id) ?? null;
    const form = element("form", "submission-form");
    form.noValidate = true;

    if (isPastDeadline(activity)) {
      form.append(
        element(
          "p",
          "submission-warning",
          `O prazo terminou em ${formatMoment(activity.prazo)}. O envio é aceito e fica marcado como atrasado.`,
        ),
      );
    }

    const fileField = element("label", "submission-field");
    const fileInput = element("input");
    fileInput.type = "file";
    fileInput.name = "arquivos";
    fileInput.multiple = activity.max_arquivos > 1;
    fileInput.accept = activity.extensoes.map((extension) => `.${extension}`).join(",");
    fileField.append(
      element("span", "", activity.max_arquivos > 1 ? "Arquivos" : "Arquivo"),
      fileInput,
      element("small", "", describeAcceptedFiles(activity)),
    );
    form.append(fileField);

    const chosenMembers = [];
    if (activity.em_grupo) {
      const classmates = await api.get(`/turmas/${activity.turma_id}/colegas`);
      const currentMembers = new Set(
        (delivery?.membros ?? []).map((member) => member.matricula_id),
      );
      const group = element("fieldset", "submission-group");
      group.append(
        element("legend", "", "Quem faz parte do grupo?"),
        element("p", "", "Você já está incluído. Marque os colegas."),
      );
      for (const classmate of classmates.filter((person) => !person.voce)) {
        const option = element("label", "submission-group__option");
        const checkbox = element("input");
        checkbox.type = "checkbox";
        checkbox.value = String(classmate.id);
        checkbox.checked = currentMembers.has(classmate.id);
        chosenMembers.push(checkbox);
        option.append(checkbox, element("span", "", classmate.nome));
        group.append(option);
      }
      form.append(group);
    }

    if (delivery) {
      form.append(
        element(
          "p",
          "submission-hint",
          `Este envio substitui a entrega de ${formatMoment(delivery.enviada_em)}. A versão anterior continua guardada para o professor.`,
        ),
      );
    }

    const problem = element("p", "submission-error");
    problem.setAttribute("role", "alert");
    const actions = element("div", "submission-dialog__actions");
    const cancel = element("button", "submission-button submission-button--quiet", "Cancelar");
    cancel.type = "button";
    cancel.addEventListener("click", () => dialog.close());
    const submit = element("button", "submission-button", "Enviar");
    submit.type = "submit";
    actions.append(cancel, submit);
    form.append(problem, actions);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const files = [...fileInput.files];
      problem.textContent = validateSelection(files, activity);
      if (problem.textContent) {
        return;
      }
      if (!readStoredToken()) {
        showLogin(activity, body, "O login expirou. Entre de novo para enviar.");
        return;
      }

      const data = new FormData();
      for (const file of files) {
        data.append("arquivos", file);
      }
      for (const checkbox of chosenMembers.filter((item) => item.checked)) {
        data.append("membros", checkbox.value);
      }

      submit.disabled = true;
      submit.textContent = "Enviando…";
      try {
        const sent = await api.upload(`/atividades/${activity.id}/entregas`, data);
        await loadDeliveries();
        state.notice = `Entrega recebida: ${activity.titulo}, em ${formatMoment(sent.enviada_em)}.`;
        dialog.close();
        render();
      } catch (error) {
        problem.textContent = error.message;
        submit.disabled = false;
        submit.textContent = "Enviar";
      }
    });

    body.replaceChildren(form);
    fileInput.focus();
  }

  async function openDialog(activity) {
    const title = element("h3", "submission-dialog__title", activity.titulo);
    title.id = "submission-dialog-title";
    const body = element("div", "submission-dialog__body");
    dialog.replaceChildren(element("p", "eyebrow", "Enviar entrega"), title, body);
    dialog.showModal();

    if (state.deliveries === null) {
      showLogin(activity, body, "");
      return;
    }
    try {
      await showForm(activity, body);
    } catch (error) {
      body.replaceChildren(element("p", "submission-error", error.message));
    }
  }

  try {
    const body = await api.get(`/disciplinas/${discipline}/atividades`);
    state.activities = body.atividades;
    await loadDeliveries();
    render();
  } catch {
    list.replaceChildren(
      element(
        "p",
        "submission-empty",
        "Não foi possível carregar as entregas agora. Tente de novo em instantes.",
      ),
    );
  }
}
