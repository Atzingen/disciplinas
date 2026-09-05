let mathModule;
let mathQueue = Promise.resolve();
const explorerControllers = new WeakMap();

function paragraph(text, className = '') {
  const node = document.createElement('p');
  node.textContent = text;
  node.className = className;
  return node;
}

export function clearSolutionMath(root) {
  for (const panel of root.querySelectorAll('.enade-solution')) {
    explorerControllers.get(panel)?.destroy();
    explorerControllers.delete(panel);
  }
  globalThis.MathJax?.typesetClear?.([root]);
}

export function createSolutionPanel(question) {
  const panel = document.createElement('details');
  panel.id = 'solucao';
  panel.className = 'enade-solution';
  const summary = document.createElement('summary');
  summary.append(document.createTextNode('Ver solução'));
  if (question.solution.status === 'rascunho') {
    const badge = document.createElement('span');
    badge.className = 'enade-draft-label';
    badge.textContent = 'Rascunho para conferência';
    summary.append(badge);
  }
  const content = document.createElement('div');
  content.className = 'enade-solution-content';
  panel.append(summary, content);
  let loaded = false;
  let loading;

  panel.loadSolution = () => {
    if (loading) return loading;
    if (loaded) return Promise.resolve();
    content.replaceChildren(paragraph('Carregando a resolução…'));
    content.setAttribute('aria-busy', 'true');
    loading = (async () => {
      try {
        if (question.solution.format !== 'html-fragment') {
          const link = document.createElement('a');
          link.href = question.solution.url;
          link.textContent = 'Abrir a página da resolução';
          content.replaceChildren(link);
          loaded = true;
          return;
        }
        const response = await fetch(new URL(question.solution.url, document.baseURI));
        if (!response.ok) throw new Error('HTTP '+response.status);
        const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
        const article = parsed.querySelector('.enade-worked-solution');
        if (article?.dataset.questionId !== question.id) throw new Error('Questão incompatível');
        if (!panel.isConnected) return;
        content.replaceChildren(document.importNode(article, true));
        loaded = true;
        if (content.querySelector('[data-enade-explorer]')) {
          try {
            const {mountExplorers} = await import('./enade-exploradores/index.js');
            if (!panel.isConnected) return;
            explorerControllers.set(panel, mountExplorers(content));
          } catch {
            content.append(paragraph('A exploração interativa não carregou. A resolução permanece disponível.', 'enade-math-notice'));
          }
        }
        mathQueue = mathQueue.catch(() => {}).then(async () => {
          mathModule ??= import('./matematica.js');
          const {typesetMath} = await mathModule;
          if (!panel.isConnected) return;
          if (!await typesetMath(content)) {
            content.prepend(paragraph('A notação está disponível em LaTeX. A renderização das fórmulas não carregou; recarregue a página para tentar novamente.', 'enade-math-notice'));
          }
        });
        await mathQueue;
      } catch {
        if (!panel.isConnected) return;
        loaded = false;
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'enade-button';
        retry.textContent = 'Tentar carregar a solução novamente';
        retry.addEventListener('click', () => panel.loadSolution());
        content.replaceChildren(paragraph('Não foi possível carregar esta resolução. O enunciado continua disponível.'), retry);
      } finally {
        loading = null;
        content.removeAttribute('aria-busy');
      }
    })();
    return loading;
  };

  panel.addEventListener('toggle', () => {
    if (panel.open) panel.loadSolution();
    else explorerControllers.get(panel)?.pause();
  });
  return panel;
}

export function createAnswerPanel(question, answerPdf) {
  const panel = document.createElement('details');
  panel.id = 'gabarito';
  panel.className = 'enade-answer';
  const summary = document.createElement('summary');
  summary.textContent = 'Ver gabarito';
  panel.append(summary);
  // The official alternative is inserted only after this separate control opens.
  panel.addEventListener('toggle', () => {
    if (!panel.open || panel.querySelector('.enade-answer-letter')) return;
    const link = document.createElement('a');
    link.href = answerPdf;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Conferir o gabarito em PDF';
    panel.append(paragraph('Alternativa '+question.answer, 'enade-answer-letter'),
      paragraph('Resposta do gabarito oficial fornecido para este caderno. A comparação com a resolução é manual.'), link);
  });
  return panel;
}
