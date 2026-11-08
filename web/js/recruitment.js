import {is_neutral_chair} from './roles.js';
import {can_recruit} from './party-relations.js';

function recruitment_banned_ids(game){
 const ban=game.recruitmentBan;
 // Preserve a legacy save's existing restriction until that round ends.
 return ban?.cardIds??(ban?.round===game.round&&ban.id?[ban.id]:[]);
}

export function recruitment_is_banned(game,id){
 return recruitment_banned_ids(game).includes(id);
}

export function round_recruitment_excluded(game){
 return [...new Set([...game.used,...recruitment_banned_ids(game)])];
}

function recruitment_has_open_lineup(cards,routes,tags){
 if(cards.length<5)return false;
 return routes.some(route=>{
  const threshold=route.thresholds?.[0]??route.threshold;
  return threshold>=2&&threshold<=5&&cards.filter(card=>tags.get(card.id)?.has(route.id)).length>=threshold;
 });
}

export function prepare_game_recruitment_ban(game){
 if(!game.data.gameRecruitmentBans||Object.hasOwn(game,'recruitmentBan'))return;
 game.recruitmentBan=null;
 const routes=game.data.allianceDefinitions||[];
 const tags=new Map();
 for(const row of game.data.allianceTags||[]){
  const memberships=tags.get(row.id)||new Set();
  for(const tag of row.tags||[])memberships.add(tag);
  tags.set(row.id,memberships);
 }
 const roster=recruitment_pool(game.data.roster,[],6).flatMap(group=>group.cards);
 const options=[];
 const seen=new Set();
 for(const route of routes){
  if(!['working_group','state'].includes(route.category))continue;
  if(game.players[0].party==='CSU'&&route.category==='state'&&route.name?.de==='Bayern')continue;
  const cardIds=[...new Set(roster.filter(card=>tags.get(card.id)?.has(route.id)).map(card=>card.id))].sort();
  const key=JSON.stringify(cardIds);
  if(!cardIds.length||seen.has(key))continue;
  seen.add(key);
  options.push({tagId:route.id,name:route.name,category:route.category,cardIds});
 }

 // Shuffle once, then try distinct pairs without advancing the auction RNG.
 let seed=(game.initialSeed^0x9e3779b9)>>>0;
 for(let i=options.length-1;i>0;i--){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const j=seed%(i+1);
  [options[i],options[j]]=[options[j],options[i]];
 }
 for(let i=0;i<options.length-1;i++)for(const second of options.slice(i+1)){
  const first=options[i],blocked=new Set([...first.cardIds,...second.cardIds]);
  if(blocked.size<=Math.max(first.cardIds.length,second.cardIds.length))continue;
  const remaining=roster.filter(card=>!blocked.has(card.id));
  if(!game.players.every(player=>remaining.some(card=>card.party===player.party)))continue;
  const earlyPools=game.players.map(player=>remaining.filter(card=>card.tier<=2&&can_recruit(player.party,card)));
  if(new Set(earlyPools.flat().map(card=>card.id)).size<10)continue;
  if(!earlyPools.every(pool=>recruitment_has_open_lineup(pool,routes,tags)))continue;
  game.recruitmentBan={groups:[first,second],cardIds:[...blocked]};
  return;
 }
}

export function recruitment_ban_groups(ban){
 return ban?.groups??(ban?.tagId?[ban]:[]);
}

export function recruitment_ban_category(category,t){
 return t({working_group:'workingGroups',professional:'professionalBackground',state:'representedState'}[category]);
}

export function round_recruitment_notice(game,t,esc,loc){
 const ban=game.recruitmentBan;
 if(!ban||!recruitment_banned_ids(game).length)return '';
 const groups=recruitment_ban_groups(ban);
 if(groups.length){
  const names=groups.map(group=>esc(recruitment_ban_category(group.category,t))+' · '+esc(loc(group.name)));
  return `<p class="round-recruitment-notice"><b>${t('recruitmentBan')}</b> · ${names.join(' / ')} <small>${t('recruitmentBanDetail')}</small></p>`;
 }
 const card=game.data.roster.find(c=>c.id===ban.id);
 return card?`<p class="round-recruitment-notice"><b>${t('legacyRecruitmentBan')}</b> · ${esc(card.displayName||card.name)}</p>`:'';
}
// Tier weights apply ONCE per tier, never once per member.
export const tier_weights=[[75,20,5,0,0,0],[55,30,12,3,0,0],[35,30,23,10,2,0],[20,25,28,20,6,1],[10,18,27,28,13,4],[5,10,20,30,23,12]];
export function recruitment_pool(roster,used,level){
 const maxTier=Math.max(1,Math.min(6,Math.floor(level)||1));
 const excluded=new Set(used),groups=Array.from({length:6},()=>[]);
 for(const c of roster)if(!is_neutral_chair(c)&&!c.inactive&&!excluded.has(c.id)&&Number.isInteger(c.tier)&&c.tier>=1&&c.tier<=maxTier)groups[c.tier-1].push(c);
 const weights=tier_weights[maxTier-1];
 let active=groups.map((cards,i)=>({tier:i+1,cards,weight:cards.length?weights[i]:0})).filter(g=>g.weight>0);
 // Exhaustion never unlocks a higher tier.
 if(!active.length)active=groups.map((cards,i)=>({tier:i+1,cards,weight:cards.length?1:0})).filter(g=>g.weight>0);
 const total=active.reduce((n,g)=>n+g.weight,0);
 return active.map(g=>({...g,probability:g.weight/total}));
}
export function draw_member(roster,used,level,random,cardWeight=null){
 const groups=recruitment_pool(roster,used,level);if(!groups.length)return null;
 let r=random(),selected=groups.at(-1);
 for(const g of groups){r-=g.probability;if(r<0){selected=g;break;}}
 if(cardWeight){const weights=selected.cards.map(c=>Math.max(.01,Math.min(3,cardWeight(c)||1)));let r=random()*weights.reduce((n,w)=>n+w,0);for(let i=0;i<weights.length;i++){r-=weights[i];if(r<0)return selected.cards[i];}return selected.cards.at(-1);}
 return selected.cards[Math.min(selected.cards.length-1,Math.floor(random()*selected.cards.length))];
}
