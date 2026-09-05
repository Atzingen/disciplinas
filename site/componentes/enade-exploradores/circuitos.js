import {lamps, networks, equivalent} from '../../nucleo/enade-exploradores.js';
import {setup, fmt, line, label, circle} from './ui.js';

export function lampExplorer(root) {
  const ui = setup(root);
  const count = ui.range('Número de lâmpadas', 1, 12, 1, 6);
  const internal = ui.range('Resistência interna da pilha', 0, 3, 0.1, 1, 'Ω');
  function update() {
    const n = +count.value;
    const result = lamps(n, +internal.value);
    let drawing = line(70, 65, 600, 65)+line(70, 215, 600, 215)+line(70, 65, 70, 130)+line(70, 143, 70, 215);
    drawing += line(55, 130, 85, 130)+line(61, 143, 79, 143)+label(45, 173, '6 V')+label(120, 35, `Cada ramo: ${fmt(result.voltage)} V`);
    for (let i = 0; i < n; i++) {
      const x = 140+i*450/Math.max(1,n-1);
      drawing += line(x,65,x,122)+line(x,158,x,215)+circle(x,140,18,`class="explorer-lamp" style="fill-opacity:${Math.min(1,.1+result.branchPower/3)}"`)+line(x-9,131,x+9,149)+line(x-9,149,x+9,131);
    }
    drawing += label(320, 257, `r = ${fmt(+internal.value)} Ω (dentro da pilha)`,'text-anchor="middle"');
    ui.draw('Lâmpadas em paralelo ligadas à pilha; o preenchimento representa a potência relativa.', drawing);
    ui.report([['Tensão nas lâmpadas',fmt(result.voltage)+' V'],['Corrente por lâmpada',fmt(result.branchCurrent)+' A'],['Corrente total',fmt(result.current)+' A'],['Potência por lâmpada',fmt(result.branchPower)+' W']]);
    ui.caption.textContent = Math.abs(result.voltage-3)<1e-8 ? 'Ponto nominal: 3 V e 0,5 A em cada lâmpada.' : result.voltage>3 ? 'Acima da tensão nominal: o modelo prevê maior potência. Isso pode danificar uma lâmpada real.' : 'Abaixo da tensão nominal: cada lâmpada recebe menor potência.';
  }
  ui.on(ui.controls,'input',update); ui.reset(update); update();
  return {pause() {}, destroy: ui.destroy};
}

// Layout follows the same series/parallel tree as the equivalent-resistance model.
function drawNetwork(tree, x1, x2, y, spread) {
  if (typeof tree === 'number') {
    const mid = (x1+x2)/2;
    return line(x1,y,mid-12,y)+`<rect x="${mid-12}" y="${y-9}" width="24" height="18"/>`+line(mid+12,y,x2,y)+label(mid,y-15,'R','text-anchor="middle"');
  }
  if (tree.series) {
    const size = (x2-x1)/tree.series.length;
    return tree.series.map((part,i) => drawNetwork(part,x1+i*size,x1+(i+1)*size,y,spread)).join('');
  }
  const parts = tree.parallel;
  const top = y-spread/2;
  return line(x1,top,x1,top+spread)+line(x2,top,x2,top+spread)+parts.map((part,i) => {
    const branchY = top+i*spread/(parts.length-1);
    return circle(x1,branchY,3,'class="explorer-node"')+circle(x2,branchY,3,'class="explorer-node"')+line(x1,branchY,x1+18,branchY)+drawNetwork(part,x1+18,x2-18,branchY,spread*.35)+line(x2-18,branchY,x2,branchY);
  }).join('');
}
export function networkExplorer(root) {
  const ui = setup(root);
  const choice = ui.select('Associação', {A:'Circuito A',B:'Circuito B',C:'Circuito C',D:'Circuito D'}, 'A');
  const resistance = ui.range('Cada resistor R', 10, 200, 10, 100, 'Ω');
  function update() {
    const r = equivalent(networks[choice.value], +resistance.value);
    ui.draw('Redesenho por conectividade do circuito '+choice.value, label(24,145,'a')+line(40,140,80,140)+drawNetwork(networks[choice.value],80,555,140,130)+line(555,140,602,140)+label(612,145,'b'));
    ui.caption.textContent = 'Cada retângulo é um resistor R. Fios ligados pelo mesmo nó têm o mesmo potencial. Fonte ideal de 10 V entre a e b.';
    ui.report([['Resistência equivalente',fmt(r)+' Ω'],['Corrente para 10 V',fmt(10000/r)+' mA'],['Razão R equivalente / R',fmt(r/+resistance.value,3)]]);
  }
  ui.on(ui.controls,'input',update); ui.reset(update); update();
  return {pause() {}, destroy: ui.destroy};
}
