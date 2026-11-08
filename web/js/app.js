import {active_crisis,match_round_limit} from './crisis.js';
import {crisis_checkpoint_view,crisis_clue,crisis_objective_view} from './crisis-view.js';
import {equipment_card,equipment_sidebar,equipment_bind} from './equipment-ui.js';
import {tactical_plan_view,tactical_decision_view} from './tactical-view.js';
import {news_page} from './news-view.js';
import {can_recruit} from './party-relations.js';
import {card_facts,card_facts_view,card_bookmarks_view} from './card-facts.js';
import {deployment_view,deployment_skill_view,strategy_brief,refresh_deployment_selection} from './deployment-view.js';
import {MAX_DEPLOYMENT,initial_deployment_selection} from './deployment-rules.js';
import {office_label} from './office-labels.js';
import {portrait_spec,portrait_style,refresh_portraits} from './portraits.js';
import {announce_transition,round_motion_available,retire_round_lot,reveal_round_agenda,reveal_round_settlement} from './ui-motion.js';
import {normalize_saved_cards} from './save-migration.js';
import {result_page} from './result-view.js';
import {history_view} from './replay-view.js';
import {is_neutral_chair} from './roles.js';
import {leader_profile} from './discipline.js';
import {party_relation} from './party-relations.js';
import {recruitment_pool,round_recruitment_excluded,round_recruitment_notice,recruitment_ban_groups,recruitment_ban_category} from './recruitment.js';
import {environment_view} from './environment-view.js';
import {initial_polls} from './environment.js';
import {starting_price} from './economy.js';
import {FACTIONS,faction_status,faction_can_invest,FACTION_INVEST_COST,faction_trainable,CSU_TRAIN_COST,CSU_TRAIN_ACTIONS} from './factions.js';
import {Game} from './controller.js';
import {Sandbox} from './sandbox.js';
import {strings} from './i18n.js';
import {diffState,applyStatePatch} from '../vendor/stronghold/shared/stateDelta.js';
let lang=localStorage.getItem('kp-lang')||'zh',dark=localStorage.getItem('kp-dark')==='true',game=null,selected=new Set(),openingFlow=null,snap=null,historyOpen=false,collectionOpen=false,sidebarLogOpen=false,newsOpen=false;
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),t=k=>strings[lang]?.[k]||k,loc=x=>typeof x==='object'?(x?.[lang]||x?.en||''):x;
function btn(label,action,disabled=false){return `<button data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;}
function faction_meter_view(p){
 const meter=faction_status(p);
 return meter?` · ${t('faction_'+meter.key)} ${meter.value}/${meter.max}`:'';
}
function regional_investment_view(g){
 if(g.players[0].party!=='CSU')return '';
 if(g.players[0].faction?.investmentRound===g.round)return `<p class="muted">${t('factionInvested')}</p>`;
 return `<div class="actions">${['economy','transport'].map(d=>btn(`${t('faction_csu_invest')} · ${t(d)} · €${FACTION_INVEST_COST}`,'regional_'+d,!faction_can_invest(g,0,d))).join('')}</div>`;
}
function csu_training_view(g){
 const cards=faction_trainable(g,0);
 if(!cards.length)return '';
 return `<div class="actions"><select id="csu-trainee" aria-label="${t('factionTrainee')}">${cards.map(c=>`<option value="${esc(c.id)}">${esc(c.displayName||c.name)}</option>`).join('')}</select><select id="csu-training-action" aria-label="${t('factionTrainingAction')}">${CSU_TRAIN_ACTIONS.map(a=>`<option value="${a}">${t(a)}</option>`).join('')}</select>${btn(`${t('faction_csu_train')} · €${CSU_TRAIN_COST}`,'train_csu')}</div>`;
}
function card(c,select=false,owner=game?.players[0]?.party){const equipment=equipment_card(game,c,t,esc);const portrait=portrait_spec(c,CONTENT.portraits);
 const facts=card_facts(c,CONTENT,lang),offices=c.offices||[];
 const training=game?.players.find(p=>p.party===owner)?.faction?.training?.find(e=>e.id===c.id);
 const government=offices.filter(o=>['minister','executive'].includes(o.scope)&&o.status==='verified_current');
 const otherOffices=offices.filter(o=>!government.includes(o));
 const bookmarks=card_bookmarks_view(facts,government,lang,t,esc);
 select=select&&!is_neutral_chair(c);return `<article ${equipment.attrs} ${portrait?`data-portrait-id="${esc(c.id)}"`:''} style="--party:${FACTIONS[c.party]?.color||'#887f99'}${portrait_style(portrait)}" class="card ${bookmarks?'has-bookmarks':''} ${portrait?'has-portrait':''} ${is_neutral_chair(c)?'neutral-chair':''} ${selected.has(c.id)?'chosen':''}" ${select?`data-card="${esc(c.id)}" tabindex="0" role="checkbox" aria-checked="${selected.has(c.id)}"`:''}>${portrait?'<div class="card-portrait" aria-hidden="true"><div class="portrait-ambient"></div><div class="portrait-photo"></div></div>':''}<div class="card-content"><div class="card-core"><div class="card-header"><div class="eyebrow">${esc(c.party)} <span>${c.edition==='special'?t('specialEdition')+' · ':''}T${c.tier}</span></div>${owner?`<div class="relation-tag relation-${party_relation(owner,c.party)}" title="${t(party_relation(owner,c.party)+'Text')}">${t(party_relation(owner,c.party))}</div>`:''}<h3>${esc(c.displayName||c.name)}</h3>${training?`<span class="relation-tag" title="${t(training.readyRound>game.round?'factionTrainingPending':'factionTrainingReady')}">${t('faction_csu_train')} · ${t(training.action)} ${training.readyRound>game.round?`· ${t('round')} ${training.readyRound}`:'+0.65'}</span>`:''}${c.specialEffect?`<span class="relation-tag special-effect-tag">${t('specialEdition')}: ${t(c.specialEffect.stat)} +${c.specialEffect.amount}</span>`:''}${is_neutral_chair(c)?`<span class="relation-tag">${t('neutralChair')}</span>`:''}${c.careerNote?`<div class="leader-role">${esc(loc(c.careerNote))}</div>`:''}${offices.length?`<div class="leader-role ${otherOffices.length?'':'leader-role-mobile'}">${otherOffices.map(o=>esc(office_label(o,lang))).join(' · ')}${government.length?`<span class="leader-role-mobile">${otherOffices.length?' · ':''}${government.map(o=>esc(office_label(o,lang))).join(' · ')}</span>`:''}</div>`:''}<p>${c.domains.map(d=>`<span class="domain-chip">${esc(t(d))}</span>`).join('')}</p></div><div class="attributes">${['resources','leadership','negotiation','oratory','expertise','resilience'].map(k=>`<div><span>${t(k==='resources'?'resource':k)} <b>${c[k]??3}</b></span><div class="stat-bar"><i style="width:${(c[k]??3)*20}%"></i></div></div>`).join('')}</div>${bookmarks}</div>${card_facts_view(c,CONTENT,lang,t,esc,facts)}</div>${equipment.mask}</article>`;}
function save(){if(!game)return;try{localStorage.setItem('kp-game-v2',JSON.stringify({...game,deploymentSelection:game.phase==='DEPLOYMENT'?[...selected]:undefined,sandbox:game.sandbox.toJSON(),data:undefined}));}catch{}}
function apply_theme(){document.documentElement.dataset.theme=dark?'dark':'light';const button=$('#theme');button.textContent=(dark?'☾ ':'☀ ')+t(dark?'dark':'light');button.setAttribute?.('aria-pressed',String(dark));button.setAttribute?.('aria-label',t('toggleTheme'));}
function faction_board_view(players){
 return `<div class="scoreboard faction-board">${players.map((p,i)=>{
  const palette=openingPartyPalette[p.party]||{accent:'#586777',ci:'#d8e5ef'};
  const ability=FACTIONS[p.party];
  const organization=p.organization||p.legislativeEfficiency
   ?` · ${t('organizationPoints')} ${p.organization||0} · ${t('legislativeEfficiency')} ${p.legislativeEfficiency||0}`:'';
  return `<section style="--party-accent:${palette.accent};--party-ci:${palette.ci}">
   <div class="faction-board-label"><span>${t(i?'cpu':'you')}</span><b>${esc(p.party)}</b></div>
   <div class="faction-board-readout">
    <div class="metrics">
     <span>${t('cash')}<b>€${p.cash}</b></span>
     <span>${t('income')}<b>+${p.income}</b></span>
     <span>${t('score')}<b>${p.score}</b></span>
    </div>
    <p class="ability" title="${esc(loc(ability?.text))}">${esc(loc(ability?.title))}${faction_meter_view(p)}${organization}</p>
   </div>
  </section>`;
 }).join('')}</div>`;
}
function show_opening_ban(pendingGame,continueToNews){
 const ban=pendingGame.recruitmentBan,groups=recruitment_ban_groups(ban);
 if(!groups.length&&!pendingGame.crisis){continueToNews();return;}
 const byId=new Map(pendingGame.data.roster.map(card=>[card.id,card]));
 const shown=new Set();
 let order=0;
 const rows=groups.map((group,index)=>{
  const cards=group.cardIds.filter(id=>!shown.has(id)&&byId.has(id)).map(id=>byId.get(id)).toSorted((a,b)=>
   b.tier-a.tier||(a.displayName||a.name).localeCompare(b.displayName||b.name));
  for(const card of cards)shown.add(card.id);
  const route=pendingGame.data.allianceDefinitions?.find(def=>def.id===group.tagId)||group;
  const category=recruitment_ban_category(group.category,t);
  return `<section class="opening-ban-group" aria-labelledby="opening-ban-group-${index}">
   <div class="opening-ban-label">${alliance_ring({...route,count:0},1)}
    <div><small>${esc(category)}</small><h3 id="opening-ban-group-${index}">${esc(loc(group.name))}</h3></div>
   </div>
   <ul>${cards.map(c=>`<li style="--ban-delay:${Math.min(order++,12)*28}ms"><b>T${c.tier}</b><span>${esc(c.displayName||c.name)}</span></li>`).join('')}</ul>
  </section>`;
 }).join('');
 const dialog=document.createElement('dialog');
 dialog.className='opening-ban-dialog';
 dialog.setAttribute('aria-labelledby','opening-ban-title');
 dialog.innerHTML=`<header class="opening-brief-heading"><span aria-hidden="true">04</span>
   <h2 id="opening-ban-title">${t('openingBrief')}</h2>
  </header>
  ${crisis_clue(pendingGame,t,esc)}
  ${rows?`<h3 class="opening-ban-caption">${t('recruitmentBanList')}</h3><div class="opening-ban-groups" tabindex="0">${rows}</div>`:''}
  <form method="dialog"><button type="submit" autofocus><b aria-hidden="true">05</b> ${t('phase_NEWS')} →</button></form>`;
 dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
 dialog.addEventListener('close',()=>{dialog.remove();continueToNews();},{once:true});
 document.body.append(dialog);
 dialog.showModal();
}
function start_opening(){
 let pendingGame;
 openingFlow=mount_opening($('#main'),{
  language:lang,
  resolveOpponent:party=>{
   pendingGame=new Game(CONTENT,party);
   return pendingGame.players[1].party;
  },
  onReady:()=>show_opening_ban(pendingGame,()=>{
   game=pendingGame;
   selected.clear();
   newsOpen=false;
   render();
   $('#main .news-page')?.classList.add('news-opening-arrival');
   globalThis.scrollTo?.({top:0,behavior:'instant'});
  }),
  onBack:()=>{
   render();
   $('#main [data-action="start"]')?.focus();
  },
  onError:error=>{
   render();
   $('#error').textContent=t(error.message);
  },
 });
 document.body?.classList?.add('opening-flow');
 globalThis.scrollTo?.({top:0,behavior:'instant'});
}
function render(){openingFlow?.();openingFlow=null;document.body?.classList?.remove('opening-flow');resetEquipmentUi();document.documentElement.lang=lang;apply_theme();$('#language').value=lang;$('#tag').textContent=t('tag');$('#new').textContent=t('new');$('#foot').textContent=t('rule');let main=$('#main');if(!game){if($('#news-button'))$('#news-button').hidden=true;main.innerHTML=`<section class="welcome"><div class="eyebrow">KOALITIONSPROTOKOLL / 01</div><h1>${t('government')}<br><em>Koalitionsprotokoll</em></h1><div class="actions">${btn(t('start'),'start')}${localStorage.getItem('kp-game-v2')?btn(t('resume'),'resume'):''}</div></section>`;return;}
let g=game;let newsButton=$('#news-button');if(g.news?.edition&&!newsButton){newsButton=document.createElement('button');newsButton.id='news-button';newsButton.dataset.action='show_news';document.querySelector('nav').append(newsButton);}if(newsButton){newsButton.textContent=t('reopenNews');newsButton.hidden=!g.news?.edition||g.phase==='NEWS';}if(g.news?.edition&&(g.phase==='NEWS'||newsOpen)){$('#status').textContent=t('round')+' '+g.round+'/'+match_round_limit(g);main.innerHTML=news_page(g,t,loc,esc,newsOpen&&g.phase!=='NEWS');save();return;}$('#status').textContent=`${t('round')} ${g.round}/${match_round_limit(g)} · ${t('level')} ${g.level}/6`;let metrics=faction_board_view(g.players);let content='';if(g.phase==='UPGRADE')content=`${round_recruitment_notice(g,t,esc,loc)}<h2>${t('level')} · Lv.${g.level}</h2><p class="faction-note">${esc(loc(FACTIONS[g.players[0].party]?.text))}</p><div class="actions">${btn(`${t('upgrade')} ${g.upgradeCost?'€'+g.upgradeCost:''}`,'upgrade',g.upgraded||g.level>=6||g.players[0].cash<g.upgradeCost)}${btn(t('recruit'),'continue')}</div>${regional_investment_view(g)}${csu_training_view(g)}`;
if(['AUCTION','BONUS_AUCTION'].includes(g.phase))content=`<div class="auction-heading"><h2>${g.phase==='BONUS_AUCTION'?t('bonusAuction')+' '+(g.rare.index+1)+'/2':t('auction')+' '+g.slot+'/3'}</h2><span>${t('hidden')}</span></div>${g.phase==='BONUS_AUCTION'?`<div class="rare-pair">${g.rare.cards.map((c,i)=>`<div class="${i===g.rare.index?'active-lot':'waiting-lot'}">${card(c)}<span>${t(i===g.rare.index?'biddingNow':i<g.rare.index?'lotResolved':'pairedLot')}</span></div>`).join('')}</div>`:`<div class="auction-card">${card(g.card)}</div>`}<p>${t('price')}: <strong>€${g.price||g.startingPrice}</strong> · ${t('highest')}: ${g.high===null?t('none'):t(g.high?'cpu':'you')}</p><div class="actions"><input id="amount" aria-label="${t('bid')}" type="number" min="${g.high===null?g.startingPrice:g.price+1}" max="${g.players[0].cash}" value="${g.high===null?g.startingPrice:g.price+1}">${btn(t('bid'),'bid',!can_recruit(g.players[0].party,g.card)||(g.high===null?g.startingPrice:g.price+1)>g.players[0].cash)}${btn(t('pass'),'pass')}</div>`;
if(g.phase==='BONUS_CHOICE')content=`<h2>${t('keepOne')}</h2><div class="rare-pair">${g.rare.awards.map(a=>`<div>${card(a.card)}<button data-action="keep_bonus" data-id="${esc(a.card.id)}">${t('keepThis')} · ${t('refundOther')}</button></div>`).join('')}</div>`;
if(g.phase==='NEGOTIATION')content=`${active_crisis(g)?crisis_objective_view(g.crisis,t,loc,esc):''}${strategy_brief(g,t,loc,esc)}<div class="eyebrow">${t('chooseNegotiation')}</div><h2>${esc(loc(g.negotiation.title))}</h2><p>${esc(loc(g.negotiation.description))}</p>${g.negotiation.oppositionPreview?.lead?`<p class="faction-note"><b>${t('factionBurstLead')}</b> · ${esc(g.negotiation.oppositionPreview.lead.name)}</p>`:''}${tactical_plan_view(g.negotiation,t,loc,esc)}<div class="negotiation-options">${g.negotiation.options.map((o,i)=>`<section class="negotiation-option" style="--negotiation-option-index:${i}"><h3>${esc(loc(o.title))}</h3><p>${esc(loc(o.description))}</p><button data-action="negotiate" data-id="${esc(o.id)}" ${o.cost>g.players[0].cash?'disabled':''}>${o.cost?`€${o.cost}`:t('freeOption')}${o.baseCost>o.cost?` <s>€${o.baseCost}</s>`:''}</button></section>`).join('')}</div>`;
if(g.phase==='TACTIC_DECISION')content=tactical_decision_view(g,t,loc,esc);
if(g.phase==='NEXT_CARD')content=`<h2>${t('phase_NEXT_CARD')}</h2><p>${t('hidden')}</p>${btn(t('next'),'continue')}`;
if(g.phase==='DEPLOYMENT')content=(active_crisis(g)?crisis_objective_view(g.crisis,t,loc,esc):'')+deployment_view(g,selected,t,loc,esc,card,MAX_DEPLOYMENT);
if(g.phase==='CRISIS_CHECKPOINT'){main.innerHTML=crisis_checkpoint_view(g,t,loc,esc);save();return;}
if(['RESULT','END'].includes(g.phase)){main.innerHTML=result_page(g,t,loc,esc);refresh_portraits(document,CONTENT.portraits);save();return;}
main.innerHTML=`${metrics}${environment_view(g,t,loc,esc)}<div class="workspace${g.phase==='DEPLOYMENT'?' deployment-workspace':''}"><section class="panel"><div class="eyebrow">${t('phase_'+g.phase)}</div>${content}</section><aside class="panel">${g.phase==='DEPLOYMENT'?deployment_skill_view(g,selected,t,loc,esc):''}${equipment_sidebar(g,t,esc)}<details open><summary>${t('cpu')} · ${g.players[1].owned.length} ${t('recruited')}</summary><p title="${esc(loc(FACTIONS[g.players[1].party]?.text))}">${esc(loc(FACTIONS[g.players[1].party]?.title))}</p>${g.cpuDecision?`<p class="cpu-plan">${t('cpu_'+g.cpuDecision.branch)}</p>`:''}</details><details id="sidebar-log" class="sidebar-log" ${sidebarLogOpen?'open':''}><summary>${t('logs')}</summary><div class="sidebar-scroll" tabindex="0"><ol>${g.logs.slice(-12).reverse().map(l=>`<li>${t(l.kind==='cpu_pass'?'cpuPass':l.kind==='bid'?'bidLog':l.kind==='social_event'?'socialEvent':l.kind)} ${l.player!==undefined?t(l.player?'cpu':'you'):''} ${esc(l.name||(l.item?t('item_'+l.item):''))} ${l.layers?'+'+l.layers+' '+t('layers'):''} ${l.amount?'€'+l.amount:''} ${l.title?esc(loc(l.title)):''}</li>`).join('')}</ol></div></details></aside></div>${history_view(g,t,loc,esc,historyOpen)}${g.phase!=='DEPLOYMENT'?`<details id="collection-panel" class="collection-panel" ${collectionOpen?'open':''}><summary>${t('roster')} · ${g.players[0].owned.length}</summary><div class="collection-scroll"><div class="roster-heading"><span class="pool-count">${CONTENT.roster.filter(c=>!is_neutral_chair(c)&&!c.inactive).length} ${t('memberPool')}</span></div><div class="cards">${g.players[0].owned.map(c=>card(c)).join('')}</div><details><summary>${t('cpu')} / ${g.players[1].owned.length}</summary><div class="cards">${g.players[1].owned.map(c=>card(c,false,g.players[1].party)).join('')}</div></details></div></details>`:''}`;
// Migrated Stronghold immutable state patches provide replay snapshots without mutating prior views.
refresh_portraits(document,CONTENT.portraits);let next={round:g.round,phase:g.phase,players:structuredClone(g.players)};let patch=snap?diffState(snap,next):null;snap=patch?applyStatePatch(snap,patch):next;save();}
const resetEquipmentUi=equipment_bind({getGame:()=>game,getIds:()=>[...selected],render,t,loc,esc});
document.addEventListener('click',async e=>{
 const browse=e.target.closest('[data-roster-scroll]');
 if(browse){
  const grid=$('.deployment-grid');
  grid?.scrollBy({left:Number(browse.dataset.rosterScroll)*grid.clientWidth*.82,behavior:round_motion_available(grid)?'smooth':'instant'});
  return;
 }
 const newsAction=e.target.closest('[data-action]')?.dataset.action;if(newsAction==='show_news'||newsAction==='close_news'){newsOpen=newsAction==='show_news';render();globalThis.scrollTo?.({top:0,behavior:'instant'});return;}let c=e.target.closest('[data-card]');if(c&&e.target.closest('details,a'))return;if(c){let id=c.dataset.card;if(selected.has(id))selected.delete(id);else if(selected.size<MAX_DEPLOYMENT)selected.add(id);else return;c.classList.toggle('chosen',selected.has(id));c.setAttribute('aria-checked',String(selected.has(id)));if(game){refresh_deployment_selection(game,selected,document,t,loc,esc);save();}return;}let b=e.target.closest('[data-action]');if(!b)return;try{let a=b.dataset.action,previous=game?.phase,logStart=game?.logs.length||0;if(a==='start'){start_opening();return;}else if(a==='resume'){let raw=JSON.parse(localStorage.getItem('kp-game-v2'));game=Object.assign(Object.create(Game.prototype),raw);game.data=CONTENT;normalize_saved_cards(game,CONTENT);game.sandbox=Sandbox.restore(raw.sandbox,CONTENT.pssProfiles);game.sandbox.track(game.players.flatMap(p=>p.owned));game.polls??=initial_polls();newsOpen=false;if(game.phase==='AUCTION'&&game.card){game.card=CONTENT.roster.find(c=>c.id===game.card.id)||game.card;if(is_neutral_chair(game.card)||game.card.tier>game.level)game.resolve(null);}selected=initial_deployment_selection(game,raw.phase==='DEPLOYMENT'?raw.deploymentSelection:undefined);}else if(a==='export'){let blob=new Blob([JSON.stringify({schemaVersion:14,rulesVersion:game.crisis?'terminal-crisis-v1':'pss-v1',crisis:game.crisis,recruitmentBan:game.recruitmentBan,pss:game.sandbox.toJSON(),polls:game.polls,pollReference:game.pollReference,level:game.level,round:game.round,phase:game.phase,initialSeed:game.initialSeed,rngState:game.seed,players:game.players.map(p=>({party:p.party,cash:p.cash,income:p.income,score:p.score,owned:p.owned,alliances:p.alliances,organization:p.organization,legislativeEfficiency:p.legislativeEfficiency,hiddenRelations:p.hiddenRelations,tactics:p.tactics,faction:p.faction,equipment:p.equipment})),news:game.news,history:game.history,logs:game.logs},null,2)],{type:'application/json'});let url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='koalitionsprotokoll.json';link.click();URL.revokeObjectURL(url);return;}else{game.command(a,{id:a==='train_csu'?$('#csu-trainee')?.value:a==='replace_negotiation'?$('#tactical-replace')?.value:b.dataset.id,training:a==='train_csu'?$('#csu-training-action')?.value:undefined,tactics:Object.fromEntries([...(document.querySelectorAll?.('[data-tactical-setting]')||[])].map(el=>[el.dataset.tacticalSetting,el.value])),amount:Number($('#amount')?.value),ids:[...selected]});if(game.phase!=='DEPLOYMENT')selected.clear();else if(previous!=='DEPLOYMENT')selected=initial_deployment_selection(game);}
 const enteringAgenda=game.phase==='DEPLOYMENT'&&['AUCTION','BONUS_AUCTION','BONUS_CHOICE'].includes(previous)&&a!=='resume';
 const lotPanel=enteringAgenda?$('.workspace > .panel'):null;
 if(round_motion_available(lotPanel)){
  save();
  await retire_round_lot(lotPanel);
  if(!lotPanel.isConnected)return;
 }
 render();
 if(game){
  if(['RESULT','END','CRISIS_CHECKPOINT'].includes(game.phase)||a==='continue'&&previous==='RESULT')globalThis.scrollTo?.({top:0,behavior:'instant'});
  const enteringCrisisNews=previous==='RESULT'&&game.phase==='NEWS'&&active_crisis(game);
  if(enteringCrisisNews)$('.news-page')?.classList.add('news-opening-arrival');
  if(enteringAgenda){
   const panel=$('.workspace > .panel'),box=panel?.getBoundingClientRect();
   if(box&&(box.top<12||box.top>globalThis.innerHeight-180))panel.scrollIntoView({block:'start',behavior:'instant'});
   reveal_round_agenda(panel);
  }
  if(game.phase==='RESULT'&&previous!=='RESULT'&&a!=='resume')reveal_round_settlement($('.result-page'));let sold=game.logs.slice(logStart).find(l=>l.kind==='sold');if(sold){let el=document.createElement('div');el.className='settlement';document.querySelectorAll?.('.settlement').forEach(old=>old.remove());document.body.append(el);announce_transition(el,`${sold.name} → ${t(sold.player?'cpu':'you')} · €${sold.amount}`,{duration:2800,remove:true});}if((a==='deploy'&&game.phase!=='CRISIS_CHECKPOINT')||(game.phase==='DEPLOYMENT'&&previous!==game.phase&&!enteringAgenda)||(a==='continue'&&previous==='RESULT'&&!enteringCrisisNews)){let el=$('#transition');announce_transition(el,t(a==='deploy'?'phase_'+game.phase:game.phase==='DEPLOYMENT'?'agenda':'phase_'+game.phase));}}}catch(err){$('#error').textContent=t(err.message);setTimeout(()=>$('#error').textContent='',4000);}});
document.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&e.target.matches('[data-card]')){e.preventDefault();e.target.click();}});
$('#theme').onclick=()=>{dark=!dark;localStorage.setItem('kp-dark',dark);apply_theme();};$('#language').onchange=e=>{lang=e.target.value;localStorage.setItem('kp-lang',lang);render();};$('#new').onclick=()=>{game=null;$('#status').textContent='';render();};render();

$('#rules').onclick=()=>{let d=$('#rules-dialog');d.innerHTML=`<button class="close" id="close-rules">×</button><h2>${t('rulesTitle')}</h2><p>${t('rulesBody')}</p><p>${t('crisisRules')}</p><h3>${t('partyPolicyTitle')}</h3>${Object.entries(CONTENT.platforms||{}).map(([party,p])=>`<p><b>${esc(party)} · ${esc(loc(p.title))}</b><br>${esc(loc(p.goals))}</p>`).join('')}<h3>${t('factionPassives')}</h3>${Object.entries(FACTIONS).map(([party,f])=>`<p><b>${esc(party)} · ${esc(loc(f.title))}</b><br>${esc(loc(f.text))}</p>`).join('')}<h3>${t('interpartyTitle')}</h3>${(CONTENT.policyRelations||[]).map(r=>`<p><b>${esc(r.a)} / ${esc(r.b)}</b><br>${esc(loc(r.description))}</p>`).join('')}<h3>${t('disciplineTitle')}</h3><p>${t('disciplineRules')}</p><h3>${t('partyRelations')}</h3><p>${['sameParty','unionPartner','coalitionPartner','crossBench','oppositionPeer'].map(k=>`<b>${t(k)}</b> · ${t(k+'Text')}`).join('<br>')}</p><h3>${t('recruitOdds')}</h3><p>${recruitment_pool(CONTENT.roster,game?round_recruitment_excluded(game):[],game?.level||1).map(g=>`T${g.tier}: ${(g.probability*100).toFixed(1)}%`).join(' · ')}</p><p>${t('noTierSix')}</p><p>${t('rule')}</p><h3>${t('sources')}</h3><p>${CONTENT.roster.filter(c=>!is_neutral_chair(c)&&!c.inactive).length} ${t('memberPool')} · ${CONTENT.agendas.length} ${t('agenda')}</p><a href="https://www.bundeswahlleiterin.de/bundestagswahlen/2025/gewaehlte.html" target="_blank" rel="noopener">Bundeswahlleiterin · Bundestagswahl 2025</a>`;d.showModal();$('#close-rules').onclick=()=>d.close();};

document.addEventListener('toggle',event=>{if(event.target.id==='history-panel')historyOpen=event.target.open;if(event.target.id==='collection-panel')collectionOpen=event.target.open;if(event.target.id==='sidebar-log')sidebarLogOpen=event.target.open;},true);
