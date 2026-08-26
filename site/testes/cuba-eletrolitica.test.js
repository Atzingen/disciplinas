import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL(
  "../experimentos/06-cuba-eletrolitica/index.html",
  import.meta.url,
);
const reportUrl = new URL(
  "../experimentos/06-cuba-eletrolitica/relatorio.md",
  import.meta.url,
);
const detailPhotoUrl = new URL(
  "../assets/experimentos/cuba-eletrolitica/exp-06-cuba-detalhe.jpg",
  import.meta.url,
);
const setupPhotoUrl = new URL(
  "../assets/experimentos/cuba-eletrolitica/exp-06-cuba-montagem.jpg",
  import.meta.url,
);

const html = await readFile(pageUrl, "utf8");
const report = await readFile(reportUrl, "utf8");

function count(source, pattern) {
  return (source.match(pattern) ?? []).length;
}

test("cuba eletrolítica publica o roteiro completo e as fotografias", async () => {
  assert.equal(count(html, /role="tab"/g), 4);
  assert.equal(count(html, /role="tabpanel"/g), 4);
  assert.equal(count(html, /<img\b/g), 2);
  assert.match(html, /exp-06-cuba-montagem\.jpg/);
  assert.match(html, /exp-06-cuba-detalhe\.jpg/);
  assert.equal(count(html, /<img\b[^>]*alt="[^"]+"/g), 2);
  assert.match(html, /<svg[\s\S]*role="img"/);
  assert.match(html, /<title id="cuba-schema-title">/);
  assert.match(html, /<desc id="cuba-schema-desc">/);

  for (const photo of [detailPhotoUrl, setupPhotoUrl]) {
    const metadata = await stat(photo);
    assert.ok(
      metadata.size > 50_000,
      photo.pathname + " deve conter a fotografia",
    );
  }
});

test("roteiro fixa os três potenciais e a referência comum", () => {
  assert.match(html, /0 V, 5 V e 10 V/);
  assert.match(html, /E_0=0\\,\\mathrm\{V\}/);
  assert.match(html, /E_5=5\\,\\mathrm\{V\}/);
  assert.match(html, /E_\{10\}=10\\,\\mathrm\{V\}/);
  assert.match(html, /referência comum/);
  assert.match(html, /terminal COM do voltímetro/);
  assert.match(html, /displays fotografados não são\s+os valores prescritos/);
});

test("roteiro exige sete divisões entre cada par", () => {
  assert.match(html, /Para <strong>cada par<\/strong>/);
  assert.match(html, /d_\{ij\}\\geq 7\\Delta/);
  assert.match(html, /d_\{01\},d_\{05\},d_\{5,10\}\\geq 7\\Delta/);
  assert.match(html, /Conte espaços, não o número de linhas/);
  assert.match(report, /d_\{ij\}\\geq7\\Delta/);
});

test("roteiro define um quadrado com margem e cobertura integrais", () => {
  assert.match(html, /menor quadrado alinhado à\s+malha/);
  assert.match(html, /duas divisões completas/);
  assert.match(html, /N \\geq \\max/);
  assert.match(html, /\(N\+1\)\^2/);
  assert.match(html, /todos os cruzamentos do quadrado/);
  assert.match(html, /Pontos ausentes<\/td><td>&nbsp;<\/td><td>deve ser zero/);
  assert.match(html, /varredura em serpentina/);
  assert.match(report, /número de pontos ausentes ao final deve ser\s+zero/);
});

test("fundamentação conecta potencial, campo e equação de Laplace", () => {
  assert.match(html, /\\vec E=-\\nabla V/);
  assert.match(html, /\\nabla\^2V &= 0/);
  assert.match(html, /E_x\(i,j\)&\\approx-/);
  assert.match(html, /E_y\(i,j\)&\\approx-/);
  assert.match(html, /r_L=/);
  assert.match(html, /equipotenciais a\s+aproximadamente/);
  assert.match(html, /90\^\\circ/);
});

test("relatório preserva matriz, repetibilidade e rastreabilidade", () => {
  const words = report
    .replace(/^\|.*$/gm, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  assert.match(report, /^# /m);
  assert.match(report, /^## Dados brutos/m);
  assert.match(report, /^## Tratamento e análise/m);
  assert.match(report, /^## Incertezas e qualidade da evidência/m);
  assert.match(report, /^## Discussão/m);
  assert.match(report, /^## Conclusão/m);
  assert.match(report, /cinco pontos distribuídos/);
  assert.match(report, /matriz completa \\?\(V\(x,y\)\\?\)/);
  assert.match(report, /r_\{\\mathrm\{RMS\}\}/);
  assert.ok(words >= 2500, "o relatório tem somente " + words + " palavras");
});
