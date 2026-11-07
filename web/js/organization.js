import {domain_weight} from './agenda-domains.js';
import {is_neutral_chair} from './roles.js';
import {caucus_key} from './discipline.js';
// Strategic denial represents unavailable organisational infrastructure, not forced real-world votes.
export function current_offices(card,game){return card.offices||game.data.offices?.filter(o=>o.id===card.id&&o.status==='verified_current')||[];}
function organizational_weight(o){return (o.influence||0)*({fraktion:1,party:.55}[o.scope]||0);}
export function organization_state(game,teams){
 const offices=game.data.offices?.filter(o=>o.status==='verified_current')||game.data.leadership||[];
 return game.players.map((p,i)=>{
  const key=caucus_key(p.party),groupCards=game.data.roster.filter(c=>!is_neutral_chair(c)&&caucus_key(c.party)===key),leaders=new Map();
  for(const c of groupCards)for(const o of (c.offices||offices.filter(o=>o.id===c.id))){let w=organizational_weight(o);if(w>0)leaders.set(c.id,Math.max(leaders.get(c.id)||0,w));}
  const all=[...leaders.values()].reduce((a,b)=>a+b,0),captured=game.players[1-i].owned.filter(c=>leaders.has(c.id));
  const fraction=all?Math.min(1,captured.reduce((n,c)=>n+leaders.get(c.id),0)/all):0;
  const integrity=Math.max(.35,1-.7*fraction);
  const deployed=teams[i].filter(c=>!is_neutral_chair(c)&&current_offices(c,game).some(o=>o.scope==='fraktion'));
  const command=Math.min(.18,deployed.reduce((n,c)=>n+Math.max(...current_offices(c,game).filter(o=>o.scope==='fraktion').map(o=>o.influence))*.18,0));
  return {player:i,integrity,command,captured:captured.map(c=>({id:c.id,name:c.name})),scale:integrity+command};
 });
}
export function office_effect(card,team,domain,game){
 if(is_neutral_chair(card))return {minister:0,partyCaucus:0,cabinet:0};
 const offices=current_offices(card,game),minister=Math.max(0,...offices.filter(o=>o.scope==='minister').map(o=>domain_weight(o.domains,domain)));
 const fraktion=offices.some(o=>o.scope==='fraktion'),party=offices.some(o=>o.scope==='party');
 const linked=team.filter(c=>c.id!==card.id&&!is_neutral_chair(c)&&caucus_key(c.party)===caucus_key(card.party));
 const partyCaucus=linked.some(c=>{let peer=current_offices(c,game);return (fraktion&&peer.some(o=>o.scope==='party'))||(party&&peer.some(o=>o.scope==='fraktion'));});
 const cabinet=minister&&linked.some(c=>current_offices(c,game).some(o=>['fraktion','party'].includes(o.scope)));
 return {minister:minister*1.2,partyCaucus:partyCaucus?.5:0,cabinet:cabinet?.3*minister:0};
}
