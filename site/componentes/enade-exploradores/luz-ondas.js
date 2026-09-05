import {metals, photoelectric, standingWave} from '../../nucleo/enade-exploradores.js';
import {setup, fmt, line, label, circle} from './ui.js';

export function photoExplorer(root) {
  const ui=setup(root);
  const metal=ui.select('Superfície metálica',Object.fromEntries(Object.entries(metals).map(([key,value])=>[key,value.label+' · '+fmt(value.work)+' eV'])),'zinco');
  const wavelength=ui.range('Comprimento de onda da luz',200,800,1,250,'nm');
  const intensity=ui.range('Intensidade relativa da luz',0,100,1,50,'%');
  function update() {
    const material=metals[metal.value];
    const result=photoelectric(+wavelength.value,material.work,+intensity.value);
    const energyWidth=result.photonEnergy*65;
    const workWidth=material.work*65;
    ui.draw('Comparação da energia de um fóton com a energia necessária para retirar um elétron.',
      label(36,35,'Energia por fóton')+`<rect x="36" y="48" width="${energyWidth}" height="30" class="explorer-fill"/>`+label(36+energyWidth+10,70,fmt(result.photonEnergy)+' eV')+
      label(36,112,'Função trabalho do metal')+`<rect x="36" y="125" width="${workWidth}" height="30" class="explorer-secondary"/>`+label(36+workWidth+10,147,fmt(material.work)+' eV')+
      label(36,191,result.emitting?'O excedente pode virar energia cinética.':+intensity.value===0?'Luz desligada: nenhum fóton incide.':'O fóton não fornece energia suficiente.')+
      (result.emitting?`<rect x="36" y="207" width="${Math.max(.2,result.kinetic*65)}" height="25" class="explorer-fill"/>`+label(36+result.kinetic*65+10,227,fmt(result.kinetic)+' eV'):''));
    ui.report([['Limite de comprimento de onda',fmt(result.thresholdNm,1)+' nm'],['Emissão',result.emitting?'Permitida pelo modelo':'Não ocorre'],['Energia cinética máxima',result.emitting?fmt(result.kinetic)+' eV':'—'],['Intensidade ajustada',fmt(+intensity.value)+' %']]);
    ui.caption.textContent='Aumente a intensidade mantendo a cor: acima do limiar, mais elétrons podem sair, mas a energia máxima de cada um permanece igual. As barras comparam energias; não representam número de elétrons.';
  }
  ui.on(ui.controls,'input',update); ui.reset(update); update();
  return {pause() {}, destroy:ui.destroy};
}

export function waveExplorer(root) {
  const ui=setup(root);
  const harmonic=ui.range('Número de ventres',1,5,1,3);
  const length=ui.range('Comprimento da região',.2,2,.1,1,'m');
  let frame=0, phase=0, start=0;
  function draw() {
    const n=+harmonic.value, l=+length.value;
    let drawing=line(35,128,605,128,'class="explorer-axis"');
    for(const sign of [-1,1]) {
      const envelope=Array.from({length:241},(_,i)=>`${35+i*570/240},${128+sign*65*Math.abs(Math.sin(n*Math.PI*i/240))}`).join(' ');
      drawing+=`<polyline points="${envelope}" class="explorer-envelope"/>`;
    }
    const points=Array.from({length:241},(_,i)=>`${35+i*570/240},${128-65*standingWave(n,l,i*l/240,phase)}`).join(' ');
    drawing+=`<polyline points="${points}" class="explorer-accent"/>`;
    for(let j=0;j<=n;j++) drawing+=circle(35+j*570/n,128,5,'class="explorer-node"');
    for(let j=0;j<n;j++) drawing+=line(35+(j+.5)*570/n,212,35+(j+.5)*570/n,227,'class="explorer-accent"');
    drawing+=label(320,257,'Marcas inferiores: posições dos ventres','text-anchor="middle"')+label(35,35,'0')+label(605,35,fmt(l)+' m','text-anchor="end"');
    ui.draw('Onda estacionária com '+n+' ventres e '+(n+1)+' nós fixos.',drawing);
  }
  function update() {
    draw();
    const wavelength=2*(+length.value)/(+harmonic.value);
    ui.report([['Comprimento de onda',fmt(wavelength,3)+' m'],['Distância entre ventres',fmt(wavelength/2,3)+' m'],['Nós',String(+harmonic.value+1)]]);
    ui.caption.textContent='Os pontos são nós: a amplitude permanece zero. Os ventres oscilam mais; sua posição não se desloca junto com a curva.';
  }
  function pause() {cancelAnimationFrame(frame);frame=0;draw();play.textContent='Animar a oscilação';}
  const play=ui.button('Animar a oscilação',()=>{
    if(frame) {pause();return;}
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) {
      phase+=Math.PI/4;draw();play.textContent='Avançar uma fase (movimento reduzido)';return;
    }
    start=performance.now()-phase/(Math.PI)*1000;
    const tick=now=>{phase=(now-start)/1000*2*Math.PI*.5;draw();frame=requestAnimationFrame(tick);};
    play.textContent='Pausar'; frame=requestAnimationFrame(tick);
  });
  ui.on(ui.controls,'input',()=>{pause();phase=0;update();});
  ui.reset(()=>{pause();phase=0;update();}); update();
  return {pause,destroy(){cancelAnimationFrame(frame);ui.destroy();}};
}
