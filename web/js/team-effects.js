// Coefficients are game rules, never measurements of real parties or people.
export function team_cohesion(owner,team,stage,actor=null){
 const counts={};for(const c of team)counts[c.party]=(counts[c.party]||0)+1;
 const bonus=party=>(counts[party]||0)>=3?(party===owner?(stage===0?.35:.9):(stage===0?0:.6)):0;
 return actor?bonus(actor.party):team.length?team.reduce((sum,c)=>sum+bonus(c.party),0)/team.length:0;
}
export function special_effect(card,action){
 const stat={negotiate:'negotiation',coordinate:'leadership',amend:'expertise',scrutinize:'oratory'}[action];
 return card.edition==='special'&&card.specialEffect?.stat===stat?Math.max(0,Math.min(.6,card.specialEffect.amount||0)):0;
}
export function firewall_penalty(party,team){return ['CDU','CSU','SPD'].includes(party)?Math.min(2.4,team.filter(c=>c.party==='AfD').length*.8):0;}
