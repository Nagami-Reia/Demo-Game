import {state_abbreviation,state_accent} from './state-colors.js';
import {office_label} from './office-labels.js';

// Biographical facts are separate from game attributes and parliamentary offices.
export function card_facts(card,data,lang='zh'){
 const local=value=>typeof value==='string'?value:value?.[lang]||value?.de||value?.en||'';
 const routes=new Map((data.allianceDefinitions||[]).map(d=>[d.id,d]));
 const memberships=(data.allianceTags||[]).filter(r=>r.id===card.id);
 const ids=new Set(memberships.flatMap(r=>r.tags||[]));
 const tags=[...ids].map(id=>routes.get(id)).filter(Boolean);
 const profile=card.assessment?.status==='official_profile_reviewed'?card.assessment.profession||'':'';
 const born=profile.split('\n').find(line=>/^Geboren\b/.test(line.trim()));
 const birthplace=born?.match(/\bin\s+(.+?)\s*$/)?.[1]||'';
 const state=tags.find(d=>d.category==='state');
 const previousState=(data.regionalLinks||[]).find(g=>g.members?.some(m=>m.id===card.id));
 const groups=tags.filter(d=>d.category==='working_group').map(d=>local(d.name));
 // Older sourced records remain useful for people outside the imported snapshots.
 if(!groups.length)for(const g of data.workingGroups||[])if(g.members?.some(m=>m.id===card.id))groups.push(lang==='zh'?(g.nameZh||g.name).replace(/^CDU\/CSU联邦议院党团/,''):g.sourceName||g.name);
 const professions=memberships.flatMap(r=>(r.qualifications||[]).map(q=>local(q.name)));
 if(!professions.length)professions.push(...tags.filter(d=>d.category==='personal').map(d=>local(d.name)));
 if(!professions.length)professions.push(...profile.split('\n').map(s=>s.trim()).filter(s=>s&&!/^Geboren\b/.test(s)));
 return {birthplace,state:state?local(state.name):previousState?(lang==='zh'?previousState.nameZh||previousState.name:previousState.name):'',stateKey:state?.name.de||previousState?.name||'',groups:[...new Set(groups)],professions:[...new Set(professions)]};
}

export function card_bookmarks_view(facts,government,lang,t,esc){
 const origin=state_abbreviation(facts.stateKey)||facts.state||facts.birthplace;
 const originTitle=[
  facts.birthplace&&`${t('birthplace')} · ${facts.birthplace}`,
  facts.state&&`${t('representedState')} · ${facts.state}`
 ].filter(Boolean).join(' / ');
 const stateColor=state_accent(facts.stateKey)||'var(--muted)';
 const stateTab=origin?`<span class="card-bookmark card-bookmark-state" style="--bookmark-state:${stateColor}" title="${esc(originTitle)}"><span>${esc(origin)}</span></span>`:'';
 const title=government.map(o=>office_label(o,'de')).join(' · ');
 const localized=government.map(o=>office_label(o,lang)).join(' · ');
 const officeTab=title?`<span class="card-bookmark card-bookmark-office" title="${esc(title===localized?title:title+' / '+localized)}"><span>${esc(title)}</span></span>`:'';
 return stateTab||officeTab?`<div class="card-bookmarks">${stateTab}${officeTab}</div>`:'';
}

export function card_facts_view(card,data,lang,t,esc,facts=card_facts(card,data,lang)){
 const empty='—';
 const origin=facts.birthplace?esc(facts.birthplace)+(facts.state?` <span class="card-state">· ${t('representedState')} ${esc(facts.state)}</span>`:''):facts.state?esc(facts.state):empty;
 const originLabel=!facts.birthplace&&facts.state?'representedState':'birthplace';
 return `<dl class="card-facts"><div class="card-facts-origin"><dt>${t(originLabel)}</dt><dd>${origin}</dd></div><div><dt>${t('workingGroups')}</dt><dd>${facts.groups.length?facts.groups.map(esc).join(' · '):empty}</dd></div><div><dt>${t('professionalBackground')}</dt><dd>${facts.professions.length?facts.professions.map(esc).join(' · '):empty}</dd></div></dl>`;
}

