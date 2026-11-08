import {alliance_ring} from './alliance-icon.js';
import {match_round_limit} from './crisis.js';

export function crisis_clue(game,t,esc){
 if(!game.crisis||game.round>=match_round_limit(game))return '';
 const {domain}=game.crisis;
 return `<div class="crisis-clue">
  ${alliance_ring({domains:[domain],count:1},1)}
  <div><span>${t('crisisField')}</span><strong>${esc(t(domain))}</strong></div>
  <b class="crisis-clue-round">${t('round')} ${String(match_round_limit(game)).padStart(2,'0')}</b>
 </div>`;
}

function crisis_goal_details(goal,t,esc){
 return `<small>${goal.domains.map(domain=>esc(t(domain))).join(' / ')} · ${goal.actions.map(action=>esc(t(action))).join(' / ')}${goal.requires?' · '+t('crisisSequential'):''}</small>`;
}

export function crisis_objective_view(crisis,t,loc,esc){
 return `<section class="crisis-objectives"><h3>${t('crisisObjectives')}</h3><ol>${crisis.objectives.map((goal,i)=>
  `<li><span class="crisis-step-number">0${i+1}</span><div><b>${esc(loc(goal.title))}</b> · ${goal.target} ${t('crisisActions')}
   ${crisis_goal_details(goal,t,esc)}</div></li>`).join('')}</ol></section>`;
}

export function crisis_event_strip(crisis,t,loc,esc){
 return `<article class="crisis-event-strip">
  <div class="eyebrow">09 / ${t('crisisEdition')}</div>
  <h2>${esc(loc(crisis.news.title))}</h2>
  <p>${esc(loc(crisis.news.brief))}</p>
  <button data-action="show_news">${t('reopenNews')}</button>
 </article>`;
}

export function crisis_checkpoint_view(game,t,loc,esc){
 const first=game.roundRuntime.crisisCheckpoint,next=game.crisis.objectives[1];
 const count=Math.min(first.target,first.contributions[0]+first.contributions[1]);
 return `<section class="panel crisis-checkpoint" aria-labelledby="crisis-checkpoint-title">
  <div class="eyebrow">09 / ${t('crisisEdition')} · 01 / 02</div>
  <h1 id="crisis-checkpoint-title">${esc(loc(first.title))}</h1>
  <p class="crisis-checkpoint-result">${t(first.complete?'crisisComplete':'crisisIncomplete')} · ${count} / ${first.target}</p>
  <p class="muted">${t('you')} ${first.contributions[0]} · ${t('cpu')} ${first.contributions[1]}</p>
  <div class="crisis-next-step"><span class="crisis-step-number">02</span>
   <div><h2>${esc(loc(next.title))}</h2>${next.requires&&!first.complete?`<p>${t('crisisBlocked')}</p>`:crisis_goal_details(next,t,esc)}</div>
  </div>
  <button data-action="continue_crisis">${t('crisisNext')} →</button>
 </section>`;
}

export function crisis_result_view(result,t,loc,esc){
 if(!result)return '';
 return `<section class="round-verdict crisis-verdict"><div class="eyebrow">${t('crisisVerdict')}</div>
  <p class="outcome">${esc(loc(result.verdict))}</p>
  <ul>${result.objectives.map(goal=>`<li>${esc(loc(goal.title))} · ${Math.min(goal.target,goal.contributions[0]+goal.contributions[1])} / ${goal.target} · ${t(goal.complete?'crisisComplete':'crisisIncomplete')} <small>${t('you')} ${goal.contributions[0]} · ${t('cpu')} ${goal.contributions[1]}</small></li>`).join('')}</ul>
 </section>`;
}
