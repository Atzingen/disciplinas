import "../exercicio-estatico.js";
import { mountForceLocus } from "./visualizacao.js";

globalThis.lessonControllers = {
  forceLocus: mountForceLocus(document.querySelector("[data-force-locus]")),
};
