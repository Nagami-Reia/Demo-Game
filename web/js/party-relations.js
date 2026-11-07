// May 2025 coalition snapshot. All gameplay coefficients are design assumptions.
// Official context: bundesregierung.de/breg-de/aktuelles/koalitionsvertrag-2025-2340970
// CDU/CSU group: bundeswahlleiterin.de/service/glossar/f/fraktionsgemeinschaft-cdu-csu.html
const GOVERNING_PARTIES=new Set(['CDU','CSU','SPD']);
const OPPOSITION_PARTIES=new Set(['AfD','Grüne','Linke']);
export function party_relation(owner,member){
 if(owner===member)return 'sameParty';
 if(['CDU','CSU'].includes(owner)&&['CDU','CSU'].includes(member))return 'unionPartner';
 if(GOVERNING_PARTIES.has(owner)&&GOVERNING_PARTIES.has(member))return 'coalitionPartner';
 if((GOVERNING_PARTIES.has(owner)&&OPPOSITION_PARTIES.has(member))||(OPPOSITION_PARTIES.has(owner)&&GOVERNING_PARTIES.has(member)))return 'crossBench';
 if(OPPOSITION_PARTIES.has(owner)&&OPPOSITION_PARTIES.has(member))return 'oppositionPeer';
 return 'independentPartner';
}
export function recruitment_affinity(owner,card){
 switch(party_relation(owner,card.party)){
 case 'sameParty':return .3;
 case 'unionPartner':return .4;
 case 'coalitionPartner':return .2;
 case 'crossBench':return -.35+(card.negotiation??3)*.07;
 default:return 0;
 }
}
export function relation_effect(owner,card,team,domain,action,cooperation=0){
 const kind=party_relation(owner,card.party),negotiator=Math.max(card.negotiation??3,...team.map(c=>c.negotiation??3));
 const specialist=card.domains.includes(domain),unionLink=team.some(c=>c.party==='CDU')&&team.some(c=>c.party==='CSU');
 let bonus=recruitment_affinity(owner,card),needsNegotiation=false;
 if(kind==='sameParty'&&action==='coordinate')bonus+=.15;
 if(kind==='unionPartner'&&unionLink&&action==='coordinate')bonus+=.35;
 if(kind==='coalitionPartner'&&action==='negotiate')bonus=0;
 if(kind==='coalitionPartner'&&action!=='negotiate')bonus+=action==='coordinate'?.25:specialist&&action==='amend'?.2:0;
 if(kind==='crossBench'){
  needsNegotiation=cooperation<.5&&negotiator<4;
  bonus+=Math.min(.4,cooperation*.4)+(specialist&&action==='amend'?.3:0);
  if(negotiator>=4)bonus+=.2;
  if(needsNegotiation)bonus-=.2;
 }
 // Different opposition parties are NOT automatically coalition partners.
 if(kind==='oppositionPeer'&&action==='scrutinize'&&specialist)bonus+=.1;
 return {kind,bonus,needsNegotiation,unionLink:kind==='unionPartner'&&unionLink};
}
export function can_recruit(owner,member){
 const party=typeof member==='string'?member:member?.party;if(member?.inactive)return false;
 if(['CDU','CSU','SPD'].includes(owner)&&party==='AfD'||owner==='AfD'&&['CDU','CSU'].includes(party))return false;
 const chair=typeof member==='object'&&((member.offices||[]).some(o=>o.scope==='party'&&o.status==='verified_current')||(member.mandate?.scope==='party'&&member.mandate.status==='verified_current'));
 if(chair&&GOVERNING_PARTIES.has(owner)!==GOVERNING_PARTIES.has(party))return false;
 return true;
}
