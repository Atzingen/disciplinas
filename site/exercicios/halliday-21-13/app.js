import { setupTabs } from "../../componentes/abas.js";
import "../../componentes/matematica.js";
import { mountChargeSimulator } from "../../componentes/simulador-cargas.js";
import { HALLIDAY_PRESET } from "./preset.js";

const tabs = setupTabs(document.querySelector("[data-tabs]"));
const chargeSimulator = mountChargeSimulator(
  document.querySelector("[data-halliday-simulator]"),
  HALLIDAY_PRESET,
);

globalThis.lessonControllers = {
  tabs,
  chargeSimulator,
};
