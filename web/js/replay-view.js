import {PSS_CHANNELS} from './political-state.js';

export function round_verdict_key(result){
 if(result.procedure!=='question')return result.passed?'passed':'blocked';
 const power=result.effectLedger?.map(row=>row.finalPower)??result.power;
 if(power?.length===2&&power[0]===power[1])return 'questionEven';
 return result.passed?'questionGood':'questionBad';
}

export function round_score_view(result,t,labels){
 const breakdown=result.scoreBreakdown;
 if(!breakdown)return '';
 const question=result.procedure==='question',response=result.questionResponse;
 const rows=['procedure','policy','influence','execution','cooperation','hidden','news','tactics','faction','crisis'];
 const label=key=>key==='policy'?t(question?'questionScore':'policyGoalScore'):t('score_'+key);
 const score=value=>Number(value??0).toFixed(1);
 const signed=value=>value>0?'+'+score(value):value<0?'−'+score(-value):score(0);
 const policy=result.policy;
 const detail=(key,i)=>{
  if(key==='procedure'&&result.teams?.[i]?.length&&result.trace?.some(row=>row.kind==='action')){
   const successful=result.trace.filter(row=>row.kind==='action'&&row.player===i&&row.success&&(row.powerContribution===undefined||row.powerContribution>0)).length;
   return `<small>${t('roundEffectiveActions')} ${successful}/${result.teams[i].length*3}</small>`;
  }
  if(key!=='policy')return '';
  if(response?.[i])return `<small>${t('questionScoreBase')} ${score(response[i].base)} · ${t('questionScoreAdjustment')} ${signed(response[i].adjustment)}</small>`;
  const target=policy?.target?.[i];
  if(!question&&result.passed&&[target,policy?.statusQuo,policy?.value].every(Number.isFinite)){
   const before=Math.abs(target-policy.statusQuo),after=Math.abs(target-policy.value);
   return `<small>${t('roundPolicyDistance')} ${before.toFixed(2)} → ${after.toFixed(2)}</small>`;
  }
  return '';
 };
 return `<p class="round-score-note">${t(question?(response?'questionScoreLinked':'questionScoreLegacy'):'proposalScoreNote')}</p>
 <div class="result-table-scroll"><table class="result-table round-score-table">
 <thead><tr><th scope="col">${t('scoreBreakdown')}</th>${labels.map(name=>`<th scope="col">${name}</th>`).join('')}</tr></thead>
 <tbody>${rows.filter(key=>breakdown.some(side=>Object.hasOwn(side,key))).map(key=>`<tr><th scope="row">${label(key)}</th>${breakdown.map((side,i)=>`<td>${score(side[key])}${detail(key,i)}</td>`).join('')}</tr>`).join('')}</tbody>
 <tfoot><tr><th scope="row">${t('roundTotalScore')}</th>${result.scores.map(value=>`<td>${score(value)}</td>`).join('')}</tr></tfoot></table></div>`;
}

const pss_labels={control:'pssControl',identity_integrity:'pssIdentity'};
function pss_numbers(state,t){
 return PSS_CHANNELS.filter(k=>Number.isFinite(state?.[k])).map(k=>`${t(pss_labels[k]||k)} ${state[k].toFixed(2)}`).join(' · ');
}
function pss_replay_action(row,t){
 const f=row.feedback,update=f?.pss;
 if(!update)return `<p>${t('details')} · ${pss_numbers(f,t)}</p>`;
 return `<p><b>${t('pssTitle')}</b> · ${t(f.profileSource==='generic'?'pssProfileGeneric':'pssProfileImported')}</p>
  <p>${pss_numbers(update.before,t)} → ${pss_numbers(f,t)}</p>
  <p>${t('pssExpected')} ${Math.round(update.expected*100)}% · ${t('pssObserved')} ${Math.round(update.observed*100)}% · ${t('pssEvidence')} ${update.evidence.toFixed(2)}${update.memoryFormed?' · '+t('pssMemory'):''}${update.controlRestored?' · '+t('pssControlRestored')+' +'+update.controlRestored.toFixed(3):''}</p>`;
}
function pss_replay_news(result,t,loc,esc){
 const exposures=result.pss?.exposures?.flat()||[];
 if(!exposures.length)return '';
 const names=new Map((result.teams||[]).flat().map(card=>[card.id,card.displayName||card.name]));
 return `<details class="trace"><summary>${t('pssNews')} · ${exposures.length}</summary>${exposures.map(e=>`<p><b>${esc(names.get(e.cardId)||e.cardId)}</b> · ${esc(loc(e.title))}${e.continuing?' · '+t('pssContinuing'):''}<br>${pss_numbers(e.before,t)} → ${pss_numbers(e.after,t)}</p>`).join('')}</details>`;
}

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
 return `<details id="history-panel" class="history-panel" ${open?'open':''}><summary>${t('replay')} · ${g.history.length} ${t('round')}</summary><div class="history-scroll" tabindex="0" aria-label="${t('replay')}">${[...g.history].reverse().map(h=>`<details class="history-round"><summary>${t('round')} ${h.round} · ${esc(loc(h.agenda.title))} · ${h.result.scores.join(' / ')}</summary><p class="round-score-note">${t(round_verdict_key(h.result))} · ${t('power')} ${h.result.power?.map(value=>Number(value).toFixed(2)).join(' / ')||'—'}</p>${h.result.scoreBreakdown?`<details class="trace"><summary>${t('scoreBreakdown')}</summary>${round_score_view(h.result,t,g.players.map(p=>esc(p.party)))}</details>`:''}${(h.result.burstLeads||[]).map((lead,i)=>lead?`<p><b>${t(i?'cpu':'you')} · ${t('factionBurstLead')}</b> · ${esc(lead.name)}</p>`:'').join('')}${faction_history_view(h.result,t)}${pss_replay_news(h.result,t,loc,esc)}${h.result.trace.map(row=>{
 if(row.kind==='discipline')return `<details class="discipline-record"><summary>${esc(row.name)} · ${t(row.status)}</summary><p>${t('blocEffect')}: ${row.power>0?'+':''}${row.power} · ${t('extraOutcome')}: +${row.extra}</p><p>${t('scope_'+row.scope)} · ${t('cohesion')}: ${row.conditions.cohesion.toFixed(2)} · ${t('tension')}: ${row.conditions.tension.toFixed(2)}</p></details>`;
 if(row.kind==='event')return `<div class="incident"><b>${t('event')} · ${esc(loc(row.event.title))}</b><p>${esc(loc(row.event.description))}</p></div>`;
 return `<details class="trace"><summary>${esc(row.name)} · ${t(row.action)} · ${t(row.skipped?'tacticalSacrificed':row.partialAgreement?'partialAgreement':row.success?'success':'failure')}${row.controversy?` · ${t('faction_'+faction_controversy_key(row.controversy.modifier))} ${faction_signed(row.controversy.modifier)}`:''}</summary>${row.supports?`<p>${t('remedialAction')}: ${esc(row.supports)}</p>`:''}${row.preparationReused?`<p>${t('preparationReused')}</p>`:''}${row.relationship?`<p>${t(row.relationship)} · ${t(row.relationship+'Text')}</p>`:''}<p>${Object.entries(row.explanation||{}).map(([k,v])=>esc(t('factor_'+k))+': '+Number(v).toFixed(2)).join(' · ')}</p>${row.allianceEffects?.length?`<p>${row.allianceEffects.map(e=>`${esc(loc(e.name))} · ${e.layers} ${t('layers')} · +${e.power.toFixed(2)}`).join(' / ')}</p>`:''}${row.hiddenScore?`<p>${t('score_hidden')}: +${row.hiddenScore}</p>`:''}${pss_replay_action(row,t)}</details>`;
 }).join('')}</details>`).join('')}</div></details>`;
}
