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

export const THEME_KEY = "tema";

export function nextTheme(current) {
  return current === "escuro" ? "claro" : "escuro";
}

export function storedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function applyTheme(theme) {
  const chosen = theme === "escuro" ? "escuro" : "claro";
  if (chosen === "escuro") {
    document.documentElement.dataset.theme = "escuro";
  } else {
    delete document.documentElement.dataset.theme;
  }
  try {
    localStorage.setItem(THEME_KEY, chosen);
  } catch {
    /* navegação privativa: a escolha vale só para esta página */
  }
  return chosen;
}

function createThemeToggle() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.dataset.themeToggle = "";

  const mark = document.createElement("span");
  mark.className = "theme-toggle__mark";
  mark.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = "theme-toggle__label";
  button.append(mark, label);

  function refresh(theme) {
    const escuro = theme === "escuro";
    mark.textContent = escuro ? "☀" : "☾";
    label.textContent = escuro ? "Tema claro" : "Tema escuro";
    button.setAttribute(
      "aria-label",
      escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro",
    );
    button.setAttribute("aria-pressed", String(escuro));
  }

  refresh(document.documentElement.dataset.theme ?? "claro");
  button.addEventListener("click", () => {
    refresh(applyTheme(nextTheme(document.documentElement.dataset.theme ?? "claro")));
  });

  return button;
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
  root.replaceChildren(nav, createThemeToggle());
}

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-site-navigation]")) {
    mountMainNavigation(root);
  }
}
