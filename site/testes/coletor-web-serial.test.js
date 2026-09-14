import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let api = {};
try {
  api = await import("../experimentos/07-carga-descarga-capacitores/coletor-web-serial.js");
} catch {
  api = {};
}

test("captura Web Serial valida um par e preserva o CSV recebido", () => {
  assert.equal(typeof api.createSerialCapture, "function");
  const capture = api.createSerialCapture();

  assert.equal(capture.ingest("# pronto: i=iniciar par carga/descarga").type, "ready");
  assert.equal(capture.ingest("fase,t_ms,adc,r_nominal_ohm").type, "header");
  assert.equal(capture.ingest("carga,0,0,47000").type, "data");
  assert.equal(capture.ingest("carga,20,1,47000").type, "data");
  assert.equal(capture.ingest("descarga,0,1016,47000").type, "data");
  assert.equal(capture.ingest("descarga,20,1015,47000").type, "data");
  assert.equal(capture.ingest("# fim").type, "complete");

  assert.deepEqual(capture.summary(), {
    status: "complete",
    count: 4,
    phase: "descarga",
    elapsedMs: 20,
    adc: 1015,
    resistance: 47000,
    downloadable: true,
    complete: true,
  });
  assert.equal(
    capture.csv(),
    "fase,t_ms,adc,r_nominal_ohm\n" +
      "carga,0,0,47000\n" +
      "carga,20,1,47000\n" +
      "descarga,0,1016,47000\n" +
      "descarga,20,1015,47000\n",
  );
});

test("captura conserva dados parciais quando o aluno interrompe", () => {
  const capture = api.createSerialCapture();
  capture.ingest("fase,t_ms,adc,r_nominal_ohm");
  capture.ingest("carga,0,0,56000");

  const event = capture.ingest("# interrompido");

  assert.equal(event.type, "interrupted");
  assert.equal(capture.summary().downloadable, true);
  assert.equal(capture.summary().complete, false);
  assert.match(capture.csv(), /carga,0,0,56000/);
});

test("captura rejeita valores, ordem e resistores incoerentes", () => {
  const invalidSequences = [
    ["fase,t_ms,adc,r_nominal_ohm", "carga,0,1024,47000"],
    ["fase,t_ms,adc,r_nominal_ohm", "carga,0,0,47000", "carga,0,1,47000"],
    ["fase,t_ms,adc,r_nominal_ohm", "descarga,0,900,47000"],
    [
      "fase,t_ms,adc,r_nominal_ohm",
      "carga,0,0,47000",
      "descarga,0,900,68000",
    ],
    ["fase,t_ms,adc,r_nominal_ohm", "carga,0,0,12345"],
  ];

  for (const lines of invalidSequences) {
    const capture = api.createSerialCapture();
    let event;
    for (const line of lines) event = capture.ingest(line);
    assert.equal(event.type, "error", lines.join(" | "));
    assert.equal(capture.summary().status, "error");
  }
});

test("captura permanece inválida depois de um erro de protocolo", () => {
  const capture = api.createSerialCapture();
  capture.ingest("fase,t_ms,adc,r_nominal_ohm");
  const invalid = capture.ingest("carga,0,1024,47000");
  const laterLine = capture.ingest("carga,20,1,47000");

  assert.equal(invalid.type, "error");
  assert.equal(laterLine.type, "error");
  assert.equal(capture.summary().status, "error");
  assert.equal(capture.summary().count, 0);
});

test("fim sem as duas fases é marcado como aquisição incompleta", () => {
  const capture = api.createSerialCapture();
  capture.ingest("fase,t_ms,adc,r_nominal_ohm");
  capture.ingest("carga,0,0,68000");

  const event = capture.ingest("# fim");

  assert.equal(event.type, "error");
  assert.match(event.message, /duas fases/i);
  assert.equal(capture.summary().downloadable, true);
});

test("progresso usa o tempo real sobre os cinco RC da fase", () => {
  assert.equal(typeof api.calculatePhaseProgress, "function");
  assert.equal(api.calculatePhaseProgress(0, 47000), 0);
  assert.equal(api.calculatePhaseProgress(258500, 47000), 50);
  assert.equal(api.calculatePhaseProgress(517000, 47000), 100);
  assert.equal(api.calculatePhaseProgress(600000, 47000), 100);
  assert.equal(api.calculatePhaseProgress(null, null), 0);
});

test("página oferece Web Serial e mantém Python como alternativa", async () => {
  const html = await readFile(
    new URL(
      "../experimentos/07-carga-descarga-capacitores/index.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(html, /data-web-serial-collector/);
  assert.match(html, /Conectar Arduino/);
  assert.match(html, /Iniciar carga e descarga/);
  assert.match(html, /Baixar CSV/);
  assert.match(html, /coletor-web-serial\.js/);
  assert.match(html, /Alternativa com Python/);
  assert.match(html, /coletar\.py/);
});
