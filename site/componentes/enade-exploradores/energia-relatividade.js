import {energyKwh, orbit} from '../../nucleo/enade-exploradores.js';
import {setup, fmt, line, label, circle} from './ui.js';

export function orbitExplorer(root) {
  const ui=setup(root);
  const beta=ui.range('Velocidade como fração de c',.05,.99,.01,.95);
  function update() {
    const result=orbit(+beta.value);
    const radius=100;
    ui.draw('Órbitas clássica e relativística de um elétron para a mesma velocidade e campo magnético.',
      circle(230,136,radius,'class="explorer-accent"')+circle(230,136,radius/result.gamma,'class="explorer-secondary-stroke"')+
      line(230,136,330,136)+line(230,136,230,136-radius/result.gamma)+circle(230,136,3,'class="explorer-node"')+
      label(368,100,'Raio relativístico')+label(368,130,fmt(result.relativistic*1000,3)+' mm')+label(368,179,'Raio clássico')+label(368,209,fmt(result.classical*1000,3)+' mm'));
    ui.report([['Fator de Lorentz γ',fmt(result.gamma,3)],['Razão entre os raios',fmt(result.gamma,3)],['Campo uniforme', '1 T']]);
    ui.caption.textContent='Os círculos compartilham o centro apenas para comparar seus raios. A escala se reajusta: o círculo maior ocupa sempre o mesmo espaço; os valores em milímetros mostram a dimensão física.';
  }
  ui.on(ui.controls,'input',update);ui.reset(update);update();
  return {pause(){},destroy:ui.destroy};
}

function bars(ui, entries, total) {
  const colors=['explorer-fill','explorer-secondary','explorer-tertiary'];
  let x=35;
  let markup=label(35,35,'Contribuições para o consumo');
  entries.forEach(([name,value],index)=>{
    const width=total>0?570*value/total:0;
    markup+=`<rect x="${x}" y="56" width="${width}" height="48" class="${colors[index]}"/>`;
    markup+=`<rect x="35" y="${130+index*45}" width="14" height="14" class="${colors[index]}"/>`+label(62,143+index*45,name)+label(605,143+index*45,fmt(value)+' kWh','text-anchor="end"');
    x+=width;
  });
  if(total===0) markup+=label(320,85,'Nenhum consumo','text-anchor="middle"');
  ui.draw('Energia consumida por equipamento; as áreas das barras representam as proporções.',markup);
}

export function schoolExplorer(root) {
  const ui=setup(root);
  const pump=ui.range('Bomba · 1 500 W',0,6,.5,1,'h/dia');
  const fridge=ui.range('Geladeira · 400 W',0,24,.5,10,'h/dia');
  const led=ui.range('Cada LED · 15 W',0,24,.5,6,'h/dia');
  const count=ui.range('Quantidade de LEDs',1,8,1,4);
  const days=ui.range('Período',1,31,1,30,'dias');
  function update() {
    const entries=[['Bomba',energyKwh(1500,+pump.value,1,+days.value)],['Geladeira',energyKwh(400,+fridge.value,1,+days.value)],['LEDs',energyKwh(15,+led.value,+count.value,+days.value)]];
    const total=entries.reduce((sum,[,value])=>sum+value,0);
    bars(ui,entries,total);
    ui.report([['Consumo no período',fmt(total)+' kWh'],['Média diária',fmt(total/+days.value)+' kWh']]);
    ui.caption.textContent='A largura de cada trecho mostra sua participação no total. Compare reduzir uma hora de uso da bomba com uma hora de uso dos LEDs.';
  }
  ui.on(ui.controls,'input',update);ui.reset(update);update();
  return {pause(){},destroy:ui.destroy};
}

export function costExplorer(root) {
  const ui=setup(root);
  const current=ui.range('Corrente do aparelho',.2,5,.1,2,'A');
  const hours=ui.range('Tempo total de uso',0,96,1,48,'h');
  const price=ui.range('Tarifa por kWh',.1,2,.05,.6,'reais');
  function update() {
    const power=220*(+current.value),energy=energyKwh(power,+hours.value),cost=energy*(+price.value);
    const max=energyKwh(220*5,96);
    ui.draw('Consumo atual comparado ao cenário original da questão.',
      label(35,36,'Energia consumida · mesma escala para as duas barras')+
      `<rect x="35" y="72" width="${570*energy/max}" height="35" class="explorer-fill"/>`+label(35,135,'Exploração: '+fmt(energy)+' kWh')+
      `<rect x="35" y="172" width="${570*21.12/max}" height="35" class="explorer-secondary"/>`+label(35,235,'Questão original: 21,12 kWh'));
    ui.report([['Potência a 220 V',fmt(power)+' W'],['Energia',fmt(energy)+' kWh'],['Custo de energia',fmt(cost,2)+' reais']]);
    ui.caption.textContent='A tarifa muda o custo, mas não a energia consumida. O tempo multiplica a energia; não modifica a potência do aparelho neste modelo.';
  }
  ui.on(ui.controls,'input',update);ui.reset(update);update();
  return {pause(){},destroy:ui.destroy};
}
