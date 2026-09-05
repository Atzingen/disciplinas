import {lampExplorer, networkExplorer} from './circuitos.js';
import {inductionExplorer} from './inducao.js';
import {photoExplorer, waveExplorer} from './luz-ondas.js';
import {orbitExplorer, schoolExplorer, costExplorer} from './energia-relatividade.js';

const builders={lampadas:lampExplorer,redes:networkExplorer,inducao:inductionExplorer,
  fotoeletrico:photoExplorer,ondas:waveExplorer,orbita:orbitExplorer,escola:schoolExplorer,custo:costExplorer};

export function mountExplorers(root) {
  const controllers=[];
  for (const target of root.querySelectorAll('[data-enade-explorer]')) {
    if(target.dataset.mounted) continue;
    try {
      const builder=builders[target.dataset.enadeExplorer];
      if(!builder) throw new Error('Explorador desconhecido');
      controllers.push(builder(target));
      target.dataset.mounted='true';
    } catch {
      target.querySelector('.explorer-live')?.remove();
      const notice=document.createElement('p');
      notice.textContent='A exploração não carregou. A resolução acima continua disponível; recarregue a página para tentar novamente.';
      target.append(notice);
    }
  }
  const pause=()=>controllers.forEach(controller=>controller.pause());
  const abort=new AbortController();
  document.addEventListener('visibilitychange',()=>{if(document.hidden) pause();},{signal:abort.signal});
  window.addEventListener('beforeprint',pause,{signal:abort.signal});
  return {pause,destroy(){abort.abort();controllers.forEach(controller=>controller.destroy());}};
}
