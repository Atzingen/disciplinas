import assert from "node:assert/strict";
import test from "node:test";

import {
  areaDoSensor, calibracaoDoSetup, lerFirmware, lerSetup, sugerirPlano,
} from "../experimentos/09-mapa-campo-espiras/coleta-setup.js";
import { conferirLimites, paraImpressora, planejarVarredura } from "../experimentos/09-mapa-campo-espiras/coleta-varredura.js";

const CURSO_TYCOON = { min: { x: -14, y: 0, z: 0 }, max: { x: 240, y: 250, z: 300 } };

// Falha que pega: sinal trocado em dx/dy ou dz mandaria o sensor para o lado oposto da bobina ou para dentro dela.
test("origem: com o bico em X0, Y0 o sensor fica sobre o centro, e z conta do plano do fio", () => {
  const setup = { dx: -60, dy: 15, dz: 25, hb: 100, xc: 100, yc: 120 };
  const calibracao = calibracaoDoSetup(setup);
  const bico = paraImpressora({ x: 0, y: 0, z: 30 }, calibracao);
  assert.equal(bico.X + setup.dx, setup.xc, "sensor no centro em X");
  assert.equal(bico.Y + setup.dy, setup.yc, "sensor no centro em Y");
  assert.equal(bico.Z - setup.dz - setup.hb, 30, "sensor 30 mm acima do plano do fio");
});

test("setup: campo vazio e sensor acima do bico são recusados", () => {
  assert.throws(() => lerSetup({ dx: "", dy: "0", dz: "25", hb: "100", xc: "120", yc: "125" }), /dx/);
  assert.throws(() => lerSetup({ dx: "0", dy: "0", dz: "-5", hb: "100", xc: "120", yc: "125" }), /abaixo da ponta do bico/);
});

// Falha que pega: o plano padrão fixo (±110 mm, bobina de 150 mm no meio da mesa) saía do curso com a espira de
// 100 mm perto da borda em Y, e a passada não começava. O sugerido tem de caber inteiro no curso do firmware.
test("plano sugerido cabe no curso real e passa pelo centro da bobina", () => {
  const setup = { dx: -40, dy: 0, dz: 25, hb: 100, xc: 81 - 40, yc: 190 };
  const campos = sugerirPlano({ dimensaoMm: 100, setup, curso: CURSO_TYCOON });
  const numero = (chave) => Number(campos[chave]);
  const plano = {
    x: { min: numero("xMin"), max: numero("xMax"), passo: numero("xPasso") },
    y: { min: numero("yMin"), max: numero("yMax"), passo: numero("yPasso") },
    alturas: campos.alturas.split(",").map(Number),
    referencia: { x: numero("refX"), y: numero("refY"), z: numero("refZ") },
    referenciaACadaLinhas: numero("refCada"),
  };
  const passos = planejarVarredura(plano);
  assert.deepEqual(conferirLimites(passos, calibracaoDoSetup(setup), { curso: CURSO_TYCOON }), []);
  assert.ok(passos.some((p) => p.tipo === "ponto" && p.x === 0 && p.y === 0), "a grade passa pelo centro");
  assert.equal(plano.x.passo, 10);
  // Y do centro em 190 com curso até 250: o lado +y é cortado em 60 mm, o lado −y vai até a margem cheia.
  assert.equal(plano.y.max, 60);
  assert.equal(plano.y.min, -80);
});

test("plano sugerido recusa centro fora do alcance do sensor e Z sem nenhuma altura possível", () => {
  assert.throws(() => sugerirPlano({ dimensaoMm: 100, setup: { dx: 0, dy: 0, dz: 25, hb: 100, xc: 400, yc: 100 }, curso: CURSO_TYCOON }), /não alcança/);
  assert.throws(() => sugerirPlano({ dimensaoMm: 100, setup: { dx: 0, dy: 0, dz: 25, hb: 290, xc: 120, yc: 100 }, curso: CURSO_TYCOON }), /Nenhuma altura/);
});

test("área do sensor desloca o curso do bico pelo dx, dy e dz", () => {
  const area = areaDoSensor(CURSO_TYCOON, { dx: -40, dy: 10, dz: 25, hb: 100, xc: 100, yc: 100 });
  assert.deepEqual(area.x, { min: -14 - 140, max: 240 - 140 });
  assert.deepEqual(area.y, { min: 0 - 90, max: 250 - 90 });
  assert.deepEqual(area.z, { min: -125, max: 175 });
});

test("firmware e máquina saem do M115 da Kywoo", () => {
  const linhas = ["FIRMWARE_NAME:Marlin 2.1.3 (Mar 9 2022) SOURCE_CODE_URL:github.com/MarlinFirmware/Marlin PROTOCOL_VERSION:1.0 MACHINE_TYPE:Tycoon Slim EXTRUDER_COUNT:1 UUID:cede2a2f"];
  assert.deepEqual(lerFirmware(linhas), { firmware: "Marlin 2.1.3 (Mar 9 2022)", maquina: "Tycoon Slim" });
  assert.equal(lerFirmware(["ok"]), null);
});
