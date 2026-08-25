import { loadCatalog } from "./catalogo.js";

export function chapterSequence(items, reference, chapter) {
  if (!Array.isArray(items)) {
    throw new TypeError("O catálogo deve ser uma lista.");
  }

  return items
    .filter(
      (item) => item.reference === reference && item.chapter === chapter,
    )
    .toSorted((first, second) => first.exerciseNumber - second.exerciseNumber);
}

export function adjacentExercises(sequence, currentId) {
  const currentIndex = sequence.findIndex((item) => item.id === currentId);
  if (currentIndex === -1) {
    return { previous: null, current: null, next: null };
  }

  return {
    previous: sequence[currentIndex - 1] ?? null,
    current: sequence[currentIndex],
    next: sequence[currentIndex + 1] ?? null,
  };
}

function exerciseHref(item, rootPath) {
  return item ? `${rootPath}${item.path}` : null;
}

export function exerciseLabel(item) {
  if (!item) {
    return "";
  }
  return `${item.seriesLabel ?? "Exercício"} ${item.exerciseNumber}`;
}

function labeledLink(label, item, rootPath, className) {
  if (!item) {
    const spacer = document.createElement("span");
    spacer.className = `${className} exercise-navigation__spacer`;
    spacer.setAttribute("aria-hidden", "true");
    return spacer;
  }

  const link = document.createElement("a");
  link.className = className;
  link.href = exerciseHref(item, rootPath);
  const caption = document.createElement("span");
  caption.textContent = label;
  const title = document.createElement("strong");
  title.textContent = exerciseLabel(item);
  link.append(caption, title);
  return link;
}

export async function mountExerciseNavigation(root) {
  if (!root) {
    return;
  }

  const rootPath = root.dataset.rootPath ?? "../../";
  const reference = root.dataset.reference ?? "Halliday";
  const chapter = Number(root.dataset.chapter ?? 21);

  try {
    const items = await loadCatalog(root.dataset.registryUrl);
    const sequence = chapterSequence(items, reference, chapter);
    const adjacent = adjacentExercises(sequence, root.dataset.currentId);
    if (!adjacent.current) {
      throw new Error("Exercício atual ausente do catálogo.");
    }

    const nav = document.createElement("nav");
    nav.className = "exercise-navigation";
    nav.setAttribute("aria-label", `Exercícios do capítulo ${chapter}`);

    const heading = document.createElement("div");
    heading.className = "exercise-navigation__heading";
    const chapterLabel = document.createElement("span");
    chapterLabel.textContent = `${reference} · capítulo ${chapter}`;
    const chapterLink = document.createElement("a");
    chapterLink.href = root.dataset.chapterUrl;
    chapterLink.textContent = "Ver capítulo completo";
    heading.append(chapterLabel, chapterLink);

    const sequenceList = document.createElement("ol");
    sequenceList.className = "exercise-navigation__sequence";
    for (const item of sequence) {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = exerciseHref(item, rootPath);
      link.textContent = String(item.exerciseNumber);
      link.setAttribute("aria-label", exerciseLabel(item));
      if (item.id === adjacent.current.id) {
        link.setAttribute("aria-current", "page");
      }
      listItem.append(link);
      sequenceList.append(listItem);
    }

    const adjacentLinks = document.createElement("div");
    adjacentLinks.className = "exercise-navigation__adjacent";
    adjacentLinks.append(
      labeledLink("← Anterior", adjacent.previous, rootPath, "exercise-navigation__previous"),
      labeledLink("Próximo →", adjacent.next, rootPath, "exercise-navigation__next"),
    );

    nav.append(heading, sequenceList, adjacentLinks);
    root.replaceChildren(nav);
  } catch {
    const fallback = document.createElement("p");
    fallback.className = "exercise-navigation__error";
    fallback.textContent = "Não foi possível carregar a sequência deste capítulo.";
    root.replaceChildren(fallback);
  }
}

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-exercise-navigation]")) {
    mountExerciseNavigation(root);
  }
}
