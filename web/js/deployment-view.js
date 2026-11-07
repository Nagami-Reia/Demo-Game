import {deployment_preview} from './deployment-preview.js';
import {hidden_preview_view} from './hidden-view.js';
import {agenda_weights} from './agenda-domains.js';
import {firewall_penalty} from './team-effects.js';
import {personal_links} from './personal-links.js';
import {combined_relations,combination_view} from './combination-groups.js';
import {alliance_preview} from './alliances.js';

function deployment_coverage(game,ids){
 const team=game.players[0].owned.filter(c=>ids.has(c.id));
 return Math.round(Object.entries(agenda_weights(game.agenda)).reduce((sum,[domain,weight])=>sum+(team.some(c=>c.domains.includes(domain))?weight:0),0)*100);
}
function deployment_links(game,ids,t,loc,esc){
 const team=game.players[0].owned.filter(c=>ids.has(c.id)),warning=firewall_penalty(game.players[0].party,team);
 const routes=alliance_preview(game,[...ids],0);
 return (warning?`<p class="poll-debuff">${t('firewall')} · −${warning.toFixed(1)}</p>`:'')+combination_view(personal_links(team,game.agenda,combined_relations(game.data,team,routes)).active,t,loc,esc);
}
export function deployment_view(game,ids,t,loc,esc,card,maxDeployment){
 const agenda=game.agenda;
 return `<div class="eyebrow">${t(agenda.procedure)}</div><h2>${esc(loc(agenda.title))}</h2><p>${Object.entries(agenda_weights(agenda)).map(([domain,weight])=>`<span class="domain-chip">${t(domain)} ${Math.round(weight*100)}%</span>`).join(' ')}</p><p>${esc(loc(agenda.summary))}</p><a href="${esc(agenda.source?.startsWith?.('http')?agenda.source:agenda.url)}" target="_blank" rel="noopener">${t('sources')}</a><p class="faction-note">${game.players.map(p=>`<b>${esc(p.party)}</b> · ${esc(loc(game.data.platforms?.[p.party]?.goals))}`).join('<br>')}</p>
 <section class="deployment-preparation">
  <h3>${t('select')} (<span id="deployment-count">${ids.size}</span>/${maxDeployment})</h3>
  <div id="deployment-effects" class="deployment-effects" role="region" tabindex="0" aria-label="${esc(t('alliancePreview'))}">
   <div id="alliance-preview">${deployment_preview(game,ids,t,loc,esc)}</div>
   <div id="pair-preview">${deployment_links(game,ids,t,loc,esc)}</div>
  </div>
  <div class="deployment-roster">
   <div class="cards deployment-grid">${game.players[0].owned.map(c=>card(c,true)).join('')}</div>
   <aside class="deployment-skill-rail" aria-labelledby="deployment-skill-title">
    <h4 id="deployment-skill-title">${t('relationshipSkills')}</h4>
    <div id="deployment-skills" class="deployment-skill-scroll" tabindex="0">${hidden_preview_view(game,ids,0,t,loc,esc)}</div>
   </aside>
  </div>
  <div class="deployment-controls"><p id="deployment-fit">${t('domainCoverage')}: ${deployment_coverage(game,ids)}%</p><button data-action="deploy" ${ids.size?'':'disabled'}>${t('deploy')}</button></div>
 </section>`;
}
// Only the compact readouts change; the roster, its scroll position and focus stay put.
export function refresh_deployment_selection(game,ids,doc,t,loc,esc){
 const counter=doc.querySelector('#deployment-count');if(counter)counter.textContent=ids.size;
 const effects=doc.querySelector('#deployment-effects'),scroll=effects?.scrollTop||0;
 const preview=doc.querySelector('#alliance-preview');if(preview)preview.innerHTML=deployment_preview(game,ids,t,loc,esc);
 const links=doc.querySelector('#pair-preview');if(links)links.innerHTML=deployment_links(game,ids,t,loc,esc);
 const skills=doc.querySelector('#deployment-skills');
 if(skills){
  const skillScroll=skills.scrollTop;
  const expanded=new Set([...skills.querySelectorAll('details[open][data-hidden]')].map(el=>el.dataset.hidden));
  skills.innerHTML=hidden_preview_view(game,ids,0,t,loc,esc,expanded);
  skills.scrollTop=skillScroll;
 }
 if(effects)effects.scrollTop=scroll;
 const fit=doc.querySelector('#deployment-fit');if(fit)fit.textContent=t('domainCoverage')+': '+deployment_coverage(game,ids)+'%';
 const confirm=doc.querySelector('[data-action=deploy]');if(confirm)confirm.disabled=!ids.size;
}
