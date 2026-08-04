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

export function filterCatalog(items, query = "", type = "todos") {
  if (!Array.isArray(items)) {
    throw new TypeError("O catálogo deve ser uma lista.");
  }

  const normalizedQuery = normalizeSearchText(query);
  return items.filter((item) => {
    const matchesType = type === "todos" || item.kind === type;
    const matchesQuery =
      normalizedQuery === "" || searchableText(item).includes(normalizedQuery);
    return matchesType && matchesQuery;
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

function createCard(item) {
  const card = element("article", "catalog-card");
  const link = element("a", "catalog-card__link");
  const kindLabel = item.kind === "simulador" ? "Simulador" : "Resolução";
  const eyebrow = element("span", "catalog-card__kind", kindLabel);
  const title = element("h3", "catalog-card__title", item.title);
  const theme = element("p", "catalog-card__theme", item.theme);
  const description = element(
    "p",
    "catalog-card__description",
    item.description,
  );
  const tags = element("ul", "tag-list");

  link.href = item.path;
  link.append(eyebrow, title, theme, description);
  for (const tag of item.tags) {
    const tagItem = element("li", "tag-list__item", tag);
    tags.append(tagItem);
  }
  link.append(tags);
  card.append(link);
  return card;
}

export async function mountCatalog(root, options = {}) {
  const registryUrl = options.registryUrl ?? "./simuladores.json";
  const controls = root.querySelector("[data-catalog-controls]");
  const results = root.querySelector("[data-catalog-results]");
  const count = root.querySelector("[data-catalog-count]");
  const search = root.querySelector("[data-catalog-search]");
  const buttons = [...root.querySelectorAll("[data-catalog-filter]")];

  let items = [];
  let activeType = "todos";

  function render() {
    const visibleItems = filterCatalog(items, search.value, activeType);
    results.replaceChildren();

    for (const item of visibleItems) {
      results.append(createCard(item));
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
