import { mountSectionNav } from "../../componentes/navegacao-secoes.js";
import { mountSubstanceExplorer } from "../../componentes/explorador-substancias.js";
import { ATOMIC_NUMBERS } from "../../nucleo/contagem-particulas.js";
import { ELEMENT_COLORS, SUBSTANCES, VOLUME_CM3 } from "./substancias.js";

const sectionNav = mountSectionNav(document.querySelector("[data-section-nav]"));
const substanceExplorer = mountSubstanceExplorer(
  document.querySelector("[data-substance-explorer]"),
  {
    substances: SUBSTANCES,
    volumeCm3: VOLUME_CM3,
    colors: ELEMENT_COLORS,
    atomicNumbers: ATOMIC_NUMBERS,
  },
);

globalThis.lessonControllers = {
  sectionNav,
  substanceExplorer,
};
