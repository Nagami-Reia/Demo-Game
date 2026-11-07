// Issue weights are game-design estimates, not official policy measurements.
export function agenda_weights(agenda){
 const valid=new Set(['economy','social','climate','security','digital','foreign']);
 if(typeof agenda==='string')return valid.has(agenda)?{[agenda]:1}:{};
 const input=agenda?.domainWeights||{},entries=Object.entries(input).filter(([d,w])=>valid.has(d)&&Number.isFinite(w)&&w>0);
 const total=entries.reduce((n,[,w])=>n+w,0);
 if(!total)return valid.has(agenda?.domain)?{[agenda.domain]:1}:{};
 return Object.fromEntries(entries.map(([d,w])=>[d,w/total]));
}
export function weighted_effect(agenda,effect){return Object.entries(agenda_weights(agenda)).reduce((sum,[d,w])=>sum+w*effect(d,w),0);}
export function domain_weight(domains,agenda){return weighted_effect(agenda,d=>domains?.includes(d)?1:0);}
