import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sampleIndexAtTime } from "../topicos/02-visao-computacional/demo-video-medida.js";

test("o marcador não antecipa uma medida e acompanha avanços e retornos do vídeo", () => {
  const samples = [[0, 10, 20], [0.033, 11, 21], [0.099, 13, 23]];
  assert.equal(sampleIndexAtTime(samples, -1), -1);
  assert.equal(sampleIndexAtTime(samples, 0), 0);
  assert.equal(sampleIndexAtTime(samples, 0.032), 0);
  assert.equal(sampleIndexAtTime(samples, 0.033), 1);
  assert.equal(sampleIndexAtTime(samples, 0.066), 1);
  assert.equal(sampleIndexAtTime(samples, 0.1), 2);
  assert.equal(sampleIndexAtTime(samples, 0.01), 0);
  assert.equal(sampleIndexAtTime([], 10), -1);
});

test("cada timestamp do vídeo seleciona a posição correspondente no CSV real", async () => {
  const csv = await readFile(new URL("../topicos/02-visao-computacional/dados/pendulo_trena.csv", import.meta.url), "utf8");
  const samples = csv.trim().split("\n").slice(1).map((row) => row.split(",").map(Number));
  for (let index = 0; index < samples.length; index++) {
    assert.equal(sampleIndexAtTime(samples, samples[index][0]), index);
  }
  assert.equal(sampleIndexAtTime(samples, 111.548889), samples.length - 1);
});
