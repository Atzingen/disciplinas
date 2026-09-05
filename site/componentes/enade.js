import { filterQuestions, readState, stateQuery } from './enade-model.js';
import { createSolutionPanel, createAnswerPanel, clearSolutionMath } from './enade-solucao.js';

const pageSize = 12;
const form = document.querySelector('#filters');
const catalogue = document.querySelector('#catalogue-view');
const reader = document.querySelector('#reader-view');
const list = document.querySelector('#question-list');
let data;
let state = readState(location.search);
let exams;
let topics;
let contexts;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(label, url, className = '') {
  const anchor = element('a', className, label);
  anchor.href = url;
  return anchor;
}

function routeLink(label, changes, className = '') {
  const anchor = link(label, stateQuery({...state, ...changes}) || './', className);
  anchor.dataset.enadeRoute = '';
  return anchor;
}

function sourceLink(label, url) {
  const anchor = link(label, url);
  anchor.target = '_blank';
  anchor.rel = 'noopener';
  return anchor;
}

function questionLabel(question) {
  return question.kind === 'discursiva' ? 'Questão discursiva' : 'Questão '+question.number;
}

function tags(question) {
  const container = element('div', 'enade-tags');
  question.topics.forEach(id => container.append(element('span', '', topics.get(id))));
  return container;
}

function syncForm() {
  for (const key of ['year','application','topic','kind','status','query']) {
    form.elements[key].value = state[key];
    if (form.elements[key].tagName === 'SELECT' && form.elements[key].selectedIndex < 0) {
      form.elements[key].value = '';
      state[key] = '';
    }
  }
}

function navigate(next, {replace = false, focus = false} = {}) {
  state = next;
  const url = stateQuery(state) || location.pathname;
  history[replace ? 'replaceState' : 'pushState'](null, '', url);
  syncForm();
  render();
  if (focus) {
    const heading = state.question ? reader.querySelector('h1') : document.querySelector('#catalogue-title');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({preventScroll:true});
    window.scrollTo({top:0, behavior:'instant'});
  }
}

function card(question) {
  const exam = exams.get(question.examId);
  const article = element('article', 'enade-card');
  const number = element('div', 'enade-number'+(question.number ? '' : ' enade-number--discursive'), question.number ? String(question.number).padStart(2,'0') : 'Disc.');
  number.setAttribute('aria-hidden','true');
  number.append(element('small', '', String(exam.year)));
  const copy = element('div');
  copy.append(element('p','enade-meta',exam.title+' · '+exam.booklet));
  const heading = element('h2');
  heading.append(routeLink(question.title, {question:question.id}));
  copy.append(heading, tags(question));
  const action = element('div', 'enade-card-action');
  const open = routeLink('Abrir questão', {question:question.id}, 'enade-open');
  open.setAttribute('aria-label','Abrir '+questionLabel(question).toLowerCase()+' — '+exam.title);
  const solutionLabel = question.solution?.status === 'rascunho' ? 'Solução em conferência' : (question.solution?.url ? 'Resolução disponível' : 'Sem resolução comentada');
  action.append(open, element('small','',solutionLabel));
  article.append(number,copy,action);
  return article;
}

function renderCatalogue(results) {
  const count = results.length;
  const pages = Math.max(1,Math.ceil(count/pageSize));
  state.page = Math.min(state.page,pages);
  history.replaceState(null,'',stateQuery(state) || location.pathname);
  const offset = (state.page-1)*pageSize;
  list.replaceChildren(...results.slice(offset,offset+pageSize).map(card));
  document.querySelector('#empty-state').hidden = count > 0;
  document.querySelector('#result-count').textContent = count ? count+' de '+data.questions.length+' questões · exibindo '+(offset+1)+'–'+Math.min(offset+pageSize,count) : '0 de '+data.questions.length+' questões';
  const pagination = document.querySelector('#pagination');
  pagination.replaceChildren();
  if (count > pageSize) {
    for (const [label, page, disabled] of [['Anterior',state.page-1,state.page===1],['Próxima',state.page+1,state.page===pages]]) {
      const button = element('button','enade-button',label);
      button.type = 'button';
      button.disabled = disabled;
      button.addEventListener('click',() => {
        navigate({...state,page});
        document.querySelector('#result-count').scrollIntoView({block:'start',behavior:'instant'});
      });
      pagination.append(button);
      if (label === 'Anterior') pagination.append(element('span','','Página '+state.page+' de '+pages));
    }
  }
  const editions = document.querySelector('#edition-links');
  editions.replaceChildren();
  for (const exam of data.exams) {
    const count = data.questions.filter(q => q.examId === exam.id).length;
    const anchor = routeLink(exam.title, {year:String(exam.year), application:exam.application, page:1, question:''}, 'enade-edition');
    anchor.append(element('small','',count+' itens'));
    anchor.setAttribute('aria-current',String(state.year===String(exam.year) && state.application===exam.application));
    editions.append(anchor);
  }
}

function figures(segments, label) {
  return segments.map((segment,index) => {
    const figure = element('figure', segment.crop[2]-segment.crop[0]<300 ? 'narrow' : '');
    const image = element('img');
    image.src = segment.src;
    image.width = segment.width;
    image.height = segment.height;
    image.alt = label+' — recorte original, página '+segment.page+(segments.length>1 ? ', parte '+(index+1) : '');
    image.loading = 'lazy';
    image.decoding = 'async';
    figure.append(image,element('figcaption','','Página '+segment.page+' do caderno original'));
    return figure;
  });
}

function renderReader(results) {
  clearSolutionMath(reader);
  reader.replaceChildren();
  const question = data.questions.find(q => q.id === state.question);
  if (!question) {
    reader.append(routeLink('Voltar ao catálogo',{question:''}),element('h1','','Questão não encontrada'),element('p','','Este link não corresponde a uma questão do acervo. Volte ao catálogo para escolher uma questão.'));
    return;
  }
  const exam = exams.get(question.examId);
  const references = question.contextIds.map(id => contexts.get(id));
  document.title = questionLabel(question)+' · '+exam.title+' | Enade Física';
  const nav = element('div','enade-reader-nav');
  nav.append(routeLink('← Voltar ao catálogo',{question:''}));
  const tools = element('div','enade-reader-tools');
  const projection = element('button','enade-button',document.body.classList.contains('enade-classroom') ? 'Sair do modo aula' : 'Modo aula');
  projection.type = 'button';
  projection.setAttribute('aria-pressed',String(document.body.classList.contains('enade-classroom')));
  projection.addEventListener('click',() => {
    const active = document.body.classList.toggle('enade-classroom');
    projection.textContent = active ? 'Sair do modo aula' : 'Modo aula';
    projection.setAttribute('aria-pressed',String(active));
  });
  const print = element('button','enade-button','Imprimir questão');
  print.type = 'button';
  print.addEventListener('click',async () => {
    const solution = reader.querySelector('.enade-solution[open]');
    if (solution) await solution.loadSolution();
    const images = [...reader.querySelectorAll('img')];
    images.forEach(image => image.loading='eager');
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    window.print();
  });
  tools.append(projection, print);
  nav.append(tools);
  const header = element('header','enade-reader-header');
  header.append(element('p','enade-meta',exam.title+' · '+exam.booklet+' · '+questionLabel(question)),element('h1','',question.title),tags(question));
  const layout = element('div','enade-reader-layout');
  const body = element('div');
  const paper = element('article','enade-question-paper');
  for (const context of references) {
    const section = element('section');
    section.append(element('h2','','Texto-base e figuras'),...figures(context.segments,'Texto-base das questões '+context.first+' a '+context.last));
    paper.append(section);
  }
  const questionBody = element('section','enade-question-body');
  questionBody.append(element('h2','',questionLabel(question)),...figures(question.segments,questionLabel(question)));
  paper.append(questionBody);
  body.append(paper);
  if (question.solution?.url) body.append(createSolutionPanel(question));
  else {
    const pending = element('section','enade-solution-pending');
    pending.append(element('h2','','Resolução comentada'), element('p','',question.kind==='discursiva' ? 'Ainda não há uma resolução comentada. O material fornecido não inclui padrão de resposta para esta discursiva.' : 'Ainda não há uma resolução comentada para esta questão.'));
    body.append(pending);
  }
  if (question.answer) body.append(createAnswerPanel(question, exam.answerPdf));
  const transcript = element('details','enade-transcript');
  transcript.append(element('summary','','Consultar texto extraído'),element('p','','Texto auxiliar para leitura e busca. Fórmulas, tabelas e figuras podem perder informação na extração; confira o enunciado original acima.'));
  for (const item of [...references,question]) transcript.append(element('pre','',item.text));
  body.append(transcript);
  const aside = element('aside','enade-reader-aside');
  const pages = [...new Set([...references.flatMap(c => c.segments),...question.segments].map(s => s.page))];
  aside.append(element('h2','','Neste caderno'),element('p','',pages.length===1 ? 'Página '+pages[0] : 'Páginas '+pages.join(', ')));
  aside.append(sourceLink('Abrir prova original',exam.pdf+'#page='+question.segments[0].page),sourceLink('Baixar prova completa',exam.pdf));
  aside.append(element('h2','','Conceitos'),element('p','',question.keywords.join(' · ')));
  layout.append(body,aside);
  const bottom = element('nav','enade-reader-bottom');
  bottom.setAttribute('aria-label','Navegar pelas questões filtradas');
  const index = results.findIndex(q => q.id === question.id);
  if (index > 0) bottom.append(routeLink('← Questão anterior',{question:results[index-1].id},'enade-button'));
  bottom.append(element('p','',index<0 ? 'Esta questão está fora dos filtros atuais.' : (index+1)+' de '+results.length+' nos filtros atuais'));
  if (index>=0 && index<results.length-1) bottom.append(routeLink('Próxima questão →',{question:results[index+1].id},'enade-button'));
  reader.append(nav,header,layout,bottom);
  if (location.hash === '#solucao') {
    const solution = reader.querySelector('.enade-solution');
    if (solution) solution.open = true;
  }
}

function render() {
  if (!data) return;
  const results = filterQuestions(data,state);
  catalogue.hidden = Boolean(state.question);
  reader.hidden = !state.question;
  if (state.question) renderReader(results);
  else {
    clearSolutionMath(reader);
    reader.replaceChildren();
    document.body.classList.remove('enade-classroom');
    document.title = 'Enade · Física | Gustavo von Atzingen';
    renderCatalogue(results);
  }
}

function clear() { navigate(readState('')); }
document.querySelector('#clear-filters').addEventListener('click',clear);
document.querySelector('[data-clear]').addEventListener('click',clear);
form.addEventListener('submit',event => event.preventDefault());
form.addEventListener('input',event => {
  if (!data) return;
  const next = {...state, page:1, question:''};
  for (const key of ['year','application','topic','kind','status','query']) next[key]=form.elements[key].value;
  navigate(next,{replace:event.target.name==='query'});
});
document.addEventListener('click',event => {
  const anchor = event.target.closest('a[data-enade-route]');
  if (!anchor || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  navigate(readState(new URL(anchor.href).search),{focus:true});
});
window.addEventListener('popstate',() => {state=readState(location.search);if(data){syncForm();render();}});
document.addEventListener('keydown',event => {
  if (event.key==='Escape' && document.body.classList.contains('enade-classroom')) {
    document.body.classList.remove('enade-classroom');
    render();
  }
});
document.querySelector('#retry-load').addEventListener('click',() => location.reload());

try {
  const response = await fetch(new URL('../enade/catalogo.json',import.meta.url));
  if (!response.ok) throw new Error('HTTP '+response.status);
  data = await response.json();
  const drafts = data.questions.filter(q => q.solution?.status === 'rascunho').length;
  const notice = document.querySelector('#review-notice');
  notice.hidden = drafts === 0;
  notice.textContent = drafts+' soluções em rascunho, aguardando conferência. A alternativa proposta fica em “Ver solução”; o gabarito oficial tem um controle separado.';
  exams = new Map(data.exams.map(exam => [exam.id,exam]));
  topics = new Map(data.topics.map(topic => [topic.id,topic.label]));
  contexts = new Map(data.contexts.map(context => [context.id,context]));
  for (const topic of data.topics) {
    const option = element('option','',topic.label);
    option.value=topic.id;
    form.elements.topic.append(option);
  }
  syncForm();
  render();
} catch (error) {
  document.querySelector('#load-error').hidden=false;
  document.querySelector('#result-count').textContent='Acervo indisponível no momento.';
  console.error('Não foi possível carregar o catálogo Enade.',error);
}
