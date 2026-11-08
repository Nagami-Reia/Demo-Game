import {pss_bound,pss_state,pss_apply_event,pss_outcome,pss_advance,pss_restore_control} from './political-state.js';

const sandboxNewsTags={
 news_001:'coalition_deadlock',news_003:'implementation_drift',news_005:'economic_shock',news_013:'coalition_blockage',
 news_019:'energy_insecurity',news_021:'delivery_failure',news_022:'coordination_failure',news_023:'bureaucratic_delay',
 news_024:'indecision',news_027:'administrative_failure'
};

export class Sandbox {
 constructor(profiles={}){this.actors={};this.world={};this.processed=new Set();this.profiles=profiles;}
 static restore(raw,profiles={}){
  const sandbox=new Sandbox(profiles);
  sandbox.actors=raw?.actors||{};
  sandbox.world=raw?.world||{};
  sandbox.processed=new Set(raw?.processed||[]);
  return sandbox;
 }
 toJSON(){return {version:1,actors:this.actors,world:this.world,processed:[...this.processed]};}
 state(id){
  const record=this.actors[id]??={trust:{},memories:[],elapsedDays:0};
  if(record.control===undefined||record.identity_integrity===undefined)Object.assign(record,pss_state(record));
  record.trust??={};
  return record;
 }
 track(cards){for(const card of cards)this.state(card.id);}
 snapshot(card){
  const state=this.state(card.id);
  return {...pss_state(state),trust:{...state.trust}};
 }
 profile(card){
  const configured=this.profiles[card.id];
  return configured?.profile||{stress_resistance:.25+.085*(card.resilience??3),recovery_rate:.4+.075*(card.resilience??3),sensitivity_map:{}};
 }
 event(card,event,key){
  // Kept for the remainder of rounds already in progress in older saves.
  if(this.processed.has(key))return;
  this.processed.add(key);
  const state=this.state(card.id);
  state.pressure=pss_bound(state.pressure+(event.impact<0?.06:-.03));
  state.energy=pss_bound(state.energy-.02);
 }
 expose(card,entries,round){
  const results=[];
  for(const entry of entries){
   const event=entry.event,domains=event.domains??[event.domain].filter(Boolean);
   const pressure=event.pressure??event.impact??0;
   const relevance=domains.some(domain=>card.domains?.includes(domain))?1:.35;
   const incident=`pss:news:${card.id}:${entry.startedRound}:${event.id}`;
   const key=`${incident}:${round}`;
   if(!pressure||this.processed.has(key))continue;
   const continuing=this.processed.has(incident);
   this.processed.add(key);
   this.processed.add(incident);
   const tags=[...domains,event.category,sandboxNewsTags[event.id]].filter(Boolean);
   const result=pss_apply_event(this.state(card.id),this.profile(card),{
    event_id:incident,tags,severity:Math.abs(pressure)*(entry.strength??1)*relevance*(continuing?.35:1),
    valence:Math.sign(pressure)
   },{remember:!continuing});
   results.push({cardId:card.id,eventId:event.id,title:event.title,continuing,...result});
  }
  return results;
 }
 condition(card,{legacy=false}={}){
  const s=this.state(card.id);
  if(legacy)return s.energy+s.confidence-s.pressure+(card.resilience??3)*.04;
  // A neutral actor keeps the former base strength; bounded movement leaves room for card stats.
  const deviation=.45*(s.energy-.75)+.4*(s.confidence-.7)-.45*(s.pressure-.25)+
   .25*(s.control-.65)+.2*(s.identity_integrity-.85);
  return 1.32+Math.max(-.6,Math.min(.6,deviation));
 }
 settle(card,success,target,key,options={}){
  const s=this.state(card.id);
  if(this.processed.has(key))return pss_state(s);
  this.processed.add(key);
  if(target)s.trust[target]=pss_bound((s.trust[target]??.5)+(success?.025:-.015));
  if(options.legacy){
   s.confidence=pss_bound(s.confidence+(success?.025:-.04));
   s.energy=pss_bound(s.energy-(options.skipPreparation?0:.018));
   s.pressure=pss_bound(s.pressure+(success?-.02:.04));
   return structuredClone(s);
  }
  const profile=this.profile(card);
  const update=pss_outcome(s,profile,{
   id:key,action:options.action||'action',tags:options.tags,success:options.partial?.65:Number(success),
   expected:options.expected,workload:options.skipPreparation?0:.024,
   evidenceQuality:options.forced?.35:.7,scope:options.partial?.65:1
  });
  const controlKey=`pss:coordination:${card.id}:${options.round}`;
  if(success&&options.contributed&&options.action==='coordinate'&&!this.processed.has(controlKey)){
   this.processed.add(controlKey);
   update.controlRestored=pss_restore_control(s,.025);
  }
  return {...pss_state(s),trust:{...s.trust},pss:update,profileSource:this.profiles[card.id]?.source||'generic'};
 }
 rest(roster=[]){
  const cards=new Map(roster.map(card=>[card.id,card]));
  for(const id of Object.keys(this.actors)){
   const card=cards.get(id);
   pss_advance(this.state(id),this.profile(card||{id}),14);
  }
 }
}
