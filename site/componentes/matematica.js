export const MATHJAX_VERSION = "4.1.2";
export const MATHJAX_URL =
  "https://cdn.jsdelivr.net/npm/mathjax@4.1.2/tex-mml-chtml.js";

export const MATHJAX_CONFIG = Object.freeze({
  tex: Object.freeze({
    inlineMath: Object.freeze([["\\(", "\\)"]]),
    displayMath: Object.freeze([["\\[", "\\]"]]),
    processEscapes: true,
  }),
  chtml: Object.freeze({
    displayAlign: "center",
    displayIndent: "0",
  }),
});

function browserConfig() {
  return {
    tex: {
      inlineMath: [["\\(", "\\)"]],
      displayMath: [["\\[", "\\]"]],
      processEscapes: true,
    },
    chtml: {
      displayAlign: "center",
      displayIndent: "0",
    },
  };
}

function waitForMathJax() {
  const startup = globalThis.MathJax?.startup;
  if (!startup?.promise) return Promise.resolve(null);

  return startup.promise
    .then(() => globalThis.MathJax)
    .catch(() => null);
}

function loadMathJax() {
  if (typeof document === "undefined") return Promise.resolve(null);

  if (globalThis.MathJax?.typesetPromise) {
    return waitForMathJax();
  }

  globalThis.MathJax = browserConfig();

  return new Promise((resolve) => {
    const existing = document.querySelector("script[data-eletro-mathjax]");
    const script = existing ?? document.createElement("script");

    const complete = () => {
      waitForMathJax().then(resolve);
    };

    script.addEventListener("load", complete, { once: true });
    script.addEventListener("error", () => resolve(null), { once: true });

    if (!existing) {
      script.src = MATHJAX_URL;
      script.defer = true;
      script.dataset.eletroMathjax = MATHJAX_VERSION;
      document.head.append(script);
    }
  });
}

export const mathReady = loadMathJax();

export async function typesetMath(root) {
  if (typeof document === "undefined") return false;

  const target = root ?? document.body;
  const mathJax = await mathReady;
  if (!target || !mathJax?.typesetPromise) return false;

  const targets = [target];
  mathJax.typesetClear?.(targets);
  await mathJax.typesetPromise(targets);
  return true;
}

function requestVisualFrame(callback) {
  if (typeof globalThis.requestAnimationFrame === "function") {
    return globalThis.requestAnimationFrame(callback);
  }
  queueMicrotask(callback);
  return null;
}

export function createMathRenderScheduler(
  typesetter = typesetMath,
  requestFrame = requestVisualFrame,
) {
  let framePending = false;
  let latestRoot = null;
  let typesetting = Promise.resolve();

  return function scheduleMathRender(root) {
    latestRoot = root;
    if (framePending) return false;

    framePending = true;
    requestFrame(() => {
      framePending = false;
      const target = latestRoot;
      latestRoot = null;
      typesetting = typesetting
        .then(() => typesetter(target))
        .catch(() => false);
      return typesetting;
    });
    return true;
  };
}
