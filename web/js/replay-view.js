const faction_signed=value=>`${value>0?'+':''}${value}`;
const faction_controversy_key=value=>value>0?'controversy_up':value<0?'controversy_down':'controversy_even';

function faction_history_view(result,t){
 return (result.factionEffects||[]).map(({events},i)=>events.length?`<p><b>${t(i?'cpu':'you')} · ${t('factionPassives')}</b> · ${events.map(e=>{
  const amount=e.delta!==undefined?`${e.value} (${faction_signed(e.delta)})`:e.key==='compromise_refund'?`€${e.value}`:faction_signed(e.value);
  return `${t('faction_'+e.key)} ${amount}${e.poll?` · ${t('factionPollRaw')} ${faction_signed(e.poll)}`:''}`;
 }).join(' / ')}</p>`:'').join('');
}

export function history_view(g,t,loc,esc,open=false){
 if(!g.history?.length)return '';
 return `<details id="history-panel" class="history-panel" ${open?'open':''}><summary>${t('replay')} · ${g.history.length} ${t('round')}</summary><div class="history-scroll" tabindex="0" aria-label="${t('replay')}">${[...g.history].reverse().map(h=>`<details class="history-round"><summary>${t('round')} ${h.round} · ${esc(loc(h.agenda.title))} · ${h.result.scores.join(' / ')}</summary>${h.result.scoreBreakdown?`<details class="trace"><summary>${t('scoreBreakdown')}</summary>${h.result.scoreBreakdown.map((b,i)=>`<p>${t(i?'cpu':'you')}: ${['procedure','policy','influence','execution','cooperation',...(b.hidden?['hidden']:[]),...(b.news?['news']:[]),...(b.tactics?['tactics']:[]),...(b.faction?['faction']:[])].map(k=>`${t('score_'+k)} ${b[k].toFixed(1)}`).join(' + ')} = ${b.total.toFixed(1)}</p>`).join('')}</details>`:''}${faction_history_view(h.result,t)}${h.result.trace.map(row=>{
 if(row.kind==='discipline')return `<details class="discipline-record"><summary>${esc(row.name)} · ${t(row.status)}</summary><p>${t('blocEffect')}: ${row.power>0?'+':''}${row.power} · ${t('extraOutcome')}: +${row.extra}</p><p>${t('scope_'+row.scope)} · ${t('cohesion')}: ${row.conditions.cohesion.toFixed(2)} · ${t('tension')}: ${row.conditions.tension.toFixed(2)}</p></details>`;
 if(row.kind==='event')return `<div class="incident"><b>${t('event')} · ${esc(loc(row.event.title))}</b><p>${esc(loc(row.event.description))}</p></div>`;
 return `<details class="trace"><summary>${esc(row.name)} · ${t(row.action)} · ${t(row.skipped?'tacticalSacrificed':row.partialAgreement?'partialAgreement':row.success?'success':'failure')}${row.controversy?` · ${t('faction_'+faction_controversy_key(row.controversy.modifier))} ${faction_signed(row.controversy.modifier)}`:''}</summary>${row.supports?`<p>${t('remedialAction')}: ${esc(row.supports)}</p>`:''}${row.preparationReused?`<p>${t('preparationReused')}</p>`:''}${row.relationship?`<p>${t(row.relationship)} · ${t(row.relationship+'Text')}</p>`:''}<p>${Object.entries(row.explanation||{}).map(([k,v])=>esc(t('factor_'+k))+': '+Number(v).toFixed(2)).join(' · ')}</p>${row.allianceEffects?.length?`<p>${row.allianceEffects.map(e=>`${esc(loc(e.name))} · ${e.layers} ${t('layers')} · +${e.power.toFixed(2)}`).join(' / ')}</p>`:''}${row.hiddenScore?`<p>${t('score_hidden')}: +${row.hiddenScore}</p>`:''}<p>${t('details')}: ${['energy','pressure','confidence'].map(k=>t(k)+': '+Number(row.feedback?.[k]??0).toFixed(2)).join(' · ')}</p></details>`;
 }).join('')}</details>`).join('')}</div></details>`;
}
