import {tactical_begin,tactical_before,tactical_after_roll,tactical_after_action,tactical_resolve} from './tactical-actions.js';
import {tactical_policy} from './tactical-state.js';
import {tactical_defer_grant,tactical_settle} from './tactical-settlement.js';
import {news_modifier,news_action_effect,news_settle} from './news-effects.js';
import {hidden_begin,hidden_before_action,hidden_after_action,hidden_settle} from './hidden-relations.js';
import {prepare_negotiation,resolve_negotiation,negotiation_action_bonus} from './negotiation-phase.js';
import {MAX_DEPLOYMENT} from './deployment-rules.js';
import {alliance_preview,alliance_action_bonus,alliance_settle} from './alliances.js';
import {combined_relations,link_action_bonus} from './combination-groups.js';
import {settle_scores} from './scoring.js';
import {institution_effect} from './institution-effects.js';
import {agenda_weights,domain_weight,weighted_effect} from './agenda-domains.js';
import {team_cohesion,special_effect,firewall_penalty} from './team-effects.js';
import {policy_relation,policy_outcome} from './policy.js';
import {is_neutral_chair} from './roles.js';
import {personal_links,background_effect} from './personal-links.js';
import {organization_state,office_effect} from './organization.js';
import {relation_effect} from './party-relations.js';
import {settle_public_opinion} from './environment.js';
import {choose_deployment} from './opponent.js';
import {faction_bonus} from './factions.js';
import {leader_profile,resolve_discipline} from './discipline.js';
export function simulate_round(game,ids){
 let frame=game.roundRuntime;
 if(frame?.round===game.round&&frame.finished)throw Error('round_already_settled');
 if(!frame||frame.round!==game.round){
 const cpuIds=choose_deployment(game.players[1].owned,game.agenda,MAX_DEPLOYMENT,game.players[1].party,'opposition',{platforms:game.data.platforms,relations:game.data.policyRelations,allianceGame:game,alliancePlayer:1});
 if(game.data.negotiationScenes?.length&&!game.cpuNegotiation?.resolved){
  game.cpuNegotiation=prepare_negotiation(game,cpuIds,1);
  const options=game.cpuNegotiation.options.filter(o=>o.cost<=game.players[1].cash);
  const option=options.toSorted((a,b)=>{const utility=o=>Object.values(o.effects||{}).reduce((n,v)=>n+(Number(v)||0),0)-o.cost*.06;return utility(b)-utility(a);})[0];
  if(option)resolve_negotiation(game,option.id,1);
 }
 const teams=[game.players[0].owned.filter(c=>ids.includes(c.id)&&!is_neutral_chair(c)),game.players[1].owned.filter(c=>cpuIds.includes(c.id)&&!is_neutral_chair(c))];
 game.cooperation??={};const organizations=organization_state(game,teams);const links=teams.map(team=>personal_links(team,game.agenda,combined_relations(game.data)));
 const deployedIds=teams.map(team=>team.map(c=>c.id)),allianceBefore=deployedIds.map((team,i)=>alliance_preview(game,team,i)),allianceTriggers=new Set(),newsExecutionPaid=[false,false];
 const tactical=deployedIds.map((ids,i)=>tactical_begin(game,i,ids));
 const hiddenRuntime=deployedIds.map((ids,i)=>hidden_begin(game,i,ids,allianceBefore[i]));
 const agenda=game.agenda,domain=agenda.domain,weights=agenda_weights(agenda),power=[0,0],trace=[],attempts=[],event=game.socialEvent||game.pick(game.data.events),world=game.sandbox.world;
 // Public incident pressure is applied once when the world event starts.
 trace.push({kind:'event',event,world:{...world}});
 const slots=[];for(let stage=0;stage<3;stage++)for(let player=0;player<2;player++)for(const card of teams[player])slots.push({stage,player,cardId:card.id});
 frame=game.roundRuntime={round:game.round,ids:[...ids],cursor:0,slots,teams,organizations,links,deployedIds,allianceBefore,allianceTriggers:[...allianceTriggers],newsExecutionPaid,hiddenRuntime,tactical,agenda,domain,weights,power,trace,attempts,event,world,pendingPack:null,finished:false};
 }
 const {teams,organizations,links,deployedIds,allianceBefore,newsExecutionPaid,hiddenRuntime,agenda,domain,weights,power,trace,attempts,event,world}=frame;
 const allianceTriggers=new Set(frame.allianceTriggers);
 for(const rt of hiddenRuntime)if(!(rt.seen instanceof Set))rt.seen=new Set((rt.actions||[]).map(a=>a.id));
 while(frame.cursor<frame.slots.length){
  const slot=frame.slots[frame.cursor],stage=slot.stage,i=slot.player,c=teams[i].find(card=>card.id===slot.cardId),future=frame.slots.slice(frame.cursor+1);
  let pack=frame.pendingPack;
  if(!pack){

  if(stage===1&&!slot.oppositionFree)game.sandbox.event(c,event,`${game.round}:${c.id}:event`);
  let match=domain_weight(c.domains,agenda);const background=background_effect(c,agenda);
  const synergy=.3*teams[i].filter(o=>o.id!==c.id).reduce((sum,o)=>sum+domain_weight(o.domains.filter(d=>c.domains.includes(d)),agenda),0);
  const environment=weighted_effect(agenda,d=>(world[d]||0)*.12),condition=game.sandbox.condition(c)+(c.resilience??3)*.04;
  const profile=leader_profile(c,game.data.leadership||[]);
  const groupRole=links[i].active.some(r=>r.typed&&r.memberIds.includes(c.id)&&['working_group','regional'].includes(r.category));
  const organizationRole=(c.offices||[]).some(o=>['party','fraktion'].includes(o.scope)&&(!o.status||o.status==='verified_current'));
  const action=stage===0&&(organizationRole||groupRole)?'coordinate':stage===1&&match>0?'amend':i===1?'scrutinize':match>0?'amend':c.leadership>=4?'coordinate':'scrutinize';
  const alignment=policy_relation(game.players[i].party,c.party,game.agenda,game.data.platforms,game.data.policyRelations);const relationship=relation_effect(game.players[i].party,c,teams[i],domain,action,game.cooperation[c.id]||0);
  let resolvedAction=stage===0&&(relationship.needsNegotiation||(c.party!==game.players[i].party&&!['sameParty','unionPartner'].includes(relationship.kind)))?'negotiate':action;
  const tactic=tactical_before(game,frame.tactical[i],{...slot,action:resolvedAction,party:c.party},future);resolvedAction=tactic.action;
  if(tactic.focus)match=domain_weight(c.domains,{domain:tactic.focus});match=Math.max(match,tactic.minimumMatch||0);const expertise=.4+1.6*match+match*(c.specialistBonus||0);
  relationship.bonus=weighted_effect(agenda,d=>relation_effect(game.players[i].party,c,teams[i],d,resolvedAction,game.cooperation[c.id]||0).bonus);
  const personal=link_action_bonus(links[i],c.id,resolvedAction,stage);
  const cohesion=team_cohesion(game.players[i].party,teams[i],stage,c),specialEffect=special_effect(c,resolvedAction);
  const skill=resolvedAction==='negotiate'?(c.negotiation??3)*.16:resolvedAction==='amend'?(c.expertise??3)*.16:resolvedAction==='coordinate'?((c.leadership??3)+(c.negotiation??3))*.1:(c.oratory??3)*.16;
  const office=office_effect(c,teams[i],agenda,game);const faction=weighted_effect(agenda,d=>faction_bonus(game.players[i].party,d,resolvedAction,c,teams[i]))*organizations[i].integrity,pollPenalty=game.players[i].pollDebuff||0;
  const institution=institution_effect(c,agenda,office.minister);
  const priority=weighted_effect(agenda,d=>(game.data.platforms?.[game.players[i].party]?.priorities?.[d]||0)*.3);
  const allianceEffect=alliance_action_bonus(game,i,c.id,resolvedAction,agenda,deployedIds[i]);
  const eligible=allianceBefore[i].filter(b=>b.active&&b.members.includes(c.id));
  const legalRelief=eligible.toSorted((a,b)=>(b.negativeEnvironmentReliefByTier?.[b.tier-1]||0)-(a.negativeEnvironmentReliefByTier?.[a.tier-1]||0))[0];
  let allianceTactics=environment<0?Math.min(-environment,legalRelief?.negativeEnvironmentReliefByTier?.[legalRelief.tier-1]||0):0;
  if(allianceTactics)allianceEffect.effects.push({id:legalRelief.id,name:legalRelief.name,layers:legalRelief.layers,power:allianceTactics,reason:'negative_environment_relief'});
  if(resolvedAction==='coordinate')for(const b of eligible)if(b.extraCoordinationPower&&b.count>=b.thresholds.at(-1)&&!allianceTriggers.has(`${i}:${b.id}`)){allianceTactics+=b.extraCoordinationPower;allianceTriggers.add(`${i}:${b.id}`);allianceEffect.effects.push({id:b.id,name:b.name,layers:b.layers,power:b.extraCoordinationPower,reason:'coordination_trigger'});}
  allianceEffect.power+=allianceTactics;
  if(allianceEffect.power>3){const scale=3/allianceEffect.power;allianceEffect.effects.forEach(e=>e.power*=scale);allianceEffect.power=3;}
  const actionId=`${game.round}:${i}:${stage}:${c.id}${slot.oppositionFree?':opposition-free':''}`;
  const hiddenContext={id:actionId,cardId:c.id,action:resolvedAction,stage,domains:c.domains,agenda,crossParty:c.party!==game.players[i].party,cash:game.players[i].cash,organization:game.players[i].organization||0,baseSkill:skill,expertiseMatch:match,baseCashCost:resolvedAction==='negotiate'?agenda.negotiationCost||0:stage===2&&!newsExecutionPaid[i]?Math.max(0,(agenda.executionCost||0)+Math.round(news_modifier(game,i,'executionCost',{agenda,team:teams[i]}).value)):0,isExecution:stage===2};
  const hiddenBefore=hidden_before_action(hiddenRuntime[i],hiddenContext);
  if(stage===2)newsExecutionPaid[i]=true;
  const newsEnvironment=news_action_effect(game,i,c,resolvedAction,agenda,teams[i]);
  if(tactic.reuse||tactic.skip||slot.oppositionFree)hiddenBefore.cashCost=0;
  const basePaid=Math.min(Math.max(0,game.players[i].cash||0),Math.max(0,hiddenBefore.cashCost||0));game.players[i].cash=(game.players[i].cash||0)-basePaid;
  const hidden=skill*((hiddenBefore.skillMultiplier||1)-1);
  const organizationReserve=['coordinate','negotiate'].includes(resolvedAction)?Math.min(1.2,Math.max(0,game.players[i].organization||0)*.04):0;
  const legislativeReserve=resolvedAction==='amend'?Math.min(1.2,Math.max(0,game.players[i].legislativeEfficiency||0)*.05):0;
  const negotiationChoice=negotiation_action_bonus(game,resolvedAction,stage,i);
  const explanation={tactical:tactic.power,hidden,organizationReserve,legislativeReserve,negotiationChoice,alliance:allianceEffect.power,government:institution.government,committee:institution.committee,cohesion,specialEffect,priority,alignment:alignment.bonus,personal,background,minister:office.minister,partyCaucus:office.partyCaucus,cabinet:office.cabinet,relationship:relationship.bonus,pollPenalty:pollPenalty?-pollPenalty:0,resources:c.resources*.13,leadership:c.leadership*.16,expertise,synergy,environment,skill,faction,condition};
  const preNews=Object.values(explanation).reduce((sum,v)=>sum+v,0);explanation.newsEnvironment=preNews*newsEnvironment.rate;explanation.newsFunding=basePaid<(hiddenBefore.cashCost||0)?-.4:0;
  const value=Object.values(explanation).reduce((sum,v)=>sum+v,0),successChance=Math.max(.15,Math.min(.94,.4+value*.045-newsEnvironment.risk));
  const roll=tactic.skip?1:game.random(),success=!tactic.skip&&(!!hiddenBefore.forceSuccess||roll<successChance);
  pack={id:actionId,c,i,stage,profile,relationship,resolvedAction,hiddenContext,basePaid,hiddenBefore,newsEnvironment,allianceEffect,explanation,value,successChance,success,contributionScale:tactic.skip?0:success?1:.35,skipped:tactic.skip,reuse:tactic.reuse,supports:tactic.supports,focus:tactic.focus,replacementReason:tactic.reason||null,oppositionRetry:tactic.oppositionRetry,oppositionBonuses:tactic.oppositionBonuses,action:resolvedAction,cardId:c.id,party:c.party,crossParty:c.party!==game.players[i].party};

  }

  const rt=frame.tactical[i];frame.pendingPack=pack;
  if(tactical_after_roll(game,rt,pack)){
   if(i===1)tactical_resolve(game,rt,rt.decision.choices[0].id,pack);
   else{game.tacticalDecision={...rt.decision,player:i};game.phase='TACTIC_DECISION';return;}
  }
  const {profile,relationship,resolvedAction,hiddenContext,basePaid,hiddenBefore,newsEnvironment,allianceEffect,explanation,value,successChance,success}=pack;
  const scale=pack.skipped?0:pack.contributionScale??(success?1:.35),powerContribution=value*scale;
  power[i]+=powerContribution;
  const hiddenAfter=pack.skipped?{scoreAdd:0,cashCost:0,events:[]}:hidden_after_action(hiddenRuntime[i],{...hiddenContext,cash:game.players[i].cash,success,paidCash:basePaid});
  const successPaid=Math.min(Math.max(0,game.players[i].cash||0),(slot.oppositionFree?0:Math.max(0,hiddenAfter.cashCost||0)));game.players[i].cash=(game.players[i].cash||0)-successPaid;
  if(!pack.skipped&&relationship.kind==='crossBench'&&['negotiate','coordinate'].includes(resolvedAction))game.cooperation[c.id]=Math.max(0,Math.min(1,(game.cooperation[c.id]||0)+(success?.3:-.1)));
  if(!pack.skipped&&!slot.oppositionFree&&profile&&stage===0)attempts.push({player:i,card:c,profile,success});
  const target=teams[i].find(o=>o.id!==c.id)?.id,feedback=pack.skipped?structuredClone(game.sandbox.state(c.id)):game.sandbox.settle(c,success,target,`${game.round}:${stage}:${c.id}${slot.oppositionFree?':opposition-free':''}`,{skipPreparation:pack.reuse||slot.oppositionFree});
  const row={kind:'action',id:pack.id,cardId:c.id,party:c.party,player:i,stage,name:c.name,action:resolvedAction,relationship:relationship.kind,success,successChance,expertiseMatch:hiddenContext.expertiseMatch??domain_weight(c.domains,agenda),value:+value.toFixed(2),rawValue:value,powerContribution,contributionScale:scale,explanation,hiddenScore:hiddenAfter.scoreAdd||0,hiddenEvents:hiddenAfter.events||[],cashPaid:basePaid+successPaid+(pack.extraPaid||0),forcedSuccess:!!hiddenBefore.forceSuccess,newsEffects:newsEnvironment.contributions,allianceEffects:allianceEffect.effects,feedback,skipped:pack.skipped,partialAgreement:!!pack.partialAgreement,supports:pack.supports||null,preparationReused:!!pack.reuse,tacticalFocus:pack.focus||null,replacementReason:pack.replacementReason,...(pack.oppositionRetry?{oppositionRetry:pack.oppositionRetry}:{}),...(pack.oppositionBonuses?{oppositionBonuses:pack.oppositionBonuses}:{}),...(slot.oppositionFree?{oppositionFree:true}:{})};
  trace.push(row);if(success&&pack.replacementReason==='office_takeover'){const original=trace.find(r=>r.id===pack.supports);const attempt=attempts.find(a=>a.player===i&&a.card.id===original?.cardId);if(attempt){attempt.success=true;attempt.recoveredBy=c.id;}}tactical_after_action(game,rt,row,future);if(rt.opposition?.free){frame.slots.splice(frame.cursor+1,0,rt.opposition.free);rt.opposition.free=null;}frame.cursor++;frame.pendingPack=null;frame.allianceTriggers=[...allianceTriggers];
  if(rt.decision){if(i===1)tactical_resolve(game,rt,rt.decision.choices[0].id,null);else{game.tacticalDecision={...rt.decision,player:i};game.phase='TACTIC_DECISION';return;}}
 }

 const discipline=resolve_discipline(game,attempts,teams);
 const effectLedger=[0,1].map(i=>{
  const scale=organizations[i].scale,beforeOrganization=power[i],factorPower={};
  for(const row of trace.filter(r=>r.kind==='action'&&r.player===i)){
   row.organizedContribution=row.powerContribution*scale;
   for(const [key,v]of Object.entries(row.explanation))factorPower[key]=(factorPower[key]||0)+v*(row.contributionScale??(row.success?1:.35))*scale;
  }
  const disciplinePower=discipline.power[i]*scale,unclamped=(beforeOrganization+discipline.power[i])*scale;
  power[i]=Math.max(0,unclamped);
  return {beforeOrganization,scale,factorPower,disciplinePower,clampAdjustment:power[i]-unclamped,finalPower:power[i]};
 });
 trace.push(...discipline.trace);
 const policy=policy_outcome(game,power,trace);
 const scoreBreakdown=settle_scores({power,trace,teams,policy,procedure:game.agenda.procedure,discipline});tactical_policy(game,policy,scoreBreakdown);const scores=scoreBreakdown.map(b=>b.total);
 const allianceSettlements=deployedIds.map((team,i)=>{
  const settlement=alliance_settle(game,i,team,trace);tactical_defer_grant(game,frame.tactical[i],settlement);game.players[i].cash+=settlement.cash||0;game.players[i].income+=settlement.income||0;
  return {before:allianceBefore[i],...settlement};
 });
 const newsResults=news_settle(game,teams,allianceSettlements,trace,scoreBreakdown,policy.passed);
 for(let i=0;i<2;i++){game.players[i].cash=Math.max(0,game.players[i].cash+newsResults[i].cash);if(newsResults[i].score){scoreBreakdown[i].news=newsResults[i].score;scoreBreakdown[i].total=Math.round((scoreBreakdown[i].total+newsResults[i].score)*10)/10;scores[i]=scoreBreakdown[i].total;}}
 const hiddenRelations=deployedIds.map((team,i)=>{
  const settlement=hidden_settle(game,i,team,{...allianceSettlements[i],cash:allianceSettlements[i].cash+newsResults[i].cash+(game.tacticalGrants?.[i]||0)+Math.max(0,game.news?.edition?.start?.[i]?.cash||0)},trace,game.round,hiddenRuntime[i]);
  const p=game.players[i];p.cash=Math.max(0,p.cash+(settlement.cash||0));p.income+=(settlement.income||0);p.organization=Math.max(0,(p.organization||0)+(settlement.organization||0));p.legislativeEfficiency=Math.max(0,(p.legislativeEfficiency||0)+(settlement.legislativeEfficiency||0));
  if(settlement.score){scoreBreakdown[i].hidden=settlement.score;scoreBreakdown[i].total=Math.round((scoreBreakdown[i].total+settlement.score)*10)/10;scores[i]=scoreBreakdown[i].total;}
  return settlement;
 });
 const tacticalResults=frame.tactical.map((rt,i)=>{const settled=tactical_settle(game,rt,trace,policy.passed);game.players[i].cash+=settled.cash;if(settled.score){const awards=settled.oppositionAwards||[];for(const a of awards)scoreBreakdown[i][a.channel]+=a.score;const tacticalOther=settled.score-awards.reduce((sum,a)=>sum+a.score,0);if(tacticalOther)scoreBreakdown[i].tactics=tacticalOther;scoreBreakdown[i].total=Math.round((scoreBreakdown[i].total+settled.score)*10)/10;scores[i]=scoreBreakdown[i].total;}return settled;});
 for(let i=0;i<2;i++)allianceSettlements[i].after=alliance_preview(game,deployedIds[i],i);
 game.players.forEach((p,i)=>p.score=Math.round((p.score+scores[i])*10)/10);const firewall=teams.map((team,i)=>firewall_penalty(game.players[i].party,team));settle_public_opinion(game,scores,firewall);for(let i=0;i<2;i++)if(firewall[i])game.log('firewall',{player:i,amount:firewall[i]});
 game.result={scoringVersion:game.data.hiddenRelations?.length?'hidden-relations-v2':'linked-effects-v1',scoreBreakdown,effectLedger,pollShares:structuredClone(game.polls.shares),domainWeights:weights,firewall,trace,power:power.map(x=>+x.toFixed(2)),scores,passed:power[0]>=power[1],procedure:game.agenda.procedure,teams,polls:structuredClone(game.polls.changes),discipline,organizations,policy,links:links.map(l=>l.active)};
 game.result.tactics=tacticalResults;game.result.news=structuredClone(game.news?.edition||null);game.result.newsEffects=newsResults;game.result.alliances=allianceSettlements;game.result.hiddenRelations=hiddenRelations;game.result.negotiation=structuredClone(game.negotiation||null);game.result.cpuNegotiation=structuredClone(game.cpuNegotiation||null);
 game.history.push({round:game.round,agenda:game.agenda,result:structuredClone(game.result)});game.phase='RESULT';frame.finished=true;game.tacticalDecision=null;
}
