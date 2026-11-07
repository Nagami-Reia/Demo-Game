import {domain_weight} from './agenda-domains.js';
import {is_neutral_chair} from './roles.js';
// Delegated support is bounded, issue-specific game influence, NEVER ownership of MPs.
export function caucus_key(party){return ['CDU','CSU'].includes(party)?'Union':party;}
export function leader_profile(card,profiles=[]){if(is_neutral_chair(card))return null;if(Array.isArray(card.offices))return card.mandate||card.offices.filter(o=>['fraktion','party','executive','committee'].includes(o.scope)).sort((a,b)=>b.influence-a.influence)[0]||null;return card.mandate||profiles.filter(p=>p.id===card.id&&p.as_of<='2025-07-01').sort((a,b)=>b.influence-a.influence)[0]||null;}
export function resolve_discipline(game,attempts,teams){
 game.discipline??={groups:{},agreements:{},processed:[]};const state=game.discipline;
 const effects={power:[0,0],extra:[0,0],trace:[]};
 const unique=new Map();
 for(const a of attempts){if(is_neutral_chair(a.card))continue;const group=caucus_key(a.card.party),key=`${a.player}:${group}`,previous=unique.get(key);if(!previous||a.profile.influence>previous.profile.influence)unique.set(key,{...a,group});}
 for(const a of unique.values()){
  const key=`discipline:${game.round}:${a.player}:${a.group}`;if(state.processed.includes(key))continue;state.processed.push(key);
  let group=state.groups[a.group]??={cohesion:.65,tension:0};
  const own=caucus_key(game.players[a.player].party)===a.group;
  const historyKey=`${game.players[a.player].party}:${a.group}`,trust=state.agreements[historyKey]||0;
  const redline=(game.agenda.discipline?.redLineParties||[]).includes(a.card.party);
  const free=!!game.agenda.discipline?.freeVote,secret=!!game.agenda.discipline?.secret;
  const specialist=domain_weight(a.card.domains,game.agenda),controversy=game.agenda.discipline?.controversy??(game.agenda.procedure==='budget'?.65:.4);
  const competing=[...unique.values()].some(o=>o.player!==a.player&&o.group===a.group);
  const scope={fraktion:1,party:.65,executive:.45,committee:.3}[a.profile.scope]??.2;
  const chance=Math.max(.1,Math.min(.88,.35+(a.card.negotiation??3)*.055+trust*.12+specialist*.12+(own?.12:0)-group.tension*.18-(redline?.4:0)));
  let status='disciplineDeclined',power=0,extra=0;
  if(free){status='freeMandate';}
  else if(a.success&&game.random()<chance){
   power=Math.min(2.4,3*a.profile.influence*scope*group.cohesion*(secret?.35:1)*(competing?.5:1));
   if(redline){power*=.25;group.tension=Math.min(1,group.tension+.2);status='disciplineLimited';}
   else{status='mandateSupport';group.cohesion=Math.min(.9,group.cohesion+.025);group.tension=Math.max(0,group.tension-.04);}
   state.agreements[historyKey]=Math.min(1,trust+.2);
   extra=power>=1&&!redline?1:0;
  }else{
   // Failed high-pressure bargaining can mobilise resistance; mild rejection is not betrayal.
   const backlash=redline||(!own&&controversy>=.6&&group.cohesion>=.6);
   if(backlash){status='disciplineBacklash';power=-Math.min(.8,a.profile.influence*scope*.9);group.tension=Math.min(1,group.tension+.15);state.agreements[historyKey]=Math.max(0,trust-.1);}
  }
  effects.power[a.player]+=power;effects.extra[a.player]=Math.min(1,effects.extra[a.player]+extra);
  effects.trace.push({kind:'discipline',player:a.player,name:a.card.name,party:a.card.party,status,power:+power.toFixed(2),extra,scope:a.profile.scope,conditions:{cohesion:group.cohesion,tension:group.tension,chance,redline,free,secret,competing},source:a.profile.source});
 }
 for(let i=0;i<2;i++)effects.power[i]=Math.max(-1.2,Math.min(3,effects.power[i]));
 return effects;
}
