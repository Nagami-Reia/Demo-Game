import {alliance_preview} from './alliances.js';
import {hidden_preview} from './hidden-relations.js';
import {agenda_weights} from './agenda-domains.js';
import {opposition_default_duo,opposition_preview} from './opposition-skills.js';
export const TACTICAL_GROWTH=8;
export function tactical_enabled(game){return !!game.data.tacticalEffects?.enabled;}
export function tactical_store(game,player){const state=game.players[player].tactics??={};state.pending??=[];state.receipts??={};state.settlements??={};return state;}
export function tactical_team(game,player,ids){const wanted=new Set(ids);return game.players[player].owned.filter(c=>wanted.has(c.id)&&!c.neutralChair).slice(0,5);}
export function tactical_abilities(game,player,ids){
 if(!tactical_enabled(game))return {};
 const routes=alliance_preview(game,ids,player).filter(r=>r.active),find=pattern=>{const r=routes.find(r=>r.category==='working_group'&&new RegExp(pattern,'i').test(JSON.stringify(r.name)));return r?{...r,specialGrowthThreshold:game.data.tacticalEffects.growthLayers}:undefined;};
 return {law:find('法律|\\bRecht\\b'),budget:find('预算|Haushalt'),finance:find('财政|Finanzen'),energy:find('经济与能源|Wirtschaft und Energie'),digital:find('数字化|Digitales'),foreign:find('外交事务|Auswärtiges|Außenpolitik'),health:find('卫生|Gesundheit'),labor:find('劳动与社会|Arbeit und Soziales'),interior:find('内政|Inneres|Innen'),local:routes.find(r=>r.category==='state'&&r.count>=3)};
}
export function tactical_grown(route){return !!route&&(route.layers>=(route.specialGrowthThreshold||TACTICAL_GROWTH)||route.category==='state'&&route.tier>=2);}
const tactical_text=(zh,en,de)=>({zh,en:en||zh,de:de||en||zh});
export function tactical_prepare(game,player,state){
 if(!tactical_enabled(game))return state;
 const ids=state.ids,abilities=tactical_abilities(game,player,ids),hidden=hidden_preview(game,player,ids).filter(r=>r.active),has=id=>hidden.some(r=>r.id===id),team=tactical_team(game,player,ids),store=tactical_store(game,player);
 const defaults={focus:Object.keys(agenda_weights(game.agenda)).sort((a,b)=>agenda_weights(game.agenda)[b]-agenda_weights(game.agenda)[a])[0],authorization:'',finance:'now',grantDomain:'economy',projectDomain:'',emergency:'none'};
 state.tactical={abilities:Object.keys(abilities).filter(k=>abilities[k]),grown:Object.keys(abilities).filter(k=>tactical_grown(abilities[k])),hidden:hidden.map(r=>r.id),defaults,settings:[],locked:false};
 const setting=(key,title,options)=>state.tactical.settings.push({key,title,options});
 const domains=['economy','digital','social','climate','foreign','security'];
 if(opposition_preview(game,ids,player).some(s=>s.id==='geliebter_tino')){defaults.weidelChrupalla=opposition_default_duo(game.agenda,player);setting('weidelChrupalla',tactical_text('双人搭档技能','Duo skill','Duo-Fähigkeit'),[{id:'geliebter_tino',title:tactical_text('Geliebter Tino')},{id:'ein_herz',title:tactical_text('Ein Herz und eine Seele')}]);}
 if(has('boss_right'))setting('focus',tactical_text('统一口径：本轮重点','Common line: locked focus','Einheitliche Linie: Schwerpunkt'),domains.map(d=>({id:d,title:{key:d}})));
 if(has('new_star')){const choices=alliance_preview(game,ids,player).filter(r=>r.category==='working_group'&&r.count>0&&!r.members.includes('mdb_Philipp_Amthor'));setting('authorization',tactical_text('获得授权：临时补位','Authorisation: temporary membership','Vollmacht: temporäre Ergänzung'),[{id:'',title:tactical_text('不借用席位','No borrowed seat','Kein zusätzlicher Sitz')},...choices.map(r=>({id:r.id,title:r.name}))]);}
 if(abilities.finance&&game.round<8){setting('finance',tactical_text('附带拨款','Conditional appropriation','Zweckgebundene Mittel'),[{id:'now',title:tactical_text('立即领取资金','Take cash now','Geld sofort erhalten')},{id:'delay',title:tactical_text('下轮领取并换定向候选','Defer for a targeted candidate','Aufschieben für gezielten Kandidaten')}]);if(tactical_grown(abilities.finance))setting('grantDomain',tactical_text('指定招募领域','Recruitment field','Rekrutierungsbereich'),domains.map(d=>({id:d,title:{key:d}})));}
 if(tactical_grown(abilities.energy))setting('projectDomain',tactical_text('项目接力方向','Follow-up project','Anschlussprojekt'),['digital','social','climate'].slice(game.round%2?0:1,game.round%2?2:3).map(d=>({id:d,title:{key:d}})));
 if(abilities.interior&&game.news?.edition?.entries.some(e=>e.event.category==='unexpected')){const protections=tactical_grown(abilities.interior)?['cash','execution','coordination']:['execution'];setting('emergency',tactical_text('应急预案：用首次监督换保护','Emergency plan: trade first scrutiny','Notfallplan: erste Kontrolle aufgeben'),[{id:'none',title:tactical_text('保留监督行动','Keep scrutiny','Kontrolle behalten')},...protections.map(id=>({id,title:tactical_text(({cash:'保护一项资金损失',execution:'保护一项执行影响',coordination:'保护一项协调影响'})[id])}))]);}
 const add=(id,title,effects,extra={})=>state.options.push({id,title,description:extra.description||title,cost:extra.cost||0,baseCost:extra.cost||0,effects,tacticalKind:id,...extra});
 if(player===0&&abilities.budget&&game.round<8&&!game.agenda.tacticalContinuation)add('tactic_budget',tactical_text('预算：先通过较小范围','Budget: pass a smaller scope','Haushalt: kleineren Umfang beschließen'),{coordination:.15,amendment:.1},{scope:.6,description:tactical_text('本轮缩小提案；余项下轮续审，政策奖励只支付未领部分。','Narrow the proposal; carry the remainder once, without duplicate policy rewards.','Vorlage verkleinern; Rest einmal fortsetzen, ohne doppelte Politikpunkte.')});
 if(abilities.labor&&new Set(team.map(c=>c.party)).size>=2)add('tactic_cosign',tactical_text('以人的名义：共同签署','In people’s name: co-sign','Im Namen der Menschen: gemeinsam unterzeichnen'),{negotiation:.1},{description:tactical_text('两个不同党派各有一次有效行动，才兑现共同文本。','Two parties must each deliver an effective action.','Zwei Parteien müssen je wirksam handeln.')});
 if(player===0&&abilities.local&&!game.agenda.tacticalContinuation)add('tactic_local',tactical_text('从这里，到柏林：地方配套','From here to Berlin: local package','Von hier nach Berlin: lokales Paket'),{coordination:.1},{scope:.75,description:tactical_text('将本轮提案范围收窄至75%；推进成功获得2资金。','Narrow this round’s proposal to 75%; gain 2 cash if it advances.','Den Umfang auf 75% verringern; bei erfolgreicher Umsetzung 2 Geld erhalten.')});
 const bridge=store.pending.find(p=>p.kind==='foreign_bridge'&&p.due===game.round);if(bridge&&abilities.foreign)add('tactic_bridge',tactical_text('沿用外交合作文本','Reuse diplomatic text','Diplomatischen Text weiterverwenden'),{negotiation:.25,coordination:.1});
 if(has('lower_saxony_line'))state.scoutedOption={id:'tactic_scouted',title:tactical_text('先打个电话：跨党工作文本','A quick call: cross-party draft','Erst anrufen: gemeinsamer Entwurf'),description:tactical_text('协商经费2；增强谈判和协调，监督让步。','Costs 2; negotiation and coordination improve at the expense of scrutiny.','Kosten 2; bessere Verhandlung und Koordination, schwächere Kontrolle.'),baseCost:2,cost:2,effects:{negotiation:.3,coordination:.15,scrutiny:-.1},tacticalKind:'tactic_scouted'};
 const obligation=store.pending.find(p=>p.kind==='disagreement'&&p.due<=game.round);
 if(obligation){state.obligation=obligation.id;state.options=[{id:'tactic_fulfill',title:tactical_text('带回去谈：履行上轮条件','Address last round’s condition','Bedingung der Vorrunde erfüllen'),description:tactical_text('本轮先处理约定；收窄政策范围。'),baseCost:0,cost:0,effects:{negotiation:.15},scope:.8,tacticalKind:'tactic_fulfill'},{id:'tactic_terminate',title:tactical_text('终止未完成的合作','End unfinished cooperation','Unvollendete Kooperation beenden'),description:tactical_text('不再延期；本轮协调受损。'),baseCost:0,cost:0,effects:{coordination:-.2},tacticalKind:'tactic_terminate'}];state.scoutedOption=null;}
 return state;
}
export function tactical_validate(state,settings={}){
 const chosen={...state.tactical.defaults};for(const setting of state.tactical.settings){let value=settings[setting.key]??chosen[setting.key]??setting.options[0]?.id;if(!setting.options.some(o=>o.id===value)){if(settings[setting.key]!==undefined)throw Error('invalid_tactical_choice');value=setting.options[0]?.id;}chosen[setting.key]=value;}return chosen;
}
export function tactical_commit(game,player,state,settings={}){
 if(!tactical_enabled(game)||!state.tactical)return;const chosen=tactical_validate(state,settings);
 const option=state.options.find(o=>o.id===state.selected);chosen.scope=option?.scope||1;chosen.cosign=option?.id==='tactic_cosign';chosen.local=option?.id==='tactic_local';chosen.handledDisagreement=!!state.obligation;chosen.round=game.round;chosen.ids=[...state.ids];state.tactical.locked=true;state.tactical.selected=chosen;
 game.tacticalPlans??={};game.tacticalPlans[player]=chosen;
 const store=tactical_store(game,player);if(option?.id==='tactic_bridge'){const bridge=store.pending.find(p=>p.kind==='foreign_bridge'&&p.due===game.round);if(bridge){store.receipts[bridge.id]={round:game.round};store.pending=store.pending.filter(p=>p.id!==bridge.id);}}if(state.obligation){store.pending=store.pending.filter(p=>p.id!==state.obligation);store.receipts[state.obligation]={round:game.round,kind:state.selected};}
}
export function tactical_pending(game,player,kind,payload){
 const store=tactical_store(game,player);store.pending=store.pending.filter(p=>!(p.kind===kind&&p.due>=game.round));const item={id:`${player}:${game.round}:${kind}`,kind,created:game.round,due:game.round+1,expires:game.round+1,...payload};store.pending.push(item);return item;
}
export function tactical_funding(game){
 if(!tactical_enabled(game))return;game.tacticalPlans={};game.tacticalRound={};game.tacticalGrants=[0,0];
 game.players.forEach((owner,player)=>{const store=tactical_store(game,player);for(const p of store.pending){if(p.due>game.round||store.receipts[p.id])continue;
  if(p.kind==='signature_debt'){const paid=Math.min(owner.cash,p.amount);owner.cash-=paid;store.receipts[p.id]={round:game.round,paid};game.log('tactical_debt',{player,amount:paid});}
  if(p.kind==='grant'){owner.cash+=p.amount;game.tacticalGrants[player]+=p.amount;game.recruitOffers??=[];game.recruitOffers.push({id:p.id,player,domain:p.domain,round:game.round,used:false});store.receipts[p.id]={round:game.round,paid:p.amount};game.log('tactical_grant',{player,amount:p.amount,domain:p.domain});}
 }store.pending=store.pending.filter(p=>p.expires>=game.round&&!store.receipts[p.id]);});
}
export function tactical_agenda(game,ordinary){
 const store=tactical_enabled(game)?tactical_store(game,0):null,proposal=store?.pending.find(p=>p.kind==='proposal'&&p.due===game.round);
 return proposal?{...proposal.agenda,tacticalContinuation:{id:proposal.id,credited:proposal.credited,fullReward:proposal.fullReward,grown:proposal.grown},title:{zh:'续审：'+proposal.agenda.title.zh,en:'Continuation: '+proposal.agenda.title.en,de:'Fortsetzung: '+proposal.agenda.title.de}}:ordinary;
}
export function tactical_policy(game,policy,breakdowns){
 if(!tactical_enabled(game)||policy.value===null)return;
 const plan=game.tacticalPlans?.[0],continuation=game.agenda.tacticalContinuation;
 if(continuation){const remainder=Math.max(0,Math.round(continuation.fullReward*10)-Math.round(continuation.credited*10)),current=Math.round(breakdowns[0].policy*10);const credit=policy.passed&&current>0?(continuation.grown?remainder:Math.min(remainder,current))/10:0;policy.goalScores[0]=credit;breakdowns[0].total=Math.round((breakdowns[0].total-breakdowns[0].policy+credit)*10)/10;breakdowns[0].policy=credit;const st=tactical_store(game,0);st.receipts[continuation.id]={round:game.round,completed:policy.passed&&current>0};st.pending=st.pending.filter(p=>p.id!==continuation.id);return;}
 if(plan?.scope<1){const target=policy.target?.[0],status=policy.statusQuo??0,proposal=policy.proposalValue;
  const potential=Number.isFinite(target)&&Number.isFinite(proposal)?Math.min(2,2*Math.max(0,Math.abs(target-status)-Math.abs(target-proposal))/Math.max(.4,Math.abs(target-status))):0;
  const fullReward=policy.passed?breakdowns[0].policy:Math.round(potential*10)/10,credit=policy.passed?Math.round(fullReward*plan.scope*10)/10:0;policy.scope=plan.scope;policy.goalScores[0]=credit;breakdowns[0].total=Math.round((breakdowns[0].total-breakdowns[0].policy+credit)*10)/10;breakdowns[0].policy=credit;
  if(plan.scope===.6&&game.round<8)tactical_pending(game,0,'proposal',{agenda:structuredClone(game.agenda),credited:credit,fullReward:fullReward,grown:!!game.negotiation?.tactical?.grown.includes('budget')});
 }
}
