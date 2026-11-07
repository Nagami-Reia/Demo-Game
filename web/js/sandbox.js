// Game-scale port of Hakoniwa political_state_system + persona_v2 relationship feedback.
// Source snapshots and attribution in vendor; coefficients are game assumptions.
export class Sandbox {
 constructor(){this.actors={};this.world={};this.processed=new Set();}
 state(id){return this.actors[id]??=( {energy:.75,pressure:.25,confidence:.7,trust:{}});}
 event(card,event,key){if(this.processed.has(key))return;this.processed.add(key);let s=this.state(card.id);s.pressure=clamp(s.pressure+(event.impact<0?.06:-.03));s.energy=clamp(s.energy-.02);}
 condition(card){let s=this.state(card.id);return s.energy+s.confidence-s.pressure;}
 settle(card,success,target,key,options={}){if(this.processed.has(key))return;this.processed.add(key);let s=this.state(card.id);s.confidence=clamp(s.confidence+(success?.025:-.04));s.energy=clamp(s.energy-(options.skipPreparation?0:.018));s.pressure=clamp(s.pressure+(success?-.02:.04));if(target)s.trust[target]=clamp((s.trust[target]??.5)+(success?.025:-.015));return structuredClone(s);}
 rest(){for(let s of Object.values(this.actors)){s.energy=clamp(s.energy+.12);s.pressure=clamp(s.pressure-.07);}}
}
const clamp=x=>Math.max(0,Math.min(1,x));
