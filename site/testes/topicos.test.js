import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readSiteFile(path) {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  } catch {
    return "";
  }
}

function count(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

const catalog = JSON.parse(await readSiteFile("materiais.json"));

test("Física Computacional reproduz os dados do PPC", async () => {
  const html = await readSiteFile("disciplinas/prccomp/index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /Física Computacional/);
  assert.match(html, /PRCCOMP/);
  assert.match(html, /8º semestre/);
  assert.match(html, /13 tópicos/);
  assert.match(html, /Laboratório de informática B09/);
  assert.match(html, /Algoritmos estruturados/);
  assert.match(html, /Experimentos de Física simulados ou por análise de vídeos/);
  assert.match(html, /Bibliografia/);
  assert.match(html, /#page=252/);
  assert.match(html, /#page=50/);
  assert.match(html, /scope:\s*\{ discipline: "PRCCOMP" \}/);
  assert.match(html, /href="\.\.\/\.\.\/topicos\/"/);
});

test("os tópicos formam uma área própria da disciplina", async () => {
  const html = await readSiteFile("topicos/index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /data-active-section="topicos"/);
  assert.match(html, /section:\s*"topicos"/);
  assert.match(html, /discipline:\s*"PRCCOMP"/);
  assert.match(html, /pathPrefix:\s*"\.\.\/"/);
  assert.match(html, /data-catalog-filter="topico"/);
});

test("o tópico do Picoh cobre robô, blocos, Python e referências", async () => {
  const html = await readSiteFile("topicos/01-picoh/index.html");

  assert.equal(count(html, /<h1\b/g), 1);
  assert.match(html, /data-active-section="topicos"/);
  for (const id of ["robo", "ligar", "blocos", "python", "protocolo", "referencias"]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
    assert.match(html, new RegExp(`href="#${id}"`), id);
  }
  assert.match(html, /scratch\.ohbot\.co\.uk/);
  assert.match(html, /chromewebstore\.google\.com\/detail\/ohbridge/);
  assert.match(html, /github\.com\/ohbot\/picoh-python/);
  assert.match(html, /href="\.\/picoh_simples\.py" download/);
  assert.match(html, /href="\.\/60-picoh\.rules" download/);
  assert.match(html, /navegacao-secoes\.js/);
});

test("as três imagens do editor de blocos acompanham o tópico", async () => {
  const html = await readSiteFile("topicos/01-picoh/index.html");

  for (const nome of ["editor", "blocos", "arquivo"]) {
    const arquivo = `assets/topicos/picoh-scratch-${nome}.png`;
    assert.match(html, new RegExp(`\\.\\./\\.\\./${arquivo.replace(/\//g, "\\/")}`), nome);
    const png = await readFile(new URL(`../${arquivo}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG", nome);
  }
});

test("o script Python do tópico não depende de nada além do pyserial", async () => {
  const codigo = await readSiteFile("topicos/01-picoh/picoh_simples.py");

  assert.match(codigo, /^import serial$/m);
  assert.doesNotMatch(codigo, /jarvis|voice-launcher/i);
  for (const funcao of [
    "def conectar",
    "def cor",
    "def boca",
    "def virar",
    "def acenar",
    "def olhar",
    "def formato_olho",
    "def piscar",
    "def repouso",
  ]) {
    assert.ok(codigo.includes(funcao), funcao);
  }
  assert.match(codigo, /BAUD = 19200/);
});

test("a regra do udev do Picoh usa o prefixo que concede uaccess", async () => {
  const regra = await readSiteFile("topicos/01-picoh/60-picoh.rules");

  assert.match(regra, /idVendor\}=="2e8a"/);
  assert.match(regra, /TAG\+="uaccess"/);
});

test("o catálogo registra o tópico do Picoh em PRCCOMP", () => {
  const item = catalog.find((entry) => entry.id === "topico-01-picoh");

  assert.ok(item);
  assert.equal(item.kind, "topico");
  assert.equal(item.section, "topicos");
  assert.deepEqual(item.disciplines, ["PRCCOMP"]);
  assert.equal(item.path, "topicos/01-picoh/");
  assert.ok(item.tags.includes("Picoh"));
});
