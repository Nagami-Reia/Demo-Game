import {is_neutral_chair} from './roles.js';
import {alliance_preview,alliance_passive_generic} from './alliances.js';
const hidden_number=n=>Number.isFinite(n)?Math.max(0,n):0;
function hidden_team(game,player,ids){const wanted=new Set(ids||[]);return [...new Map((game.players[player]?.owned||[]).filter(c=>wanted.has(c.id)&&!is_neutral_chair(c)).map(c=>[c.id,c])).values()].slice(0,5);}
export function hidden_preview(game,player,ids){
 const defs=game.data.hiddenRelations||[],team=hidden_team(game,player,ids),own=game.players[player]?.owned||[],selected=new Set(team.map(c=>c.id)),available=new Set(own.filter(c=>!is_neutral_chair(c)).map(c=>c.id));
 return defs.filter(d=>!d.blocked).map(d=>{
  const csu=d.id==='csu_bavaria',count=csu?team.filter(c=>c.party==='CSU').length:(d.members||[]).filter(id=>selected.has(id)).length;
  const availableCount=csu?own.filter(c=>c.party==='CSU'&&!is_neutral_chair(c)).length:(d.members||[]).filter(id=>available.has(id)).length;
  const threshold=d.threshold||2,active=count>=threshold;
  return {...d,count,threshold,availableCount,active,baseCash:csu?[0,0,4,11,21,36][count]:d.effects?.cashRound||0};
 }).filter(r=>r.count>0||r.availableCount>=r.threshold);
}
export function hidden_begin(game,player,ids,normal=alliance_preview(game,ids,player)){
 return {tactical:!!game.data.tacticalEffects?.enabled,player,round:game.round,team:hidden_team(game,player,ids),rows:hidden_preview(game,player,ids).filter(r=>r.active),normal:normal.filter(r=>r.active),actions:[],events:[],seen:new Set(),cash:game.players[player]?.cash||0,organization:game.players[player]?.organization||0,legislativeEfficiency:0,score:0};
}
function hidden_topic(runtime,ctx,topic){
 const text=JSON.stringify([ctx.agenda?.title,ctx.agenda?.summary,...runtime.normal.map(r=>r.name)]);
 return {law:/法律|司法|Recht|Gesetz|Legal|Law/i,health:/卫生|医疗|健康|Gesund|Kranken|Health/i,digital:/数字|digital|Digitalisierung/i}[topic]?.test(text)||false;
}
function hidden_matches(runtime,route,selector){
 if(alliance_passive_generic(route))return false;
 const byId=new Map(runtime.team.map(c=>[c.id,c])),members=(route.members||[]).map(id=>byId.get(id)).filter(Boolean),text=JSON.stringify(route.name);
 if(selector==='csu')return members.some(c=>c.party==='CSU');if(selector==='cdu')return members.some(c=>c.party==='CDU');if(selector==='spd')return members.some(c=>c.party==='SPD');
 if(selector==='merz')return members.some(c=>c.id==='Merz');if(selector==='amthor')return members.some(c=>c.id==='mdb_Philipp_Amthor');if(selector==='state')return route.category==='state';
 return {law:/法律|司法|Recht|Legal|Law/i,finance:/财政|预算|财税|Finanz|Haushalt|Fiscal|Budget/i,labor:/劳动|雇员|Arbeit|Labour|Labor/i,digital:/数字|digital/i,admin:/内政|行政|现代化|Innen|Modernisierung|Administration/i}[selector]?.test(text)||false;
}
export function hidden_before_action(runtime,ctx){
 const out={skillMultiplier:1,forceSuccess:false,cashCost:hidden_number(ctx.baseCashCost),orgCost:hidden_number(ctx.baseOrgCost),discount:0,reservedSuccessCost:0,pending:[]};
 const negotiation=ctx.action==='negotiate',first=negotiation&&!runtime.actions.some(a=>a.action==='negotiate'),cross=!!ctx.crossParty,execution=ctx.isExecution??ctx.stage===2;
 for(const row of runtime.rows){const e=row.effects||{};
  if(negotiation&&first)out.discount+=e.firstNegotiationDiscount||0;
  if(ctx.stage<0)continue;
  if(execution){out.discount+=e.executionDiscount||0;if(!runtime.actions.some(a=>a.isExecution))out.discount+=e.firstExecutionDiscount||0;if(hidden_topic(runtime,ctx,'digital')&&!runtime.actions.some(a=>a.isExecution&&a.digital))out.discount+=e.firstDigitalExecutionDiscount||0;}
  if(negotiation&&hidden_topic(runtime,ctx,'law'))out.skillMultiplier*=e.lawNegotiationMultiplier||1;
  if(negotiation&&cross&&!runtime.actions.some(a=>a.action==='negotiate'&&a.crossParty))out.skillMultiplier*=e.firstCrossNegotiationMultiplier||1;
  if(hidden_topic(runtime,ctx,'health')){if(negotiation)out.skillMultiplier*=e.healthNegotiationMultiplier||1;if(ctx.action==='coordinate')out.skillMultiplier*=e.healthCoordinationMultiplier||1;}
  if(negotiation&&cross)out.orgCost+=e.crossOrgCost||0;
  if(negotiation&&e.firstNegotiationForce&&!runtime.tactical){out.reservedSuccessCost+=e.successNegotiationCost||0;if(first)out.pending.push('force');}
 }
 out.cashCost=Math.max(0,out.cashCost-out.discount);
 out.forceSuccess=ctx.stage>=0&&out.pending.includes('force')&&hidden_number(ctx.cash)>=out.cashCost+out.reservedSuccessCost;
 return out;
}
export function hidden_after_action(runtime,ctx){
 if(runtime.seen.has(ctx.id))return {scoreAdd:0,cashCost:0,organization:0,legislativeEfficiency:0,events:[]};
 const out={scoreAdd:0,cashCost:0,organization:0,legislativeEfficiency:0,events:[]},negotiation=ctx.action==='negotiate',execution=ctx.isExecution??ctx.stage===2;
 for(const row of runtime.rows){const e=row.effects||{};let points=0;
  if(ctx.success&&negotiation){points+=e.successNegotiationScore||0;if(ctx.crossParty)points+=e.crossSuccessNegotiationScore||0;if(!runtime.tactical&&e.successNegotiationCost&&hidden_number(ctx.cash)-out.cashCost>=e.successNegotiationCost)out.cashCost+=e.successNegotiationCost;}
  if(ctx.success&&execution&&hidden_topic(runtime,ctx,'digital'))points+=e.successDigitalExecutionScore||0;
  if(negotiation&&ctx.crossParty)out.organization-=Math.min(Math.max(0,runtime.organization+out.organization),e.crossOrgCost||0);
  if(points)out.events.push({source:row.id,kind:'score',amount:points,actionId:ctx.id});out.scoreAdd+=points;
 }
 runtime.seen.add(ctx.id);runtime.actions.push({...ctx,isExecution:execution,digital:hidden_topic(runtime,ctx,'digital')});runtime.organization+=out.organization;runtime.score+=out.scoreAdd;runtime.events.push(...out.events);
 return out;
}
export function hidden_lineup_value(game,player,ids){
 const rows=hidden_preview(game,player,ids).filter(r=>r.active);
 return rows.reduce((n,r)=>{const e=r.effects||{};return n+.15*(r.baseCash||e.cashRound||0)+.1*(e.organizationRound||0)+.3*(e.successNegotiationScore||e.crossSuccessNegotiationScore||e.scoreIfBoth?.score||0)+.12*(e.layers?.amount||0)+.2*(e.firstNegotiationForce?1:0);},0);
}
export function hidden_settle(game,player,ids,normalSettlement={},trace=[],round=game.round,runtime=null){
 const owner=game.players[player],active=hidden_preview(game,player,ids).filter(r=>r.active),empty={active,cash:0,income:0,organization:0,legislativeEfficiency:0,score:0,gains:[],events:[]};
 if(!active.length)return empty;
 const state=owner.hiddenRelations??={settlements:{},cashRemainder:0};state.settlements??={};if(state.settlements[round])return empty;
 const rt=runtime||hidden_begin(game,player,ids,normalSettlement.before||alliance_preview(game,ids,player));
 if(!runtime)for(const row of trace.filter(r=>r.kind==='action'&&r.player===player))hidden_after_action(rt,{...row,crossParty:owner.owned.find(c=>c.id===row.cardId)?.party!==owner.party,isExecution:row.stage===2,cash:owner.cash,agenda:game.agenda});
 const result={...empty,organization:rt.organization-(owner.organization||0),score:rt.score,events:[...rt.events]},queue=[],once=new Set();
 const csuCount=rt.team.filter(c=>c.party==='CSU').length,bavaria=active.some(r=>r.id==='csu_bavaria'),csuRoutes=rt.normal.filter(r=>hidden_matches(rt,r,'csu'));
 const money=(source,amount,ancestry=[])=>{if(amount>0)queue.push({id:`${round}:${player}:${queue.length}:${source}`,source,amount,ancestry:[...ancestry,source]});};
 const layers=(route,amount,source)=>{if(!amount||route.layerCap===0)return;owner.alliances??={layers:{}};owner.alliances.layers??={};const from=owner.alliances.layers[route.id]||0,to=Math.min(route.layerCap??999,from+amount);owner.alliances.layers[route.id]=to;if(to>from)result.gains.push({id:route.id,name:route.name,from,to,add:to-from,source});};
 for(const row of active){const e=row.effects||{};money(row.id,e.cashRound||0);result.organization+=e.organizationRound||0;if(e.organizationRound)result.events.push({source:row.id,kind:'organization',amount:e.organizationRound});
  const hooks=[...(e.onNormal?[e.onNormal]:[]),...(e.onNormals||[])];
  for(const route of rt.normal){
   for(const hook of hooks)if(hidden_matches(rt,route,hook.selector)){money(row.id,hook.cash||0);result.organization+=hook.organization||0;result.legislativeEfficiency+=hook.legislativeEfficiency||0;if(hook.organization)result.events.push({source:row.id,routeId:route.id,kind:'organization',amount:hook.organization});if(hook.legislativeEfficiency)result.events.push({source:row.id,routeId:route.id,kind:'legislativeEfficiency',amount:hook.legislativeEfficiency});}
   if(e.firstNormal&&hidden_matches(rt,route,e.firstNormal.selector)&&!once.has(row.id)){money(row.id,e.firstNormal.cash||0);once.add(row.id);}
   if(e.layers&&hidden_matches(rt,route,e.layers.selector))layers(route,(e.layers.amount||0)+(e.layers.perCSU||0)*csuCount,row.id);
  }
  if(!(rt.tactical&&['law_money','two_chairs'].includes(row.id))&&e.scoreIfBoth&&e.scoreIfBoth.selectors.every(s=>rt.normal.some(r=>hidden_matches(rt,r,s)))){result.score+=e.scoreIfBoth.score;result.events.push({source:row.id,kind:'score',amount:e.scoreIfBoth.score});}
 }
 if(bavaria){
  for(const [threshold,amount]of [[2,4],[3,7],[4,10],[5,15]])if(csuCount>=threshold)money(`csu_tier_${threshold}`,amount);
  for(const route of csuRoutes)money('csu_normal',(route.members||[]).filter(id=>rt.team.some(c=>c.id===id&&c.party==='CSU')).length);
  if(csuCount>=4){
   const refunds=new Set((game.logs||[]).filter(l=>l.kind==='bonus_refund'&&l.player===player&&l.round===round).map(l=>l.name));
   let fifths=hidden_number(state.refundFifths);
   for(const [index,log]of (game.logs||[]).entries())if(log.kind==='sold'&&log.player===player&&log.round===round&&!refunds.has(log.name)){
    fifths+=hidden_number(log.amount);const refund=Math.floor(fifths/5);fifths%=5;money(`auction_refund_${index}`,refund);
   }
   state.refundFifths=fifths;
  }
 }
 // Cash already paid by the ordinary ledger is eligible for layer conversion, not paid twice.
 let earned=hidden_number(normalSettlement.cash),cursor=0;
 if(earned>0)for(const row of active)if(row.effects?.firstCashBonus&&!once.has('cash:'+row.id)){money(row.id,row.effects.firstCashBonus,['normal_cash']);once.add('cash:'+row.id);}
 while(cursor<queue.length){const event=queue[cursor++];result.cash+=event.amount;earned+=event.amount;result.events.push({...event,kind:'cash'});
  for(const row of active)if(row.effects?.firstCashBonus&&!once.has('cash:'+row.id)&&!event.ancestry.includes(row.id)){money(row.id,row.effects.firstCashBonus,event.ancestry);once.add('cash:'+row.id);}
 }
 if(bavaria&&csuCount>=3){const total=hidden_number(state.cashRemainder)+earned,steps=Math.floor(total/10);state.cashRemainder=total%10;for(let n=0;n<steps;n++){if(csuRoutes.length)layers(csuRoutes[((game.initialSeed||0)+round+n)%csuRoutes.length],1,'csu_tier_3');if(csuCount>=5)for(const route of csuRoutes)layers(route,1,'csu_tier_5');}}
 result.score=Math.round(result.score*10)/10;state.settlements[round]=structuredClone(result);return result;
}
