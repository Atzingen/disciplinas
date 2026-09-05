import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const data = JSON.parse(readFileSync(new URL('../enade/catalogo.json', import.meta.url)));
let model = {};
try { model = await import('../componentes/enade-model.js'); } catch {}

test('catálogo mantém a numeração de cada caderno e os 136 gabaritos', () => {
  assert.equal(data.questions.length, 137);
  assert.equal(new Set(data.questions.map(q => q.id)).size, 137);
  for (const exam of data.exams) {
    const objective = data.questions.filter(q => q.examId === exam.id && q.kind === 'objetiva');
    assert.deepEqual(objective.map(q => q.number), Array.from({length: exam.last-exam.first+1}, (_,i) => exam.first+i));
    assert.ok(objective.every(q => /^[ABCD]$/.test(q.answer)));
  }
  assert.equal(data.questions.find(q => q.id === '2024-discursiva').answer, null);
});

test('todo item possui tema, imagens existentes e contexto completo', () => {
  const topics = new Set(data.topics.map(t => t.id));
  const contexts = new Map(data.contexts.map(c => [c.id,c]));
  for (const q of data.questions) {
    assert.ok(q.title && q.topics.length && q.topics.every(t => topics.has(t)), q.id);
    assert.ok(q.segments.length, q.id);
    for (const id of q.contextIds) assert.ok(contexts.has(id), `${q.id}: ${id}`);
  }
  for (const item of [...data.questions, ...data.contexts]) {
    for (const image of item.segments) {
      assert.ok(existsSync(new URL('../enade/'+image.src, import.meta.url)), image.src);
      assert.ok(image.width > 0 && image.height > 0, image.src);
    }
  }
  assert.deepEqual(data.questions.find(q => q.id === '2024-q50').segments.map(s => s.page), [36,37]);
  for (const n of [31,32,33]) assert.deepEqual(data.questions.find(q => q.id === `2025-regular-q${n}`).contextIds, ['2025-regular-contexto-31-33']);
  assert.equal(data.contexts.find(c => c.id === '2025-regular-contexto-68-70').segments[0].page, 34);
});

test('os seis PDFs preservam tamanho e hash do inventário', () => {
  const sources = JSON.parse(readFileSync(new URL('../enade/fontes.json', import.meta.url)));
  assert.equal(sources.files.length, 6);
  for (const file of sources.files) {
    const bytes = readFileSync(new URL('../enade/'+file.localPath, import.meta.url));
    assert.equal(bytes.length, file.bytes);
    assert.equal(bytes.subarray(0,5).toString(), '%PDF-');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  }
});

test('filtros combinam ano, aplicação e conteúdo com busca sem acentos', () => {
  assert.equal(typeof model.filterQuestions, 'function');
  const results = model.filterQuestions(data, {year:'2025',application:'reaplicacao',topic:'optica',query:'difracao'});
  assert.deepEqual(results.map(q => q.id), ['2025-reaplicacao-q40']);
  assert.equal(model.filterQuestions(data, {year:'2024'}).length, 37);
  assert.equal(model.filterQuestions(data, {year:'2025'}).length, 100);
  assert.equal(model.filterQuestions(data, {kind:'discursiva'}).length, 1);
  assert.equal(model.filterQuestions(data, {year:'2024',application:'reaplicacao'}).length, 0);
});

test('busca inclui o texto-base e resolução não confunde gabarito com comentário', () => {
  assert.equal(typeof model.filterQuestions, 'function');
  assert.ok(model.filterQuestions(data, {year:'2025',query:'pororoca'}).some(q => q.id === '2025-reaplicacao-q32'));
  assert.equal(model.filterQuestions(data, {status:'resolvida'}).length, 27);
  assert.equal(model.filterQuestions(data, {status:'rascunho'}).length, 0);
  assert.equal(model.filterQuestions(data, {status:'pendente'}).length, 110);
  const future = {...data, questions:[{...data.questions[0], solution:{url:'resolucoes/exemplo.html'}}]};
  assert.equal(model.filterQuestions(future, {status:'resolvida'}).length, 1);
  const draft = {...data, questions:[{...data.questions[0], solution:{url:'resolucoes/exemplo.html', status:'rascunho'}}]};
  assert.equal(model.filterQuestions(draft, {status:'rascunho'}).length, 1);
});

test('links diretos preservam filtros e rejeitam paginação inválida', () => {
  assert.equal(typeof model.readState, 'function');
  assert.equal(typeof model.stateQuery, 'function');
  const state = model.readState('?ano=2025&aplicacao=regular&topico=ondas&busca=corda&pagina=2&questao=2025-regular-q76');
  assert.equal(state.question, '2025-regular-q76');
  assert.equal(state.page, 2);
  assert.deepEqual(model.readState(model.stateQuery(state)), state);
  for (const page of ['-1','0','abc','Infinity','1.5']) assert.equal(model.readState('?pagina='+page).page, 1);
});
