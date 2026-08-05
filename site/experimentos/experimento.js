import { setupTabs } from "../componentes/abas.js";
import { typesetMath } from "../componentes/matematica.js";

export function setupExperiment(root, printPage = () => globalThis.print()) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const reportIndex = tabs.findIndex(
    (tab) => tab.getAttribute("aria-controls") === "painel-relatorio",
  );
  const printButton = root.querySelector("[data-print-report]");

  if (reportIndex === -1 || !printButton) {
    throw new Error("O experimento precisa de uma aba e de um botão de relatório.");
  }

  const tabController = setupTabs(root);
  printButton.addEventListener("click", async () => {
    tabController.activate(reportIndex);
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
