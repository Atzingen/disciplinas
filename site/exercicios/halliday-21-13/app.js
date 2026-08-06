import { mountSectionNav } from "../../componentes/navegacao-secoes.js";
import { mountChargeSimulator } from "../../componentes/simulador-cargas.js";
import { HALLIDAY_PRESET } from "./preset.js";

const sectionNav = mountSectionNav(document.querySelector("[data-section-nav]"));
const chargeSimulator = mountChargeSimulator(
  document.querySelector("[data-halliday-simulator]"),
  HALLIDAY_PRESET,
);

globalThis.lessonControllers = {
  sectionNav,
  chargeSimulator,
};
