export function normalizeSearchText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function searchableText(item) {
  return normalizeSearchText(
    [
      item.title,
      item.theme,
      item.description,
      item.reference,
      item.chapter,
      ...(item.tags ?? []),
    ].join(" "),
  );
}

export function itemDisciplines(item) {
  if (Array.isArray(item.disciplines)) {
    return item.disciplines;
  }
  return item.discipline ? [item.discipline] : [];
}

export function filterCatalog(items, query = "", type = "todos", scope = {}) {
  if (!Array.isArray(items)) {
    throw new TypeError("O catálogo deve ser uma lista.");
  }

  const normalizedQuery = normalizeSearchText(query);
  return items.filter((item) => {
    const matchesType = type === "todos" || item.kind === type;
    const matchesSection = !scope.section || item.section === scope.section;
    const matchesDiscipline =
      !scope.discipline || itemDisciplines(item).includes(scope.discipline);
    const matchesChapter =
      scope.chapter === undefined || item.chapter === scope.chapter;
    const matchesReference =
      !scope.reference || item.reference === scope.reference;
    const matchesQuery =
      normalizedQuery === "" || searchableText(item).includes(normalizedQuery);
    return (
      matchesType &&
      matchesSection &&
      matchesDiscipline &&
      matchesChapter &&
      matchesReference &&
      matchesQuery
    );
  });
}

export async function loadCatalog(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Não foi possível carregar o catálogo.");
  }
  return response.json();
}

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

export function resolveCatalogPath(path, pathPrefix = "") {
  return `${pathPrefix}${path}`;
}

function createCard(item, pathPrefix = "", showDisciplines = false) {
  const card = element("article", "catalog-card");
  const link = element("a", "catalog-card__link");
  const kindLabels = {
    experimento: "Experimento",
    resolucao: "Resolução",
    simulador: "Simulador",
  };
  const kindLabel = kindLabels[item.kind] ?? "Material";
  const eyebrow = element("span", "catalog-card__kind", kindLabel);
  const title = element("h3", "catalog-card__title", item.title);
  const theme = element("p", "catalog-card__theme", item.theme);
  const description = element(
    "p",
    "catalog-card__description",
    item.description,
  );
  const tags = element("ul", "tag-list");

  link.href = resolveCatalogPath(item.path, pathPrefix);
  const header = element("div", "catalog-card__header");
  header.append(eyebrow);
  if (showDisciplines) {
    const disciplines = element("ul", "catalog-card__disciplines");
    disciplines.setAttribute("aria-label", "Disciplinas relacionadas");
    for (const code of itemDisciplines(item)) {
      disciplines.append(element("li", "catalog-card__discipline", code));
    }
    header.append(disciplines);
  }
  link.append(header, title, theme, description);
  for (const tag of item.tags) {
    const tagItem = element("li", "tag-list__item", tag);
    tags.append(tagItem);
  }
  link.append(tags);
  card.append(link);
  return card;
}

export async function mountCatalog(root, options = {}) {
  const registryUrl = options.registryUrl ?? "./materiais.json";
  const scope = options.scope ?? {};
  const pathPrefix = options.pathPrefix ?? "";
  const showDisciplines = options.showDisciplines ?? false;
  const controls = root.querySelector("[data-catalog-controls]");
  const results = root.querySelector("[data-catalog-results]");
  const count = root.querySelector("[data-catalog-count]");
  const search = root.querySelector("[data-catalog-search]");
  const buttons = [...root.querySelectorAll("[data-catalog-filter]")];
  const disciplineButtons = [
    ...root.querySelectorAll("[data-catalog-discipline]"),
  ];

  let items = [];
  let activeType = "todos";
  let activeDiscipline = "todas";

  function activeScope() {
    if (activeDiscipline === "todas") {
      return scope;
    }
    return { ...scope, discipline: activeDiscipline };
  }

  function render() {
    const visibleItems = filterCatalog(
      items,
      search.value,
      activeType,
      activeScope(),
    );
    results.replaceChildren();

    for (const item of visibleItems) {
      results.append(createCard(item, pathPrefix, showDisciplines));
    }

    if (visibleItems.length === 0) {
      results.append(
        element(
          "p",
          "catalog-empty",
          "Nenhum material corresponde à busca. Tente outro termo ou mostre todos.",
        ),
      );
    }

    const suffix = visibleItems.length === 1 ? "material" : "materiais";
    count.textContent = String(visibleItems.length) + " " + suffix;
  }

  search.addEventListener("input", render);
  for (const button of buttons) {
    button.addEventListener("click", () => {
      activeType = button.dataset.catalogFilter;
      for (const candidate of buttons) {
        candidate.setAttribute(
          "aria-pressed",
          String(candidate === button),
        );
      }
      render();
    });
  }
  for (const button of disciplineButtons) {
    button.addEventListener("click", () => {
      activeDiscipline = button.dataset.catalogDiscipline;
      for (const candidate of disciplineButtons) {
        candidate.setAttribute(
          "aria-pressed",
          String(candidate === button),
        );
      }
      render();
    });
  }

  try {
    items = await loadCatalog(registryUrl);
    controls.removeAttribute("aria-busy");
    render();
  } catch {
    controls.removeAttribute("aria-busy");
    count.textContent = "Catálogo indisponível";
    results.replaceChildren(
      element(
        "p",
        "catalog-error",
        "Não foi possível carregar os materiais. Recarregue a página para tentar novamente.",
      ),
    );
  }
}
