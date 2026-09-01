import { typesetMath } from "./matematica.js";

export function setupExampleReport(
  root = globalThis.document,
  printPage = () => globalThis.print(),
  renderMath = typesetMath,
) {
  const printButton = root?.querySelector?.("[data-print-example]");
  const reportRoot = root?.querySelector?.("#relatorio") ?? root?.body;
  const mathReady = Promise.resolve()
    .then(() => renderMath(reportRoot))
    .catch(() => false)
    .finally(() => {
      root?.documentElement?.setAttribute?.("data-report-math-ready", "true");
    });

  if (!printButton) return false;

  printButton.addEventListener("click", async () => {
    await mathReady;
    printPage();
  });
  return true;
}

if (typeof document !== "undefined") {
  setupExampleReport(document);
}
