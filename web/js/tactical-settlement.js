import {match_round_limit} from './crisis.js';
import {tactical_enabled,tactical_store,tactical_pending,tactical_grown} from './tactical-state.js';
import {agenda_weights} from './agenda-domains.js';
export function tactical_defer_grant(game,rt,settlement){
 if(!rt.enabled||game.round>=match_round_limit(game)||!rt.abilities.finance||rt.plan.finance!=='delay'||rt.once.grantDeferred)return;
 const payout=(settlement.payouts||[]).find(p=>p.id===rt.abilities.finance.id&&p.cash>0);if(!payout)return;
 const amount=payout.cash,domain=tactical_grown(rt.abilities.finance)?rt.plan.grantDomain:Object.entries(agenda_weights(game.agenda)).sort((a,b)=>b[1]-a[1])[0]?.[0]||'economy';
 payout.deferredCash=amount;payout.cash=0;settlement.cash-=amount;settlement.deferredCash=amount;rt.once.grantDeferred=true;
 tactical_pending(game,rt.player,'grant',{amount,domain});
 const saved=game.players[rt.player].alliances?.settlements?.[game.round];if(saved){saved.cash=settlement.cash;saved.deferredCash=amount;saved.payouts=structuredClone(settlement.payouts);}
 rt.events.push({kind:'grant_deferred',amount,domain});
}
export function tactical_settle(game,rt,trace,passed){
 const empty={cash:0,score:0,events:[],pending:[]};if(!rt.enabled)return empty;
 const store=tactical_store(game,rt.player);if(store.settlements[game.round])return empty;
 const result={cash:0,score:0,events:[...rt.events],pending:[],oppositionAwards:rt.opposition?.awards||[]},actions=trace.filter(r=>r.kind==='action'&&r.player===rt.player&&r.success&&r.powerContribution>0&&!r.skipped),award=(kind,cash=0,score=0,data={})=>{result.cash+=cash;result.score+=score;result.events.push({kind,cash,score,...data});};
 const finish=p=>{store.receipts[p.id]={round:game.round,completed:true};store.pending=store.pending.filter(x=>x.id!==p.id);};
 for(const pending of rt.pending){
  if(pending.kind==='law_retained'&&pending.used)finish(pending);
  if(pending.kind==='project'&&actions.some(r=>rt.team.find(c=>c.id===r.cardId)?.domains?.includes(pending.domain)&&r.action==='amend')){award('project_completed',2,1,{source:pending.id,domain:pending.domain});finish(pending);}
  if(pending.kind==='local_project'&&actions.some(r=>r.action==='amend')&&rt.abilities.local?.name.de===pending.state){award('federal_connection',2,1,{source:pending.id});finish(pending);}
  if(pending.kind==='law_money'&&rt.lawMoneyDone){award('law_then_finance',0,5,{source:pending.id});finish(pending);rt.once.lawMoneyAwarded=true;}
  if(pending.kind==='bundle'){const parts=new Set([...pending.parts,...rt.bundleParts]);if(parts.has('labor')&&parts.has('finance')){award('bundled_proposal_completed',0,5,{source:pending.id});finish(pending);rt.once.bundleAwarded=true;}}
  if(['foreign_bridge','cosign_text'].includes(pending.kind)&&pending.used)finish(pending);
 }
 for(const a of result.oppositionAwards)result.score+=a.score;
 const retained=rt.pending.find(p=>p.kind==='opposition_funkloch'&&p.used);if(retained)finish(retained);
 if(rt.opposition?.carry&&game.round<match_round_limit(game))tactical_pending(game,rt.player,'opposition_funkloch',{});
 if(rt.hidden.includes('law_money')&&!rt.once.lawMoneyAwarded){if(rt.lawMoneyDone)award('law_then_finance',0,5);else if(rt.lawApproved&&game.round<match_round_limit(game))tactical_pending(game,rt.player,'law_money',{approved:rt.lawApproved.id});}
 if(rt.hidden.includes('two_chairs')&&!rt.once.bundleAwarded){if(rt.bundleParts.includes('labor')&&rt.bundleParts.includes('finance'))award('bundled_proposal_completed',0,5);else if(rt.bundleParts.length&&game.round<match_round_limit(game))tactical_pending(game,rt.player,'bundle',{parts:rt.bundleParts});}
 if(rt.once.retainLaw&&game.round<match_round_limit(game))tactical_pending(game,rt.player,'law_retained',rt.once.retainLaw);
 if(rt.once.foreignBridge&&game.round<match_round_limit(game))tactical_pending(game,rt.player,'foreign_bridge',{});
 if(rt.plan.cosign&&rt.cosign.length>=2){award('common_signature',0,1);if(tactical_grown(rt.abilities.labor)&&game.round<match_round_limit(game))tactical_pending(game,rt.player,'cosign_text',{parties:rt.cosign.slice(0,2)});}
 if(rt.abilities.energy&&passed&&rt.player===0&&(agenda_weights(game.agenda).economy||0)>0&&actions.some(r=>r.action==='amend')&&game.round<match_round_limit(game)){
  const choices=['digital','social','climate'],domain=tactical_grown(rt.abilities.energy)&&choices.includes(rt.plan.projectDomain)?rt.plan.projectDomain:choices[(game.initialSeed+game.round)%choices.length];
  tactical_pending(game,rt.player,'project',{domain,producer:rt.abilities.energy.members[0],csu:rt.team.some(c=>rt.abilities.energy.members.includes(c.id)&&c.party==='CSU')});
 }
 if(rt.plan.local&&rt.abilities.local&&passed&&rt.player===0){award('local_package',2,0);if(tactical_grown(rt.abilities.local)&&game.round<match_round_limit(game))tactical_pending(game,rt.player,'local_project',{state:rt.abilities.local.name.de,producer:rt.abilities.local.members[0],csu:rt.team.some(c=>rt.abilities.local.members.includes(c.id)&&c.party==='CSU')});}
 // A file can be entrusted once when the original office leaves the lineup.
 const current=new Set(rt.team.map(c=>c.id)),oldTeam=store.lastTeam||[];
 if(oldTeam.includes('Dobrindt')&&oldTeam.includes('mdb_Alexander_Hoffmann'))for(const p of store.pending){
  if(!p.csu||p.handoverUsed||!['Dobrindt','mdb_Alexander_Hoffmann'].includes(p.producer)||current.has(p.producer))continue;
  const other=p.producer==='Dobrindt'?'mdb_Alexander_Hoffmann':'Dobrindt';if(current.has(other)){p.custodian=other;p.handoverUsed=true;p.expires+=1;const pending=rt.pending.find(x=>x.id===p.id);if(pending)pending.expires=p.expires;result.events.push({kind:'handover',source:p.id,actor:other});}
 }
 for(const p of rt.pending)if(p.expires===game.round&&!store.receipts[p.id]&&p.kind!=='disagreement')store.pending=store.pending.filter(x=>x.id!==p.id);
 store.lastTeam=rt.team.map(c=>c.id);result.pending=structuredClone(store.pending);store.settlements[game.round]=structuredClone(result);return result;
}
