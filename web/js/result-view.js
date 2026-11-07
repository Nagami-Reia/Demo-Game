import {tactical_result_view} from './tactical-view.js';
import {news_result_view} from './news-view.js';
import {hidden_result_view} from './hidden-view.js';
import {combination_view} from './combination-groups.js';
import {alliance_growth_view} from './deployment-preview.js';
import {FACTIONS} from './factions.js';
import {finale_view} from './finale-view.js';
import {history_view} from './replay-view.js';
import {policy_score_offset} from './ui-motion.js';

function policy_score_ring(total,gain,label,esc){
 return `<span class="policy-score-ring" data-score="${total}" data-gain="${gain}" role="img" aria-label="${esc(`${label} ${total}`)}">
  <svg viewBox="0 0 72 72" aria-hidden="true">
   <circle class="policy-score-track" cx="36" cy="36" r="31"/>
   <circle class="policy-score-arc" cx="36" cy="36" r="31" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${policy_score_offset(total)}" transform="rotate(-90 36 36)"/>
  </svg>
  <b aria-hidden="true">${total}</b>
 </span>`;
}

// Settlement is a separate full-width screen, without recruitment or news panels.
export function result_page(g,t,loc,esc){
 const r=g.result,final=g.phase==='END'||g.round>=8;
 if(final)return finale_view(g,t,loc,esc);
 const outcome=final?t(g.players[0].score===g.players[1].score?'tie':g.players[0].score>g.players[1].score?'win':'lose'):t(r.procedure==='question'?(r.passed?'questionGood':'questionBad'):(r.passed?'passed':'blocked'));
 const records=final?g.history:g.history.filter(h=>h.round===g.round);
 return `<section class="result-page panel"><div class="eyebrow">${t(final?'phase_END':'phase_RESULT')} · ${t('round')} ${g.round}/8</div><h1>${final?t('ending'):esc(loc(g.agenda.title))}</h1><p class="outcome">${outcome}</p><div class="scoreboard">${g.players.map((p,i)=>`<section style="--party:${FACTIONS[p.party]?.color||'var(--accent)'}"><div class="eyebrow">${t(i?'cpu':'you')} · ${esc(p.party)}</div><div class="metrics"><span class="policy-score-metric">${t('score')}${policy_score_ring(p.score,r.scores[i],t('score'),esc)}</span><span>${t('roundGain')}<b>+${r.scores[i]}</b></span><span>${t('cash')}<b>€${p.cash}</b></span></div></section>`).join('')}</div><div class="actions"><button data-action="${final?'start':'continue'}">${t(final?'new':'next')}</button><button data-action="export">${t('export')}</button>${g.news?.edition?`<button data-action="show_news">${t('reopenNews')}</button>`:''}</div>${r.firewall?.some(v=>v>0)?`<p class="poll-debuff">${t('firewall')}: ${r.firewall.map((v,i)=>v?`${t(i?'cpu':'you')} −${v.toFixed(1)}`:'').filter(Boolean).join(' / ')}</p>`:''}<h2>${t('roundBreakdown')}</h2><div class="result-table-scroll"><table class="result-table"><thead><tr><th>${t('round')}</th><th>${t('agenda')}</th><th>${t('power')} · ${t('you')} / ${t('cpu')}</th><th>${t('score')} · ${t('you')} / ${t('cpu')}</th></tr></thead><tbody>${records.map(h=>`<tr><td>${h.round}</td><td>${esc(loc(h.agenda.title))}</td><td>${h.result.power.join(' / ')}</td><td>${h.result.scores.join(' / ')}</td></tr>`).join('')}</tbody></table></div><h2>${t('select')}</h2><div class="result-teams">${r.teams.map((team,i)=>`<section><h3>${t(i?'cpu':'you')}</h3>${team.map(c=>`<p>${esc(c.displayName||c.name)} · ${esc(c.party)} · T${c.tier}</p>`).join('')}</section>`).join('')}</div>${r.organizations?`<h2>${t('organization')}</h2>${r.organizations.map(o=>`<p>${t(o.player?'cpu':'you')} · ${Math.round(o.integrity*100)}% · ${t('commandBonus')} +${Math.round(o.command*100)}%${o.captured.length?` · ${t('leaderContested')}: ${o.captured.map(c=>esc(c.name)).join(', ')}`:''}</p>`).join('')}`:''}${r.policy?.value!==null&&r.policy?`<p>${t('partyGoalProgress')} · ${g.players.map((p,i)=>`${esc(p.party)} +${r.policy.goalScores[i]}`).join(' / ')}</p>`:''}${r.links?.flat().length?`<div class="pair-effects">${combination_view(r.links.flat(),t,loc,esc)}</div>`:''}${tactical_result_view(r,t,loc,esc)}${news_result_view(r,t,loc,esc)}${alliance_growth_view(r,t,loc,esc)}${hidden_result_view(r,t,loc,esc)}${history_view(g,t,loc,esc,true)}</section>`;
}
