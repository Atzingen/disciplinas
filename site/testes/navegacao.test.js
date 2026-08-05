import assert from "node:assert/strict";
import test from "node:test";

let navigation = {};

try {
  navigation = await import("../componentes/navegacao-principal.js");
} catch {
  navigation = {};
}

test("navegação principal resolve as quatro áreas a partir da raiz informada", () => {
  assert.equal(typeof navigation.buildMainNavigation, "function");
  assert.deepEqual(navigation.buildMainNavigation("../../", "exercicios"), [
    { id: "inicio", label: "Início", href: "../../", current: false },
    {
      id: "exercicios",
      label: "Exercícios",
      href: "../../exercicios/",
      current: true,
    },
    {
      id: "experimentos",
      label: "Experimentos",
      href: "../../experimentos/",
      current: false,
    },
    {
      id: "simulacoes",
      label: "Simulações",
      href: "../../simuladores/",
      current: false,
    },
  ]);
});

test("somente a área ativa recebe estado atual", () => {
  const links = navigation.buildMainNavigation("../", "experimentos");
  assert.deepEqual(
    links.filter((link) => link.current).map((link) => link.id),
    ["experimentos"],
  );
});
