import { mountSectionNav } from "../../componentes/navegacao-secoes.js";
import "../../componentes/matematica.js";
import { mountChargeSimulator } from "../../componentes/simulador-cargas.js";
import { HALLIDAY_PRESET } from "./preset.js";
import { mountEquilibriumGeometry } from "./visualizacao.js";

const sectionNav = mountSectionNav(document.querySelector("[data-section-nav]"));
const equilibriumGeometry = mountEquilibriumGeometry(
  document.querySelector("[data-didactic-visualization]"),
);
const chargeSimulator = mountChargeSimulator(
  document.querySelector("[data-halliday-simulator]"),
  HALLIDAY_PRESET,
);

globalThis.lessonControllers = {
  sectionNav,
  chargeSimulator,
  equilibriumGeometry,
};
