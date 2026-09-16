import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const site = new URL("../", import.meta.url);
const topic = "topicos/02-visao-computacional/";
const chapters = [
  "01-fundamentos/",
  "02-video-medida/",
  "03-convolucao-redes/",
  "04-deteccao-segmentacao/",
];

test("visão computacional é um tópico de PRCCOMP com quatro capítulos navegáveis", async () => {
  const catalog = JSON.parse(await readFile(new URL("materiais.json", site), "utf8"));
  const entries = catalog.filter((entry) => entry.path === topic);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].kind, "topico");
  assert.deepEqual(entries[0].disciplines, ["PRCCOMP"]);

  const index = await readFile(new URL(`${topic}index.html`, site), "utf8");
  for (const chapter of chapters) {
    assert.ok(index.includes(`href="${chapter}"`), chapter);
    const page = await readFile(new URL(`${topic}${chapter}index.html`, site), "utf8");
    assert.equal([...page.matchAll(/<h1\b/g)].length, 1, chapter);
    assert.ok(page.includes('href="../"'), `${chapter}: volta ao tópico`);
  }
});

test("links, imagens e downloads das páginas de visão resolvem para arquivos existentes", async () => {
  for (const chapter of ["", ...chapters]) {
    const pageUrl = new URL(`${topic}${chapter}index.html`, site);
    const page = await readFile(pageUrl, "utf8");
    const identifiers = [...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(identifiers).size, identifiers.length, `${chapter}: IDs únicos`);
    for (const [, reference] of page.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|data:|mailto:)/.test(reference)) continue;
      const target = new URL(reference, pageUrl);
      const fragment = decodeURIComponent(target.hash.slice(1));
      target.hash = "";
      if (target.pathname.endsWith("/")) target.pathname += "index.html";
      const file = await stat(target).catch(() => null);
      assert.ok(file?.isFile() && file.size > 0, `${chapter}: ${reference}`);
      if (fragment) {
        const destination = await readFile(target, "utf8");
        assert.ok(destination.includes(`id="${fragment}"`), `${chapter}: #${fragment}`);
      }
    }
  }
});

test("o CSV real do pêndulo preserva tempo crescente e posições finitas", async () => {
  const csv = await readFile(new URL(`${topic}dados/pendulo_trena.csv`, site), "utf8");
  const [header, ...lines] = csv.trim().split("\n");
  assert.equal(header, "t_s,x_px,y_px");
  assert.ok(lines.length > 3000);
  let previous = -1;
  for (const line of lines) {
    const values = line.split(",").map(Number);
    assert.equal(values.length, 3);
    assert.ok(values.every(Number.isFinite));
    assert.ok(values[0] > previous);
    previous = values[0];
    assert.ok(values[1] >= 0 && values[1] < 640);
    assert.ok(values[2] >= 0 && values[2] < 416);
  }
  assert.ok(previous > 100, "O CSV mantém a duração do vídeo, não o tempo do processamento.");
});

test("os notebooks entregues estão executados e têm leitura HTML", async () => {
  for (const name of ["01-convolucao", "02-mnist-densa-cnn", "03-fashion-mnist", "04-caes-gatos"]) {
    const notebook = JSON.parse(await readFile(new URL(`${topic}notebooks/${name}.ipynb`, site), "utf8"));
    const cells = notebook.cells.filter((cell) => cell.cell_type === "code" && cell.source.join("").trim());
    assert.ok(cells.length > 0, name);
    for (const cell of cells) {
      assert.ok(Number.isInteger(cell.execution_count), `${name}: célula sem execução`);
      assert.ok(cell.outputs.every((output) => output.output_type !== "error"), `${name}: saída de erro`);
    }
    const rendered = await stat(new URL(`${topic}notebooks/${name}.html`, site));
    assert.ok(rendered.size > 1000, name);
  }
});

test("a leitura na página preserva todas as células de código dos notebooks", async () => {
  const page = await readFile(new URL(`${topic}03-convolucao-redes/index.html`, site), "utf8");
  const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
  for (const name of ["01-convolucao", "02-mnist-densa-cnn", "03-fashion-mnist", "04-caes-gatos"]) {
    const notebook = JSON.parse(await readFile(new URL(`${topic}notebooks/${name}.ipynb`, site), "utf8"));
    const start = page.indexOf(`<!-- notebook:${name}:inicio -->`);
    const end = page.indexOf(`<!-- notebook:${name}:fim -->`);
    assert.ok(start >= 0 && end > start, `${name}: conteúdo incorporado`);
    const section = page.slice(start, end);
    for (const cell of notebook.cells.filter((cell) => cell.cell_type === "code")) {
      assert.ok(section.includes(`<code class="language-python">${escape(cell.source.join(""))}</code>`),
        `${name}: código preservado na leitura, sem precisar abrir outra página`);
    }
    assert.ok(section.includes('<figure class="vision-figure">'), `${name}: resultados visuais presentes`);
  }
});
