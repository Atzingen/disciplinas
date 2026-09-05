export const fmt = (value, digits = 2) => value.toLocaleString('pt-BR', {maximumFractionDigits: digits});
export function node(tag, text = '', className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}
export function setup(root) {
  const abort = new AbortController();
  const on = (element, event, callback) => element.addEventListener(event, callback, {signal: abort.signal});
  const controls = node('div', '', 'explorer-controls');
  const figure = node('figure', '', 'explorer-figure');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 640 280');
  svg.setAttribute('role', 'img');
  const caption = node('figcaption');
  figure.append(svg, caption);
  const results = node('div', '', 'explorer-results');
  results.setAttribute('aria-live', 'polite');
  results.setAttribute('aria-atomic', 'true');
  const actions = node('div', '', 'explorer-actions');
  const reset = node('button', 'Restaurar valores iniciais', 'enade-button');
  reset.type = 'button';
  actions.append(reset);
  const live = node('div', '', 'explorer-live tex2jax_ignore');
  live.append(figure, controls, results, actions);
  root.insertBefore(live, root.querySelector('.explorer-model'));
  const defaults = [];
  const range = (label, min, max, step, value, unit = '') => {
    const wrapper = node('label');
    const text = node('span', label);
    const output = node('output');
    const input = document.createElement('input');
    input.type = 'range';
    Object.assign(input, {min, max, step, value});
    input.setAttribute('aria-label', label);
    const refresh = () => {output.textContent = fmt(+input.value, 3) + (unit ? ' '+unit : '');};
    on(input, 'input', refresh);
    refresh();
    defaults.push(() => {input.value = value; refresh();});
    wrapper.append(text, output, input);
    controls.append(wrapper);
    return input;
  };
  const select = (label, options, value) => {
    const wrapper = node('label', label);
    const input = document.createElement('select');
    input.setAttribute('aria-label', label);
    for (const [key, title] of Object.entries(options)) {
      const option = node('option', title); option.value = key; input.append(option);
    }
    input.value = value;
    defaults.push(() => {input.value = value;});
    wrapper.append(input); controls.append(wrapper);
    return input;
  };
  const draw = (title, markup) => {
    svg.setAttribute('aria-label', title);
    // Markup comes only from our numeric models and fixed labels, never user HTML.
    svg.innerHTML = '<title>'+title+'</title>'+markup;
  };
  const report = items => results.replaceChildren(...items.map(([label, value]) => {
    const item = node('p'); item.append(node('span', label), node('strong', value)); return item;
  }));
  return {on, range, select, draw, report, svg, controls, actions, caption, results,
    reset(update) {on(reset, 'click', () => {defaults.forEach(restore => restore()); update();});},
    button(label, callback) {const button = node('button', label, 'enade-button'); button.type = 'button'; on(button, 'click', callback); actions.append(button); return button;},
    destroy() {abort.abort(); live.remove();}};
}
export const line = (x1, y1, x2, y2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
export const label = (x, y, text, extra = '') => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
export const circle = (x, y, r, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
