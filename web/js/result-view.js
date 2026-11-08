import {match_round_limit} from './crisis.js';
import {crisis_result_view} from './crisis-view.js';
import {tactical_result_view} from './tactical-view.js';
import {news_result_view} from './news-view.js';
import {hidden_result_view} from './hidden-view.js';
import {combination_view} from './combination-groups.js';
import {alliance_growth_view} from './deployment-preview.js';
import {FACTIONS} from './factions.js';
import {finale_view} from './finale-view.js';
import {history_view,round_verdict_key,round_score_view} from './replay-view.js';
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
 const r=g.result,final=g.phase==='END'||(!g.crisis&&g.round>=match_round_limit(g));
 if(final)return finale_view(g,t,loc,esc);
 const verdict=round_verdict_key(r);
 return `<section class="result-page panel"><div class="eyebrow">${t('phase_RESULT')} · ${t('round')} ${g.round}/${match_round_limit(g)}</div><h1>${esc(loc(g.agenda.title))}</h1>
 ${crisis_result_view(r.crisis,t,loc,esc)}<div class="round-verdict ${['questionBad','blocked'].includes(verdict)?'round-verdict-blocked':''}"><div class="eyebrow">${t('procedureVerdict')}</div><p class="outcome">${t(verdict)}</p><p class="round-verdict-power"><span>${t('power')} · ${t('you')} / ${t('cpu')}</span><b>${r.power?.map(value=>Number(value).toFixed(2)).join(' / ')||'—'}</b></p></div>
 <div class="scoreboard">${g.players.map((p,i)=>`<section style="--party:${FACTIONS[p.party]?.color||'var(--accent)'}"><div class="eyebrow">${t(i?'cpu':'you')} · ${esc(p.party)}</div><div class="metrics"><span class="policy-score-metric">${t('cumulativeRoundScore')}${policy_score_ring(p.score,r.scores[i],t('cumulativeRoundScore'),esc)}</span><span class="round-gain">${t('roundTotalScore')}<b>${r.scores[i]>=0?'+':''}${r.scores[i].toFixed(1)}</b></span><span>${t('remainingRoundCash')}<b>€${p.cash}</b></span></div></section>`).join('')}</div><div class="actions"><button data-action="continue">${t(r.crisis?'ending':'next')}</button><button data-action="export">${t('export')}</button>${g.news?.edition?`<button data-action="show_news">${t('reopenNews')}</button>`:''}</div>${r.firewall?.some(v=>v>0)?`<p class="poll-debuff">${t('firewall')}: ${r.firewall.map((v,i)=>v?`${t(i?'cpu':'you')} −${v.toFixed(1)}`:'').filter(Boolean).join(' / ')}</p>`:''}${r.scoreBreakdown?`<h2>${t('roundBreakdown')}</h2>${round_score_view(r,t,g.players.map(p=>esc(p.party)))}`:''}<h2>${t('select')}</h2><div class="result-teams">${r.teams.map((team,i)=>`<section><h3>${t(i?'cpu':'you')}</h3>${team.map(c=>`<p>${esc(c.displayName||c.name)} · ${esc(c.party)} · T${c.tier}</p>`).join('')}</section>`).join('')}</div>${r.organizations?`<h2>${t('organization')}</h2>${r.organizations.map(o=>`<p>${t(o.player?'cpu':'you')} · ${Math.round(o.integrity*100)}% · ${t('commandBonus')} +${Math.round(o.command*100)}%${o.captured.length?` · ${t('leaderContested')}: ${o.captured.map(c=>esc(c.name)).join(', ')}`:''}</p>`).join('')}`:''}${r.links?.flat().length?`<div class="pair-effects">${combination_view(r.links.flat(),t,loc,esc)}</div>`:''}${tactical_result_view(r,t,loc,esc)}${news_result_view(r,t,loc,esc)}${alliance_growth_view(r,t,loc,esc)}${hidden_result_view(r,t,loc,esc)}${history_view(g,t,loc,esc,true)}</section>`;
}
