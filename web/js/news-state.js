import {news_active,news_modifier} from './news-effects.js';
import {update_polls,refresh_poll_pressure} from './environment.js';
function news_weighted_pick(game,pool,weights){const total=pool.reduce((n,e)=>n+(e.weight||1)*(weights[e.category]||1),0);let r=game.random()*total;for(const e of pool){r-=(e.weight||1)*(weights[e.category]||1);if(r<0)return e;}return pool.at(-1);}
export function prepare_news(game){
 game.news??={lastSeen:{},edition:null};if(game.news.edition?.round===game.round)return game.news.edition;
 game.pollReference??={...game.polls.shares};game.pollRoundStart={...game.polls.shares};
 for(const k of Object.keys(game.sandbox.world))game.sandbox.world[k]*=.9;
 const previous=game.news.edition?.entries||[],entries=[],weights={};
 for(const entry of previous)for(const [cat,value]of Object.entries(entry.event.followUp||{}))weights[cat]=(weights[cat]||1)+value;
 for(let slot=0;slot<4;slot++){
  const existing=previous.find(e=>e.slot===slot&&game.round<e.untilRound);
  if(existing){entries.push(existing);continue;}
  const eligible=game.data.newsEvents.filter(e=>!entries.some(a=>a.event.id===e.id)&&!previous.some(a=>a.untilRound>game.round&&a.event.id===e.id));
  let pool=eligible.filter(e=>game.round-(game.news.lastSeen[e.id]??-99)>2);if(!pool.length)pool=eligible;
  const categories=new Set(entries.map(e=>e.event.category));const diverse=pool.filter(e=>!categories.has(e.category));if(diverse.length)pool=diverse;
  const event=news_weighted_pick(game,pool,weights);if(!event)throw Error('news_pool_exhausted');
  entries.push({event:structuredClone(event),slot,strength:slot===0?1:.5,startedRound:game.round,untilRound:game.round+(slot===0?event.durationRounds:Math.min(2,event.durationRounds))});game.news.lastSeen[event.id]=game.round;
 }
 game.news.edition={round:game.round,entries,acknowledged:false,startApplied:false,settled:false};
 const head=entries[0];game.socialEvent={...head.event,description:head.event.body,domain:head.event.domains[0],impact:head.event.pressure||0};game.activeWorld={id:head.event.id,startedRound:head.startedRound,untilRound:head.untilRound};
 return game.news.edition;
}
export function acknowledge_news(game){
 const edition=game.news?.edition;if(!edition||edition.round!==game.round)throw Error('news_unavailable');if(edition.startApplied)return;
 const pollChanges={},start=[];
 game.players.forEach((owner,player)=>{
  const income=news_modifier(game,player,'income'),poll=news_modifier(game,player,'poll',{newOnly:true});const cash=Math.max(-owner.cash,Math.sign(income.value)*Math.round(Math.abs(income.value)));owner.cash+=cash;
  if(['CDU','CSU'].includes(owner.party)){pollChanges.CDU=(pollChanges.CDU||0)+poll.value*22/28;pollChanges.CSU=(pollChanges.CSU||0)+poll.value*6/28;}else pollChanges[owner.party]=(pollChanges[owner.party]||0)+poll.value;
  start.push({player,cash,poll:poll.value,events:[...income.contributions,...poll.contributions]});
 });
 update_polls(game.polls,pollChanges,`news:start:${game.round}`);refresh_poll_pressure(game);
 edition.start=start;edition.startApplied=true;edition.acknowledged=true;game.log('news_read',{titles:news_active(game).map(e=>e.event.title)});
}
