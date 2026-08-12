import "../exercicio-estatico.js";
import { mountChargedPendulum } from "./visualizacao.js";

globalThis.lessonControllers = {
  chargedPendulum: mountChargedPendulum(
    document.querySelector("[data-charged-pendulum]"),
  ),
};
