import { setupTabs } from "../../componentes/abas.js";
import { mountChargeSimulator } from "../../componentes/simulador-cargas.js";
import { mountVectorLabs } from "../../componentes/simulador-vetores.js";
import { GENERIC_PRESET } from "./preset.js";

const tabs = setupTabs(document.querySelector("[data-tabs]"));
const chargeSimulator = mountChargeSimulator(
  document.querySelector("[data-charge-simulator]"),
  GENERIC_PRESET,
);
const vectorLabs = mountVectorLabs({
  sum: document.querySelector("[data-vector-sum]"),
  dot: document.querySelector("[data-vector-dot]"),
  theory: document.querySelector("[data-vector-theory]"),
});

globalThis.lessonControllers = {
  tabs,
  chargeSimulator,
  vectorLabs,
};
