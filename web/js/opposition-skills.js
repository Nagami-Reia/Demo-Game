import {agenda_weights} from './agenda-domains.js';

const OPP_BARTSCH='mdb_Dietmar_Gerhard_Bartsch';
const OPP_RAMELOW='mdb_Bodo_Ramelow';
const OPP_BANASZAK='mdb_Felix_Banaszak';
const OPP_HOFREITER='mdb_Anton_Hofreiter';
const OPP_STORCH='mdb_Beatrix_Amelie_Ehrengard_Eilika_von_Storch';
const opposition_text=(zh,en,de)=>({zh,en,de});

export const OPPOSITION_SKILLS=[
 {id:'silberlocke',name:'Mission Silberlocke',members:['Gysi',OPP_BARTSCH,OPP_RAMELOW],value:1,
  text:opposition_text('退休是不可能退休的。首次协调失败后，另一位银发成员免费补救一次。','Retirement can wait. After the first failed coordination, another member makes one free attempt.','Ruhestand kann warten. Nach der ersten gescheiterten Koordination versucht es ein anderes Mitglied kostenlos.')},
 {id:'dj_gysi',name:'DJ Gysi',members:['Gysi','Reichinnek'],value:.45,
  text:opposition_text('混音版议会发言。Gysi 首次监督成功后，Reichinnek 下次监督行动力 +0.35，成功另得 0.5 程序分。','Remix the debate. Gysi’s first successful scrutiny gives Reichinnek +0.35 on her next scrutiny and 0.5 procedure points if she succeeds.','Remix der Debatte. Nach Gysis erster erfolgreicher Kontrolle erhält Reichinnek +0,35 für ihre nächste Kontrolle und bei Erfolg 0,5 Verfahrenspunkte.')},
 {id:'all_in',name:'All in',members:['Reichinnek','Pellmann'],value:.45,
  text:opposition_text('最后再来一把。首次监督失败后，另一人可用下一次行动接手，成功另得 0.5 程序分。','One last try. After the first failed scrutiny, the other member may use their next action to retry. Success adds 0.5 procedure points.','Noch ein Versuch. Nach der ersten gescheiterten Kontrolle kann das andere Mitglied seine nächste Aktion einsetzen. Ein Erfolg bringt 0,5 Verfahrenspunkte.')},
 {id:'silberruecken',name:'Silberrücken',members:['Gysi',OPP_BARTSCH],value:.25,
  text:opposition_text('这名字绝对不行。首次协调失败后，下一次协调行动力 +0.25。凑齐三人升级为 Mission Silberlocke。','That name won’t do. After the first failed coordination, the next one gains +0.25. The full trio upgrades to Mission Silberlocke.','Der Name geht gar nicht. Nach der ersten gescheiterten Koordination erhält die nächste +0,25. Zu dritt wird daraus Mission Silberlocke.')},
 {id:'schulklos',name:'Gute Schulklos',members:['Droege','Hasselmann'],value:.45,
  text:opposition_text('厕所也得有人修。公共服务、教育或基建议题首次修正成功，另得 0.5 执行分；首次失败后，下次修正行动力 +0.35。','Someone has to fix the toilets. On services, education or infrastructure, the first successful amendment adds 0.5 implementation points. The first failure gives the next amendment +0.35.','Die Toiletten müssen auch repariert werden. Bei Daseinsvorsorge, Bildung oder Infrastruktur bringt die erste erfolgreiche Änderung 0,5 Umsetzungspunkte. Der erste Fehlschlag gibt der nächsten Änderung +0,35.')},
 {id:'eckkneipe',name:'Unser Küchentisch ist die Eckkneipe',members:['Brantner',OPP_BANASZAK],value:.4,
  text:opposition_text('换个地方继续开会。首次协调失败后，另一人可用下一次行动接手，行动力 +0.35。','Continue the meeting at the pub. After the first failed coordination, the other member may use their next action to take over with +0.35.','Die Sitzung geht in der Kneipe weiter. Nach der ersten gescheiterten Koordination kann das andere Mitglied seine nächste Aktion mit +0,35 einsetzen.')},
 {id:'panzer_toni',name:'Panzer-Toni',members:[OPP_HOFREITER],value:.35,
  text:opposition_text('这次真的不是在讲农业。国防或外交议题首次专业修正可按适配领域行动。','Not talking about agriculture this time. The first amendment on defence or foreign policy gains domain fit.','Diesmal geht es wirklich nicht um Landwirtschaft. Die erste Änderung zur Verteidigungs- oder Außenpolitik erhält Fachpassung.')},
 {id:'geliebter_tino',name:'Geliebter Tino',members:['Weidel','Chrupalla'],value:.35,
  text:opposition_text('亲爱的，你先说。任一人的首次监督失败后，另一人下次监督行动力 +0.35。','Darling, you go first. After either member’s first failed scrutiny, the other’s next scrutiny gains +0.35.','Liebling, du zuerst. Nach der ersten gescheiterten Kontrolle eines Mitglieds erhält die nächste Kontrolle des anderen +0,35.')},
 {id:'ein_herz',name:'Ein Herz und eine Seele',members:['Weidel','Chrupalla'],value:.35,
  text:opposition_text('完全没有分歧。首次协调成功后，两人下一次非协调行动的行动力 +0.25。','No disagreements whatsoever. After the first successful coordination, the pair’s next different action gains +0.25.','Überhaupt keine Differenzen. Nach der ersten erfolgreichen Koordination erhält die nächste andere Aktion des Duos +0,25.')},
 {id:'schnitzel',name:'Niemand geht an mein Schnitzel!',members:['Weidel'],value:.2,
  text:opposition_text('午饭神圣不可侵犯。首次监督失败后，自己的下次监督行动力 +0.25。','Lunch is sacred. After the first failed scrutiny, her next scrutiny gains +0.25.','Das Mittagessen ist heilig. Nach der ersten gescheiterten Kontrolle erhält ihre nächste +0,25.')},
 {id:'mausgerutscht',name:'Mausgerutscht',members:[OPP_STORCH],value:.2,
  text:opposition_text('鼠标打滑。首次监督失败后，可用自己的下一次行动再试，只结算正常成果。','The mouse slipped. After the first failed scrutiny, use her next action to retry for the normal outcome.','Die Maus ist ausgerutscht. Nach der ersten gescheiterten Kontrolle kann sie ihre nächste Aktion für einen normalen neuen Versuch einsetzen.')},
 {id:'funkloch',name:'Funkloch',members:[OPP_STORCH],value:.2,
  text:opposition_text('信号不好。首次协调失败后，部分准备带到下一轮，首次协调行动力 +0.25。','No signal. After the first failed coordination, carry some preparation forward for +0.25 on her first coordination next round.','Kein Empfang. Nach der ersten gescheiterten Koordination bleibt Vorbereitung für +0,25 auf ihre erste Koordination der nächsten Runde.')},
];
const opposition_names=Object.fromEntries(OPPOSITION_SKILLS.map(s=>[s.id,s.name]));
export function opposition_name(id){return opposition_names[id]||id;}
function opposition_defence(agenda){
 const weights=agenda_weights(agenda);
 const title=Object.values(agenda?.title||{}).join(' ');
 return !!weights.foreign || (!!weights.security && /兵役|国防|军队|军费|坦克|Bundeswehr|Wehrdienst|Verteidigung|defen[cs]e|military|conscription/i.test(title));
}
function opposition_public_service(agenda){
 const title=[agenda?.id,...Object.values(agenda?.title||{})].join(' ');
 return /教育|学校|校舍|厕所|泳池|公交|基建|公共服务|医院|Bildung|Schule|Schulklos|Infrastruktur|Daseinsvorsorge|Nahverkehr|Krankenhaus|Schwimmbad|school|education|infrastructure|public[ _]service|public transit|hospital|railway|road[ _]maintenance/i.test(title);
}
export function opposition_active(team,agenda,choice='geliebter_tino'){
 const ids=new Set(team.filter(c=>!c.neutralChair).map(c=>c.id));
 return OPPOSITION_SKILLS.filter(s=>s.members.every(id=>ids.has(id))
  && (s.id!=='silberruecken'||!ids.has(OPP_RAMELOW))
  && (s.id!=='panzer_toni'||opposition_defence(agenda))
  && (s.id!=='schulklos'||opposition_public_service(agenda))
  && (!['geliebter_tino','ein_herz'].includes(s.id)||s.id===choice));
}
export function opposition_preview(game,ids,player){
 if(!game.data.tacticalEffects?.enabled)return [];
 return opposition_active(game.players[player].owned.filter(c=>ids.includes(c.id)),game.agenda);
}
export function opposition_default_duo(agenda,player){
 return player===1&&agenda?.procedure!=='question'?'ein_herz':'geliebter_tino';
}
export function opposition_begin(team,agenda,choice){
 return {active:opposition_active(team,agenda,choice).map(s=>s.id),used:{},bonuses:[],awards:[],free:null,carry:false};
}
function opposition_event(rt,id,details={}){
 rt.events.push({kind:'opposition_skill',skill:id,...details});
}
function opposition_award(rt,id,channel){
 rt.opposition.awards.push({channel,score:.5});
 opposition_event(rt,id,{channel,score:.5});
}
export function opposition_before(rt,slot,out){
 const op=rt.opposition;
 if(!op||out.skip||out.oppositionRetry)return;
 if(slot.stage===0&&out.action==='scrutinize'&&!out.supports&&OPPOSITION_SKILLS.some(skill=>
  ['silberlocke','silberruecken','funkloch'].includes(skill.id)&&op.active.includes(skill.id)&&skill.members.includes(slot.cardId)))out.action='coordinate';
 if(op.active.includes('panzer_toni')&&slot.cardId===OPP_HOFREITER&&!op.used.panzer
  &&(out.action==='amend'||slot.stage===1&&out.action==='scrutinize'&&!out.supports)){
  op.used.panzer=true;out.action='amend';out.minimumMatch=.6;
  opposition_event(rt,'panzer_toni',{actor:slot.cardId});
 }
 for(const b of op.bonuses){
  if(b.used||!b.members.includes(slot.cardId)||(b.action&&out.action!==b.action)||out.action===b.except)continue;
  out.power+=b.power;b.used=true;
  out.oppositionBonuses??=[];out.oppositionBonuses.push(b.id);
  opposition_event(rt,b.id,{actor:slot.cardId,power:b.power});
 }
 const carried=rt.pending.find(p=>p.kind==='opposition_funkloch'&&!p.used);
 if(carried&&out.action==='coordinate'&&slot.cardId===OPP_STORCH){
  carried.used=true;out.power+=.25;opposition_event(rt,'funkloch',{actor:slot.cardId,power:.25});
 }
}
function opposition_offer(rt,row,future,id,actor,power){
 const slot=future.find(s=>s.player===rt.player&&s.cardId===actor&&!s.oppositionFree&&!rt.overrides[`${s.stage}:${s.cardId}`]);
 if(!slot)return false;
 rt.decision={
  id:`${rt.round}:${rt.player}:opposition:${id}`,type:'opposition_retry',
  title:opposition_text(opposition_name(id),opposition_name(id),opposition_name(id)),
  choices:[
   {id:'opp_retry',title:opposition_text('用下一次行动补救','Use next action to retry','Nächste Aktion für neuen Versuch einsetzen')},
   {id:'opp_keep',title:opposition_text('保留原行动','Keep the original action','Ursprüngliche Aktion behalten')}
  ],
  data:{slot,skill:id,action:row.action,supports:row.id,power}
 };
 return true;
}
export function opposition_retry_decision(rt,decision,choice){
 if(choice!=='opp_retry')return;
 const {slot,skill,action,supports,power}=decision.data;
 rt.overrides[`${slot.stage}:${slot.cardId}`]={action,supports,power,oppositionRetry:skill,reason:'opposition_retry'};
 opposition_event(rt,skill,{actor:slot.cardId,source:supports});
}
export function opposition_after(rt,row,future){
 const op=rt.opposition;
 if(!op||row.skipped)return false;
 const success=row.success&&row.powerContribution>0,actor=row.cardId;
 if(row.oppositionRetry==='all_in'&&success)opposition_award(rt,'all_in','procedure');
 if(row.oppositionRetry)return true;
 const enabled=id=>op.active.includes(id)&&OPPOSITION_SKILLS.find(s=>s.id===id).members.includes(actor);
 const first=id=>{if(op.used[id])return false;op.used[id]=true;return true;};
 const members=id=>OPPOSITION_SKILLS.find(s=>s.id===id).members;
 const other=id=>members(id).find(x=>x!==actor);
 const bonus=(id,group,power,action,except)=>op.bonuses.push({id,members:group,power,action,except});
 if(row.action==='scrutinize'){
  if(success&&row.oppositionBonuses?.includes('dj_gysi'))opposition_award(rt,'dj_gysi','procedure');
  if(success&&actor==='Gysi'&&enabled('dj_gysi')&&first('dj_gysi'))bonus('dj_gysi',['Reichinnek'],.35,'scrutinize');
  if(!success){
   if(enabled('geliebter_tino')&&first('geliebter_tino'))bonus('geliebter_tino',[other('geliebter_tino')],.35,'scrutinize');
   if(enabled('schnitzel')&&first('schnitzel'))bonus('schnitzel',[actor],.25,'scrutinize');
   if(enabled('all_in')&&first('all_in')&&opposition_offer(rt,row,future,'all_in',other('all_in'),0))return true;
   if(enabled('mausgerutscht')&&first('mausgerutscht')&&opposition_offer(rt,row,future,'mausgerutscht',actor,0))return true;
  }
 }
 if(row.action==='coordinate'){
  if(success&&enabled('ein_herz')&&first('ein_herz'))bonus('ein_herz',members('ein_herz'),.25,null,'coordinate');
  if(!success){
   if(enabled('silberlocke')&&first('silberlocke')){
    const helper=members('silberlocke').find(x=>x!==actor);
    op.free={player:rt.player,stage:row.stage,cardId:helper,oppositionFree:true,oppositionAction:'coordinate',supports:row.id};
    opposition_event(rt,'silberlocke',{actor:helper,source:row.id});
    return true;
   }
   if(enabled('silberruecken')&&first('silberruecken'))bonus('silberruecken',members('silberruecken'),.25,'coordinate');
   if(enabled('funkloch')&&rt.round<8&&first('funkloch')){
    op.carry=true;opposition_event(rt,'funkloch',{actor});
   }
   if(enabled('eckkneipe')&&first('eckkneipe')&&opposition_offer(rt,row,future,'eckkneipe',other('eckkneipe'),.35))return true;
  }
 }
 if(row.action==='amend'&&enabled('schulklos')){
  if(success&&first('schulklos_success'))opposition_award(rt,'schulklos','execution');
  if(!success&&first('schulklos_failure'))bonus('schulklos',members('schulklos'),.35,'amend');
 }
 return false;
}
