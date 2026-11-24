import { setupTabs } from "../componentes/abas.js";
import { typesetMath } from "../componentes/matematica.js";
import { loadAcademicReport } from "../componentes/relatorio-markdown.js";

// Folga entre a barra fixa e o início da parte quando a página rola até ela.
const SCROLL_GAP_PX = 16;

export function setupExperiment(
  root,
  printPage = () => globalThis.print(),
  loadReport = loadAcademicReport,
) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const reportIndex = tabs.findIndex(
    (tab) => tab.getAttribute("aria-controls") === "painel-relatorio",
  );
  const printButton = root.querySelector("[data-print-report]");
  const reportDocument = root.querySelector("[data-markdown-report]");

  if (reportIndex === -1 || !printButton) {
    throw new Error("O experimento precisa de uma aba e de um botão de relatório.");
  }

  // Cada aba é uma parte do roteiro, com endereço próprio: painel-fundamentos vira #fundamentos.
  const parts = tabs.map((tab) => {
    const panelId = tab.getAttribute("aria-controls");
    return {
      name: tab.textContent.trim(),
      anchor: panelId.replace(/^painel-/, ""),
      panel: root.querySelector("#" + panelId),
    };
  });
  const topbar = root.querySelector("[data-topbar]");
  const defaultIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
  );

  function indexFromAddress() {
    return parts.findIndex((part) => "#" + part.anchor === window.location.hash);
  }

  function updateAddress(index, mode) {
    const address = "#" + parts[index].anchor;
    if (window.location.hash === address) return;
    if (mode === "push") {
      // A entrada que fica para trás guarda onde o aluno estava; followAddress devolve a esse ponto.
      window.history.replaceState({ scrollY: window.scrollY }, "");
      window.history.pushState(null, "", address);
    } else {
      window.history.replaceState(null, "", address);
    }
  }

  // Sem "always", só rola quando o início da parte ficou escondido acima da barra fixa.
  function scrollToPart(index, always = false) {
    const topbarBottom = topbar.getBoundingClientRect().bottom;
    const panelTop = parts[index].panel.getBoundingClientRect().top;
    if (!always && panelTop >= topbarBottom) return;
    window.scrollTo({
      top: window.scrollY + panelTop - topbarBottom - SCROLL_GAP_PX,
      behavior: "instant",
    });
  }

  tabs.forEach((tab, index) => {
    const number = document.createElement("span");
    number.className = "experiment-tab__number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(index + 1);
    tab.prepend(number);
  });

  const progressCount = document.createElement("span");
  const progressName = document.createElement("strong");
  const progress = document.createElement("p");
  progress.className = "experiment-progress";
  progress.append(progressCount, " · ", progressName);

  const tabList = root.querySelector('[role="tablist"]');
  const stepper = document.createElement("div");
  stepper.className = "experiment-stepper";
  tabList.before(stepper);
  stepper.append(progress, tabList);

  function showProgress(index) {
    tabs[index].setAttribute("data-visitada", "");
    progressCount.textContent = `Parte ${index + 1} de ${parts.length}`;
    progressName.textContent = parts[index].name;
    // Em tela estreita os passos rolam na horizontal: traz o atual para a vista.
    const listBox = tabList.getBoundingClientRect();
    const tabBox = tabs[index].getBoundingClientRect();
    if (tabBox.left < listBox.left || tabBox.right > listBox.right) {
      tabList.scrollLeft += tabBox.left - listBox.left - SCROLL_GAP_PX;
    }
  }

  // O endereço muda antes da troca de parte, para guardar a rolagem antes que a parte nova
  // (às vezes mais curta) encurte a página. Por isso este clique é registrado antes do de
  // setupTabs, que faz a troca.
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => updateAddress(index, "push"));
  });

  const addressIndex = indexFromAddress();
  const tabController = setupTabs(root, {
    initialIndex: addressIndex === -1 ? undefined : addressIndex,
    onActivate(index, origin) {
      showProgress(index);
      // Percorrer as abas com as setas só troca o endereço, sem empilhar histórico.
      if (origin === "keyboard") {
        updateAddress(index, "replace");
      }
      if (origin === "click" || origin === "keyboard") {
        scrollToPart(index);
      }
    },
  });

  function goToPart(index) {
    updateAddress(index, "push");
    tabController.activate(index);
    parts[index].panel.focus({ preventScroll: true });
    scrollToPart(index);
  }

  function buildPartLink(index, direction) {
    const link = document.createElement("a");
    link.className = `experiment-part-link experiment-part-link--${direction}`;
    link.href = "#" + parts[index].anchor;
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    if (direction === "anterior") {
      arrow.textContent = "←";
      label.textContent = `Anterior: ${parts[index].name}`;
      link.append(arrow, label);
    } else {
      arrow.textContent = "→";
      label.textContent = `Próxima: ${parts[index].name}`;
      link.append(label, arrow);
    }
    link.addEventListener("click", (event) => {
      // Ctrl, Shift ou Cmd mantêm o comportamento do navegador (abrir em outra aba ou janela).
      if (event.ctrlKey || event.shiftKey || event.metaKey) return;
      event.preventDefault();
      goToPart(index);
    });
    return link;
  }

  function buildPartNavigation(index, position) {
    const navigation = document.createElement("nav");
    navigation.className = `experiment-part-nav experiment-part-nav--${position}`;
    navigation.setAttribute(
      "aria-label",
      position === "topo" ? "Partes vizinhas" : "Continuar o roteiro",
    );
    if (index > 0) {
      navigation.append(buildPartLink(index - 1, "anterior"));
    }
    if (index < parts.length - 1) {
      navigation.append(buildPartLink(index + 1, "proxima"));
    }
    return navigation;
  }

  parts.forEach((part, index) => {
    part.panel.prepend(buildPartNavigation(index, "topo"));
    part.panel.append(buildPartNavigation(index, "fim"));
  });

  // Voltar e avançar do navegador, ou um #endereço digitado, trocam a parte visível.
  // O navegador restaura a rolagem antes do popstate, com a parte antiga ainda na tela e a
  // página de outra altura; por isso a rolagem guardada é reaplicada aqui, depois da troca.
  function followAddress() {
    const index = window.location.hash === "" ? defaultIndex : indexFromAddress();
    if (index === -1 || tabs[index].getAttribute("aria-selected") === "true") return;
    tabController.activate(index);
    const savedScroll = window.history.state?.scrollY;
    if (typeof savedScroll === "number") {
      window.scrollTo({ top: savedScroll, behavior: "instant" });
    } else {
      scrollToPart(index);
    }
  }
  window.addEventListener("popstate", followAddress);
  window.addEventListener("hashchange", followAddress);

  // Aberta com #endereço, a página desce direto até o início daquela parte. As fontes chegam
  // depois e mudam a altura do cabeçalho; no load a posição é refeita, se o aluno não rolou.
  if (addressIndex !== -1) {
    scrollToPart(addressIndex, true);
    const scrolledTo = window.scrollY;
    window.addEventListener(
      "load",
      () => {
        if (window.scrollY === scrolledTo) scrollToPart(addressIndex, true);
      },
      { once: true },
    );
  }

  const reportReady = reportDocument
    ? Promise.resolve().then(() => loadReport(reportDocument))
    : Promise.resolve(false);
  printButton.addEventListener("click", async () => {
    tabController.activate(reportIndex);
    await reportReady;
    await typesetMath(root);
    printPage();
  });

  return tabController;
}

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-experiment-tabs]")) {
    setupExperiment(root);
  }
}
