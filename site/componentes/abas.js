export function nextTabIndex(currentIndex, key, total) {
  if (!Number.isInteger(total) || total <= 0) {
    return null;
  }
  if (key === "ArrowLeft") {
    return (currentIndex - 1 + total) % total;
  }
  if (key === "ArrowRight") {
    return (currentIndex + 1) % total;
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return total - 1;
  }
  return null;
}

export function setupTabs(root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) =>
    root.querySelector("#" + tab.getAttribute("aria-controls")),
  );

  if (tabs.length === 0 || panels.some((panel) => panel === null)) {
    throw new Error("A estrutura de abas está incompleta.");
  }

  function activate(index, focus = false) {
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[tabIndex].hidden = !selected;
    });

    if (focus) {
      tabs[index].focus();
    }
  }

  const clickHandlers = tabs.map((tab, index) => {
    const handler = () => activate(index);
    tab.addEventListener("click", handler);
    return handler;
  });

  const keyHandlers = tabs.map((tab, index) => {
    const handler = (event) => {
      const targetIndex = nextTabIndex(index, event.key, tabs.length);
      if (targetIndex === null) {
        return;
      }
      event.preventDefault();
      activate(targetIndex, true);
    };
    tab.addEventListener("keydown", handler);
    return handler;
  });

  const initialIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
  );
  activate(initialIndex);

  return {
    activate,
    destroy() {
      tabs.forEach((tab, index) => {
        tab.removeEventListener("click", clickHandlers[index]);
        tab.removeEventListener("keydown", keyHandlers[index]);
      });
    },
  };
}
