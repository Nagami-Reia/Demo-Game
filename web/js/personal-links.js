import {domain_weight} from './agenda-domains.js';
import {is_neutral_chair} from './roles.js';
// Only explicitly sourced public working relationships; no invented private affinity.
export function personal_links(team,domain,relations=[]){
 const ids=new Set(team.filter(c=>!is_neutral_chair(c)).map(c=>c.id));
 const active=relations.flatMap(r=>{const members=r.members?r.members.map(m=>typeof m==='string'?m:m.id):[r.a,r.b];const memberIds=[...new Set(members.filter(id=>ids.has(id)))];if(memberIds.length<(r.memberRequirement||2))return [];if(r.category!=='working_group'&&r.category!=='regional'&&r.domains?.length&&!domain_weight(r.domains,domain))return [];return [{...r,memberIds,sources:r.members?r.members.filter(m=>memberIds.includes(m.id)).map(m=>m.source):r.sources||[r.source]}];});
 const bonuses={},channels={};let total=0;
 for(const r of active){const share=r.category==='working_group'?.6+.4*domain_weight(r.domains,domain):!r.domains?.length?1:domain_weight(r.domains,domain);
  const perMember=Math.max(0,Math.min(1,r.strength||0)*share)/r.memberIds.length;
  for(const id of r.memberIds){if(r.coveredMemberIds?.includes(id))continue;total+=perMember;bonuses[id]=(bonuses[id]||0)+perMember;const row=channels[id]??={};const key=r.typed?r.effect:'legacy';row[key]=(row[key]||0)+perMember;}
 }
 const scale=total>1.5?1.5/total:1;for(const id in bonuses){bonuses[id]=Math.min(1,bonuses[id]*scale);for(const k in channels[id])channels[id][k]=Math.min(k==='coordination'?.35:k==='negotiation'?.3:1,channels[id][k]*scale);}
 return {active,bonuses,channels};
}
export function background_effect(card,domain){return Math.min(.45,(card.backgrounds||[]).reduce((sum,b)=>sum+.45*domain_weight(b.domains,domain),0));}
