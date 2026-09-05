const fields = {year:'ano', application:'aplicacao', topic:'topico', kind:'tipo', status:'resolucao', query:'busca', page:'pagina', question:'questao'};

export function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function filterQuestions(data, filters = {}) {
  const exams = new Map(data.exams.map(exam => [exam.id, exam]));
  const contexts = new Map(data.contexts.map(context => [context.id, context.text]));
  const terms = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  return data.questions.filter(question => {
    const exam = exams.get(question.examId);
    if (filters.year && String(exam.year) !== filters.year) return false;
    if (filters.application && exam.application !== filters.application) return false;
    if (filters.topic && !question.topics.includes(filters.topic)) return false;
    if (filters.kind && question.kind !== filters.kind) return false;
    if (filters.status === 'resolvida' && !question.solution?.url) return false;
    if (filters.status === 'pendente' && question.solution?.url) return false;
    const content = normalize([question.title, question.number, question.text, ...question.keywords,
      ...question.contextIds.map(id => contexts.get(id))].join(' '));
    return terms.every(term => content.includes(term));
  });
}

export function readState(search) {
  const params = new URLSearchParams(search);
  const state = Object.fromEntries(Object.entries(fields).map(([key,param]) => [key,params.get(param) ?? '']));
  const page = Number(state.page);
  state.page = Number.isSafeInteger(page) && page > 0 ? page : 1;
  return state;
}

export function stateQuery(state) {
  const params = new URLSearchParams();
  for (const [key,param] of Object.entries(fields)) {
    if (state[key] && !(key === 'page' && state.page === 1)) params.set(param, state[key]);
  }
  return params.size ? '?'+params : '';
}
