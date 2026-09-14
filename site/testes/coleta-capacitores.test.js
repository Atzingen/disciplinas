import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("coletor RC preserva dados e rejeita aquisição incompleta ou inválida", () => {
  const result = spawnSync("python", ["-B", "-c", String.raw`
import importlib.util
import io
from pathlib import Path

path = Path('site/experimentos/07-carga-descarga-capacitores/coletar.py')
assert path.exists(), 'O coletor CSV precisa existir'
spec = importlib.util.spec_from_file_location('coletar', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SerialFixture:
    def __init__(self, lines):
        self.lines = iter(lines)
    def readline(self):
        return next(self.lines).encode('ascii')

header = 'fase,t_ms,adc,r_nominal_ohm\n'
rows = ['carga,0,0,47000\n', 'carga,20,1,47000\n',
        'descarga,0,1016,47000\n', 'descarga,20,1015,47000\n']
output = io.StringIO()
assert module.collect(SerialFixture([header, *rows, '# fim\n']), output) == 4
assert output.getvalue() == header + ''.join(rows)
for invalid in [
    [header, rows[0], '# interrompido\n'],
    [header, rows[0], '# fim\n'],
    [header, 'carga,0,1024,47000\n'],
    [header, rows[0], 'carga,0,2,47000\n'],
    [header, rows[0], 'descarga,0,800,68000\n'],
    ['# erro: descarregue o capacitor\n'],
]:
    try:
        module.collect(SerialFixture(invalid), io.StringIO())
    except (RuntimeError, ValueError):
        pass
    else:
        raise AssertionError(f'Aquisição inválida aceita: {invalid}')
print('Coleta completa, limites ADC, ordem temporal, resistor e interrupções verificados.')
`], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
