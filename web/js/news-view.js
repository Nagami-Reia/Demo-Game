import {active_crisis,match_round_limit} from './crisis.js';
import {crisis_clue,crisis_objective_view} from './crisis-view.js';
import {round_recruitment_notice} from './recruitment.js';
const news_effect_units={income:'€',auctionCost:'€',negotiationCost:'€',executionCost:'€',policyEfficiency:'%',negotiationEfficiency:'%',coordinationEfficiency:'%',policyScore:'%',risk:'%',stability:'%',poll:'pp',allianceLayers:'layers',allianceCash:'%',allianceRepeat:'times',conditionalCash:'€',conditionalScore:'points',recruitWeight:'%'};
const news_lower_is_better=new Set(['auctionCost','negotiationCost','executionCost','risk']);
export function news_page(game,t,loc,esc,reopen=false){
 const edition=game.news?.edition;if(!edition)return '';
 const owner=game.players[0],entries=edition.entries,crisis=active_crisis(game);
 const issue=String(game.round).padStart(3,'0'),round=String(game.round).padStart(2,'0');
 const date=new Date(edition.publishedAt||Date.now()).toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric'}).toUpperCase();
 const article=(entry,headline)=>{
  const e=entry.event;
  const category=esc(t('newsCategory_'+e.category));
  const metadata=`${esc(e.region)} · ${t('duration')} ${entry.untilRound-game.round} ${t('round')}`;
  const story=`<h2 class="${headline?'news-headline':''}">${esc(loc(e.title))}</h2>
   <p class="news-deck">${esc(loc(headline?e.body:e.brief))}</p>
   <div class="news-tags">${e.domains.map(d=>`<span>${t(d)}</span>`).join(' · ')}${entry.startedRound<game.round?` · ${t('continuing')}`:''}</div>`;
  return `<article class="${headline?'front-page news-main':'news-brief'}" data-news-id="${esc(e.id)}"><div class="news-dateline"><span>${category}</span><span>${metadata}</span></div>${story}</article>`;
 };
 const analysis=entries.map((entry,index)=>{
  if(crisis&&index===0)return '';
  const effects=(entry.event.effects||[]).filter(e=>!e.target?.parties||e.target.parties.includes(owner.party)).filter(e=>!e.target?.role||e.target.role==='government');
  const rows=effects.map(e=>{
   const unit=news_effect_units[e.kind]||'',percentage=unit==='%',value=e.kind==='allianceRepeat'?(e.value>0?1:0):e.kind==='poll'&&entry.startedRound<game.round?0:e.value*entry.strength*(percentage?100:1)*(e.axis?(1-Math.abs((game.data.platforms?.[owner.party]?.positions?.[e.axis]??e.position)-e.position)):1);
   const shown=Number(value.toFixed(2)),sign=shown>0?'+':'';
   const benefit=news_lower_is_better.has(e.kind)?-shown:shown;
   const tone=benefit>0?'news-buff':benefit<0?'news-debuff':'news-neutral';
   const conditions=[e.domains?.map(d=>t(d)).join('/'),e.target?.states?.join('/'),e.target?.category?t('newsScope_'+e.target.category):'',e.target?.routeWords?t('newsSpecificAlliance'):'',e.axis?t('newsPolicyAlignment'):'',e.condition?t('newsCondition_'+e.condition):''].filter(Boolean).join(' · ');
   return `<li class="${tone}"><span>${t('newsEffect_'+e.kind)}</span> <b>${sign}${shown}${percentage?'%':unit==='€'?'€':unit==='pp'?' '+t('pollPoints'):unit?' '+t(unit):''}</b>${conditions?` <small>${esc(conditions)}</small>`:''}</li>`;
  }).join('');
  return `<section class="news-impact news-event">
   <div class="news-event-rail"><span aria-hidden="true">${String(index+1).padStart(2,'0')}</span><b>${esc(t('newsCategory_'+entry.event.category))}</b></div>
   <div class="news-event-body"><h3 class="news-event-strip">${esc(loc(entry.event.title))}</h3>
    <div class="news-event-copy">${rows?`<ul>${rows}</ul>`:'<span aria-hidden="true">—</span>'}</div>
   </div>
  </section>`;
 }).join('');
 return `<section class="news-page${crisis?' news-crisis-edition':''}"><div class="news-system-header"><div><strong>${round}</strong><span>/ ${crisis?t('crisisEdition'):'NACHRICHTEN'}</span></div><div class="news-header-actions"><span>RUNDE ${round} / ${String(match_round_limit(game)).padStart(2,'0')}</span><div class="actions newspaper-controls"><button data-action="${reopen?'close_news':'ack_news'}">${t(reopen?'backToRound':'readContinue')}</button></div></div></div><div class="newspaper-paper"><div class="newspaper-content"><div class="newspaper-masthead">Das Parlament</div><div class="newspaper-edition-line">BERLIN · AUSGABE ${issue} · ${esc(date)}</div><div class="newspaper-status">${t(edition.startApplied?'newsApplied':'newsExpected')}</div>${round_recruitment_notice(game,t,esc,loc)}${game.round===1?crisis_clue(game,t,esc):''}${crisis?`<div class="crisis-front-page">${article(entries[0],true)}${crisis_objective_view(crisis,t,loc,esc)}</div>`:''}<div class="news-edition">${crisis?'':article(entries[0],true)}<div class="news-briefs"><div class="eyebrow">${t('newsBriefs')}</div>${entries.slice(1).map(e=>article(e,false)).join('')}</div></div><section class="news-analysis"><div class="newspaper-effects-heading"><h2>POLITISCHE AUSWIRKUNGEN</h2><span>${esc(owner.party)} / ${t('newsAnalysis')}</span></div><p class="muted">${t('newsAnalysisNote')}</p><div class="news-impact-grid">${analysis}</div>${edition.startApplied?`<p>${t('newsApplied')}: ${t('cash')} ${edition.start?.[0]?.cash>=0?'+':''}${edition.start?.[0]?.cash||0}€</p>`:''}</section></div></div></section>`;
}
export function news_result_view(result,t,loc,esc){
 if(!result.newsEffects?.some(r=>r.cash||r.score||r.gains.length))return '';
 return `<section class="news-result"><h3>${t('newsSettlement')}</h3>${result.newsEffects.map((r,i)=>`<p>${t(i?'cpu':'you')}: ${t('cash')} ${r.cash>=0?'+':''}${r.cash}€ · ${t('score_news')} ${r.score>=0?'+':''}${r.score}${r.gains.length?' · '+r.gains.map(g=>`${esc(loc(g.name))} +${g.add} ${t('layers')}`).join(' · '):''}</p>`).join('')}</section>`;
}
