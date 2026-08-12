import "../exercicio-estatico.js";
import { mountQuantizedBalance } from "./visualizacao.js";

globalThis.lessonControllers = {
  quantizedBalance: mountQuantizedBalance(
    document.querySelector("[data-quantized-balance]"),
  ),
};
