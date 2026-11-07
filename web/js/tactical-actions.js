import {tactical_enabled,tactical_store,tactical_team,tactical_abilities,tactical_grown,tactical_pending} from './tactical-state.js';
import {hidden_preview} from './hidden-relations.js';
import {opposition_begin,opposition_default_duo,opposition_before,opposition_after,opposition_retry_decision} from './opposition-skills.js';
const tactical_label=zh=>({zh,en:zh,de:zh});
const tactical_slot=s=>`${s.stage}:${s.cardId}`;
export function tactical_begin(game,player,ids){
 const enabled=tactical_enabled(game),store=enabled?tactical_store(game,player):{pending:[]};
 const team=tactical_team(game,player,ids);
 return {enabled,player,round:game.round,team,opposition:enabled?opposition_begin(team,game.agenda,game.tacticalPlans?.[player]?.weidelChrupalla??opposition_default_duo(game.agenda,player)):null,abilities:tactical_abilities(game,player,ids),hidden:enabled?hidden_preview(game,player,ids).filter(r=>r.active).map(r=>r.id):[],plan:game.tacticalPlans?.[player]||{},once:{},overrides:{},events:[],decision:null,reuse:null,ping:null,cosign:[],projectSuccess:false,lawApproved:null,lawMoneyDone:false,bundleParts:[],pending:store.pending.filter(p=>p.due<=game.round&&p.expires>=game.round).map(p=>({...p}))};
}
function tactical_event(rt,kind,data={}){rt.events.push({id:`${rt.round}:${rt.player}:${rt.events.length}`,kind,...data});}
function tactical_helper(rt,future,ability,source,nextStage=false,exactId=null){
 const eligible=exactId?[exactId]:rt.abilities[ability]?.members||[];
 return future.find(s=>s.player===rt.player&&s.cardId!==source.cardId&&eligible.includes(s.cardId)&&(!nextStage||s.stage>source.stage)&&!rt.overrides[tactical_slot(s)]);
}
function tactical_rescue(rt,slot,row,kind){if(!slot)return false;rt.overrides[tactical_slot(slot)]={action:row.action,supports:row.id,reason:kind,power:kind==='foreign_door'?.25:0};tactical_event(rt,kind,{source:row.id,actor:slot.cardId,stage:slot.stage});return true;}
function tactical_decision(rt,type,title,choices,data={}){rt.decision={id:`${rt.round}:${rt.player}:${rt.events.length}:${type}`,type,title:tactical_label(title),choices:choices.map(c=>({...c,title:tactical_label(c.title)})),data};return true;}
export function tactical_before(game,rt,slot,future){
 const out={action:slot.action,power:0,skip:false,reuse:false,supports:null,focus:null};if(!rt.enabled)return out;
 if(slot.oppositionFree)return {...out,action:slot.oppositionAction,supports:slot.supports,oppositionRetry:'silberlocke',reason:'opposition_retry'};
 const override=rt.overrides[tactical_slot(slot)];if(override){Object.assign(out,{...override,power:override.power||0});delete rt.overrides[tactical_slot(slot)];}
 const law=rt.pending.find(p=>p.kind==='law_retained'&&!p.used);if(law&&slot.stage===0&&rt.abilities.law?.members.includes(slot.cardId)&&slot.cardId!==law.originalActor){out.action='amend';out.supports=law.actionId;out.power+=.2;law.used=true;tactical_event(rt,'law_carried_attempt',{actor:slot.cardId,source:law.id});}
 if(rt.hidden.includes('digital_agenda')&&!rt.once.digitalConversion&&out.action==='coordinate'&&slot.cardId==='mdb_Armand_Zorn'){out.action='amend';rt.once.digitalConversion=true;tactical_event(rt,'digital_conversion',{actor:slot.cardId});}
 if(rt.hidden.includes('boss_right')&&['Merz','Linnemann'].includes(slot.cardId))out.focus=rt.plan.focus;
 if(rt.plan.scope<1&&rt.player===0&&['amend','coordinate'].includes(out.action))out.power+=.25;
 if(rt.reuse&&rt.reuse.actor===slot.cardId&&rt.reuse.action===out.action){out.reuse=true;rt.reuse=null;tactical_event(rt,'digital_reuse',{actor:slot.cardId});}
 const coText=rt.pending.find(p=>p.kind==='cosign_text'&&!p.used);if(coText&&out.action==='negotiate'&&coText.parties.includes(slot.party)&&coText.parties.every(p=>rt.team.some(c=>c.party===p))){out.power+=.25;coText.used=true;tactical_event(rt,'cosign_reuse',{actor:slot.cardId});}
 if(rt.hidden.includes('ping_pong')&&['Linnemann','mdb_Karl_Wilhelm_Lauterbach'].includes(slot.cardId)&&['amend','scrutinize'].includes(out.action)&&/卫生|医疗|医院|健康|Gesund|Kranken|health|hospital/i.test(JSON.stringify(game.agenda))&&rt.ping?.success&&rt.ping.cardId!==slot.cardId&&rt.ping.action!==out.action){out.power+=.25;out.supports=rt.ping.id;}
 if(rt.abilities.interior&&rt.plan.emergency!=='none'&&rt.plan.emergency&&!rt.once.emergency&&out.action==='scrutinize'){
  const protection=rt.plan.emergency,kind=protection==='cash'?'income':protection==='coordination'?'coordinationEfficiency':'policyEfficiency';
  const entry=game.news?.edition?.entries.find(e=>e.event.category==='unexpected'&&e.event.effects?.some(x=>x.kind===kind&&x.value<0));
  if(entry){out.skip=true;rt.once.emergency=true;game.tacticalRound??={};game.tacticalRound[rt.player]??={};game.tacticalRound[rt.player].protectedEffect={round:game.round,eventId:entry.event.id,kind};
   if(kind==='income'){const start=game.news.edition.start?.[rt.player],source=(start?.events||[]).find(e=>e.eventId===entry.event.id&&e.kind==='income'&&e.value<0);const amount=source?Math.min(Math.ceil(-source.value),Math.max(0,-(start.cash||0))):0;game.players[rt.player].cash+=amount;tactical_event(rt,'emergency_cash',{amount,source:entry.event.id});}
   tactical_event(rt,'emergency_action_sacrificed',{actor:slot.cardId,source:entry.event.id,protection});
  }
 }
 opposition_before(rt,slot,out);
 return out;
}
export function tactical_after_roll(game,rt,pack){
 if(!rt.enabled||pack.tacticalChecked)return false;pack.tacticalChecked=true;
 if(pack.success&&pack.action==='negotiate'&&rt.hidden.includes('principle_agreed')&&!rt.once.signature){
  const choices=[];if(game.players[rt.player].cash>=2)choices.push({id:'pay',title:'立即支付2资金，履行协议'});if(game.round<8)choices.push({id:'delay',title:'延期到下一轮，届时先履约'});if(!choices.length)choices.push({id:'withdraw',title:'无法履行，撤回本次协议'});
  return tactical_decision(rt,'signature','最后的签名：签字前的小字',choices,{actionId:pack.id});
 }
 if(!pack.success&&pack.action==='negotiate'&&pack.crossParty){
  if(rt.hidden.includes('both_lawyers')&&!rt.once.exchange)return tactical_decision(rt,'exchange','异议，部分成立。',[{id:'accept',title:'让出20%政策范围，交换较小共同文本'},{id:'decline',title:'保留本党目标，接受本次谈判失败'}],{actionId:pack.id});
  if(rt.hidden.includes('groups_first')&&!rt.once.disagreement&&!rt.pending.some(p=>p.kind==='disagreement')&&!rt.plan.handledDisagreement&&game.round<8)return tactical_decision(rt,'disagreement','请党团先协调：带回去谈',[{id:'defer',title:'暂缓分歧，下轮必须处理'},{id:'decline',title:'现在接受谈判失败'}],{actionId:pack.id,party:pack.party});
 }
 return false;
}
export function tactical_after_action(game,rt,row,future){
 if(!rt.enabled)return;const a=rt.abilities;
 if(row.skipped||opposition_after(rt,row,future))return;
 if(rt.hidden.includes('ping_pong')&&['Linnemann','mdb_Karl_Wilhelm_Lauterbach'].includes(row.cardId)&&['amend','scrutinize'].includes(row.action))rt.ping=row.success?{id:row.id,cardId:row.cardId,action:row.action,success:true}:null;
 if(row.success&&row.powerContribution>0){
  if(rt.plan.cosign&&!rt.cosign.includes(row.party))rt.cosign.push(row.party);
  if(rt.hidden.includes('law_money')){if(row.cardId==='mdb_Gunter_Krings'&&row.action==='amend')rt.lawApproved={id:row.id};if(row.cardId==='mdb_Mathias_Middelberg'&&rt.lawApproved&&['coordinate','amend','negotiate'].includes(row.action))rt.lawMoneyDone=true;}
  if(rt.pending.some(p=>p.kind==='law_money')&&row.cardId==='mdb_Mathias_Middelberg'&&['coordinate','amend','negotiate'].includes(row.action))rt.lawMoneyDone=true;
  if(rt.hidden.includes('two_chairs')||rt.pending.some(p=>p.kind==='bundle')){if(row.cardId==='Bas'&&row.action==='amend'&&!rt.bundleParts.includes('labor'))rt.bundleParts.push('labor');if(row.cardId==='Klingbeil'&&['coordinate','amend'].includes(row.action)&&!rt.bundleParts.includes('finance'))rt.bundleParts.push('finance');}
  if(a.digital?.members.includes(row.cardId)&&row.action==='amend'&&!rt.once.reuseCreated){rt.once.reuseCreated=true;rt.reuse={actor:row.cardId,action:row.action};if(tactical_grown(a.digital)){const targets=rt.team.filter(c=>a.digital.members.includes(c.id)&&future.some(s=>s.player===rt.player&&s.cardId===c.id));if(targets.length>1)tactical_decision(rt,'reuse_transfer','流程复用：谁来接着做？',targets.map(c=>({id:c.id,title:c.name})),{});}}
  if(a.foreign?.members.includes(row.cardId)&&row.action==='negotiate'&&row.crossParty&&tactical_grown(a.foreign))rt.once.foreignBridge=true;
  return;
 }
 if(row.action==='amend'&&row.supports&&a.law?.members.includes(row.cardId)&&tactical_grown(a.law)&&!rt.pending.some(p=>p.kind==='law_retained'))rt.once.retainLaw={actionId:row.id,originalActor:row.cardId};
 if(row.action==='amend'&&a.law?.members.includes(row.cardId)&&!rt.once.law){rt.once.law=true;const helper=tactical_helper(rt,future,'law',row,true);if(!tactical_rescue(rt,helper,row,'law_rescue')&&tactical_grown(a.law))rt.once.retainLaw={actionId:row.id,originalActor:row.cardId};}
 if(row.action==='coordinate'&&row.cardId==='Merz'&&rt.hidden.includes('right_hand')&&!rt.once.office){rt.once.office=true;const slot=tactical_helper(rt,future,null,row,false,'Frei');if(slot)tactical_decision(rt,'office_takeover','总理的右手：办公室接管',[{id:'takeover',title:'Frei接管协调，占用下一次行动'},{id:'keep',title:'保留Frei自己的专业行动'}],{slot,row:{id:row.id,cardId:row.cardId,action:row.action}});}
 if(a.foreign?.members.includes(row.cardId)&&row.action==='negotiate'&&row.crossParty&&!rt.once.foreignDoor){rt.once.foreignDoor=true;tactical_rescue(rt,tactical_helper(rt,future,'foreign',row),row,'foreign_door');}
 if(a.health?.members.includes(row.cardId)&&!rt.once.health){const helper=tactical_helper(rt,future,'health',row);if(helper){rt.once.health=true;if(tactical_grown(a.health))tactical_decision(rt,'health','会诊：接手还是保留自己的行动？',[{id:'rescue',title:'接手补救，占用接手者下一次行动'},{id:'keep',title:'保留行动，用于自己的专业修正'}],{slot:helper,row:{id:row.id,cardId:row.cardId,action:row.action}});else tactical_rescue(rt,helper,row,'health_rescue');}}
}
export function tactical_resolve(game,rt,choiceId,pack){
 const d=rt.decision;if(!d||!d.choices.some(c=>c.id===choiceId))throw Error('invalid_tactical_choice');
 if(d.data.actionId&&pack?.id!==d.data.actionId)throw Error('invalid_tactical_choice');
 if(d.type==='signature'){
  if(choiceId==='pay'){if(game.players[rt.player].cash<2)throw Error('negotiation_unaffordable');game.players[rt.player].cash-=2;pack.extraPaid=(pack.extraPaid||0)+2;game.log('tactical_payment',{player:rt.player,amount:2});}
  else if(choiceId==='delay')tactical_pending(game,rt.player,'signature_debt',{amount:2});else{pack.success=false;pack.contributionScale=.35;}
  rt.once.signature=true;
 }
 if(d.type==='exchange'){rt.once.exchange=true;if(choiceId==='accept'){pack.success=true;pack.partialAgreement=true;pack.contributionScale=.65;rt.plan.scope=Math.min(rt.plan.scope||1,.8);game.tacticalPlans[rt.player].scope=rt.plan.scope;}}
 if(d.type==='disagreement'){rt.once.disagreement=true;if(choiceId==='defer'){pack.success=true;pack.partialAgreement=true;pack.contributionScale=.55;tactical_pending(game,rt.player,'disagreement',{party:d.data.party});}}
 if(d.type==='office_takeover'&&choiceId==='takeover')tactical_rescue(rt,d.data.slot,d.data.row,'office_takeover');
 if(d.type==='health'&&choiceId==='rescue')tactical_rescue(rt,d.data.slot,d.data.row,'health_rescue');
 if(d.type==='opposition_retry')opposition_retry_decision(rt,d,choiceId);
 if(d.type==='reuse_transfer'&&rt.reuse){rt.reuse.actor=choiceId;tactical_event(rt,'reuse_transferred',{actor:choiceId});}
 tactical_event(rt,'decision',{type:d.type,choice:choiceId,actionId:d.data.actionId||null});rt.decision=null;
}
