// Transparent, bounded game outcomes. Effects must first produce an action result.
const score_clamp=(v,max=1)=>Math.max(0,Math.min(max,Number.isFinite(v)?v:0));
const score_tenth=v=>Math.round(v*10)/10;
export function settle_scores({power,trace,teams,policy,procedure,discipline={extra:[0,0]}}){
 power=power.map(v=>Math.max(0,Number.isFinite(v)?v:0));
 const total=Math.max(0,power[0])+Math.max(0,power[1]),margin=total?Math.abs(power[0]-power[1])/total:0;
 return [0,1].map(i=>{
  const actions=trace.filter(r=>r.kind==='action'&&r.player===i),successful=actions.filter(r=>r.success&&(r.powerContribution===undefined||r.powerContribution>0));
  if(!teams[i].length||!actions.length||power[i]<=0)return {procedure:0,policy:0,influence:0,execution:0,cooperation:0,total:0};
  const procedural=power[i]===power[1-i]?1.5:power[i]>power[1-i]?2.5+.5*margin:.5*(1-margin);
  const response=successful.reduce((n,r)=>n+(['amend','scrutinize'].includes(r.action)?.5+.5*score_clamp(r.expertiseMatch):.25),0);
  const policyCredit=procedure==='question'?2*score_clamp(response/(teams[i].length*3)):score_clamp(policy.goalScores?.[i],2);
  const coordination=successful.filter(r=>['coordinate','negotiate'].includes(r.action)).length/(teams[i].length*2);
  const realizedLinks=successful.reduce((n,r)=>{const e=r.explanation||{};return n+Math.max(0,e.cohesion||0)*.05+Math.max(0,e.personal||0)*.12+Math.max(0,e.partyCaucus||0)*.1+Math.max(0,e.cabinet||0)*.1;},0);
  const parts={procedure:procedural,policy:policyCredit,influence:total?2*Math.max(0,power[i])/total:0,execution:2*score_clamp(power[i]/(teams[i].length*3*8)),cooperation:score_clamp(coordination+Math.min(.45,realizedLinks)+(discipline.extra?.[i]||0)*.35)};
  // Parts are rounded once, then summed, so the displayed equation is exact.
  for(const key in parts)parts[key]=score_tenth(parts[key]);
  return {...parts,total:score_tenth(Object.values(parts).reduce((n,v)=>n+v,0))};
 });
}
