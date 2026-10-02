// Área do professor: turmas, lista de permitidos, atividades e entregas recebidas.

import {
  createApi,
  element,
  readStoredToken,
  renderGoogleButton,
  signOut,
} from "./entregas-api.js";
import {
  countLabel,
  describeAcceptedFiles,
  formatMoment,
  formatSize,
  memberNames,
} from "./entregas-modelo.js";

function actionButton(label, onClick, className = "submission-link-button") {
  const button = element("button", className, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

export async function mountTeacherArea(root, { config }) {
  const api = createApi(config.apiUrl);
  const find = (selector) => root.querySelector(selector);

  const gate = find("[data-teacher-gate]");
  const gateMessage = find("[data-gate-message]");
  const app = find("[data-teacher-app]");
  const message = find("[data-teacher-message]");
  const classList = find("[data-class-list]");
  const classPanel = find("[data-class-panel]");
  const rosterForm = find("[data-roster-form]");
  const activityList = find("[data-activity-list]");
  const activityDialog = find("[data-activity-dialog]");
  const activityForm = find("[data-activity-form]");
  const deliveriesPanel = find("[data-deliveries-panel]");

  const state = { classes: [], selectedClass: null, editingActivity: null };

  // Toda ação passa por aqui: mostra o erro do serviço em vez de falhar em silêncio.
  async function attempt(action) {
    message.textContent = "";
    try {
      await action();
    } catch (error) {
      if (error.status === 401) {
        signOut();
        showGate("O login expirou. Entre de novo.");
        return;
      }
      message.textContent = error.message;
    }
  }

  function showGate(text = "") {
    app.hidden = true;
    gate.hidden = false;
    gateMessage.textContent = text;
    renderGoogleButton(find("[data-google-button]"), config.googleClientId, enter).catch(
      (error) => {
        gateMessage.textContent = error.message;
      },
    );
  }

  async function enter() {
    try {
      const me = await api.get("/eu");
      if (!me.professor) {
        signOut();
        showGate(`A conta ${me.email} não é de professor desta área.`);
        return;
      }
      find("[data-teacher-name]").textContent = me.nome;
      gate.hidden = true;
      app.hidden = false;
      await loadClasses();
    } catch (error) {
      signOut();
      showGate(error.message);
    }
  }

  async function loadClasses() {
    state.classes = await api.get("/turmas");
    classList.replaceChildren();
    if (state.classes.length === 0) {
      classList.append(element("p", "submission-empty", "Nenhuma turma criada ainda."));
    }
    for (const turma of state.classes) {
      const button = actionButton(
        `${turma.disciplina} · ${turma.semestre}`,
        () => attempt(() => selectClass(turma)),
        "teacher-class",
      );
      button.append(
        element(
          "small",
          "",
          `${countLabel(turma.alunos, "aluno", "alunos")} · ${countLabel(turma.atividades, "atividade", "atividades")}`,
        ),
      );
      button.setAttribute("aria-pressed", String(state.selectedClass?.id === turma.id));
      classList.append(button);
    }
  }

  async function selectClass(turma) {
    state.selectedClass = turma;
    deliveriesPanel.hidden = true;
    classPanel.hidden = false;
    find("[data-class-name]").textContent = `${turma.disciplina} · ${turma.semestre}`;
    find("[data-roster-result]").textContent = "";
    await Promise.all([loadClasses(), loadRoster(), loadActivities()]);
  }

  async function loadRoster() {
    const roster = await api.get(`/turmas/${state.selectedClass.id}/matriculas`);
    find("[data-roster-summary]").textContent =
      roster.length === 0
        ? "A lista está vazia: ninguém consegue enviar ainda."
        : `${countLabel(roster.length, "aluno pode", "alunos podem")} enviar.`;
    const items = roster.map((student) =>
      element("li", "", `${student.nome} — ${student.email}`),
    );
    find("[data-roster-list]").replaceChildren(...items);
  }

  async function loadActivities() {
    const activities = await api.get(`/turmas/${state.selectedClass.id}/atividades`);
    activityList.replaceChildren();
    if (activities.length === 0) {
      activityList.append(element("p", "submission-empty", "Nenhuma atividade criada."));
    }
    for (const activity of activities) {
      const card = element("article", "submission-card");
      const header = element("header", "submission-card__header");
      header.append(
        element("h3", "submission-card__title", activity.titulo),
        element(
          "span",
          `submission-status submission-status--${activity.aberta ? "open" : "closed"}`,
          activity.aberta ? "Aberta" : "Encerrada",
        ),
      );
      const summary = element(
        "p",
        "submission-card__description",
        [
          `Prazo: ${formatMoment(activity.prazo)}`,
          activity.em_grupo ? "Em grupo" : "Individual",
          describeAcceptedFiles(activity),
          countLabel(activity.entregas, "entrega", "entregas"),
        ].join(" · "),
      );
      const actions = element("div", "teacher-actions");
      actions.append(
        actionButton("Ver entregas", () => attempt(() => showDeliveries(activity))),
        actionButton("Editar", () => openActivityDialog(activity)),
        actionButton(activity.aberta ? "Encerrar" : "Reabrir", () =>
          attempt(async () => {
            await api.patch(`/atividades/${activity.id}`, { aberta: !activity.aberta });
            await loadActivities();
          }),
        ),
        actionButton("Apagar", () =>
          attempt(async () => {
            const sure = confirm(
              `Apagar a atividade "${activity.titulo}" com todas as entregas e arquivos?`,
            );
            if (sure) {
              await api.remove(`/atividades/${activity.id}`);
              deliveriesPanel.hidden = true;
              await Promise.all([loadActivities(), loadClasses()]);
            }
          }),
        ),
      );
      card.append(header, summary, actions);
      activityList.append(card);
    }
  }

  function deliveryRow(delivery) {
    const row = element("tr");
    const files = element("td");
    for (const file of delivery.arquivos) {
      files.append(
        actionButton(`${file.nome} (${formatSize(file.tamanho)})`, () =>
          attempt(() => api.download(`/arquivos/${file.id}`, file.nome)),
        ),
      );
    }
    row.append(
      element("td", "", memberNames(delivery)),
      element("td", "", formatMoment(delivery.enviada_em)),
      element("td", "", delivery.atrasada ? "Atrasada" : "No prazo"),
      files,
    );
    return row;
  }

  async function showDeliveries(activity) {
    const body = await api.get(`/atividades/${activity.id}/entregas`);
    const late = body.vigentes.filter((delivery) => delivery.atrasada).length;
    const delivered = body.vigentes.reduce((sum, item) => sum + item.membros.length, 0);
    const total = delivered + body.faltam.length;

    find("[data-deliveries-title]").textContent = activity.titulo;
    find("[data-deliveries-summary]").textContent =
      `${delivered} de ${countLabel(total, "aluno", "alunos")} entregaram · ${countLabel(late, "entrega atrasada", "entregas atrasadas")}.`;
    find("[data-deliveries-body]").replaceChildren(...body.vigentes.map(deliveryRow));
    find("[data-replaced-body]").replaceChildren(...body.substituidas.map(deliveryRow));
    find("[data-replaced-count]").textContent = String(body.substituidas.length);
    find("[data-missing-list]").replaceChildren(
      ...(body.faltam.length === 0
        ? [element("li", "", "Todos entregaram.")]
        : body.faltam.map((student) => element("li", "", `${student.nome} — ${student.email}`))),
    );

    const zipButton = find("[data-download-zip]");
    zipButton.disabled = body.vigentes.length === 0;
    zipButton.onclick = () =>
      attempt(() =>
        api.download(
          `/atividades/${activity.id}/entregas.zip`,
          `${body.turma.disciplina} ${body.turma.semestre} - ${activity.titulo}.zip`,
        ),
      );

    deliveriesPanel.hidden = false;
    deliveriesPanel.scrollIntoView({ block: "start" });
  }

  function openActivityDialog(activity = null) {
    state.editingActivity = activity;
    activityForm.reset();
    find("[data-activity-dialog-title]").textContent = activity
      ? "Editar atividade"
      : "Nova atividade";
    find("[data-activity-error]").textContent = "";
    if (activity) {
      const fields = activityForm.elements;
      fields.titulo.value = activity.titulo;
      fields.descricao.value = activity.descricao;
      fields.prazo_local.value = activity.prazo_local;
      fields.em_grupo.checked = activity.em_grupo;
      fields.extensoes.value = activity.extensoes.join(", ");
      fields.tamanho_max_mb.value = activity.tamanho_max_mb;
      fields.max_arquivos.value = activity.max_arquivos;
      fields.material.value = activity.material;
    }
    activityDialog.showModal();
  }

  activityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fields = activityForm.elements;
    const data = {
      titulo: fields.titulo.value,
      descricao: fields.descricao.value,
      prazo_local: fields.prazo_local.value,
      em_grupo: fields.em_grupo.checked,
      extensoes: fields.extensoes.value.split(",").filter((item) => item.trim() !== ""),
      tamanho_max_mb: Number(fields.tamanho_max_mb.value),
      max_arquivos: Number(fields.max_arquivos.value),
      material: fields.material.value.trim(),
    };
    try {
      if (state.editingActivity) {
        await api.patch(`/atividades/${state.editingActivity.id}`, data);
      } else {
        await api.post(`/turmas/${state.selectedClass.id}/atividades`, data);
      }
      activityDialog.close();
      await Promise.all([loadActivities(), loadClasses()]);
    } catch (error) {
      find("[data-activity-error]").textContent = error.message;
    }
  });

  find("[data-activity-cancel]").addEventListener("click", () => activityDialog.close());
  find("[data-new-activity]").addEventListener("click", () => openActivityDialog());

  find("[data-class-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = event.target.elements;
    attempt(async () => {
      const turma = await api.post("/turmas", {
        disciplina: fields.disciplina.value,
        semestre: fields.semestre.value,
      });
      event.target.reset();
      await selectClass(turma);
    });
  });

  rosterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    attempt(async () => {
      const result = await api.put(`/turmas/${state.selectedClass.id}/matriculas`, {
        texto: rosterForm.elements.texto.value,
      });
      const ignored =
        result.linhas_ignoradas.length === 0
          ? ""
          : ` Linhas ignoradas por não terem e-mail do IFSP (${result.linhas_ignoradas.length}): ${result.linhas_ignoradas.join(" | ")}`;
      find("[data-roster-result]").textContent =
        `Lista atualizada: ${result.entraram} entraram, ${result.sairam} saíram, ${result.permaneceram} permaneceram.${ignored}`;
      rosterForm.reset();
      await Promise.all([loadRoster(), loadClasses()]);
    });
  });

  find("[data-delete-class]").addEventListener("click", () =>
    attempt(async () => {
      const turma = state.selectedClass;
      const sure = confirm(
        `Apagar a turma ${turma.disciplina} ${turma.semestre}? A lista de alunos, as atividades, as entregas e todos os arquivos somem do servidor.`,
      );
      if (sure) {
        await api.remove(`/turmas/${turma.id}`);
        state.selectedClass = null;
        classPanel.hidden = true;
        await loadClasses();
      }
    }),
  );

  find("[data-sign-out]").addEventListener("click", () => {
    signOut();
    showGate();
  });

  if (readStoredToken()) {
    await enter();
  } else {
    showGate();
  }
}
