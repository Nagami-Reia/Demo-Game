import {domain_weight} from './agenda-domains.js';
import {is_neutral_chair} from './roles.js';
// Role evidence is factual; coefficients are deliberately bounded game design.
export function institution_effect(card,agenda,ministerBonus=0){
 if(is_neutral_chair(card))return {government:0,committee:0};
 const known=(card.offices||[]).filter(o=>o.status==='verified_current'&&['committee','executive','state_secretary','government'].includes(o.scope)).map(o=>({...o,kind:o.scope==='committee'?'committee':'government'}));
 const roles=[...(card.institutionalRoles||[]),...known].filter(r=>r.status==='verified_current');
 const government=ministerBonus>0?0:.4*Math.max(0,...roles.filter(r=>r.kind==='government').map(r=>domain_weight(r.domains,agenda)));
 const committee=.3*Math.max(0,...roles.filter(r=>r.kind==='committee').map(r=>domain_weight(r.domains,agenda)));
 return {government,committee};
}
