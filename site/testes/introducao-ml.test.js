import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  criarTreino,
  passada,
  proximaPassada,
  treinarAteConvergir,
} from "../topicos/04-introducao-ml/perceptron-modelo.js";

const PESOS_INICIAIS = { w1: -0.5, w2: 0.5, b: -0.25 };

function close(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}

async function readSiteFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("a primeira época do AND reproduz a tabela feita à mão no slide", () => {
  const treino = criarTreino({ problema: "and", ativacao: "degrau", taxa: 0.25, pesos: PESOS_INICIAIS });
  const esperado = [
    { v: -0.25, y: 0, erro: 0, depois: [-0.5, 0.5, -0.25] },
    { v: 0.25, y: 1, erro: -1, depois: [-0.5, 0.25, -0.5] },
    { v: -1, y: 0, erro: 0, depois: [-0.5, 0.25, -0.5] },
    { v: -0.75, y: 0, erro: 1, depois: [-0.25, 0.5, -0.25] },
  ];
  for (const linha of esperado) {
    const passo = proximaPassada(treino);
    close(passo.v, linha.v);
    assert.equal(passo.y, linha.y);
    assert.equal(passo.erro, linha.erro);
    close(passo.depois.w1, linha.depois[0]);
    close(passo.depois.w2, linha.depois[1]);
    close(passo.depois.b, linha.depois[2]);
  }
  assert.equal(treino.epocas.length, 1);
  assert.equal(treino.epocas[0].acertos, 2);
});

test("com o degrau, AND e OR convergem e XOR nunca converge", () => {
  const and = criarTreino({ problema: "and", ativacao: "degrau", taxa: 0.25, pesos: PESOS_INICIAIS });
  assert.equal(treinarAteConvergir(and, 100), true);
  assert.equal(and.epocas.length, 5);

  const or = criarTreino({ problema: "or", ativacao: "degrau", taxa: 0.25, pesos: PESOS_INICIAIS });
  assert.equal(treinarAteConvergir(or, 100), true);

  const xor = criarTreino({ problema: "xor", ativacao: "degrau", taxa: 0.25, pesos: PESOS_INICIAIS });
  assert.equal(treinarAteConvergir(xor, 300), false);
  assert.equal(xor.epocas.length, 300);
  assert.ok(xor.epocas.every((epoca) => epoca.acertos < 4));
});

test("com a sigmoide, a correção usa o gradiente e·y(1−y)·x", () => {
  const passo = passada(PESOS_INICIAIS, { x: [1, 1], d: 1 }, "sigmoide", 1);
  const y = 1 / (1 + Math.exp(0.25));
  close(passo.y, y);
  close(passo.delta, (1 - y) * y * (1 - y));
  close(passo.depois.w1, -0.5 + passo.delta);
  close(passo.depois.w2, 0.5 + passo.delta);
  close(passo.depois.b, -0.25 + passo.delta);

  const and = criarTreino({ problema: "and", ativacao: "sigmoide", taxa: 1, pesos: PESOS_INICIAIS });
  assert.equal(treinarAteConvergir(and, 500), true);
  const xor = criarTreino({ problema: "xor", ativacao: "sigmoide", taxa: 1, pesos: PESOS_INICIAIS });
  assert.equal(treinarAteConvergir(xor, 500), false);
});

test("o tópico 04 está publicado no catálogo e na página da disciplina", async () => {
  const catalogo = JSON.parse(await readSiteFile("materiais.json"));
  const item = catalogo.find((entrada) => entrada.id === "topico-04-introducao-ml");
  assert.ok(item);
  assert.equal(item.kind, "topico");
  assert.equal(item.section, "topicos");
  assert.deepEqual(item.disciplines, ["PRCCOMP"]);
  assert.equal(item.path, "topicos/04-introducao-ml/");

  const disciplina = await readSiteFile("disciplinas/prccomp/index.html");
  assert.match(disciplina, /href="\.\.\/\.\.\/topicos\/04-introducao-ml\/"/);

  const html = await readSiteFile("topicos/04-introducao-ml/index.html");
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /data-active-section="topicos"/);
  assert.match(html, /data-perceptron-explorer/);
  assert.match(html, /href="\.\/perceptron\.py" download/);
  for (const imagem of html.matchAll(/src="(imagens\/[^"]+)"/g)) {
    await readFile(new URL(`../topicos/04-introducao-ml/${imagem[1]}`, import.meta.url));
  }
});
