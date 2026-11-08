import {match_round_limit} from './crisis.js';
import {round_recruitment_excluded} from './recruitment.js';
// Faction passives are fictional game rules, separate from real party platforms.
import {policy_relation} from './policy.js';
import {can_recruit} from './party-relations.js';
import {is_neutral_chair} from './roles.js';
import {agenda_weights,domain_weight} from './agenda-domains.js';

export const FACTIONS={
 CDU:{color:'#26323c',title:{zh:'组织积累',en:'Organizational capital',de:'Organisationskapital'},text:{zh:'盟约成员协调成功或跨党谈判成功，可积累组织资本（每轮最多 2，上限 8）。达到 2 / 4 / 7 时，依次强化协调、谈判和专业修正。',en:'Successful alliance coordination or cross-party negotiation earns capital (up to 2 per round, 8 total). At 2 / 4 / 7, unlock bonuses to coordination, negotiation and amendments.',de:'Erfolgreiche Koordination von Bündnismitgliedern oder parteiübergreifende Verhandlungen bringen Kapital (bis zu 2 pro Runde, maximal 8). Bei 2 / 4 / 7 werden Koordination, Verhandlungen und Änderungsanträge verstärkt.'}},
 CSU:{color:'#1688be',title:{zh:'地方财政',en:'Regional finances',de:'Regionalfinanzen'},text:{zh:'拨款后现金不超过 €24 时多领 €2；本轮首张普通招募的 CSU 卡返 €1。缓冲结算民调跌幅。可花 €5 指定经济或交通候选，并加强本轮民调缓冲。花 €8 为一名已招募的 CSU 成员训练，下轮起对应行动 +0.65。每轮一名，全局三名。',en:'Gain €2 if cash after the regular budget is at most €24. The first CSU recruit in the regular auction each round refunds €1. Cushion settlement poll losses. Spend €5 to target an economy or transport candidate and strengthen this round’s cushion. Train a recruited CSU member for €8 to add 0.65 to one action type from next round. Once per round, three per match.',de:'Bei höchstens 24 € nach der regulären Auszahlung gibt es 2 € zusätzlich. Für die erste regulär angeworbene CSU-Karte pro Runde gibt es 1 € zurück. Dämpft Umfrageverluste bei der Abrechnung. Für 5 € lässt sich ein Kandidat aus Wirtschaft oder Verkehr suchen und der Verlust stärker dämpfen. Für 8 € erhält ein angeworbenes CSU-Mitglied ab der nächsten Runde +0,65 auf einen Aktionstyp. Einmal pro Runde, dreimal pro Partie.'}},
 SPD:{color:'#dd3c42',title:{zh:'联合政府管理',en:'Coalition management',de:'Koalitionsmanagement'},text:{zh:'混合阵容加强谈判，党内压力低时谈判方案减 €1。使用支持谈判的方案后达成跨党协议，返还最多 €2；频繁达成协议会累积压力，选用坚持立场的谈判方案可消解压力。',en:'Mixed teams negotiate better and save €1 on plans at low internal pressure. Cross-party agreements on a negotiation-friendly plan refund up to €2. Repeated agreements build pressure, which eases when you hold your position or go a round without agreements.',de:'Gemischte Teams verhandeln besser. Bei geringem internem Druck kosten Verhandlungspläne 1 € weniger. Parteiübergreifende Einigungen mit einem Verhandlungsplan erstatten bis zu 2 €. Häufige Einigungen erhöhen den Druck, der bei einer festen Verhandlungsposition oder in Runden ohne Einigung wieder sinkt.'}},
 AfD:{color:'#29a2cf',title:{zh:'争议动员',en:'Controversy surge',de:'Kontroversenmobilisierung'},text:{zh:'前两轮监督较强。争议议题指定一名成员发起争议监督。辩论和争议度越高，正负波动越大；韧性缓冲负面民调。跨党谈判较弱。',en:'Stronger scrutiny in rounds 1–2. One designated member leads scrutiny on a controversial agenda. Oratory and controversy widen both upside and downside. Resilience cushions polling backlash. Cross-party negotiations are weaker.',de:'Stärkere Kontrolle in Runde 1–2. Ein ausgewähltes Mitglied führt bei kontroversen Themen die Kontrolle an. Rhetorik und Kontroverse verstärken positive und negative Ausschläge. Resilienz dämpft negative Umfragefolgen. Parteiübergreifende Verhandlungen sind schwächer.'}},
 'Grüne':{color:'#599248',title:{zh:'气候政策专长',en:'Climate specialization',de:'Klimapolitische Spezialisierung'},text:{zh:'按议题权重强化气候行动，交通和经济有较小加成，能源计入气候领域。气候修正成功可积累最多 3 层势头，偏离气候议题时逐步消退。',en:'Climate actions gain a reliable weighted bonus, with smaller transport and economic bonuses. Energy counts under climate. Successful climate amendments build up to 3 momentum, which fades away from climate agendas.',de:'Aktionen gewinnen nach Themengewicht Stärke für Klima und in geringerem Maß für Verkehr und Wirtschaft. Energie zählt zu Klima. Erfolgreiche Klimaänderungen erzeugen bis zu 3 Schwung, der bei anderen Themen abnimmt.'}},
 Linke:{color:'#ae4481',title:{zh:'基层动员',en:'Grassroots mobilization',de:'Basismobilisierung'},text:{zh:'低阶成员的监督与协调更强，社会政策专家也受益。多名成员行动成功可积累动员，落后时积累更快。两名 T1/T2 成员成功参与时多积累 1 层；已有 3 层且三名 T1/T2 成功参与时，消耗 3 层换取 0.6 成果。',en:'Lower-tier members gain scrutiny and coordination strength, and social-policy experts benefit too. Successful actions by several members build mobilization faster when behind. Two successful T1/T2 members earn an extra stack. Three successful T1/T2 members spend 3 stored stacks for 0.6 outcome points.',de:'Niedrige Kartenstufen stärken Kontrolle und Koordination. Sozialpolitische Fachleute profitieren ebenfalls. Erfolge mehrerer Mitglieder bauen bei Rückstand schneller Mobilisierung auf. Zwei erfolgreiche T1/T2-Mitglieder bringen einen zusätzlichen Punkt. Drei erfolgreiche T1/T2-Mitglieder setzen 3 gespeicherte Punkte für 0,6 Ergebnispunkte ein.'}}
};

// A saved debate already underway completes with its original action formula.
export function faction_legacy_bonus(party,domain,action,card,team){
 switch(party){
  case 'CDU':return (['economy','digital'].includes(domain)?.7:0)+(action==='coordinate'?.2:0);
  case 'CSU':return (domain==='security'?.8:0)+(action==='coordinate'?(card.negotiation??3)*.08:0);
  case 'SPD':return (domain==='social'?.7:0)+(team.filter(c=>c.party===card.party).length>1?.2:0);
  case 'AfD':return action==='scrutinize'?.7+(card.oratory??3)*.08:0;
  case 'Grüne':return (['climate','foreign'].includes(domain)?.7:0)+(action==='amend'?.3:0);
  case 'Linke':return (domain==='social'?.8:0)+(action==='scrutinize'?(card.negotiation??3)*.08:0);
  default:return 0;
 }
}

const faction_clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const faction_meter={CDU:'capital',SPD:'pressure','Grüne':'momentum',Linke:'mobilization'};
export function faction_status(player){
 const key=faction_meter[player.party];
 return key?{key,value:player.faction?.[key]||0,max:{capital:8,pressure:4,momentum:3,mobilization:5}[key]}:null;
}

const faction_mixed=(party,team)=>team.some(c=>c.party===party)&&team.some(c=>c.party!==party&&can_recruit(party,c));
export function faction_negotiation_fee(player,team,fee){
 return player.party==='SPD'&&faction_mixed(player.party,team)&&(player.faction?.pressure||0)<3?Math.max(0,fee-1):fee;
}

function faction_base(player,team,card,agenda,action,stage,round){
 const state=player.faction||{},weights=agenda_weights(agenda);
 switch(player.party){
  case 'CDU':
   if(action==='coordinate'&&state.capital>=2)return state.capital>=7?.80:state.capital>=4?.50:.32;
   if(action==='negotiate'&&state.capital>=4)return state.capital>=7?.65:.32;
   return action==='amend'&&stage===1&&state.capital>=7?.52:0;
  case 'SPD':
   return action==='negotiate'&&faction_mixed(player.party,team)?(state.pressure>=3?.08:.55):0;
  case 'AfD':
   return action==='scrutinize'&&round<=2?.55:action==='negotiate'&&card.party!==player.party?-.35:0;
  case 'Grüne':{
   const climate=weights.climate||0;
   const expertise=card.domains?.includes('climate');
   return climate*(action==='amend'?1.20:.75)+(weights.transport||0)*.45+(weights.economy||0)*.18+
    (action==='amend'&&expertise?climate*.16*(state.momentum||0):0);
  }
  case 'Linke':
   return (['coordinate','scrutinize'].includes(action)&&card.tier<=2?.30:0)+
    (card.domains?.includes('social')?(weights.social||0)*.64:0);
  default:return 0;
 }
}

function faction_controversy_level(game,player,agenda){
 const distance=policy_relation(game.players[player].party,game.players[1-player].party,agenda,game.data?.platforms).distance;
 const baseline=agenda.procedure==='budget'?.58:agenda.procedure==='question'?.46:.34;
 return faction_clamp(agenda.discipline?.controversy??baseline+.45*distance,0,1);
}

export function faction_burst_lead(game,player,team,agenda){
 const owner=game.players[player];
 if(owner.party!=='AfD'||faction_controversy_level(game,player,agenda)<.5)return null;
 const aggressive=owner.score<=game.players[1-player].score;
 const value=c=>(c.oratory??3)*(aggressive?1.2:.25)+(c.resilience??3)*(aggressive?.35:1);
 return team.toSorted((a,b)=>value(b)-value(a)||String(a.id).localeCompare(String(b.id),'en'))[0]||null;
}

export function faction_action(game,player,team,card,agenda,action,stage,integrity,trace,skip,version=2,burstLead){
 if(skip)return {power:0,controversy:null};
 const owner=game.players[player];
 const training=version>=2?faction_training_bonus(owner,card,action,game.round):0;
 const power=(faction_base(owner,team,card,agenda,action,stage,game.round)+training)*integrity;
 if(owner.party!=='AfD'||action!=='scrutinize'||trace.some(row=>row.player===player&&row.controversy))return {power,controversy:null};
 const level=faction_controversy_level(game,player,agenda);
 if(level<.5)return {power,controversy:null};
 const roll=()=>game.random()*2-1;
 const oratory=card.oratory??3,resilience=card.resilience??3;
 if(version===1){
  const swing=roll()*(1+level*2)+(oratory-3)*.18+(resilience-3)*.12;
  const modifier=+(faction_clamp(swing,-3.4,3.4)*integrity).toFixed(2);
  return {power:power+modifier,controversy:{level,modifier}};
 }
 const lead=burstLead===undefined?faction_burst_lead(game,player,team,agenda)?.id:burstLead;
 if(card.id!==lead)return {power,controversy:null};
 const amplitude=(1+level*2)*(.7+.1*oratory);
 const modifier=+(roll()*amplitude*integrity).toFixed(2);
 return {power:power+modifier,controversy:{level,modifier,resilience,amplitude}};
}

// Heuristic expectations only. Evaluating a lineup or a plan never advances the RNG.
export function faction_lineup_value(player,team,agenda,round){
 const action=player.party==='AfD'||player.party==='Linke'?'scrutinize':'amend';
 const strength=team.reduce((sum,c)=>sum+faction_base(player,team,c,agenda,action,1,round),0);
 if(player.party==='CDU'){
  const partners=team.filter(c=>!['CDU','CSU'].includes(c.party)&&can_recruit(player.party,c)).length;
  const capital=player.faction?.capital||0;
  return strength+(capital<8&&team.length>=2?Math.min(2,partners)*.38:0);
 }
 if(player.party==='SPD')return strength+(faction_mixed(player.party,team)?(player.faction?.pressure>=3?.25:1.2):0);
 if(player.party==='Linke'){
  const low=team.filter(c=>c.tier<=2).length;
  return strength+(low>=3?2.5:low>=2?.85:0);
 }
 if(player.party==='CSU')return team.reduce((sum,c)=>sum+CSU_TRAIN_ACTIONS.reduce((best,type)=>Math.max(best,faction_training_bonus(player,c,type,round)),0),0);
 return strength;
}

export function faction_plan_value(player,team,option){
 if(player.party!=='SPD'||!faction_mixed(player.party,team))return 0;
 const negotiation=option.effects?.negotiation||0;
 if((player.faction?.pressure||0)>=3)return negotiation<0?1.25:0;
 return Math.max(0,negotiation)*1.3;
}

export function faction_fund(game){
 game.players.forEach((p,i)=>{
  if(p.party==='CSU'&&p.cash<=24){
   p.cash+=2;
   game.log('faction_csu_budget',{player:i,amount:2});
  }
 });
}

export function faction_recruit_refund(player,card,round,bonus=false){
 return !bonus&&player.party==='CSU'&&card.party==='CSU'&&player.faction?.refundRound!==round?1:0;
}

export const FACTION_INVEST_COST=5;
const faction_regional_domains=['economy','transport'];
export function faction_can_invest(game,player,domain){
 const p=game.players[player],excluded=round_recruitment_excluded(game);
 return game.phase==='UPGRADE'&&p.party==='CSU'&&p.cash>=FACTION_INVEST_COST&&p.faction?.investmentRound!==game.round&&
  faction_regional_domains.includes(domain)&&game.data.roster.some(c=>c.party==='CSU'&&!c.inactive&&!is_neutral_chair(c)&&!excluded.includes(c.id)&&c.tier<=game.level&&c.domains?.includes(domain));
}

export function faction_invest(game,player,domain){
 if(!faction_can_invest(game,player,domain))throw Error('faction_invest_unavailable');
 const p=game.players[player];p.cash-=FACTION_INVEST_COST;
 (p.faction??={}).investmentRound=game.round;
 (game.recruitOffers??=[]).unshift({player,round:game.round,domain,faction:'CSU'});
 game.log('faction_csu_invest',{player,domain,amount:FACTION_INVEST_COST});
}

export function faction_ai_invest(game,player){
 const p=game.players[player];
 if(p.party!=='CSU'||p.cash<(p.owned.length<5?22:17))return;
 const domains=faction_regional_domains.toSorted((a,b)=>p.owned.filter(c=>c.domains?.includes(a)).length-p.owned.filter(c=>c.domains?.includes(b)).length);
 const domain=domains.find(d=>faction_can_invest(game,player,d));
 if(domain)faction_invest(game,player,domain);
}

export const CSU_TRAIN_COST=8;
export const CSU_TRAIN_ACTIONS=['coordinate','amend','negotiate'];
const CSU_TRAIN_BONUS=.65;
const CSU_TRAIN_LIMIT=3;

export function faction_trainable(game,player){
 const p=game.players[player],training=p.faction?.training||[];
 if(game.phase!=='UPGRADE'||game.round>=match_round_limit(game)||p.party!=='CSU'||p.cash<CSU_TRAIN_COST||
    training.length>=CSU_TRAIN_LIMIT||training.some(e=>e.readyRound===game.round+1))return [];
 return p.owned.filter(c=>c.party==='CSU'&&!is_neutral_chair(c)&&!training.some(e=>e.id===c.id));
}

export function faction_train(game,player,id,action){
 const card=faction_trainable(game,player).find(c=>c.id===id);
 if(!card||!CSU_TRAIN_ACTIONS.includes(action))throw Error('faction_training_unavailable');
 const p=game.players[player];p.cash-=CSU_TRAIN_COST;
 ((p.faction??={}).training??=[]).push({id,action,readyRound:game.round+1});
 game.log('faction_csu_train',{player,id,action,name:card.displayName||card.name,amount:CSU_TRAIN_COST});
}

export function faction_training_bonus(player,card,action,round){
 return player.party==='CSU'&&player.faction?.training?.some(e=>e.id===card.id&&e.action===action&&e.readyRound<=round)?CSU_TRAIN_BONUS:0;
}

export function faction_ai_train(game,player){
 const p=game.players[player];
 if(p.cash<(p.owned.length<5?28:21))return;
 const candidates=faction_trainable(game,player);
 const value=c=>Math.max(c.leadership??3,c.expertise??3)+(c.domains?.length||0)*.2;
 const card=candidates.toSorted((a,b)=>value(b)-value(a))[0];
 if(card)faction_train(game,player,card.id,card.leadership>card.expertise?'coordinate':'amend');
}

export function faction_settle(game,player,team,trace,alliances,version=2){
 const p=game.players[player],state=p.faction??={};
 const rows=trace.filter(r=>r.kind==='action'&&r.player===player&&!r.skipped&&!r.oppositionFree);
 const good=rows.filter(r=>r.success),distinct=actions=>new Set(actions.map(r=>r.cardId)).size;
 const plan=player===0?game.negotiation:game.cpuNegotiation;
 const events=[];
 let score=0,poll=0,cash=0;
 const set=(key,value)=>{
  const previous=state[key]||0;
  state[key]=value;
  if(value!==previous)events.push({key,value,delta:value-previous});
 };
 switch(p.party){
  case 'CDU':{
   const allied=new Set(alliances.filter(a=>a.active).flatMap(a=>a.members));
   const builders=good.filter(r=>(r.action==='coordinate'&&allied.has(r.cardId))||(r.action==='negotiate'&&r.party!==p.party));
   if(team.length>=2)set('capital',Math.min(8,(state.capital||0)+Math.min(2,distinct(builders))));
   break;
  }
  case 'SPD':{
   const partners=new Set(team.filter(c=>c.party!==p.party&&can_recruit(p.party,c)).map(c=>c.id));
   const agreements=faction_mixed(p.party,team)?distinct(good.filter(r=>r.action==='negotiate'&&partners.has(r.cardId))):0;
   const pressure=state.pressure||0;
   const negotiation=plan?.resolved?plan.effects?.negotiation||0:0;
   if(agreements&&negotiation>0&&pressure<3)cash=Math.min(2,plan.costPaid||0);
   const pressureChange=negotiation<0?-2:agreements?Math.min(2,agreements):-1;
   set('pressure',faction_clamp(pressure+pressureChange,0,4));
   break;
  }
  case 'AfD':{
   const burst=rows.find(r=>r.controversy);
   if(burst){
    const modifier=burst.controversy.modifier;
    const pollRate=modifier<0&&version>=2?.12-((burst.controversy.resilience??3)-3)*.02:.12;
    if(modifier<0||burst.success)poll=+(modifier*pollRate).toFixed(2);
    events.push({key:modifier<0?'controversy_down':modifier>0?'controversy_up':'controversy_even',value:modifier,poll});
   }
   break;
  }
  case 'Grüne':{
   const climate=(agenda_weights(game.agenda).climate||0)>=.30;
   const advanced=climate&&good.some(r=>r.action==='amend'&&team.find(c=>c.id===r.cardId)?.domains?.includes('climate'));
   set('momentum',faction_clamp((state.momentum||0)+(advanced?1:climate?0:-1),0,3));
   break;
  }
  case 'Linke':{
   const lowIds=new Set(team.filter(c=>c.tier<=2).map(c=>c.id));
   const eligible=good.filter(r=>r.action==='scrutinize'||(version>=2&&r.action==='coordinate'&&lowIds.has(r.cardId))||
    team.some(c=>c.id===r.cardId&&domain_weight(c.domains,game.agenda)>=.25&&c.domains?.includes('social')));
   const participants=distinct(eligible),stored=state.mobilization||0;
   const trailing=p.score<game.players[1-player].score;
   const low=distinct(eligible.filter(r=>lowIds.has(r.cardId)));
   if((version>=2?low:participants)>=3&&stored>=3)score=.6;
   const extra=version>=2&&low>=2?1:0;
   if(extra)events.push({key:'grassroots_low_t',value:extra});
   const gain=participants>=2?(participants>=3?2:1)+(trailing?1:0)+extra:0;
   set('mobilization',faction_clamp(stored+gain-(score?3:0),0,5));
   break;
  }
 }
 if(cash)events.push({key:'compromise_refund',value:cash});
 if(score)events.push({key:'grassroots_reward',value:score});
 p.cash+=cash;
 return {events,score,poll,cash};
}

export function faction_poll_change(player,round,change){
 if(player.party!=='CSU'||change>=0)return change;
 const invested=player.faction?.investmentRound===round;
 return change+Math.min(invested?.75:.45,-change*(invested?.75:.45));
}
