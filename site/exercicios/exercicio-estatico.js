import { mountSectionNav } from "../componentes/navegacao-secoes.js";

const navRoot = document.querySelector("[data-section-nav]");

if (navRoot) {
  mountSectionNav(navRoot);
}
