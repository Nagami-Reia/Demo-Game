import {can_recruit} from './party-relations.js';
// Old auctions invented special tiers. Resume with the same canonical person
// everywhere, including unresolved paired auctions; historic results stay intact.
export function normalize_saved_cards(game,data){
 const byId=new Map(data.roster.map(c=>[c.id,c]));
 const canonical=c=>{if(!c)return c;const base=byId.get(c.id)||{...c,offices:[],mandate:null};return c.edition==='special'&&['leadership','negotiation','expertise','oratory'].includes(c.specialEffect?.stat)?{...base,edition:'special',specialEffect:{stat:c.specialEffect.stat,amount:Math.min(.6,Math.max(0,c.specialEffect.amount||0))}}:base;};
 for(const p of game.players)p.owned=p.owned.map(canonical);
 game.card=canonical(game.card);if(game.card&&game.high!=null&&!can_recruit(game.players[game.high].party,game.card)){game.high=null;game.price=0;}
 if(game.rare){
  game.rare.cards=game.rare.cards.map(canonical);
  game.rare.awards=game.rare.awards.map(a=>({...a,card:canonical(a.card)}));
  // Settled awards are historical receipts, never fresh acquisitions or refunds.
  if(!game.rare.settled&&['BONUS_AUCTION','BONUS_CHOICE'].includes(game.phase)){
   const forbidden=game.rare.awards.filter(a=>!can_recruit(game.players[a.winner].party,a.card));
   for(const a of forbidden){game.players[a.winner].cash+=a.price;game.log?.('recruitment_refund',{player:a.winner,name:a.card.name,amount:a.price});}
   game.rare.awards=game.rare.awards.filter(a=>can_recruit(game.players[a.winner].party,a.card));
   if(forbidden.length&&game.phase==='BONUS_CHOICE'&&typeof game.revealAgenda==='function'){
    for(const a of game.rare.awards)game.players[a.winner].owned.push(a.card);
    game.rare.settled=true;game.revealAgenda();
   }
  }
 }
 return game;
}
