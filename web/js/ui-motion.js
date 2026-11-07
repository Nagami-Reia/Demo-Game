// Reimplemented after studying Stronghold-Protocol's toast and turn-banner rhythm.
const motionRuns=new WeakMap();

export function policy_score_offset(score,settled=true){
 const fraction=Math.round((score-Math.floor(score))*1e8)/1e8;
 if(settled&&score>0&&fraction===0)return 0;
 return Math.round((1-fraction)*1e8)/1e6;
}

export function animate_policy_scores(container){
 if(!globalThis.matchMedia?.('(min-width: 801px)').matches||globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 for(const ring of container.querySelectorAll('.policy-score-ring')){
  const total=Number(ring.dataset.score),gain=Number(ring.dataset.gain);
  if(!Number.isFinite(total)||!Number.isFinite(gain)||gain<=0)continue;
  const number=ring.querySelector('b'),arc=ring.querySelector('.policy-score-arc');
  const duration=Math.min(1800,Math.max(550,gain*145)),started=performance.now();
  const previous=Math.round((total-gain)*10)/10;
  number.textContent=previous.toFixed(1);
  arc.setAttribute('stroke-dashoffset',String(policy_score_offset(previous,false)));
  function advance(now){
   if(!ring.isConnected)return;
   const elapsed=Math.min(1,Math.max(0,(now-started)/duration));
   // Keep the first turns moving, then brake smoothly over the final third.
   const brakingTime=.35;
   const brakingElapsed=Math.max(0,elapsed-(1-brakingTime));
   const distance=elapsed-brakingElapsed**2/(2*brakingTime);
   const progress=distance/(1-brakingTime/2);
   const score=elapsed===1?total:previous+gain*progress;
   number.textContent=elapsed===1?String(total):score.toFixed(1);
   arc.setAttribute('stroke-dashoffset',String(policy_score_offset(score,elapsed===1)));
   if(elapsed<1)requestAnimationFrame(advance);
   else arc.animate?.([{filter:'none'},{filter:'drop-shadow(0 0 4px currentColor)',offset:.4},{filter:'none'}],{duration:220,easing:'ease-out'});
  }
  requestAnimationFrame(advance);
 }
}

export function announce_transition(element,label,{duration=2400,remove=false}={}){
 const previous=motionRuns.get(element);if(previous){clearTimeout(previous.timer);previous.animation?.cancel();}
 element.textContent=label;element.classList.add('play');element.setAttribute?.('role','status');element.setAttribute?.('aria-live','polite');
 const reduce=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const animation=!reduce&&element.animate?.([{opacity:0,transform:'translate(-50%, -8px)'},{opacity:1,transform:'translate(-50%, 0)',offset:.08},{opacity:1,transform:'translate(-50%, 0)',offset:.91},{opacity:0,transform:'translate(-50%, -4px)'}],{duration,easing:'ease-out'});
 const run={animation,timer:setTimeout(()=>{if(motionRuns.get(element)===run){element.classList.remove('play');animation?.cancel();if(remove)element.remove();motionRuns.delete(element);}},duration)};motionRuns.set(element,run);
}
