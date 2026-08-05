import { setupTabs } from "../componentes/abas.js";
import "../componentes/matematica.js";

const tabsRoot = document.querySelector("[data-tabs]");

if (tabsRoot) {
  setupTabs(tabsRoot);
}
