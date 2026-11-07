import {tactical_prepare,tactical_commit,tactical_validate} from './tactical-state.js';
import {news_modifier} from './news-effects.js';
import {agenda_weights} from './agenda-domains.js';
import {hidden_begin,hidden_before_action} from './hidden-relations.js';
const negotiation_clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:0));
function negotiation_cross(game,ids,player){return game.players[player].owned.some(c=>ids.includes(c.id)&&c.party!==game.players[player].party&&!(['CDU','CSU'].includes(c.party)&&['CDU','CSU'].includes(game.players[player].party)));}
function negotiation_fee(game,ids,player,baseCost){const runtime=hidden_begin(game,player,ids);return hidden_before_action(runtime,{id:`negotiation:${game.round}:${player}`,stage:-1,action:'negotiate',isExecution:false,baseCashCost:baseCost,baseOrgCost:0,crossParty:negotiation_cross(game,ids,player),agenda:game.agenda,cash:game.players[player].cash}).cashCost;}
export function prepare_negotiation(game,ids,player=0){
 const scenes=game.data.negotiationScenes||[],weights=agenda_weights(game.agenda),cross=negotiation_cross(game,ids,player);
 const eligible=scenes.filter(s=>!s.domains?.length||s.domains.some(d=>(weights[d]||0)>0));
 if(!scenes.length)throw Error('negotiation_unavailable');
 const scene=game.pick(eligible.length?eligible:scenes);
 const state={player,round:game.round,ids:[...ids],sceneId:scene.id,title:scene.title,description:scene.description,resolved:false,options:scene.options.map(o=>{const environment=news_modifier(game,player,'negotiationCost',{agenda:game.agenda,team:game.players[player].owned.filter(c=>ids.includes(c.id))}).value;const baseCost=o.cost>0?negotiation_clamp(Math.round(o.cost+(cross?1:0)+(game.agenda.procedure==='question'?1:0)+environment),1,8):0;return {...o,baseCost,cost:negotiation_fee(game,ids,player,baseCost),effects:{...o.effects}};})};return tactical_prepare(game,player,state);
}
export function resolve_negotiation(game,choiceId,player=0,settings={}){
 const state=player===0?game.negotiation:game.cpuNegotiation;
 if(!state||state.player!==player||state.round!==game.round)throw Error('negotiation_unavailable');
 if(state.resolved){if(state.selected!==choiceId)throw Error('negotiation_already_resolved');return state;}
 if(player===0&&game.phase!=='NEGOTIATION')throw Error('invalid_phase');
 const option=state.options.find(o=>o.id===choiceId);if(!option)throw Error('invalid_negotiation_choice');
 if(state.tactical)tactical_validate(state,settings);
 const paid=negotiation_fee(game,state.ids,player,option.baseCost),owner=game.players[player];if(!Number.isFinite(owner.cash)||owner.cash<paid)throw Error('negotiation_unaffordable');
 owner.cash-=paid;state.resolved=true;state.selected=choiceId;state.costPaid=paid;state.effects={...option.effects};
 const org=negotiation_clamp(option.effects.organization||0,-1,2);owner.organization=Math.max(0,(owner.organization||0)+org);
 tactical_commit(game,player,state,settings);
 game.log?.('negotiation',{player,choiceId,sceneId:state.sceneId,amount:paid,organization:org});return state;
}
export function negotiation_action_bonus(game,action,stage,player=0){
 const state=player===0?game.negotiation:game.cpuNegotiation;if(!state?.resolved||state.round!==game.round)return 0;
 const key=action==='negotiate'?'negotiation':action==='coordinate'?'coordination':action==='amend'?'amendment':action==='scrutinize'?'scrutiny':null;
 if(!key||((key==='negotiation'||key==='coordination')&&stage!==0)||((key==='amendment'||key==='scrutiny')&&stage===0))return 0;
 return negotiation_clamp(state.effects?.[key]||0,-.6,.8);
}

export function replace_negotiation_option(game,targetId,player=0){
 const state=player===0?game.negotiation:game.cpuNegotiation;if(!state||state.resolved||!state.scoutedOption||state.scoutedUsed)throw Error('invalid_tactical_choice');
 const index=state.options.findIndex(o=>o.id===targetId);if(index<0)throw Error('invalid_tactical_choice');
 state.options[index]={...state.scoutedOption,cost:negotiation_fee(game,state.ids,player,state.scoutedOption.baseCost)};state.scoutedUsed=true;
}
