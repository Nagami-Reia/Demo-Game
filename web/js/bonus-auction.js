import {round_recruitment_excluded,recruitment_is_banned} from './recruitment.js';
import {can_recruit} from './party-relations.js';
import {bonus_tier} from './auction-schedule.js';
import {is_neutral_chair} from './roles.js';
import {card_value} from './opponent.js';
const government=new Set(['CDU','CSU','SPD']);
export function bonus_pair_available(game){
 const excluded=round_recruitment_excluded(game);
 return game.players.every(p=>game.data.roster.some(c=>c.tier===bonus_tier(game.round)&&!is_neutral_chair(c)&&!c.inactive&&!excluded.includes(c.id)&&government.has(c.party)===government.has(p.party)));
}
export function make_bonus_pair(game){
 const selected=new Set(round_recruitment_excluded(game)),cards=[];
 for(let side=0;side<2;side++){
  const party=game.players[side].party;
  let pool=game.data.roster.filter(c=>!is_neutral_chair(c)&&!c.inactive&&c.tier===bonus_tier(game.round)&&!selected.has(c.id)&&c.party===party);
  if(!pool.length)pool=game.data.roster.filter(c=>!is_neutral_chair(c)&&!c.inactive&&c.tier===bonus_tier(game.round)&&!selected.has(c.id)&&government.has(c.party)===government.has(party));
  if(!pool.length)return {cards:[],index:0,awards:[]}; // No fabricated high-tier editions or incomplete pairs.
  const ranked=pool.toSorted((a,b)=>b.tier-a.tier||(b.leadership+b.resources)-(a.leadership+a.resources)).slice(0,6);
  const base=game.pick(ranked);
  cards.push({...base,edition:'special',specialEffect:{stat:game.pick(['leadership','negotiation','expertise','oratory']),amount:.6}});selected.add(base.id);
 }
 return {cards,index:0,awards:[]};
}
export function finalize_bonus(game,keepId){
 if(game.rare.settled)throw Error('bonus_already_settled');
 const awards=game.rare.awards;
 if(awards.some(a=>recruitment_is_banned(game,a.card.id)||!can_recruit(game.players[a.winner].party,a.card)))throw Error('recruitment_forbidden');
 if(awards.length===2&&awards[0].winner===awards[1].winner){
  const winner=awards[0].winner,kept=awards.find(a=>a.card.id===keepId);
  if(!kept)throw Error('invalid_bonus_choice');
  for(const a of awards)if(a!==kept){game.players[winner].cash+=a.price;game.log('bonus_refund',{player:winner,name:a.card.name,amount:a.price});}
  game.players[winner].owned.push(kept.card);game.sandbox?.track([kept.card]);game.log('bonus_kept',{player:winner,name:kept.card.name});
 }else for(const a of awards){game.players[a.winner].owned.push(a.card);game.sandbox?.track([a.card]);}
 game.rare.settled=true;game.revealAgenda();
}
export function cpu_bonus_choice(game){
 const p=game.players[1];return game.rare.awards.toSorted((a,b)=>card_value(b.card,p.owned,p.party,game.round,{platforms:game.data.platforms,relations:game.data.policyRelations})-card_value(a.card,p.owned,p.party,game.round,{platforms:game.data.platforms,relations:game.data.policyRelations}))[0]?.card.id;
}
