export function buildMainNavigation(rootPath = "./", activeSection = "inicio") {
  return [
    {
      id: "inicio",
      label: "Início",
      href: rootPath,
      current: activeSection === "inicio",
    },
    {
      id: "exercicios",
      label: "Exercícios",
      href: `${rootPath}exercicios/`,
      current: activeSection === "exercicios",
    },
    {
      id: "experimentos",
      label: "Experimentos",
      href: `${rootPath}experimentos/`,
      current: activeSection === "experimentos",
    },
    {
      id: "simulacoes",
      label: "Simulações",
      href: `${rootPath}simuladores/`,
      current: activeSection === "simulacoes",
    },
  ];
}

export function mountMainNavigation(root) {
  if (!root) {
    return;
  }

  const nav = document.createElement("nav");
  nav.className = "site-navigation";
  nav.setAttribute("aria-label", "Áreas do acervo");

  const list = document.createElement("ul");
  for (const item of buildMainNavigation(
    root.dataset.rootPath,
    root.dataset.activeSection,
  )) {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (item.current) {
      link.setAttribute("aria-current", "page");
    }
    listItem.append(link);
    list.append(listItem);
  }

  nav.append(list);
  root.replaceChildren(nav);
}

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-site-navigation]")) {
    mountMainNavigation(root);
  }
}
