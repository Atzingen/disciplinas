import { setupTabs } from "../../componentes/abas.js";
import { mountPotentialSimulator } from "../../componentes/simulador-potencial.js";

const tabs = setupTabs(document.querySelector("[data-tabs]"));
const simulator = mountPotentialSimulator(
  document.querySelector("[data-cuba-potential-simulator]"),
);

globalThis.lessonControllers = { tabs, simulator };
