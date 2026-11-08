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
  const duration=Math.min(2000,Math.max(1100,gain*320)),started=performance.now();
  const previous=Math.round((total-gain)*10)/10;
  number.textContent=previous.toFixed(1);
  arc.setAttribute('stroke-dashoffset',String(policy_score_offset(previous,false)));
  function advance(now){
   if(!ring.isConnected)return;
   const elapsed=Math.min(1,Math.max(0,(now-started)/duration));
   // Begin braking before the halfway point so the last turn settles gently.
   const brakingTime=.56;
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

export function round_motion_available(element){
 return !!element?.animate&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function round_motion_play(element,frames,duration,fill='backwards'){
 return element.animate(frames,{duration,fill,easing:'cubic-bezier(.2,.7,.24,1)'}).finished.catch(()=>{});
}
const round_motion_dwell=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function retire_round_lot(panel){
 panel.inert=true;
 return round_motion_play(panel,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],175,'forwards');
}

export async function reveal_round_agenda(panel){
 const file=panel?.querySelector('.agenda-file'),roster=panel?.querySelector('.deployment-preparation');
 if(!round_motion_available(file)||!roster)return;
 // Keep the original roster dimensions during the pause so card sizing stays stable.
 roster.inert=true;
 roster.style.visibility='hidden';
 await round_motion_play(file,[
  {clipPath:'inset(0 0 100% 0)',opacity:.45,transform:'translateY(-5px)'},
  {clipPath:'inset(0 -8px -8px 0)',opacity:1,transform:'translateY(0)'},
 ],360);
 await round_motion_dwell(360);
 if(!roster.isConnected)return;
 roster.style.visibility='';
 roster.inert=false;
 await round_motion_play(roster,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],270);
}

export async function reveal_round_settlement(page){
 const verdict=page?.querySelector('.round-verdict'),scores=page?.querySelector('.scoreboard');
 if(!round_motion_available(verdict)||!scores)return;
 const children=[...page.children];
 const followup=children.slice(children.indexOf(verdict)+1).filter(el=>!el.hidden);
 followup.forEach(el=>el.hidden=true);
 await round_motion_play(verdict,[
  {opacity:0,transform:'translateY(-8px)',clipPath:'inset(0 0 70% 0)'},
  {opacity:1,transform:'translateY(0)',clipPath:'inset(0 -6px -6px 0)'},
 ],270);
 await round_motion_dwell(560);
 if(!scores.isConnected)return;
 followup.forEach(el=>el.hidden=false);
 animate_policy_scores(scores);
 await round_motion_play(scores,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],280);
}

export function announce_transition(element,label,{duration=2400,remove=false}={}){
 const previous=motionRuns.get(element);if(previous){clearTimeout(previous.timer);previous.animation?.cancel();}
 element.textContent=label;element.classList.add('play');element.setAttribute?.('role','status');element.setAttribute?.('aria-live','polite');
 const reduce=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const animation=!reduce&&element.animate?.([{opacity:0,transform:'translate(-50%, -8px)'},{opacity:1,transform:'translate(-50%, 0)',offset:.08},{opacity:1,transform:'translate(-50%, 0)',offset:.91},{opacity:0,transform:'translate(-50%, -4px)'}],{duration,easing:'ease-out'});
 const run={animation,timer:setTimeout(()=>{if(motionRuns.get(element)===run){element.classList.remove('play');animation?.cancel();if(remove)element.remove();motionRuns.delete(element);}},duration)};motionRuns.set(element,run);
}
