import { setupTabs } from "../componentes/abas.js";

const tabsRoot = document.querySelector("[data-tabs]");

if (tabsRoot) {
  setupTabs(tabsRoot);
}
