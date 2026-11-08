'use strict';

const openingPartyPalette={
 CDU:{accent:'#1f9097',ci:'#90e5e2'},
 CSU:{accent:'#2079bc',ci:'#a1d8fd'},
 SPD:{accent:'#d72e3c',ci:'#ffb4ba'},
 AfD:{accent:'#169bd5',ci:'#8de1ff'},
 'Grüne':{accent:'#489646',ci:'#b2ed97'},
 Linke:{accent:'#a73370',ci:'#ffb2da'},
};

function mount_opening(host,{language='zh',oppositionEnabled=false,resolveOpponent,onReady,onBack=()=>{},onError=()=>{}}={}){
 language=['zh','en','de'].includes(language)?language:'zh';
 const words={
  zh:{back:'返回',steps:['阵营','党派','匹配'],titles:['选择阵营','选择党派','对局匹配'],camp:['执政党','反对党'],choose:['选择执政联盟中的党派','选择反对阵营中的党派'],locked:'当前由电脑担任',you:'我方',enemy:'对手',search:'正在匹配对方党团…',ready:'匹配完成',versus:'对阵',replay:'重播匹配'},
  en:{back:'Back',steps:['Side','Party','Match'],titles:['Choose a side','Choose a party','Matchmaking'],camp:['Government','Opposition'],choose:['Choose a governing party','Choose an opposition party'],locked:'Computer controlled',you:'You',enemy:'Opponent',search:'Finding an opponent…',ready:'Match ready',versus:'vs',replay:'Replay matchup'},
  de:{back:'Zurück',steps:['Seite','Partei','Duell'],titles:['Seite wählen','Partei wählen','Gegnerauswahl'],camp:['Regierung','Opposition'],choose:['Regierungspartei wählen','Oppositionspartei wählen'],locked:'Vom Computer gesteuert',you:'Du',enemy:'Gegner',search:'Gegner wird ermittelt …',ready:'Duell bereit',versus:'gegen',replay:'Duell erneut zeigen'},
 }[language];
 const roles = {
  government:{code:words.camp[0],name:'REGIERUNG',detail:words.choose[0],mark:'01',accent:'#59889e',ci:'#cce8f4'},
  opposition:{code:words.camp[1],name:'OPPOSITION',detail:oppositionEnabled?words.choose[1]:words.locked,mark:'02',accent:'#9a6759',ci:'#f1d5c8'},
 };
 const parties={
  CDU:{name:['基督教民主联盟','Christian Democratic Union','Christlich Demokratische Union'],...openingPartyPalette['CDU']},
  CSU:{name:['基督教社会联盟','Christian Social Union','Christlich-Soziale Union'],...openingPartyPalette['CSU']},
  SPD:{name:['德国社会民主党','Social Democratic Party','Sozialdemokratische Partei'],...openingPartyPalette['SPD']},
  AfD:{name:['德国选择党','Alternative for Germany','Alternative für Deutschland'],...openingPartyPalette['AfD']},
  'Grüne':{name:['联盟90／绿党','Alliance 90 / The Greens','Bündnis 90 / Die Grünen'],...openingPartyPalette['Grüne']},
  Linke:{name:['左翼党','The Left','Die Linke'],...openingPartyPalette['Linke']},
 };
 const camps={government:['CDU','CSU','SPD'],opposition:['AfD','Grüne','Linke']};
 const steps=['role','party','match'];
 host.innerHTML=`<section class="opening" aria-labelledby="opening-title">
  <div class="chamber" aria-hidden="true"><svg viewBox="0 0 950 600" fill="none"><path d="M65 544a410 410 0 0 1 820 0M120 544a355 355 0 0 1 710 0M175 544a300 300 0 0 1 600 0M230 544a245 245 0 0 1 490 0M285 544a190 190 0 0 1 380 0M340 544a135 135 0 0 1 270 0M475 131v280M185 253l195 197M765 253L570 450M65 544h820"/></svg></div>
  <header class="opening-nav">
   <button type="button" data-opening-back><span aria-hidden="true">←</span> ${words.back}</button>
   <ol>${steps.map((key,i)=>`<li data-step="${key}"><b>0${i+1}</b> ${words.steps[i]}</li>`).join('')}</ol>
  </header>
  <div class="opening-inner">
   <div class="opening-scene-heading"><b data-opening-number aria-hidden="true"></b><div><span data-opening-code></span><h1 id="opening-title" tabindex="-1"></h1></div></div>
   <div class="opening-deck"></div>
   <footer class="opening-footer"><p aria-live="polite"></p><button type="button" data-opening-replay hidden>${words.replay} <span aria-hidden="true">↻</span></button></footer>
  </div>
 </section>`;
 const opening=host.querySelector('.opening');
 const deck=opening.querySelector('.opening-deck');
 const title=opening.querySelector('#opening-title');
 const status=opening.querySelector('.opening-footer p');
 const replay=opening.querySelector('[data-opening-replay]');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const listeners=new AbortController();
 const listenerOptions={signal:listeners.signal};
 const codes=['SEITENWAHL','FRAKTIONSWAHL','MATCHMAKING'];
 let scene,camp,player,opponent,readyTimer;
 let revision=0;
 function play(el, frames, duration, delay=0) {
  if(reducedMotion.matches || !el.animate) return Promise.resolve();
  return el.animate(frames, {
   duration,delay,fill:'backwards',easing:'cubic-bezier(.18,.7,.25,1)',
  }).finished.catch(()=>{});
 }

 function setScene(next) {
  opening.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
  clearTimeout(readyTimer);
  scene = next;
  status.textContent = '';
  replay.hidden = true;
  const step=steps.indexOf(next),label=words.titles[step];
  opening.querySelector('[data-opening-number]').textContent='0'+(step+1);
  opening.querySelector('[data-opening-code]').textContent=codes[step];
  title.textContent = label;
  deck.setAttribute('aria-label',label);
  for(const item of opening.querySelectorAll('[data-step]')){
   if(item.dataset.step === next) item.setAttribute('aria-current','step');
   else item.removeAttribute('aria-current');
  }
  title.focus({preventScroll:true});
 }

 function identity(id, index, roleCard=false) {
  const info = roleCard ? roles[id] : parties[id];
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'opening-identity' + (roleCard ? ' role-card' : '');
  card.dataset.identity = id;
  card.style.setProperty('--accent',info.accent);
  card.style.setProperty('--ci',info.ci);
  const label=roleCard?info.name:info.name[language==='de'?2:language==='en'?1:0];
  card.disabled=roleCard&&id==='opposition'&&!oppositionEnabled;
  card.innerHTML='<span class="opening-art"><span class="mono-mark" aria-hidden="true">'+(info.mark||id)+'</span>'+
   '<span class="accent-plate"></span><span class="dots"></span><span class="index-tab" aria-hidden="true">'+
   String(index+1).padStart(2,'0')+'</span><span class="match-label"></span></span>'+
   '<span class="opening-nameplate"><strong class="faction-code">'+(info.code||id)+'</strong>'+
   '<span class="party-name">'+label+'</span>'+(info.detail?'<span class="party-detail">'+info.detail+'</span>':'')+'</span>';
  return card;
 }

 function arrive(cards) {
  cards.forEach((card,i)=>play(card,[
   {transform:'translateY(38px) scale(.96)',opacity:0,clipPath:'inset(8% -16px 0 -12px)'},
   {transform:'translateY(0) scale(1)',opacity:1,clipPath:'inset(-12px -16px -18px -12px)'},
  ],390,65+i*90));
 }

 function showRoles() {
  revision++;
  setScene('role');
  deck.className = 'opening-deck roles';
  const cards = Object.keys(roles).map((id,i)=>identity(id,i,true));
  deck.replaceChildren(...cards);
  play(opening,[{opacity:0},{opacity:1}],250);
  arrive(cards);
 }

 function showParties(enter=true) {
  revision++;
  setScene('party');
  deck.className = 'opening-deck';
  const cards = camps[camp].map((id,i)=>identity(id,i));
  deck.replaceChildren(...cards);
  if(enter) arrive(cards);
  return cards;
 }

 function lockCard(card, label, side) {
  card.classList.add('locked',side);
  card.disabled = true;
  card.querySelector('.match-label').textContent = label;
 }

 async function match(card, opponentId) {
  const thisMatch = ++revision;
  const rejects = [...deck.children].filter(el=>el!==card)
   .map(el=>({el,rect:el.getBoundingClientRect()}));
  const from = card.getBoundingClientRect();
  setScene('match');
  status.textContent = words.search;
  lockCard(card,words.you,'player');
  deck.className = 'opening-deck matching';
  const bounds = deck.getBoundingClientRect();
  // Hold the outgoing cards at their original positions while the grid reflows.
  for(const {el,rect} of rejects){
   el.disabled = true;
   el.setAttribute('aria-hidden','true');
   Object.assign(el.style,{
    position:'absolute',left:(rect.left-bounds.left)+'px',top:(rect.top-bounds.top)+'px',
    width:rect.width+'px',height:rect.height+'px',minHeight:'0',
   });
  }
  const to = card.getBoundingClientRect();
  card.classList.add('moving');
  const dx = from.left-to.left,dy = from.top-to.top;
  const shiftTime = Math.min(610,360+Math.abs(dx)*.28);

  const enemy = identity(opponentId,camps[camp==='government'?'opposition':'government'].indexOf(opponentId));
  lockCard(enemy,words.enemy,'opponent');
  const versus = document.createElement('div');
  versus.className = 'opening-vs';
  versus.setAttribute('aria-hidden','true');
  versus.innerHTML = '<span>VS</span>';
  deck.append(versus,enemy);
  await Promise.all([
   play(card,[
    {transform:'translate3d('+dx+'px,'+dy+'px,0)'},
    {transform:'translate3d(0,0,0)'},
   ],shiftTime),
   ...rejects.map(({el})=>play(el,[
    {opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-20px) scale(.97)'},
   ],220).then(()=>el.remove())),
   play(versus,[{transform:'rotate(45deg) scale(.55)',opacity:0},{transform:'rotate(45deg) scale(1)',opacity:1}],250,shiftTime-120),
   play(enemy,[{transform:'translateY(100px)',clipPath:'inset(100% -15px 0 -12px)',opacity:0},
    {transform:'translateY(0)',clipPath:'inset(-12px -15px -18px -12px)',opacity:1}],380,shiftTime-185),
  ]);
  card.classList.remove('moving');
  if(thisMatch!==revision) return;
  status.textContent = player+' '+words.versus+' '+opponentId+' · '+words.ready;
  if(onReady)readyTimer=setTimeout(()=>{if(thisMatch===revision)onReady();},reducedMotion.matches?0:460);
  else replay.hidden = false;
 }

 deck.addEventListener('click',event=>{
  const card=event.target.closest('button[data-identity]');
  if(!card||card.disabled)return;
  if(scene==='role'){
   camp=card.dataset.identity;
   showParties();
  }else if(scene==='party'){
   player=card.dataset.identity;
   const pool=camps[camp==='government'?'opposition':'government'];
   try{
    opponent=resolveOpponent?resolveOpponent(player):pool[Math.floor(Math.random()*pool.length)];
    if(!pool.includes(opponent))throw Error('opening_opponent');
    match(card,opponent).catch(onError);
   }catch(error){onError(error);}
  }
 },listenerOptions);

 function dispose(){
  revision++;
  clearTimeout(readyTimer);
  listeners.abort();
  opening.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
 }
 function goBack(){
  if(scene==='match')showParties();
  else if(scene==='party')showRoles();
  else{dispose();onBack();}
 }
 opening.querySelector('[data-opening-back]').addEventListener('click',goBack,listenerOptions);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')goBack();},listenerOptions);
 reducedMotion.addEventListener('change',event=>{
  if(event.matches)opening.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
 },listenerOptions);
 replay.addEventListener('click',()=>{
  const cards=showParties(false);
  match(cards.find(card=>card.dataset.identity===player),opponent).catch(onError);
 },listenerOptions);
 showRoles();
 return dispose;
}
