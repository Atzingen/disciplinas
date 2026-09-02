export function buildMainNavigation(rootPath = "./", activeSection = "inicio") {
  const disciplines = [
    {
      id: "prcfemg",
      label: "PRCFEMG — Fundamentos do Eletromagnetismo",
      href: `${rootPath}disciplinas/prcfemg/`,
      current: ["prcfemg", "exercicios", "simulacoes"].includes(
        activeSection,
      ),
    },
    {
      id: "prclfbe",
      label: "PRCLFBE — Laboratório de Física Básica: Eletromagnetismo",
      href: `${rootPath}disciplinas/prclfbe/`,
      current: ["prclfbe", "experimentos"].includes(activeSection),
    },
  ];

  return [
    {
      id: "inicio",
      label: "Início",
      href: rootPath,
      current: activeSection === "inicio",
    },
    {
      id: "disciplinas",
      label: "Disciplinas",
      current: disciplines.some((discipline) => discipline.current),
      children: disciplines,
    },
    {
      id: "sobre",
      label: "Sobre",
      href: `${rootPath}#sobre`,
      current: activeSection === "sobre",
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
  nav.setAttribute("aria-label", "Navegação principal");

  const list = document.createElement("ul");
  list.className = "site-navigation__list";
  for (const item of buildMainNavigation(
    root.dataset.rootPath,
    root.dataset.activeSection,
  )) {
    const listItem = document.createElement("li");
    listItem.className = "site-navigation__item";

    if (item.children) {
      listItem.classList.add("site-navigation__item--dropdown");
      const details = document.createElement("details");
      details.className = "site-navigation__dropdown";

      const summary = document.createElement("summary");
      summary.className = "site-navigation__summary";
      summary.textContent = item.label;
      if (item.current) {
        summary.setAttribute("aria-current", "page");
      }

      const submenu = document.createElement("ul");
      submenu.className = "site-navigation__submenu";
      for (const child of item.children) {
        const childItem = document.createElement("li");
        const childLink = document.createElement("a");
        childLink.href = child.href;
        childLink.textContent = child.label;
        if (child.current) {
          childLink.setAttribute("aria-current", "page");
        }
        childItem.append(childLink);
        submenu.append(childItem);
      }

      details.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && details.open) {
          details.open = false;
          summary.focus();
        }
      });
      document.addEventListener("click", (event) => {
        if (details.open && !details.contains(event.target)) {
          details.open = false;
        }
      });

      details.append(summary, submenu);
      listItem.append(details);
      list.append(listItem);
      continue;
    }

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
