import {alliance_ring} from './alliance-icon.js';
import {state_accent} from './state-colors.js';
import {tactical_ready_view} from './tactical-view.js';
import {alliance_preview,alliance_economy_preview,alliance_passive_generic} from './alliances.js';
// Pure rendering: selecting, deselecting or opening this strip never credits layers.
export function deployment_preview(game,ids,t,loc,esc){
 const rows=alliance_preview(game,[...ids],0)
  .filter(r=>!alliance_passive_generic(r)||r.active||r.availableCount>=r.threshold)
  .toSorted((a,b)=>Number(b.active)-Number(a.active));
 const forecast=alliance_economy_preview(game,0,[...ids]);
 return `<div class="alliance-preview" aria-label="${t('alliancePreview')}"><div class="eyebrow">${t('alliancePreview')}</div><div class="alliance-strip" role="list">${rows.length?rows.map(r=>{
  const status=t(r.active?'allianceActive':'allianceInactive');
  const gain=forecast.gains.find(g=>g.id===r.id),pay=forecast.payouts.find(p=>p.id===r.id);
  const detail=`${loc(r.description)} ${r.organization||''} · ${status} · ${t('power')} +${r.effect.toFixed(2)}${gain?` · +${gain.add} ${t('layers')}`:''}${pay?` · €${pay.cash} · ${t('income')} +${pay.income}`:''}${r.nextThreshold?` · ${t('allianceNext')} ${r.nextThreshold}`:''}`;
  const stateColor=r.category==='state'?state_accent(r.name.de):'';
  const target=r.category==='state'?r.threshold:(r.nextThreshold??r.thresholds.at(-1));
  const progress=Math.min(r.count,target);
  const layers=alliance_passive_generic(r)?'':` · <span>${r.layers} ${t('layers')}</span>`;
  return `<span ${stateColor?`style="--alliance-color:${stateColor}"`:''} role="listitem" data-alliance="${esc(r.id)}" data-active="${r.active}" class="alliance-chip alliance-${esc(r.category||'special')} ${r.active?'is-active':'is-inactive'}" title="${esc(detail)}" aria-label="${esc(loc(r.name)+' · '+progress+'/'+target+' · '+status)}">${alliance_ring(r,target)}<span class="alliance-chip-copy"><b>${esc(loc(r.name))}</b> <span>${progress}/${target}</span>${layers}</span></span>`;
 }).join(''):`<span class="muted">${t('allianceNone')}</span>`}</div></div>${tactical_ready_view(game,ids,t,loc,esc)}`;
}

export function alliance_growth_view(result,t,loc,esc){
 if(!result.alliances?.some(a=>a.gains.length||a.cash||a.income))return '';
 return `<div class="alliance-growth"><b>${t('allianceGrowth')}</b>${result.alliances.map((a,i)=>{
  const totals=new Map();for(const gain of a.gains){const old=totals.get(gain.id);totals.set(gain.id,{name:gain.name,from:old?.from??gain.from,to:gain.to});}
  return totals.size||a.cash||a.income?`<p>${t(i?'cpu':'you')} · ${[...totals.values()].map(g=>`${esc(loc(g.name))} ${g.from} → ${g.to} ${t('layers')}`).join(' · ')}${a.cash?` · +€${a.cash}`:''}${a.income?` · ${t('income')} +${a.income}`:''}</p>`:'';
 }).join('')}<small class="muted">${t('allianceNextRound')}</small></div>`;
}
