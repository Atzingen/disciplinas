import {flux, inducedEmf} from '../../nucleo/enade-exploradores.js';
import {setup, fmt, line, label, circle} from './ui.js';

export function inductionExplorer(root) {
  const ui = setup(root);
  const position = ui.range('Posição do ímã no eixo', -4, 4, .01, -3.5, 'u.r.');
  const polarity = ui.select('Orientação do ímã', {'1':'Polo N à direita','-1':'Polo S à direita'}, '1');
  let previous = +position.value;
  let timestamp = performance.now();
  let frame = 0;
  let idle = 0;
  let dragging = false;
  ui.results.setAttribute('aria-live','off');
  function paint(emf = 0) {
    const x = 320+60*(+position.value);
    let drawing = line(40,112,600,112,'class="explorer-axis"');
    for (let i=0;i<5;i++) drawing += `<ellipse cx="${304+i*8}" cy="112" rx="13" ry="58"/>`;
    drawing += `<rect x="${x-44}" y="95" width="88" height="34" rx="4" class="explorer-magnet"/>`+line(x,95,x,129)+label(x-23,117,+polarity.value===1?'S':'N','text-anchor="middle"')+label(x+23,117,+polarity.value===1?'N':'S','text-anchor="middle"');
    drawing += label(320,28,'Bobina fixa','text-anchor="middle"')+circle(320,225,32)+line(320,225,320+26*Math.sin(Math.atan(emf)),225-26*Math.cos(Math.atan(emf)),'class="explorer-accent"')+label(275,232,'−')+label(360,232,'+')+label(320,276,'Tensão induzida','text-anchor="middle"');
    ui.draw('Arraste o ímã no eixo horizontal ou use o controle de posição abaixo.',drawing);
    ui.report([['Fluxo relativo',fmt(flux(+position.value,+polarity.value),3)],['Tensão relativa',fmt(emf,3)],['Estado',Math.abs(emf)<1e-8?'Sem variação de fluxo':'Fluxo variando']]);
    ui.caption.textContent = Math.abs(emf)<1e-8 ? 'Ímã parado: pode haver fluxo, mas a tensão induzida é zero.' : 'O sinal indica o sentido da tensão para a orientação escolhida; inverter o movimento inverte esse sinal.';
  }
  function move(value) {
    const now = performance.now();
    const emf = inducedEmf(previous,value,Math.max(.016,(now-timestamp)/1000),+polarity.value);
    position.value = value;
    position.dispatchEvent(new Event('input', {bubbles:false}));
    previous = +position.value; timestamp = now; paint(emf);
    clearTimeout(idle); idle = setTimeout(() => paint(),180);
  }
  function pause() {
    cancelAnimationFrame(frame); frame=0; clearTimeout(idle); dragging=false;
    previous=+position.value; timestamp=performance.now(); paint();
  }
  ui.on(position,'input',event => {
    if (!event.bubbles) return;
    cancelAnimationFrame(frame); frame=0; move(+position.value);
  });
  ui.on(polarity,'change',pause);
  ui.svg.classList.add('explorer-draggable');
  const pointToValue = event => {
    const rect = ui.svg.getBoundingClientRect();
    return Math.max(-4, Math.min(4, ((event.clientX-rect.left)/rect.width*640-320)/60));
  };
  ui.on(ui.svg,'pointerdown',event => {
    if (event.button!==0) return;
    pause(); dragging=true; ui.svg.setPointerCapture(event.pointerId); move(pointToValue(event));
  });
  ui.on(ui.svg,'pointermove',event => {if(dragging) move(pointToValue(event));});
  for(const name of ['pointerup','pointercancel','lostpointercapture']) ui.on(ui.svg,name,pause);
  function approach(duration) {
    pause(); move(-3.5); paint();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const emf=inducedEmf(-3.5,-.5,duration,+polarity.value);
      position.value=-.5; position.dispatchEvent(new Event('input'));
      previous=-.5;
      paint();
      ui.caption.textContent=`Movimento reduzido: deslocamento de −3,5 a −0,5 em ${duration} s. Tensão média relativa durante o percurso: ${fmt(emf,3)}. Ao parar, a tensão volta a zero.`;
      return;
    }
    const start=performance.now();
    const tick = now => {
      const progress=Math.min(1,(now-start)/(duration*1000));
      move(-3.5+3*progress);
      if(progress<1) frame=requestAnimationFrame(tick); else {frame=0; pause();}
    };
    frame=requestAnimationFrame(tick);
  }
  ui.button('Aproximar devagar · 4 s',()=>approach(4));
  ui.button('Aproximar rápido · 1 s',()=>approach(1));
  ui.button('Parar',pause);
  ui.reset(pause); paint();
  return {pause, destroy() {pause(); ui.destroy();}};
}
