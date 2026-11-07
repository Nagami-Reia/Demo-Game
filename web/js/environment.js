import {faction_poll_change} from './factions.js';

// Fictional live opinion within the match; never real-time electoral polling.
const POLL_BASE={CDU:22,CSU:6,SPD:16,AfD:21,'Grüne':12,Linke:9,Other:14};
export function initial_polls(){return {shares:{...POLL_BASE},history:[],changes:[],processed:[]};}
export function update_polls(polls,changes,eventId){
 if(polls.processed.includes(eventId))return [];
 if(Object.values(changes).every(v=>Number.isFinite(Number(v))&&Number(v)===0)&&Object.values(polls.shares).every(v=>Number.isFinite(v)&&v>=0)&&Math.abs(Object.values(polls.shares).reduce((n,v)=>n+v,0)-100)<1e-8){
  polls.processed.push(eventId);polls.changes=Object.entries(polls.shares).map(([party,value])=>({party,before:value,after:value,delta:0}));polls.history.push({eventId,shares:{...polls.shares}});return polls.changes;
 }
 const before={...polls.shares},clean={};
 for(const [party,base] of Object.entries(POLL_BASE)){let old=Number(polls.shares[party]),change=Number(changes[party]??0);clean[party]=Math.max(0,Math.min(100,(Number.isFinite(old)?old:base)+(Number.isFinite(change)?change:0)));}
 let total=Object.values(clean).reduce((a,b)=>a+b,0);
 if(total<=0){Object.assign(clean,POLL_BASE);total=100;}
 // Integer basis points sum to 10000 even at 0% and after negative changes.
 let units=Object.fromEntries(Object.entries(clean).map(([k,v])=>[k,Math.floor(v/total*10000)]));let remainder=10000-Object.values(units).reduce((a,b)=>a+b,0);
 for(const k of Object.keys(units).sort((a,b)=>clean[b]-clean[a])){if(remainder<=0)break;units[k]++;remainder--;}
 polls.shares=Object.fromEntries(Object.entries(units).map(([k,v])=>[k,v/100]));polls.processed.push(eventId);
 polls.changes=Object.keys(POLL_BASE).map(party=>({party,before:Number.isFinite(before[party])?before[party]:POLL_BASE[party],after:polls.shares[party],delta:+(polls.shares[party]-(Number.isFinite(before[party])?before[party]:POLL_BASE[party])).toFixed(2)}));
 polls.history.push({eventId,shares:{...polls.shares}});return polls.changes;
}
export function polling_debuff(delta){return Math.min(.75,Math.max(0,-(Number.isFinite(delta)?delta:0))*.18);}
export function poll_share(shares,party){return ['CDU','CSU'].includes(party)?(shares.CDU||0)+(shares.CSU||0):(shares[party]||0);}
export function refresh_poll_pressure(game){for(let p of game.players){let start=poll_share(game.pollReference||game.pollRoundStart||game.polls.shares,p.party),delta=poll_share(game.polls.shares,p.party)-start;p.pollDelta=+delta.toFixed(2);p.pollDebuff=polling_debuff(delta);}}
export function begin_environment(game){
 game.polls??=initial_polls();game.pollReference??={...game.polls.shares};game.pollRoundStart={...game.polls.shares};
 const w=game.sandbox.world;for(const k of Object.keys(w))w[k]*=.9;
 if(game.activeWorld&&game.round<game.activeWorld.untilRound){game.socialEvent=game.data.events.find(e=>e.id===game.activeWorld.id)||game.socialEvent;game.log('social_continues',{title:game.socialEvent.title});refresh_poll_pressure(game);return;}
 const pool=game.data.events.filter(e=>e.social&&e.id!==game.activeWorld?.id);game.socialEvent=game.pick(pool.length?pool:game.data.events.filter(e=>e.social));
 const event=game.socialEvent;game.activeWorld={id:event.id,startedRound:game.round,untilRound:game.round+(event.durationRounds||2)};
 w[event.domain]=Math.max(-4,Math.min(4,(w[event.domain]||0)+event.impact));
 const gov=game.players[0].party,opp=game.players[1].party,shift=event.impact*.5;
 update_polls(game.polls,{[gov]:shift,[opp]:-shift*.6},`social:${game.round}`);refresh_poll_pressure(game);
 game.log('social_event',{title:event.title});
}
export function settle_public_opinion(game,scores,firewall=[],factions=null){
 const changes={};for(let i=0;i<2;i++){let p=game.players[i];const change=(scores[i]-5)*.22;changes[p.party]=factions?faction_poll_change(p,game.round,change)+(factions[i]?.poll||0):change;}
 update_polls(game.polls,changes,`result:${game.round}`);
 const penalties={};game.players.forEach((p,i)=>{if(firewall[i])penalties[p.party]=-firewall[i];});if(Object.keys(penalties).length)update_polls(game.polls,penalties,`firewall:${game.round}`);refresh_poll_pressure(game);
}
