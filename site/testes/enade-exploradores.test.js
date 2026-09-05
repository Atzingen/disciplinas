import assert from 'node:assert/strict';
import test from 'node:test';
import {lamps, networks, equivalent, flux, inducedEmf, photoelectric, metals,
  standingWave, orbit, energyKwh, H, C, E} from '../nucleo/enade-exploradores.js';

const close=(actual,expected,tolerance=1e-10)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} ≠ ${expected}`);

test('lâmpadas: ponto nominal, conservação da potência e limite da pilha ideal',()=>{
  const nominal=lamps(6,1);
  close(nominal.voltage,3);close(nominal.branchCurrent,.5);
  for(const count of [1,6,12]) for(const r of [0,1,3]) {
    const state=lamps(count,r);
    close(state.sourcePower,state.internalPower+count*state.branchPower);
    close(state.current,count*state.branchCurrent);
    if(r===0) close(state.voltage,6);
  }
  assert.ok(lamps(7,1).voltage<nominal.voltage);
});

test('redes: cinco resistores, relações de associação e escala linear',()=>{
  function count(tree) {return typeof tree==='number'?1:(tree.series??tree.parallel).reduce((sum,part)=>sum+count(part),0);}
  for(const [key,ratio] of Object.entries({A:7/5,B:3/7,C:1/2,D:5/8})) {
    assert.equal(count(networks[key]),5);
    close(equivalent(networks[key]),ratio);
    close(equivalent(networks[key],100),ratio*100);
  }
});

test('indução: repouso, mudança de sentido, orientação e duração do percurso',()=>{
  assert.ok(flux(-.5)>flux(-3.5));
  close(inducedEmf(-1,-1,1),0);
  const forward=inducedEmf(-3.5,-.5,1);
  assert.ok(forward<0);
  close(inducedEmf(-.5,-3.5,1),-forward);
  close(inducedEmf(-3.5,-.5,1,-1),-forward);
  close(inducedEmf(-3.5,-.5,4)*4,forward);
  close(flux(2),flux(-2));
});

test('fotoelétrico: material, corte, luz desligada e energia independente da intensidade',()=>{
  const dark=photoelectric(250,metals.zinco.work,0);
  assert.equal(dark.emitting,false);
  const red=photoelectric(700,metals.sodio.work,100);
  assert.equal(red.emitting,false);
  assert.equal(red.kinetic,0);
  assert.equal(photoelectric(450,metals.sodio.work,50).emitting,true);
  assert.equal(photoelectric(450,metals.zinco.work,50).emitting,false);
  const low=photoelectric(250,metals.zinco.work,10),high=photoelectric(250,metals.zinco.work,100);
  close(low.kinetic,high.kinetic);
  close(low.photonEnergy,metals.zinco.work+low.kinetic);
  const threshold=H*C/(metals.zinco.work*E)*1e9;
  assert.equal(photoelectric(threshold+.1,metals.zinco.work,100).emitting,false);
  assert.equal(photoelectric(threshold-.1,metals.zinco.work,100).emitting,true);
});

test('onda: nós fixos em todas as fases e ventres separados por meio comprimento de onda',()=>{
  for(let n=1;n<=5;n++) for(const phase of [0,.7,Math.PI/2,Math.PI]) {
    for(let j=0;j<=n;j++) close(standingWave(n,1.7,j*1.7/n,phase),0);
    for(let j=0;j<n;j++) close(Math.abs(standingWave(n,1.7,(j+.5)*1.7/n,phase)),Math.abs(Math.cos(phase)));
  }
});

test('raio: limite clássico, fator de Lorentz e dependência inversa do campo',()=>{
  close(orbit(.001).gamma,1,1e-6);
  close(orbit(.6).gamma,1.25);
  close(orbit(.95).relativistic/orbit(.95).classical,orbit(.95).gamma);
  close(orbit(.6,2).relativistic*2,orbit(.6,1).relativistic);
  assert.throws(()=>orbit(1),RangeError);
});

test('energia: dados das questões, multiplicidade, tempo zero e independência da tarifa',()=>{
  const school=(count)=>energyKwh(1500,1,1,30)+energyKwh(400,10,1,30)+energyKwh(15,6,count,30);
  close(school(4),175.8);close(school(1),167.7);
  close(energyKwh(440,48),21.12);
  close(energyKwh(440,96),2*21.12);
  close(energyKwh(440,0),0);
  assert.equal((energyKwh(440,48)*.6).toFixed(2),'12.67');
});
