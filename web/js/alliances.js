import {agenda_weights} from './agenda-domains.js';
import {is_neutral_chair} from './roles.js';

// Counts activate a route; persistent layers improve it. Rendering and action previews never produce layers.
const alliance_mappedActions={negotiate:'negotiation',coordinate:'coordination',amend:'amendment',scrutinize:'scrutiny'};
const alliance_actionType=type=>alliance_mappedActions[type]||type;
const alliance_value=n=>Number.isFinite(n)&&n>0?n:0;
const alliance_definitions=game=>Array.isArray(game.data?.allianceDefinitions)?game.data.allianceDefinitions:[];
const alliance_tagRows=game=>Array.isArray(game.data?.allianceTags)?game.data.allianceTags:[];
const alliance_ledger=(game,player)=>game.players?.[player]?.alliances||{};
const alliance_modern=def=>!!def.category||!!def.effectKind;
const alliance_tierValue=(values,tier,fallback=0)=>tier<1?0:Array.isArray(values)?(values[Math.min(tier,values.length)-1]??fallback):Number.isFinite(values)?values:fallback;
const alliance_capLayers=(n,def)=>Math.min(def.layerCap??(alliance_modern(def)?999:24),Math.floor(alliance_value(n)));
const alliance_stateLayers=(game,player,def)=>alliance_capLayers(alliance_ledger(game,player).layers?.[def.id],def);
function alliance_tagsOf(game,card){return new Set(alliance_tagRows(game).filter(r=>r.id===card.id).flatMap(r=>r.tags||[]));}
function alliance_selected(game,ids,player){
 const own=game.players?.[player]?.owned||[],wanted=new Set((ids||[]).map(x=>typeof x==='string'?x:x?.id));
 return [...new Map(own.filter(c=>wanted.has(c.id)&&!is_neutral_chair(c)).map(c=>[c.id,c])).values()].slice(0,5);
}
function alliance_snapshot(game,ids,player,includeAvailable=false){
 const team=alliance_selected(game,ids,player),owned=includeAvailable?[...new Map((game.players?.[player]?.owned||[]).filter(c=>!is_neutral_chair(c)).map(c=>[c.id,c])).values()]:[];
 const tags=new Map();for(const row of alliance_tagRows(game)){const set=tags.get(row.id)||new Set();for(const tag of row.tags||[])set.add(tag);tags.set(row.id,set);}
 return alliance_definitions(game).map(def=>{
  const members=team.filter(c=>tags.get(c.id)?.has(def.id)).map(c=>c.id);
  const plan=game.tacticalPlans?.[player],authorised=!!(game.data.tacticalEffects?.enabled&&plan?.round===game.round&&plan?.authorization===def.id&&def.category==='working_group'&&members.length>=1&&!members.includes('mdb_Philipp_Amthor')&&['Merz','mdb_Philipp_Amthor'].every(id=>team.some(c=>c.id===id)));
  if(authorised)members.push('mdb_Philipp_Amthor');const count=members.length;
  const thresholds=def.thresholds||[def.threshold||2],threshold=thresholds[0],tier=thresholds.filter(n=>count>=n).length;
  const layers=alliance_stateLayers(game,player,def),reached=(def.milestones||[]).filter(n=>layers>=n);
  return {...def,count,threshold,thresholds,tier,active:tier>0,layers,members,nextThreshold:thresholds.find(n=>n>count)??null,
   virtualMemberIds:authorised?['mdb_Philipp_Amthor']:[],availableCount:owned.filter(c=>tags.get(c.id)?.has(def.id)).length,reachedMilestones:reached,
   effect:alliance_modern(def)?Math.min(def.powerCap??Infinity,alliance_tierValue(def.powerByTier,tier)+(def.powerPerLayer||0)*layers+reached.length*(def.milestonePower||0)):
    Math.min(.52,(def.basePower||0)+(def.powerPerLayer||0)*layers+(tier>1?def.deepPower||0:0)+reached.length*(def.milestonePower||0))};
 });
}
export function alliance_preview(game,ids,player=0){
 return alliance_snapshot(game,ids,player,true).filter(b=>b.count>0||b.layers>0||b.availableCount>=b.threshold);
}
// Public lineup estimate for the opponent; shares the activation and growth formulas.
export function alliance_lineup_value(game,player,ids,agenda){
 const team=alliance_selected(game,ids,player),types=['negotiation','coordination','amendment','scrutiny'];
 const routes=alliance_actionSnapshot(game,ids,player),cap=alliance_definitions(game).some(alliance_modern)?3:.8;
 const actions=team.reduce((n,c)=>n+types.reduce((sum,type)=>sum+alliance_powerFor(routes,c.id,type,agenda,cap).power,0)/types.length,0);
 const economy=alliance_economy_preview(game,player,ids);
 // The CPU values the same payouts the settlement will produce; cash is utility, never interest.
 return actions+.15*(economy.cash+economy.income*Math.max(0,8-(game.round||1)))+economy.gains.reduce((n,g)=>n+g.add*.02,0);
}
function alliance_relevant(def,type,agenda){
 if(def.actions?.length&&!def.actions.includes(alliance_actionType(type)))return 0;
 if(!def.domains?.length)return 1;
 return Object.entries(agenda_weights(agenda)).reduce((n,[d,w])=>n+(def.domains.includes(d)?w:0),0);
}
function alliance_actionSnapshot(game,deployedIds,player){
 const history=alliance_ledger(game,player).settlements?.[String(game.round)];
 let actionGame=game;
 if(history){
  const current=alliance_ledger(game,player),layers={...current.layers};
  for(const def of alliance_definitions(game))if(alliance_modern(def)&&Object.hasOwn(history.before,def.id))layers[def.id]=history.before[def.id];
  const players=[...game.players];players[player]={...players[player],alliances:{...current,layers}};actionGame={...game,players};
 }
 return alliance_snapshot(actionGame,deployedIds,player);
}
function alliance_powerFor(routes,actorId,type,agenda,cap){
 const effects=routes.filter(b=>b.active&&(b.target==='team'||b.members.includes(actorId)))
  .map(b=>({id:b.id,name:b.name,layers:b.layers,count:b.count,tier:b.tier,power:b.effect*alliance_relevant(b,type,agenda)})).filter(b=>b.power>0);
 const total=effects.reduce((n,e)=>n+e.power,0),scale=total>cap?cap/total:1;
 for(const e of effects)e.power*=scale;
 return {power:Math.min(cap,total),effects};
}
export function alliance_action_bonus(game,player,actorId,type,agenda,deployedIds){
 if(!alliance_selected(game,deployedIds,player).some(c=>c.id===actorId))return {power:0,effects:[]};
 return alliance_powerFor(alliance_actionSnapshot(game,deployedIds,player),actorId,type,agenda,alliance_definitions(game).some(alliance_modern)?3:.8);
}
function alliance_growthRate(def,tier){
 const kinds=Array.isArray(def.effectKind)?def.effectKind:[def.effectKind];
 return Math.floor(alliance_value(alliance_tierValue(def.layerRate,tier,kinds.includes('growth')?tier:0)));
}
function alliance_paidIncome(game,player,route){
 const state=alliance_ledger(game,player);
 if(Number.isFinite(state.paidIncome?.[route.id]))return Math.floor(alliance_value(state.paidIncome[route.id]));
 // Older saved settlements already paid these amounts; migrate the counter without replaying rewards.
 const amount=Object.values(state.settlements||{}).reduce((sum,row)=>sum+(row.payouts||[]).filter(p=>p.id===route.id).reduce((n,p)=>n+alliance_value(p.income),0),0);
 return Math.floor(amount/(route.incomePerMilestone||1));
}
// Pure round-end forecast shared by preview, opponent valuation and real settlement.
export function alliance_economy_preview(game,player,deployedIds,round=game.round,economicEvents=game.logs||[]){
 const gains=[],milestones=[],payouts=[],before={},settled=!!alliance_ledger(game,player).settlements?.[String(round)];
 if(settled)return {gains,milestones,payouts,cash:0,income:0,before};
 const active=alliance_snapshot(game,deployedIds,player).filter(b=>b.active);
 const upgrade=economicEvents.find(row=>(row.kind||row.type)==='upgrade'&&row.round===round&&row.player===player&&Number.isFinite(row.amount)&&row.amount>0);
 let refundable=upgrade?Math.floor(upgrade.amount):0;
 for(const def of alliance_definitions(game))if(alliance_modern(def))before[def.id]=alliance_stateLayers(game,player,def);
 for(const route of active.filter(alliance_modern)){
  const from=route.layers,to=alliance_capLayers(from+alliance_growthRate(route,route.tier),route);
  if(to>from)gains.push({id:route.id,name:route.name,from,to,add:to-from,reason:'round_end',tier:route.tier});
  for(const level of route.milestones||[])if(from<level&&to>=level)milestones.push({id:route.id,name:route.name,level});
  const step=route.incomeEveryLayers||route.incomeStep||0;
  const paid=alliance_paidIncome(game,player,route),due=step>0?Math.floor(to/step):0;
  const qualified=step>0&&route.tier>=(route.incomeMinTier||1);
  const incomeMilestones=qualified?Math.max(0,due-paid):0;
  const income=incomeMilestones*(route.incomePerMilestone??1);
  const activeBonus=route.cashPerActiveAlliances>0?Math.floor(active.length/route.cashPerActiveAlliances)*(route.cashPerActiveAllianceGroup??1):0;
  const refund=upgrade?Math.min(refundable,Math.floor(upgrade.amount*alliance_value(alliance_tierValue(route.refundUpgradeByTier,route.tier)))):0;
  refundable-=refund;
  const cash=Math.floor(alliance_value(alliance_tierValue(route.cashByTier,route.tier))+activeBonus+refund);
  if(cash||income)payouts.push({id:route.id,name:route.name,tier:route.tier,from,to,cash,income,incomeMilestones,paidIncomeThrough:qualified?Math.max(paid,due):paid,refund,activeBonus,reason:'round_end'});
 }
 return {gains,milestones,payouts,before,cash:payouts.reduce((n,p)=>n+p.cash,0),income:payouts.reduce((n,p)=>n+p.income,0)};
}
export function alliance_settle(game,player,deployedIds,actions,round=game.round,economicEvents=game.logs||[]){
 const owner=game.players?.[player];if(!owner)return {gains:[],milestones:[],payouts:[],cash:0,income:0};
 const forecast=alliance_economy_preview(game,player,deployedIds,round,economicEvents);
 const store=owner.alliances??={layers:{},credited:{},milestones:{}};
 store.layers??={};store.credited??={};store.milestones??={};
 const routes=alliance_snapshot(game,deployedIds,player).filter(b=>b.active&&!alliance_modern(b)),gains=[...forecast.gains],milestones=[...forecast.milestones];
 store.settlements??={};
 if(!store.settlements[String(round)]){
  for(const gain of forecast.gains)store.layers[gain.id]=gain.to;
  for(const milestone of forecast.milestones)store.milestones[`${milestone.id}:${milestone.level}`]=true;
  store.paidIncome??={};
  for(const payout of forecast.payouts)if(payout.incomeMilestones>0)store.paidIncome[payout.id]=payout.paidIncomeThrough;
  store.settlements[String(round)]=structuredClone(forecast);
 }
 const credit=store.credited[String(round)]??={events:[],actors:{},gained:{},total:0};
 const seen=new Set(credit.events);
 for(const row of actions||[]){
  if(row.player!=null&&row.player!==player)continue;
  if(row.kind&&row.kind!=='action')continue;
  if(row.success!==true||!Number.isFinite(row.powerContribution)||row.powerContribution<=0)continue;
  const actor=row.actor||row.cardId||row.member,id=row.id||row.eventId;
  if(!actor||!id||seen.has(id)||credit.total>=6)continue;
  const type=row.type||row.action;
  const candidates=routes.filter(b=>b.members.includes(actor)&&alliance_relevant(b,type,game.agenda)>0&&
   alliance_capLayers(store.layers[b.id],b)<b.layerCap&&(credit.gained[b.id]||0)<(b.roundCap||3)&&!(credit.actors[b.id]||[]).includes(actor));
  // One original event feeds one route. Prefer the least-grown eligible route; ties keep definition order.
  candidates.sort((a,b)=>alliance_value(store.layers[a.id])-alliance_value(store.layers[b.id]));
  const route=candidates[0];if(!route)continue;
  const before=alliance_capLayers(store.layers[route.id],route),after=Math.min(route.layerCap||24,before+1);
  store.layers[route.id]=after;credit.total++;credit.gained[route.id]=(credit.gained[route.id]||0)+1;
  (credit.actors[route.id]??=[]).push(actor);credit.events.push(id);seen.add(id);
  gains.push({id:route.id,name:route.name,actor,eventId:id,from:before,to:after,add:after-before});
  for(const level of route.milestones||[]){
   const key=`${route.id}:${level}`;
   if(before<level&&after>=level&&!store.milestones[key]){
    store.milestones[key]=true;milestones.push({id:route.id,name:route.name,level});
   }
  }
 }
 return {gains,milestones,payouts:forecast.payouts,cash:forecast.cash,income:forecast.income};
}
