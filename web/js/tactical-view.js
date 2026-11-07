import {tactical_abilities,tactical_grown} from './tactical-state.js';
import {OPPOSITION_SKILLS,opposition_name} from './opposition-skills.js';
export function tactical_plan_view(state,t,loc,esc){
 if(!state?.tactical)return '';
 const label=x=>x?.key?t(x.key):loc(x)||x?.zh||'';
 const scout=state.scoutedOption&&!state.scoutedUsed?`<section class="tactical-scout"><b>${esc(label(state.scoutedOption.title))}</b><p>${esc(label(state.scoutedOption.description))}</p><div class="actions"><select id="tactical-replace">${state.options.map(o=>`<option value="${esc(o.id)}">${esc(label(o.title))}</option>`).join('')}</select><button data-action="replace_negotiation">${t('replaceOption')}</button></div></section>`:'';
 return `${scout}${state.tactical.settings.length?`<div class="tactical-settings">${state.tactical.settings.map(s=>{const fallback=state.tactical.defaults[s.key];return `<label>${esc(label(s.title))}<select data-tactical-setting="${esc(s.key)}">${s.options.map(o=>`<option value="${esc(o.id)}" ${o.id===fallback?'selected':''}>${esc(label(o.title))}</option>`).join('')}</select></label>`;}).join('')}</div>`:''}`;
}
export function tactical_decision_view(game,t,loc,esc){
 const d=game.tacticalDecision;if(!d)return '';
 const pack=game.roundRuntime?.pendingPack,title=t('tactic_title_'+d.type),name=pack?.c?.displayName||pack?.c?.name||'';
 return `<section class="tactical-decision"><div class="eyebrow">${t('phase_TACTIC_DECISION')}</div><h2>${esc(title.startsWith('tactic_title_')?loc(d.title):title)}</h2>${name?`<p>${esc(name)} · ${t(pack.action)}</p>`:''}<div class="tactical-choice-list">${d.choices.map(c=>{const translated=t('tactic_choice_'+c.id);return `<button data-action="tactical_choice" data-id="${esc(c.id)}">${esc(translated.startsWith('tactic_choice_')?loc(c.title):translated)}</button>`;}).join('')}</div></section>`;
}
export function tactical_ready_view(game,ids,t,loc,esc){
 const abilities=tactical_abilities(game,0,[...ids]),names=game.data.tacticalEffects?.rules||[];
 const procedures=Object.entries(abilities).filter(([,r])=>r).map(([id,r])=>{const rule=names.find(x=>x.id===id),growth=r.category==='state'?'':t('growthUnlock')+' '+(r.specialGrowthThreshold||8);return rule?`<span title="${esc([loc(rule.description),growth,loc(rule.grownDescription)].filter(Boolean).join(' · '))}">${esc(loc(rule.name))}${tactical_grown(r)?' +':''}</span>`:'';}).join('');
 return procedures?`<div class="tactical-ready"><small>${t('specialProcedures')}</small>${procedures}</div>`:'';
}
export function tactical_result_view(result,t,loc,esc){
 if(!result.tactics?.some(r=>r.events.length||r.pending.length))return '';
 return `<section class="tactical-results"><h3>${t('specialProcedures')}</h3>${result.tactics.map((r,i)=>r.events.length||r.pending.length?`<div><b>${t(i?'cpu':'you')}</b>${r.cash||r.score?` · €${r.cash} · +${r.score} ${t('points')}`:''}<p>${[...new Set(r.events.map(e=>e.kind==='opposition_skill'?opposition_name(e.skill):t('tactical_event_'+e.kind)))].map(esc).join(' · ')}</p>${opposition_result_details(r,loc,esc)}${r.pending.length?`<p>${t('nextRoundCommitments')}: ${r.pending.map(p=>esc(p.kind==='opposition_funkloch'?opposition_name('funkloch'):t('tactical_pending_'+p.kind))+(p.amount?' €'+p.amount:'')+(p.domain?' · '+t(p.domain):'')).join(' / ')}</p>`:''}</div>`:'').join('')}</section>`;
}

function opposition_result_details(result,loc,esc){
 const triggered=new Set(result.events.filter(event=>event.kind==='opposition_skill').map(event=>event.skill));
 return OPPOSITION_SKILLS.filter(skill=>triggered.has(skill.id)).map(skill=>
  `<details><summary>${esc(skill.name)}</summary><p>${esc(loc(skill.text))}</p></details>`).join('');
}
