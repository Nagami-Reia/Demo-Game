import {agenda_weights} from './agenda-domains.js';
const news_bound=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:0));
function news_score_attribution(events,total,kind){
 const rows=events.filter(e=>e.kind===kind);
 for(const row of rows){row.requestedAmount??=row.amount;row.amount=Math.round(row.amount*10)/10;}
 if(rows.length){const sum=rows.reduce((n,e)=>n+e.amount,0);rows.at(-1).amount=Math.round((rows.at(-1).amount+total-sum)*10)/10;}
}
function news_cash_attribution(events,total){
 const rows=events.filter(e=>Number.isFinite(e.cashAmount));
 for(const row of rows){row.unroundedCashAmount=row.cashAmount;row.cashAmount=Math.round(row.cashAmount);}
 const fractional=rows.filter(row=>Math.abs(row.unroundedCashAmount-Math.round(row.unroundedCashAmount))>1e-9);
 if(rows.length)(fractional.at(-1)||rows.at(-1)).cashAmount+=total-rows.reduce((n,e)=>n+e.cashAmount,0);
 for(const row of rows){row.cashRoundingAdjustment=row.cashAmount-row.unroundedCashAmount;if(row.kind==='conditionalCash'){row.requestedAmount??=row.amount;row.amount=row.cashAmount;}}
}
export function news_active(game){return game.news?.edition?.entries||[];}
export function news_state_of(game,card){
 const tags=new Set((game.data.allianceTags||[]).filter(r=>r.id===card?.id).flatMap(r=>r.tags||[]));
 return (game.data.allianceDefinitions||[]).filter(d=>tags.has(d.id)&&d.category==='state').map(d=>d.name.de);
}
function news_relevance(game,player,e,context){
 const p=game.players[player],target=e.target||{};
 if(target.parties?.length&&!target.parties.includes(p.party))return 0;
 if(target.role&&(target.role==='government')!==(player===0))return 0;
 if(target.cardParties?.length&&!target.cardParties.includes(context.card?.party))return 0;
 if(target.states?.length){const states=context.card?news_state_of(game,context.card):context.route?.category==='state'?[context.route.name.de]:context.team?.flatMap(c=>news_state_of(game,c))||[];if(!target.states.some(s=>states.includes(s)))return 0;}
 if(target.category&&context.route?.category!==target.category)return 0;
 if(target.routeWords&&!new RegExp(target.routeWords,'i').test(JSON.stringify(context.route?.name||'')))return 0;
 if(e.domains?.length){const ds=context.agenda?agenda_weights(context.agenda):context.card?Object.fromEntries((context.card.domains||[]).map(d=>[d,1/Math.max(1,context.card.domains.length)])):context.route?Object.fromEntries((context.route.domains||[]).map(d=>[d,1/Math.max(1,context.route.domains.length)])):{};return Object.entries(ds).reduce((n,[d,w])=>n+(e.domains.includes(d)?w:0),0);}
 return 1;
}
export function news_modifier(game,player,kind,context={}){
 const contributions=[];
 for(const entry of news_active(game).filter(e=>!context.newOnly||e.startedRound===game.round))for(const effect of entry.event.effects||[])if(effect.kind===kind){
  const protection=game.tacticalRound?.[player]?.protectedEffect;if(protection?.round===game.round&&protection.eventId===entry.event.id&&protection.kind===kind)continue;
  const relevance=news_relevance(game,player,effect,context);if(!relevance)continue;
  let value=effect.value*entry.strength*relevance;
  if(effect.axis){const position=game.data.platforms?.[game.players[player].party]?.positions?.[effect.axis];if(!Number.isFinite(position))continue;value*=1-Math.abs(position-effect.position);}
  if(value)contributions.push({eventId:entry.event.id,title:entry.event.title,kind,value,condition:effect.condition||null});
 }
 return {value:contributions.reduce((n,e)=>n+e.value,0),contributions};
}
export function news_auction_price(game,card){return Math.max(1,([2,3,3,3,4,4][Math.max(0,Math.min(5,(card?.tier||1)-1))])+Math.sign(news_modifier(game,0,'auctionCost',{card}).value)*Math.round(Math.abs(news_modifier(game,0,'auctionCost',{card}).value)));}
export function news_recruit_weight(game,card){return news_bound(1+(news_modifier(game,0,'recruitWeight',{card}).value+news_modifier(game,1,'recruitWeight',{card}).value)/2,.25,2.5);}
export function news_recruit_value(game,player,card){return game?news_modifier(game,player,'recruitWeight',{card}).value*.5+news_modifier(game,player,'policyEfficiency',{card}).value*2:0;}
export function news_action_effect(game,player,card,action,agenda,team){
 const context={card,agenda,team},kinds=['stability'];if(action==='negotiate')kinds.push('negotiationEfficiency');if(action==='coordinate')kinds.push('coordinationEfficiency');if(action==='amend'||action==='scrutinize')kinds.push('policyEfficiency');
 const contributions=kinds.flatMap(k=>news_modifier(game,player,k,context).contributions),risk=news_modifier(game,player,'risk',context);
 const requestedRate=contributions.reduce((n,r)=>n+r.value,0),rate=news_bound(requestedRate,-.35,.45),boundedRisk=news_bound(risk.value,-.08,.08);
 const actual=(rows,requested,applied)=>rows.map(e=>({...e,requestedValue:e.value,value:e.value*(requested?applied/requested:1)}));
 return {rate,risk:boundedRisk,contributions:[...actual(contributions,requestedRate,rate),...actual(risk.contributions,risk.value,boundedRisk)]};
}
export function news_settle(game,teams,normalSettlements,trace,breakdowns,passed=false){
 if(!game.news?.edition)return [0,1].map(()=>({cash:0,score:0,gains:[],events:[]}));
 const edition=game.news.edition;if(edition.settled)return [0,1].map(()=>({cash:0,score:0,gains:[],events:[]}));
 const results=[0,1].map(player=>{
  const context={agenda:game.agenda,team:teams[player]},events=[],gains=[];let cash=0,score=0;
  const successful=trace.filter(r=>r.kind==='action'&&r.player===player&&r.success&&r.powerContribution>0);
  const rate=news_modifier(game,player,'policyScore',context),boundedRate=news_bound(rate.value,-.4,.5),rateScale=rate.value?boundedRate/rate.value:1;
  const extra=Math.round((breakdowns[player].policy||0)*boundedRate*10)/10;score+=extra;
  for(const e of rate.contributions)events.push({...e,requestedAmount:e.value*(breakdowns[player].policy||0),amount:e.value*rateScale*(breakdowns[player].policy||0)});
  for(const kind of ['conditionalCash','conditionalScore'])for(const e of news_modifier(game,player,kind,context).contributions){
   const satisfied=e.condition==='passed'?player===0&&passed:e.condition==='negotiated'?successful.some(r=>r.action==='negotiate'):successful.length>0;
   if(satisfied){if(kind==='conditionalCash')cash+=e.value;else score+=e.value;events.push({...e,amount:e.value,...(kind==='conditionalCash'?{requestedCashAmount:e.value,cashAmount:e.value}:{})});}
  }
  const owner=game.players[player],settlement=normalSettlements[player];
  for(const route of settlement.before||[]){if(!route.active)continue;const rc={...context,route};
   const layer=news_modifier(game,player,'allianceLayers',rc),repeat=news_modifier(game,player,'allianceRepeat',rc),boost=news_modifier(game,player,'allianceCash',rc);
   const regularGrowth=(settlement.gains||[]).filter(g=>g.id===route.id).reduce((n,g)=>n+g.add,0),payout=(settlement.payouts||[]).filter(g=>g.id===route.id).reduce((n,g)=>n+g.cash,0);
   const add=route.layerCap===0?0:Math.max(0,Math.round(layer.value)+(repeat.value>0?1:0)*regularGrowth);
   if(add){owner.alliances??={layers:{}};owner.alliances.layers??={};const from=owner.alliances.layers[route.id]||0,to=Math.min(route.layerCap||999,from+add);owner.alliances.layers[route.id]=to;if(to>from)gains.push({id:route.id,name:route.name,from,to,add:to-from,source:'news'});}
   const boundedBoost=news_bound(boost.value,-.5,.75),boostScale=boost.value?boundedBoost/boost.value:1;
   const reward=payout*(boundedBoost+(repeat.value>0?1:0));cash+=reward;
   if(route.layerCap!==0)for(const e of layer.contributions)events.push({...e,routeId:route.id});
   for(const e of repeat.contributions)events.push({...e,routeId:route.id,requestedCashAmount:e.value*payout,cashAmount:repeat.value>0?e.value/repeat.value*payout:0});
   for(const e of boost.contributions)events.push({...e,routeId:route.id,requestedCashAmount:e.value*payout,cashAmount:e.value*boostScale*payout});
  }
  const finalScore=Math.round(score*10)/10;news_score_attribution(events,extra,'policyScore');news_score_attribution(events,Math.round((finalScore-extra)*10)/10,'conditionalScore');
  const finalCash=Math.round(cash);news_cash_attribution(events,finalCash);
  return {cash:finalCash,score:finalScore,gains,events};
 });
 edition.settled=true;edition.settlement=structuredClone(results);return results;
}
