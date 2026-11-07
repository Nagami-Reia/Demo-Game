export function policy_axis(agenda){return agenda.policy?.axis||({economy:'investment',social:'welfare',climate:'climate',security:'defence',digital:'digital',foreign:'defence'}[agenda.domain]);}
export function policy_relation(owner,other,agenda,platforms={},relations=[]){
 if(owner===other)return {distance:0,cooperation:1,bonus:0};
 const axis=policy_axis(agenda),a=platforms[owner]?.positions?.[axis]??0,b=platforms[other]?.positions?.[axis]??0;
 const pair=relations.find(r=>(r.a===owner&&r.b===other)||(r.a===other&&r.b===owner));
 const cooperation=pair?.cooperation??.3,distance=Math.abs(a-b)/2;
 return {distance,cooperation,bonus:Math.max(-.4,Math.min(.2,(cooperation-.5)*.3-distance*.25))};
}
// Policy credit measures a change, never merely being near a default centre.
export function policy_outcome(game,power,trace){
 const clamp=v=>Math.max(-1,Math.min(1,Number.isFinite(v)?v:0));
 const axis=policy_axis(game.agenda),platforms=game.data.platforms||{},passed=power[0]>=power[1];
 const statusQuo=clamp(game.agenda.policy?.statusQuo??0),draft=clamp(game.agenda.policy?.proposalValue??(game.agenda.policy?.proposalDirection??1)*.6);
 const target=game.players.map(p=>clamp(platforms[p.party]?.positions?.[axis]??0));
 const activity=[0,1].map(i=>trace.filter(r=>r.kind==='action'&&r.player===i&&r.success).reduce((sum,r)=>sum+(r.action==='amend'?(r.expertiseMatch??1):r.action==='negotiate'?.6:0),0));
 const weight=power.map((v,i)=>Math.max(0,v)*(1+Math.min(.6,activity[i]*.1))),total=weight[0]+weight[1]||1;
 const negotiated=(target[0]*weight[0]+target[1]*weight[1])/total;
 const negotiationWeight=Math.min(.55,.1+(activity[0]+activity[1])*.05);
 const proposalValue=clamp(draft*(1-negotiationWeight)+negotiated*negotiationWeight);
 const value=game.agenda.procedure==='question'?null:passed?proposalValue:statusQuo;
 const progress=target.map(t=>value===null?0:Math.max(0,Math.abs(t-statusQuo)-Math.abs(t-value)));
 const preventedRegression=target.map((t,i)=>value===null||passed||i===0?0:Math.max(0,Math.abs(t-proposalValue)-Math.abs(t-statusQuo)));
 const goalScores=target.map((t,i)=>value===null||(!passed&&i===0)?0:Math.min(2,2*Math.max(progress[i],preventedRegression[i])/Math.max(.4,Math.abs(t-statusQuo))));
 return {axis,value,target,goalScores,passed,statusQuo,proposalValue,negotiationWeight,progress,preventedRegression};
}
