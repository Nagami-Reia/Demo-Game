import {hidden_preview} from './hidden-relations.js';
import {opposition_preview} from './opposition-skills.js';

export function hidden_preview_view(game,ids,player,t,loc,esc,expanded=new Set()){
 const selectedIds=[...ids];
 const rows=hidden_preview(game,player,selectedIds).filter(r=>r.active);
 const newSkills=opposition_preview(game,selectedIds,player);
 if(!rows.length&&!newSkills.length)return `<p class="muted">${esc(t('noActiveRelationshipSkills'))}</p>`;
 const label=x=>loc(x)||x?.zh||'';
 const details=r=>[label(r.description),game.data.tacticalEffects?.enabled?label(r.tacticalDescription):''].filter(Boolean).join(' ');
 const chip=(id,name,description,extra='')=>`<div role="listitem"><details class="alliance-chip alliance-personal hidden-chip is-active" data-hidden="${esc(id)}" data-active="true"${expanded.has(id)?' open':''}><summary><b>${esc(name)}</b>${extra}</summary><p>${esc(description)}</p></details></div>`;
 const chips=rows.map(r=>{
  const threshold=r.id==='csu_bavaria'?Math.min(5,Math.max(2,r.count+1)):r.threshold||r.members?.length||2;
  const count=r.count==null?'':`<span>${r.count}/${threshold}</span>`;
  const cash=r.id==='csu_bavaria'?`<span>+€${r.baseCash}</span>`:'';
  return chip(r.id,label(r.name),details(r),count+cash);
 });
 chips.push(...newSkills.map(skill=>chip(skill.id,skill.name,label(skill.text))));
 return `<div class="hidden-skill-list" role="list">${chips.join('')}</div>`;
}

export function hidden_result_view(result,t,loc,esc){
 const hasHidden=result.hiddenRelations?.some(r=>r.active?.length||r.cash||r.score);
 const label=x=>loc(x)||x?.zh||'';
 const negotiation=result.negotiation,selected=negotiation?.options?.find(o=>o.id===negotiation.selected);
 const plan=negotiation?.resolved&&selected?`<p class="faction-note">${t('phase_NEGOTIATION')} · ${esc(label(selected.title))} · €${negotiation.costPaid||0}</p>`:'';
 if(!hasHidden)return plan;
 return `${plan}<div class="hidden-result"><h3>${t('hiddenRelations')}</h3>${result.hiddenRelations.map((r,i)=>{
  const names=new Map((r.active||[]).map(a=>[a.id,label(a.name)]));
  const gains=new Map();for(const g of r.gains||[]){const old=gains.get(g.id)||{name:g.name,add:0};old.add+=g.add;gains.set(g.id,old);}
  const events=new Map();for(const e of r.events||[]){const key=e.source+':'+e.kind;const old=events.get(key)||{source:e.source,kind:e.kind,amount:0};old.amount+=e.amount||0;events.set(key,old);}
  return `<section><b>${t(i?'cpu':'you')}</b><p>${(r.active||[]).map(a=>esc(label(a.name))).join(' · ')}</p><p>${t('cash')} ${r.cash>=0?'+':''}${r.cash||0} · ${t('organizationPoints')} ${r.organization>=0?'+':''}${r.organization||0} · ${t('legislativeEfficiency')} +${r.legislativeEfficiency||0} · ${t('score_hidden')} +${r.score||0}</p><div class="hidden-ledger">${[...events.values()].filter(e=>e.amount).map(e=>`<span>${esc(names.get(e.source)||(e.source.startsWith('csu_')||e.source.startsWith('auction_refund_')?names.get('csu_bavaria')||e.source:e.source))} · ${t({cash:'cash',score:'score_hidden',organization:'organizationPoints',legislativeEfficiency:'legislativeEfficiency'}[e.kind]||e.kind)} +${e.amount}</span>`).join('')}${[...gains.values()].map(g=>`<span>${esc(label(g.name))} · +${g.add} ${t('layers')}</span>`).join('')}</div></section>`;
 }).join('')}</div>`;
}
