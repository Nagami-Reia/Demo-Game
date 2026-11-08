import {match_round_limit} from './crisis.js';
import {EQUIPMENT_ITEMS} from './equipment-data.js';
import {alliance_preview} from './alliances.js';
import {is_neutral_chair} from './roles.js';

const equipmentWeights={common:45,uncommon:30,rare:20,special:5};
export const equipment_phase=game=>['UPGRADE','AUCTION','BONUS_AUCTION','DEPLOYMENT'].includes(game.phase);
const equipmentState=(game,i)=>game.players[i].equipment??={catalog:2,round:0,next:1,inventory:[],slots:{},pending:[],rng:(game.initialSeed^Math.imul(i+1,2654435761))>>>0};
export function equipment_cash(game,i){
 const bid=['AUCTION','BONUS_AUCTION'].includes(game.phase)&&game.high===i?game.price:0;
 return game.players[i].cash-bid;
}
function equipmentRoutes(game,item,id){
 const tags=new Set((game.data.allianceTags||[]).filter(row=>row.id===id).flatMap(row=>row.tags));
 return (game.data.allianceDefinitions||[]).filter(r=>tags.has(r.id)&&(r.layerCap??999)>0&&
  (!item.route||r.id===item.route)&&(!item.category||r.category===item.category));
}
export function equipment_compatible(game,i,item){
 if(item.kind!=='layers')return true;
 return game.players[i].owned.some(c=>!is_neutral_chair(c)&&equipmentRoutes(game,item,c.id).length>0);
}
function equipmentDraw(game,i,state){
 const pool=Object.entries(EQUIPMENT_ITEMS).filter(([id,item])=>!item.retired&&id!==state.last&&(id!=='coin'||game.round<match_round_limit(game))&&equipment_compatible(game,i,EQUIPMENT_ITEMS[id]));
 const counts={};for(const [,item] of pool)counts[item.rarity]=(counts[item.rarity]||0)+1;
 const weight=item=>equipmentWeights[item.rarity]/counts[item.rarity];
 state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;
 let roll=state.rng/4294967296*pool.reduce((sum,[,item])=>sum+weight(item),0);
 state.offer=state.last=pool.find(([,item])=>(roll-=weight(item))<0)[0];
}
export function equipment_open(game,i){
 const state=equipmentState(game,i);
 if(state.catalog!==2){
  for(const piece of state.inventory)if(piece.id==='directory')piece.id='directory_legacy';
  state.catalog=2;
 }
 if(state.round!==game.round){state.round=game.round;state.refreshed=false;equipmentDraw(game,i,state);}
 else if(state.offer&& !equipment_compatible(game,i,EQUIPMENT_ITEMS[state.offer]))equipmentDraw(game,i,state);
 return state;
}
export function equipment_funding(game){
 game.players.forEach((p,i)=>{
  const state=equipment_open(game,i),due=state.pending.filter(x=>x.round<=game.round);
  state.pending=state.pending.filter(x=>x.round>game.round);
  for(const effect of due){p.cash+=effect.amount;game.log('equipment_funds',{player:i,amount:effect.amount});}
 });
}
export function equipment_buy(game,i){
 const state=equipment_open(game,i),item=EQUIPMENT_ITEMS[state.offer],p=game.players[i];
 if(!item||equipment_cash(game,i)<item.price)throw Error('equipment_unavailable');
 const piece={uid:state.next++,id:state.offer};
 p.cash-=item.price;state.offer=null;state.inventory.push(piece);
 game.log('equipment_bought',{player:i,item:piece.id,amount:item.price});
 return piece;
}
export function equipment_refresh(game,i){
 const state=equipment_open(game,i),p=game.players[i];
 if(state.refreshed||equipment_cash(game,i)<1)throw Error('equipment_unavailable');
 p.cash--;state.refreshed=true;equipmentDraw(game,i,state);game.log('equipment_refresh',{player:i,amount:1});
}
export function equipment_target(game,i,uid,id,ids=[]){
 const p=game.players[i],state=p.equipment,piece=state?.inventory.find(x=>x.uid===uid);
 const card=p.owned.find(c=>c.id===id&&!is_neutral_chair(c));
 if(!piece||!card)return {};
 const item=EQUIPMENT_ITEMS[piece.id],slots=state.slots[id]||[null,null];
 if(item.kind==='gear'){
  const existing=slots.findIndex(x=>x?.id===piece.id);
  const upgrade=existing>=0&&item.rates&&!slots[existing].upgraded?existing:-1;
  const availableSlots=existing>=0?(upgrade>=0?[upgrade]:[]):[0,1].filter(n=>!slots[n]);
  return {item,piece,slots,availableSlots,valid:availableSlots.length>0};
 }
 if(item.kind==='cash')return {item,piece,valid:game.round<match_round_limit(game)};
 const active=new Set(alliance_preview(game,ids,i).filter(r=>r.active).map(r=>r.id));
 const routes=equipmentRoutes(game,item,id).map(r=>{
  const before=p.alliances?.layers?.[r.id]||0;
  return {id:r.id,name:r.name,before,amount:Math.min((active.has(r.id)&&item.active)||item.amount,(r.layerCap??999)-before)};
 }).filter(r=>r.amount>0);
 return {item,piece,routes,valid:routes.length>0};
}
export function equipment_assign(game,i,{uid,id,slot,route,ids}){
 const target=equipment_target(game,i,uid,id,ids),p=game.players[i],state=p.equipment;
 if(!target.valid)throw Error('equipment_unavailable');
 const {item,piece}=target;
 let grant;
 if(item.kind==='gear'){
  if(!target.availableSlots.includes(slot))throw Error('equipment_unavailable');
  const slots=state.slots[id]??=[null,null];
  slots[slot]=slots[slot]?{...slots[slot],upgraded:true}:piece;
 }else if(item.kind==='layers'){
  grant=target.routes.find(r=>r.id===route);
  if(!grant)throw Error('equipment_unavailable');
  const ledger=p.alliances??={};
  (ledger.layers??={})[route]=grant.before+grant.amount;
 }else state.pending.push({round:game.round+1,amount:item.amount});
 state.inventory=state.inventory.filter(x=>x.uid!==uid);
 game.log('equipment_assigned',{player:i,item:piece.id,cardId:id,route,layers:grant?.amount,upgraded:item.kind==='gear'&&state.slots[id][slot].upgraded===true});
}
export function equipment_refund(game,i,uid){
 const p=game.players[i],state=p.equipment,piece=state?.inventory.find(x=>x.uid===uid);
 if(!piece||equipment_compatible(game,i,EQUIPMENT_ITEMS[piece.id]))throw Error('equipment_unavailable');
 const {price}=EQUIPMENT_ITEMS[piece.id];
 state.inventory=state.inventory.filter(x=>x.uid!==uid);
 p.cash+=price;
 game.log('equipment_refund',{player:i,item:piece.id,amount:price});
}
export function equipment_rate(player,id,action){
 return (player.equipment?.slots[id]||[]).reduce((sum,piece)=>sum+(EQUIPMENT_ITEMS[piece?.id]?.rates?.[action]?.[piece.upgraded?1:0]||0),0);
}
export function equipment_power(player,id,action,alliances,version=2){
 return (player.equipment?.slots[id]||[]).reduce((sum,piece)=>{
  const item=EQUIPMENT_ITEMS[piece?.id];
  if(version===1&&piece?.id==='legal'&&action==='amend')return sum+.30;
  if(version===1&&piece?.id==='coffee'&&action==='coordinate')return sum+.20;
  if(!item||item.action!==action)return sum;
  return sum+item.amount+(item.exclusive===id&&alliances.some(r=>r.id===item.route&&r.active)?item.bonus:0);
 },0);
}
export function equipment_ai(game,ids){
 const i=1,p=game.players[i],state=equipment_open(game,i),item=EQUIPMENT_ITEMS[state.offer];
 if(!item||item.kind==='cash'||p.cash-item.price<10)return;
 const cards=p.owned.filter(c=>ids.includes(c.id));
 const options=cards.map(c=>{
  // Evaluate through the same eligibility function without committing a purchase.
  const owner={...p,equipment:{...state,inventory:[{uid:0,id:state.offer}]}};
  const probe={...game,players:[game.players[0],owner]};
  return {id:c.id,...equipment_target(probe,i,0,c.id,ids)};
 }).filter(x=>x.valid);
 const option=options.find(x=>x.id===item.exclusive)||options.find(x=>x.availableSlots?.some(n=>x.slots[n]))||options[0];
 if(!option)return;
 const piece=equipment_buy(game,i);
 equipment_assign(game,i,{uid:piece.uid,id:option.id,ids,slot:option.availableSlots?.[0],route:option.routes?.toSorted((a,b)=>b.amount-a.amount)[0]?.id});
}
