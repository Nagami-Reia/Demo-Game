// The opening seed fixes the dossier without consuming the match RNG.
export function pick_crisis(data,seed){
 const pool=data.crises||[];
 if(!pool.length)return null;
 let mixed=Math.imul(seed^(seed>>>16),0x45d9f3b);
 mixed=Math.imul(mixed^(mixed>>>16),0x45d9f3b);
 const fraction=((mixed^(mixed>>>16))>>>0)/0x100000000;
 return structuredClone(pool[Math.floor(fraction*pool.length)]);
}

export function match_round_limit(game){return game.crisis?9:8;}

export function active_crisis(game){
 return game.round===9?game.crisis:null;
}

export function crisis_agenda(crisis){
 const {id,domainWeights,domain,procedure,policy,news}=crisis;
 return {id,domain,domainWeights,procedure,policy,title:news.title,summary:news.brief};
}

// The first objective closes before the remaining simulation stage runs.
export function crisis_first_deadline(crisis){return crisis.objectives[0].deadline;}

// Resolve stages as batches so the government does not claim credit by acting first.
export function settle_crisis(crisis,trace,teams){
 const cards=teams.map(team=>new Map(team.map(card=>[card.id,card])));
 const objectives=crisis.objectives.map(objective=>({...objective,contributions:[0,0],complete:false}));
 for(let stage=0;stage<3;stage++){
  const eligible=objectives.filter((goal,i)=>!goal.complete&&stage<=goal.deadline&&
   (i===0||stage>crisis_first_deadline(crisis))&&
   (!goal.requires||objectives.some(other=>other.id===goal.requires&&other.complete)));
  for(const row of trace){
   if(row.kind!=='action'||row.stage!==stage||!row.success||row.skipped||!(row.powerContribution>0))continue;
   const domains=cards[row.player]?.get(row.cardId)?.domains||[];
   const goal=eligible.find(goal=>goal.actions.includes(row.action)&&goal.domains.some(domain=>domains.includes(domain)));
   if(goal)goal.contributions[row.player]++;
  }
  for(const goal of eligible)goal.complete=goal.contributions[0]+goal.contributions[1]>=goal.target;
 }
 const completed=objectives.filter(goal=>goal.complete);
 // Round the aggregate once, then give the remaining tenths to the other side.
 const first=Math.round(completed.reduce((sum,goal)=>sum+10*goal.contributions[0]/(goal.contributions[0]+goal.contributions[1]),0));
 const scores=[first/10,(completed.length*10-first)/10];
 const outcome=completed.length===objectives.length?'contained':completed.length?'partial':'unresolved';
 return {id:crisis.id,objectives,scores,outcome,verdict:crisis.verdicts[outcome]};
}
