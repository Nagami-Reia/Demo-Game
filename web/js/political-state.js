// Port of hakoniwa/political_state_system.py. Keep runtime precision until display.
export const PSS_CHANNELS=['energy','pressure','confidence','control','identity_integrity'];
const pssDefaults={energy:.75,pressure:.25,confidence:.7,control:.65,identity_integrity:.85};
export const pss_bound=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const pss_signed=n=>Math.max(-1,Math.min(1,n));
const pssImpactProfile={pressure:1,energy:.35,confidence:.45,control:.55,identity_integrity:.15};

export function pss_state(record={}){
 return Object.fromEntries(PSS_CHANNELS.map(key=>[key,Number.isFinite(record[key])?pss_bound(record[key]):pssDefaults[key]]));
}

export function pss_impact(record,profile,event){
 const tags=new Set(event.tags);
 const sensitivity=tags.size?Math.max(...[...tags].map(tag=>profile.sensitivity_map[tag]??.5)):.5;
 const resonance=[];
 let load=0;
 for(const memory of record.memories||[]){
  const memoryTags=new Set(memory.tags);
  const overlap=[...memoryTags].filter(tag=>tags.has(tag)).length/new Set([...memoryTags,...tags]).size;
  if(!(overlap>0))continue;
  const contribution=overlap*memory.severity*memory.unresolved*(.45+.55*Math.max(0,-memory.valence));
  load+=contribution;
  resonance.push({id:memory.event_id,overlap,contribution});
 }
 const memoryMultiplier=Math.min(2,1+load);
 const damage=pss_bound(pss_bound(event.severity)*(1-profile.stress_resistance)*(.5+sensitivity)*memoryMultiplier);
 const valence=pss_signed(event.valence??-1);
 const deltas=Object.fromEntries(PSS_CHANNELS.map(key=>[key,
  damage*(event.impact_profile?.[key]??pssImpactProfile[key])*valence*(key==='pressure'?-1:1)]));
 deltas.energy-=pss_bound(event.workload??0);
 return {sensitivity,memoryMultiplier,damage,deltas,resonance};
}

export function pss_apply_event(record,profile,event,{remember=true}={}){
 const before=pss_state(record),impact=pss_impact(record,profile,event);
 for(const key of PSS_CHANNELS)record[key]=pss_bound(before[key]+impact.deltas[key]);
 if(remember)(record.memories??=[]).push({
  event_id:event.event_id,tags:[...new Set(event.tags)],severity:impact.damage,
  valence:impact.deltas.pressure>=0?-1:1,decay_per_day:.002+.006*profile.recovery_rate,
  unresolved:pss_bound(impact.damage*(.7+impact.memoryMultiplier*.3)),
  learned_response_tags:[],evidence_weight:1
 });
 return {id:event.event_id,before,after:pss_state(record),impact};
}

export function pss_outcome(record,profile,{id,action,tags=[],success,expected=.5,workload=.04,evidenceQuality=.7,scope=1}){
 const observed=pss_bound(success),prior=pss_bound(expected),evidence=pss_bound(evidenceQuality)*pss_bound(scope);
 const signed=2*observed-1,predictionError=observed-prior,before=pss_state(record);
 const memories=record.memories??=[];
 const related=memories.filter(m=>m.tags.includes(action)&&m.event_id.startsWith('outcome:')&&m.valence>0);
 const novelty=1/(1+.45*related.reduce((sum,m)=>sum+m.evidence_weight,0));
 const update=.105*predictionError*evidence+.04*signed*evidence*(signed>0?novelty:1);
 const delta=update*(update>0?1-before.confidence:.55+.45*before.confidence);
 record.energy=pss_bound(before.energy-Math.max(0,workload));
 record.confidence=pss_bound(before.confidence+delta);
 record.pressure=pss_bound(before.pressure-.055*signed*evidence);
 record.identity_integrity=pss_bound(before.identity_integrity+.025*signed*evidence);
 record.control=before.control;
 if(evidence>0)memories.push({
  event_id:`outcome:${action}:${id}`,tags:[...new Set([...tags,action])],
  severity:(.35+.45*Math.abs(signed))*evidence,valence:signed,
  decay_per_day:.003+.006*profile.recovery_rate,unresolved:pss_bound(Math.max(0,-signed)*.7*evidence),
  learned_response_tags:observed>=.65&&evidence>=.35?[...tags]:[],evidence_weight:evidence
 });
 return {before,after:pss_state(record),expected:prior,observed,predictionError,evidence,novelty,confidenceDelta:delta,memoryFormed:evidence>0};
}

export function pss_advance(record,profile,days,workload=0){
 if(!Number.isFinite(days)||days<0)throw Error('invalid_pss_time');
 record.energy=pss_bound(record.energy+days*.0055*profile.recovery_rate-Math.max(0,workload));
 record.pressure=pss_bound(record.pressure-days*.004*profile.recovery_rate);
 for(const memory of record.memories||[]){
  memory.severity*= (1-memory.decay_per_day)**days;
  memory.unresolved*= (1-.25*memory.decay_per_day)**days;
 }
 record.elapsedDays=(record.elapsedDays||0)+days;
}

export function pss_restore_control(record,amount){
 const before=record.control;
 record.control=pss_bound(before+Math.max(0,amount));
 return record.control-before;
}

export function pss_reinforce_identity(record,alignment){
 record.identity_integrity=pss_bound(record.identity_integrity+Math.max(-.03,Math.min(.03,alignment)));
}

export function pss_decision_parameters(record,profile,ambition,risk,preferences){
 const mod=profile.state_modulation||{};
 const move=(value,tag,channel,intensity)=>{
  const target=pss_bound(mod[`${tag}_${channel}_target`]??value);
  const strength=pss_bound(mod[`${tag}_${channel}_strength`]??0);
  return pss_bound(value+(target-value)*intensity*strength);
 };
 for(const [tag,intensity] of [['pressure',record.pressure],['low_energy',1-record.energy],['low_confidence',1-record.confidence]]){
  ambition=move(ambition,tag,'ambition',intensity);risk=move(risk,tag,'risk',intensity);
 }
 const controlMultiplier=1+(1-record.control)*pss_bound(mod.low_control_control_strength??.5);
 return {ambition,risk_appetite:risk,control_preferences:Object.fromEntries(Object.entries(preferences).map(([key,value])=>[key,pss_bound(value*controlMultiplier)])),
  state_inputs:pss_state(record),control_multiplier:controlMultiplier};
}
