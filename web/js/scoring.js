// Transparent, bounded game outcomes. Effects must first produce an action result.
const score_clamp=(v,max=1)=>Math.max(0,Math.min(max,Number.isFinite(v)?v:0));
const score_tenth=v=>Math.round(v*10)/10;
export const ROUND_SCORE_MODEL='procedure-linked-v2';
export function settle_round_scoring({power,trace,teams,policy,procedure,discipline={extra:[0,0]},scoreModel=ROUND_SCORE_MODEL}){
 power=power.map(v=>Math.max(0,Number.isFinite(v)?v:0));
 const linkedQuestion=procedure==='question'&&scoreModel===ROUND_SCORE_MODEL;
 const questionResponse=linkedQuestion?[{base:0,adjustment:0},{base:0,adjustment:0}]:null;
 const combinedPower=power[0]+power[1];
 const breakdown=[0,1].map(i=>{
  const actions=trace.filter(r=>r.kind==='action'&&r.player===i),successful=actions.filter(r=>r.success&&(r.powerContribution===undefined||r.powerContribution>0));
  if(!teams[i].length||!successful.length||power[i]<=0)return {procedure:0,policy:0,influence:0,execution:0,cooperation:0,total:0};
  const slots=teams[i].length*3,benchmark=slots*8;
  const successRate=score_clamp(successful.length/slots);
  const realized=successful.reduce((sum,row)=>sum+Math.max(0,row.organizedContribution??row.powerContribution??0),0);
  const quality=score_clamp(realized/benchmark);
  const ownProcedure=3*(.55*successRate+.45*quality);
  const powerGap=power[i]-power[1-i],margin=powerGap/Math.max(benchmark,combinedPower);
  const procedural=ownProcedure*(.9+.1*margin);
  const response=successful.reduce((n,r)=>n+(['amend','scrutinize'].includes(r.action)?.5+.5*score_clamp(r.expertiseMatch):.25),0);
  const ownResponse=2*score_clamp(response/slots);
  let policyCredit=procedure==='question'?ownResponse:score_clamp(policy.goalScores?.[i],2);
  if(linkedQuestion){
   // The verdict adjusts earned credit symmetrically; it cannot create credit from zero.
   const relativeLead=combinedPower?powerGap/combinedPower:0;
   policyCredit=score_clamp(ownResponse*(1+.5*relativeLead),2);
   const base=score_tenth(ownResponse);
   questionResponse[i]={base,adjustment:score_tenth(score_tenth(policyCredit)-base)};
  }
  const coordination=successful.filter(r=>['coordinate','negotiate'].includes(r.action)).length/(teams[i].length*2);
  const realizedLinks=successful.reduce((n,r)=>{const e=r.explanation||{};return n+Math.max(0,e.cohesion||0)*.05+Math.max(0,e.personal||0)*.12+Math.max(0,e.partyCaucus||0)*.1+Math.max(0,e.cabinet||0)*.1;},0);
  const parts={procedure:procedural,policy:policyCredit,influence:2*quality,execution:2*score_clamp(power[i]/benchmark)*successRate,cooperation:score_clamp(coordination+Math.min(.45,realizedLinks)+(discipline.extra?.[i]||0)*.35)};
  // Parts are rounded once, then summed, so the displayed equation is exact.
  for(const key in parts)parts[key]=score_tenth(parts[key]);
  return {...parts,total:score_tenth(Object.values(parts).reduce((n,v)=>n+v,0))};
 });
 return {breakdown,questionResponse};
}

export function settle_scores(input){return settle_round_scoring(input).breakdown;}
