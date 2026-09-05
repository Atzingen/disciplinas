import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const base = new URL('../enade/', import.meta.url);
const data = JSON.parse(readFileSync(new URL('catalogo.json', base)));
const manifest = JSON.parse(readFileSync(new URL('solucoes/manifesto.json', base)));
const editorial = JSON.parse(readFileSync(new URL('classificacao.json', base)));

test('as 27 soluções têm publicação autorizada, sem comparação automática com o gabarito', () => {
  const selected = data.questions.filter(q => q.topics.includes('eletromagnetismo'));
  assert.equal(selected.length, 27);
  assert.deepEqual(Object.keys(manifest.questions).sort(), selected.map(q => q.id).sort());
  assert.equal(manifest.comparedWithOfficialKey, false);
  assert.equal(manifest.status, 'publicada');
  assert.equal(manifest.publicationAuthorizedAt, '2026-09-05');
  for (const question of selected) {
    const solution = question.solution;
    assert.equal(solution.status, 'publicada');
    assert.equal(manifest.questions[question.id].status, solution.status);
    assert.equal(solution.format, 'html-fragment');
    assert.deepEqual(editorial.questions[question.id].solution, solution);
    const html = readFileSync(new URL(solution.url, base), 'utf8');
    assert.ok(html.includes('data-question-id="'+question.id+'"'), question.id);
    assert.ok(html.includes('data-proposed-answer="'+manifest.questions[question.id].proposedAlternative+'"'));
    assert.ok(!/class="solution-step"|Passo \d/.test(html), question.id);
    assert.ok(html.includes('class="solution-article"'), question.id);
    assert.ok(html.includes('Conceitos e referências'), question.id);
    assert.ok(html.includes('https://'), question.id);
    assert.equal((html.match(/\\\[/g) ?? []).length, (html.match(/\\\]/g) ?? []).length, question.id);
    assert.equal((html.match(/\\\(/g) ?? []).length, (html.match(/\\\)/g) ?? []).length, question.id);
    assert.ok(!/<script\b|\son\w+=/i.test(html), question.id);
  }
});

test('balanços numéricos conferem unidades, multiplicidades e hipóteses das resoluções', () => {
  // These are independent calculations from the statements, not answer-key checks.
  const pumpPower = 220 * 1;
  assert.equal(pumpPower / 22 * 60 * 24 / (4 * 40), 90);
  assert.equal((6 - 3) / 1 / 0.5, 6);
  assert.equal(110 * 15 - 100, 1550);
  const schoolEnergy = (1500 * 1 + 400 * 10 + 4 * 15 * 6) / 1000 * 30;
  assert.ok(Math.abs(schoolEnergy - 175.8) < 1e-10);
  assert.equal((1100 + 1540) / 220 * 1.25, 15);
  assert.equal((220 * 2 / 1000 * 48 * 0.60).toFixed(2), '12.67');
  assert.equal(0.3 * 400e6 * 3600 / (10 * 100) / 1000, 432000);
});

test('a comparação dos circuitos usa os nós dos fios ideais e não a disposição gráfica', () => {
  const parallel = (...r) => 1 / r.reduce((sum, value) => sum + 1 / value, 0);
  const r = {
    A: 1 + parallel(1, 1, 2),
    B: parallel(1, 1, 3),
    C: parallel(2, 2, 1),
    D: parallel(1, 1 + parallel(1, 2)),
  };
  for (const [key, value] of Object.entries({A:7/5, B:3/7, C:1/2, D:5/8})) {
    assert.ok(Math.abs(r[key] - value) < 1e-12);
  }
  assert.deepEqual(Object.keys(r).sort((a,b) => r[a]-r[b]), ['B','C','D','A']);
});
