export function currentSection(sections, scrollPosition) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return null;
  }

  let active = sections[0].id;
  for (const section of sections) {
    if (section.top <= scrollPosition) {
      active = section.id;
    }
  }
  return active;
}

export function mountSectionNav(root) {
  if (!root) {
    return null;
  }

  const links = [...root.querySelectorAll('a[href^="#"]')];
  const targets = links
    .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter((target) => target !== null);

  if (targets.length === 0) {
    return null;
  }

  const stickyBar = root.closest("[data-topbar]") ?? root;

  function refresh() {
    const margin = stickyBar.getBoundingClientRect().height + 32;
    const sections = targets.map((target) => ({
      id: target.id,
      top: target.getBoundingClientRect().top + window.scrollY - margin,
    }));
    const active = currentSection(sections, window.scrollY);

    for (const link of links) {
      const id = decodeURIComponent(link.hash.slice(1));
      if (id === active) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  window.addEventListener("scroll", refresh, { passive: true });
  window.addEventListener("resize", refresh);
  refresh();

  return { refresh };
}

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-section-nav]")) {
    mountSectionNav(root);
  }
}
