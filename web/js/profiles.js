import {combined_relations} from './combination-groups.js';
import {card_facts} from './card-facts.js';
// A historical election identity never silently grants a current executive office.
export function apply_offices(data){
 if(!data.offices)return data;
 return {...data,roster:data.roster.map(c=>{
  const offices=data.offices.filter(o=>o.id===c.id&&o.status==='verified_current');
  const scopes={fraktion:1,party:.65,executive:.45,committee:.3};
  const neutralChair=offices.some(o=>o.scope==='presidium');const mandate=offices.filter(o=>scopes[o.scope]).toSorted((a,b)=>b.influence*scopes[b.scope]-a.influence*scopes[a.scope])[0];
  let tier=c.tier;
  if(offices.some(o=>o.role==='Bundeskanzler'||o.scope==='party'))tier=5;
  else if(offices.some(o=>['minister','fraktion','executive','presidium'].includes(o.scope)))tier=4;
  else if(tier>=4)tier=3; // game rarity based on verified active office, not personal worth
  if(c.assessment?.status==='official_profile_reviewed')tier=c.assessment.tier;
  const links=combined_relations(data).filter(r=>r.a===c.id||r.b===c.id||r.members?.some(m=>m.id===c.id));const backgrounds=(data.backgrounds||[]).filter(b=>b.id===c.id);const domains=[...new Set([...c.domains,...backgrounds.flatMap(b=>b.domains),...offices.filter(o=>o.scope==='minister').flatMap(o=>o.domains)])];const facts=data.allianceTags&&data.allianceDefinitions?card_facts(c,data):null;const inactive=!!(facts&&tier<=2&&!facts.birthplace&&!facts.state&&!facts.groups.length&&!facts.professions.length);const allianceTags=[...new Set((data.allianceTags||[]).filter(r=>r.id===c.id).flatMap(r=>r.tags||[]))];const allianceMemberships=(data.allianceDefinitions||[]).filter(r=>allianceTags.includes(r.id)).map(r=>({id:r.id,name:r.name,category:r.category,organization:r.organization||null,sources:(data.allianceTags||[]).filter(t=>t.id===c.id).flatMap(t=>(t.evidence||[]).filter(e=>e.tag===r.id).map(e=>e.source)).filter(Boolean)}));const qualifications=(data.allianceTags||[]).filter(r=>r.id===c.id).flatMap(r=>r.qualifications||[]);return {...c,tier,inactive,qualifications,allianceTags,allianceMemberships,inactiveReason:inactive?'LOW_TIER_EMPTY_PROFILE':null,partyPolicy:data.platforms?.[c.party]||null,neutralChair,offices,backgrounds,links,domains,mandate:mandate||null};
 })};
}
