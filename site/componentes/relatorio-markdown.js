import { typesetMath } from "./matematica.js";

export const MARKED_VERSION = "18.0.7";

const MARKED_MODULE_URL =
  `https://cdn.jsdelivr.net/npm/marked@${MARKED_VERSION}/lib/marked.esm.js`;
const MATH_PATTERN =
  /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+?(?<!\\)\$/g;

let markedParserPromise;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function protectMath(markdown) {
  const expressions = [];
  const protectedMarkdown = markdown.replace(MATH_PATTERN, (expression) => {
    const index = expressions.push(expression) - 1;
    return `MATHPLACEHOLDER${index}END`;
  });
  return { protectedMarkdown, expressions };
}

export function renderMarkdownWithMath(markdown, parseMarkdown) {
  const { protectedMarkdown, expressions } = protectMath(markdown);
  const parsed = parseMarkdown(protectedMarkdown);

  return parsed.replace(/MATHPLACEHOLDER(\d+)END/g, (_, rawIndex) => {
    const expression = expressions[Number(rawIndex)];
    return expression === undefined ? "" : escapeHtml(expression);
  });
}

async function loadMarkedParser() {
  markedParserPromise ??= import(MARKED_MODULE_URL).then(
    ({ marked }) => (markdown) => marked.parse(markdown, { gfm: true }),
  );
  return markedParserPromise;
}

function prepareReportMarkup(root) {
  root.classList.add("report-document--markdown");

  for (const table of root.querySelectorAll("table")) {
    table.classList.add("data-table");
    const wrapper = document.createElement("div");
    wrapper.className = "data-table-wrapper report-data";
    table.before(wrapper);
    wrapper.append(table);
  }

  for (const checkbox of root.querySelectorAll('input[type="checkbox"]')) {
    checkbox.setAttribute("aria-hidden", "true");
    checkbox.tabIndex = -1;
  }
}

export async function loadAcademicReport(
  root,
  {
    fetchReport = globalThis.fetch,
    parseMarkdown,
  } = {},
) {
  const reportUrl = root.getAttribute("data-markdown-report");
  if (!reportUrl) return false;

  root.setAttribute("aria-busy", "true");

  try {
    const response = await fetchReport(reportUrl);
    if (!response.ok) {
      throw new Error(`Falha HTTP ${response.status} ao carregar ${reportUrl}.`);
    }

    const markdown = await response.text();
    const parser = parseMarkdown ?? (await loadMarkedParser());
    root.innerHTML = renderMarkdownWithMath(markdown, parser);
    prepareReportMarkup(root);
    await typesetMath(root);
    root.setAttribute("data-report-loaded", "true");
    return true;
  } catch (error) {
    root.setAttribute("data-report-error", "true");
    console.error("Não foi possível carregar o relatório Markdown completo.", error);
    return false;
  } finally {
    root.setAttribute("aria-busy", "false");
  }
}
