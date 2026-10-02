import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  activityState,
  errorMessage,
  formatMoment,
  tokenIsFresh,
  validateSelection,
} from "../componentes/entregas-modelo.js";

async function readSitePage(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function tokenExpiringAt(epochSeconds) {
  const payload = Buffer.from(JSON.stringify({ exp: epochSeconds })).toString("base64url");
  return `cabecalho.${payload}.assinatura`;
}

const activity = {
  aberta: true,
  prazo: "2026-10-11T02:59:00+00:00",
  extensoes: ["pdf"],
  tamanho_max_mb: 20,
  max_arquivos: 1,
};
const beforeDeadline = new Date("2026-10-01T12:00:00Z");
const afterDeadline = new Date("2026-10-12T12:00:00Z");

test("o prazo aparece no horário do câmpus, não no fuso do computador do aluno", () => {
  assert.equal(formatMoment("2026-10-11T02:59:00+00:00"), "10/10/2026 às 23:59");
});

test("a mensagem de erro do serviço chega legível ao aluno", () => {
  assert.equal(errorMessage({ detail: "Esta atividade está encerrada." }), "Esta atividade está encerrada.");
  assert.equal(
    errorMessage({ detail: [{ msg: "Campo obrigatório." }, { msg: "Valor inválido." }] }),
    "Campo obrigatório. Valor inválido.",
  );
  assert.equal(errorMessage(null, "Falhou."), "Falhou.");
});

test("token vencido ou prestes a vencer não é reaproveitado", () => {
  const now = Date.parse("2026-10-02T12:00:00Z");
  const nowInSeconds = now / 1000;

  assert.equal(tokenIsFresh(tokenExpiringAt(nowInSeconds + 600), now), true);
  assert.equal(tokenIsFresh(tokenExpiringAt(nowInSeconds + 30), now), false);
  assert.equal(tokenIsFresh(tokenExpiringAt(nowInSeconds - 10), now), false);
  assert.equal(tokenIsFresh("isto-nao-e-um-token", now), false);
  assert.equal(tokenIsFresh(null, now), false);
});

test("a situação da atividade distingue entregue, atrasada, vencida e encerrada", () => {
  const state = (overrides) =>
    activityState({ activity, delivery: null, signedIn: true, now: beforeDeadline, ...overrides }).label;

  assert.equal(state({ delivery: { atrasada: false } }), "Entregue");
  assert.equal(state({ delivery: { atrasada: true } }), "Entregue com atraso");
  assert.equal(state({}), "Não entregue");
  assert.equal(state({ now: afterDeadline }), "Não entregue · prazo vencido");
  assert.equal(state({ signedIn: false }), "Aberta");
  assert.equal(state({ activity: { ...activity, aberta: false }, now: afterDeadline }), "Encerrada");
  // Quem entregou continua vendo a entrega depois de a atividade ser encerrada.
  assert.equal(
    state({ activity: { ...activity, aberta: false }, delivery: { atrasada: false } }),
    "Entregue",
  );
});

test("arquivo fora das regras é recusado antes do envio", () => {
  const megabyte = 1024 * 1024;
  const pdf = { name: "relatorio.PDF", size: megabyte };

  assert.equal(validateSelection([pdf], activity), "");
  assert.match(validateSelection([], activity), /Escolha o arquivo/);
  assert.match(validateSelection([pdf, pdf], activity), /um único arquivo/);
  assert.match(validateSelection([{ name: "foto.png", size: 10 }], activity), /não é aceito/);
  assert.match(validateSelection([{ name: "semextensao", size: 10 }], activity), /não é aceito/);
  assert.match(validateSelection([{ name: "vazio.pdf", size: 0 }], activity), /está vazio/);
  assert.match(
    validateSelection([{ name: "grande.pdf", size: 20 * megabyte + 1 }], activity),
    /limite de 20 MB/,
  );
});

test("cada página de disciplina traz a seção de entregas entre os materiais e o catálogo", async () => {
  for (const code of ["prcfemg", "prclfbe", "prccomp"]) {
    const html = await readSitePage(`disciplinas/${code}/index.html`);
    const resources = html.indexOf('class="course-resources"');
    const submissions = html.indexOf("data-submissions-root");
    const catalog = html.indexOf("data-catalog-root");

    assert.ok(resources > -1 && submissions > resources && catalog > submissions, code);
    assert.match(html, new RegExp(`data-discipline="${code.toUpperCase()}"`), code);
    assert.match(html, /id="entregas"/, code);
    assert.match(html, /assets\/entregas\.css/, code);
    assert.match(html, /componentes\/entregas\.js/, code);
    assert.match(html, /entregas\/config\.js/, code);
  }
});

test("a área do professor existe e fica fora dos buscadores", async () => {
  const html = await readSitePage("entregas/professor/index.html");

  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /data-teacher-root/);
  assert.match(html, /componentes\/entregas-professor\.js/);
});
