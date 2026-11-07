import {news_recruit_value,news_action_effect} from './news-effects.js';
import {opposition_active} from './opposition-skills.js';
import {can_recruit} from './party-relations.js';
import {hidden_lineup_value} from './hidden-relations.js';
import {MAX_DEPLOYMENT} from './deployment-rules.js';
import {alliance_lineup_value} from './alliances.js';
import {institution_effect} from './institution-effects.js';
import {agenda_weights} from './agenda-domains.js';
import {team_cohesion} from './team-effects.js';
import {is_bonus_round} from './auction-schedule.js';
import {is_neutral_chair} from './roles.js';
import {personal_links,background_effect} from './personal-links.js';
import {recruitment_affinity,relation_effect} from './party-relations.js';
import {starting_price} from './economy.js';
import {caucus_key} from './discipline.js';
/** Public-information-only opponent. No network/model calls or hidden deck access.
 * Scores describe game roles, not the abilities of real political figures.
 * Exact combination search is bounded by a diverse 12-card shortlist for large rosters.
 */
const DOMAIN_KEYS = ['economy', 'social', 'climate', 'security', 'digital', 'foreign'];
const PARTY_DOMAINS = {
  CDU: ['economy','security'], CSU: ['security','economy'], 'CDU/CSU': ['economy','security'],
  SPD: ['social','economy'], AfD: ['security','economy'], 'Grüne': ['climate','foreign'],
  Gruene: ['climate','foreign'], 'Die Linke': ['social','climate'], Linke: ['social','climate'],
};
const PROFILES = {
  AfD: {oratory:1.3, negotiation:.35, expertise:.65, resilience:1.05},
  'Grüne': {oratory:.7, negotiation:.85, expertise:1.25, resilience:.55},
  Gruene: {oratory:.7, negotiation:.85, expertise:1.25, resilience:.55},
  'Die Linke': {oratory:1.05, negotiation:.7, expertise:.8, resilience:.95},
  Linke: {oratory:1.05, negotiation:.7, expertise:.8, resilience:.95},
};
const DEFAULT_PROFILE = {oratory:.8, negotiation:.9, expertise:.9, resilience:.7};
const cache = new Map();
const identity = card => card.actor_id ?? card.id;
const domains = card => new Set(card.domains ?? []);
const number = (card,key,fallback=0) => typeof card[key]==='number' && Number.isFinite(card[key]) ? Math.max(0,Math.min(6,card[key])) : fallback;
const stableId = (a,b) => String(a.id)<String(b.id)?-1:String(a.id)>String(b.id)?1:0;
function strength(card,party='',role='opposition') {
  const profile = role==='opposition' ? PROFILES[party]??DEFAULT_PROFILE : DEFAULT_PROFILE;
  return (card.edition==='special'?Math.min(.6,card.specialEffect?.amount||0)*.5:0)+recruitment_affinity(party,card)+.8*number(card,'resources')+.65*number(card,'leadership')+.15*number(card,'tier')
    + Object.entries(profile).reduce((sum,[stat,weight])=>sum+weight*number(card,stat,3)*.45,0);
}
function unique(cards,party='',role='opposition') {
  const seen=new Map();
  for(const card of cards) if(!is_neutral_chair(card)&&(!seen.has(identity(card)) || strength(card,party,role)>strength(seen.get(identity(card)),party,role))) seen.set(identity(card),card);
  return [...seen.values()].sort(stableId);
}
function* combinations(cards,count,start=0,selected=[]) {
  if(!count){yield selected;return;}
  for(let i=start;i<=cards.length-count;i++) yield* combinations(cards,count-1,i+1,[...selected,cards[i]]);
}
function lineupValue(lineup,domain,party='',role='opposition') {
  if(!lineup.length)return 0;
  const coverage=new Map(),parties=new Map();
  for(const card of lineup){
    for(const d of domains(card))coverage.set(d,(coverage.get(d)??0)+1);
    if(card.party)parties.set(card.party,(parties.get(card.party)??0)+1);
  }
  const relations=[...new Map(lineup.flatMap(c=>c.links||[]).map(r=>[r.id,r])).values()];const publicLinks=personal_links(lineup,domain,relations);let score=Object.values(publicLinks.bonuses).reduce((a,b)=>a+b,0)+lineup.reduce((sum,card)=>sum+strength(card,party,role)+background_effect(card,domain)+relation_effect(party,card,lineup,domain,domains(card).has(domain)?'amend':'coordinate').bonus*.5,0)+1.1*coverage.size;
  score+=domain?2.8*(coverage.get(domain)??0):0;
  for(const count of coverage.values())score+=.8*Math.min(2,count-1);
  for(const count of parties.values())score+=.55*Math.min(2,count-1);
  score+=Math.max(...lineup.map(c=>number(c,'leadership')))*.6;
  score-=.5*Math.max(0,Math.max(0,...coverage.values())-2);
  // Verified ministerial portfolios add issue expertise, never generic caucus
  // command. Multiple ministerial offices do not stack without a total cap.
  score+=Math.min(1.5,lineup.reduce((sum,c)=>sum+(ministerMatches(c,domain)?.75:0),0));
  score+=lineup.reduce((n,c)=>{const e=institution_effect(c,domain,ministerMatches(c,domain)?1:0);return n+e.government+e.committee;},0);
  score+=teamCombo(lineup)+team_cohesion(party,lineup,1)*1.5+team_cohesion(party,lineup,0);
  const command=Math.min(.18,lineup.reduce((sum,c)=>sum+Math.max(0,...(c.offices||[]).filter(o=>o.scope==='fraktion').map(o=>(o.influence||0)*.18)),0));
  score*=1+command;
  return score;
}
function validMandate(card) {
  // Metadata is screened by build; minimal runtime shape is scope+influence.
  // Never reconstruct an office from a name, tier, or leadership stat.
  const m=card.mandate;
  return m&&['fraktion','party','executive','committee'].includes(m.scope)&&Number.isFinite(m.influence)&&m.influence>0?{...m,influence:Math.min(1,m.influence)}:null;
}
function ministerMatches(card,domain) {
  return !!domain&&Array.isArray(card.offices)&&card.offices.some(o=>
    (o.scope==='minister'||o.type==='minister'||o.kind==='minister')&&Array.isArray(o.domains)&&o.domains.includes(domain));
}
function teamCombo(lineup) {
  let bonus=0;
  for(let i=0;i<lineup.length;i++)for(let j=i+1;j<lineup.length;j++){
    const a=lineup[i],b=lineup[j],ma=validMandate(a),mb=validMandate(b);
    if(caucus_key(a.party)!==caucus_key(b.party)||identity(a)===identity(b)||!ma||!mb)continue;
    if(new Set([ma.scope,mb.scope]).has('party')&&new Set([ma.scope,mb.scope]).has('fraktion'))bonus+=Math.min(ma.influence,mb.influence)*1.4;
  }
  return Math.min(1.4,bonus);
}
function shortlist(cards,domain,party,role) {
  const pool=unique(cards,party,role);
  if(pool.length<=12)return pool;
  const rank=(a,b)=>(strength(b,party,role)+(domains(b).has(domain)?3:0)+(ministerMatches(b,domain)?.75:0))-(strength(a,party,role)+(domains(a).has(domain)?3:0)+(ministerMatches(a,domain)?.75:0))||stableId(a,b);
  const selected=new Map(pool.toSorted(rank).slice(0,2).map(c=>[identity(c),c]));
  // Keep a credible chair pair available to the bounded combination search.
  // Two generalists + two leaders + one specialist per field leaves room for a documented pair.
  for(const scope of ['party','fraktion']){
    const leader=pool.filter(c=>validMandate(c)?.scope===scope).sort((a,b)=>
      ((validMandate(b).influence+(b.party===party?.5:0))-(validMandate(a).influence+(a.party===party?.5:0)))||rank(a,b))[0];
    if(leader)selected.set(identity(leader),leader);
  }
  // Preserve one specialist per field, even when generalist stats are higher.
  for(const d of DOMAIN_KEYS)for(const c of pool.filter(c=>domains(c).has(d)).toSorted(rank).slice(0,1))selected.set(identity(c),c);
  const byId=new Map(pool.map(c=>[c.id,c]));
  const links=[...new Map(pool.flatMap(c=>c.links||[]).map(r=>[r.id,r])).values()].sort((a,b)=>(b.strength||0)-(a.strength||0));
  for(const link of links){const pair=[byId.get(link.a),byId.get(link.b)];if(pair.some(c=>!c))continue;const missing=pair.filter(c=>!selected.has(identity(c)));if(selected.size+missing.length<=12)for(const c of missing)selected.set(identity(c),c);}
  for(const c of pool.toSorted(rank)){if(selected.size>=12)break;selected.set(identity(c),c);} 
  return [...selected.values()].sort(stableId);
}
function keyFor(owned,party) {
  return JSON.stringify([party,owned.map(c=>[identity(c),c.id,c.party,c.domains,c.mandate,c.offices,c.edition,c.specialEffect,c.institutionalRoles,c.links,c.backgrounds,...['resources','leadership','tier','oratory','negotiation','expertise','resilience'].map(k=>c[k])]).sort((a,b)=>String(a[1]).localeCompare(String(b[1])))]);
}
function bestValues(owned,party) {
  const key=keyFor(owned,party);
  if(cache.has(key))return cache.get(key);
  const result=Object.fromEntries(DOMAIN_KEYS.map(d=>[d,0]));
  // One bounded combination traversal evaluates all six agenda possibilities.
  const pool=shortlist(owned,null,party,'opposition');
  if(pool.length)for(const group of combinations(pool,Math.min(MAX_DEPLOYMENT,pool.length)))for(const d of DOMAIN_KEYS)result[d]=Math.max(result[d],lineupValue(group,d,party));
  if(cache.size>=128)cache.delete(cache.keys().next().value);
  cache.set(key,result);return result;
}
function mandatePremium(card) {
  // Only build-verified office metadata may support a mandate premium. A high
  // tier or leadership stat alone describes lineup coordination, not authority
  // over a parliamentary group. Even a verified office adds at most one euro.
  const m=validMandate(card);
  if(!m)return {bonus:0,reason:'no_verified_fraktion_mandate'};
  const influence=Number.isFinite(m.influence)?Math.max(0,Math.min(1,m.influence)):0;
  const weight={fraktion:1,party:.4,executive:.2}[m.scope]??0;
  const reason={fraktion:'verified_fraktion_mandate',party:'party_scope_only',executive:'executive_scope_only'}[m.scope]??'no_verified_fraktion_mandate';
  return {bonus:influence*weight,reason};
}
const POLICY_AXES={economy:['investment'],social:['welfare'],climate:['climate'],security:['migration','defence'],digital:['digital'],foreign:['defence']};
function policyFit(card,party,domain,axis,context={}) {
  const own=context.platforms?.[party],other=card.partyPolicy??context.platforms?.[card.party];
  if(!own||!other)return 0; // unknown positions are unknown, never centrist priors
  const axes=axis?[axis]:POLICY_AXES[domain]??[];
  const similarities=axes.filter(a=>Number.isFinite(own.positions?.[a])&&Number.isFinite(other.positions?.[a])).map(a=>
    1-Math.min(2,Math.abs(own.positions[a]-other.positions[a]))/2);
  let value=similarities.length?1.8*(similarities.reduce((a,b)=>a+b,0)/similarities.length-.5):0;
  const relations=context.relations??context.policyRelations??[];
  const link=Array.isArray(relations)?relations.find(r=>(r.a===party&&r.b===card.party)||(r.b===party&&r.a===card.party)):null;
  if(link){
    if(Number.isFinite(link.cooperation))value+=.5*(Math.max(0,Math.min(1,link.cooperation))-.5);
    if(link.sharedDomains?.includes(domain))value+=.2;
    if(link.frictionDomains?.includes(domain))value-=.2;
  }
  return Math.max(-1.5,Math.min(1.5,value));
}
export function card_value(card,owned,party,round_no,policyContext={}) {
  if(is_neutral_chair(card))return 0;
  if(owned.some(c=>identity(c)===identity(card)))return 0;
  const weights=Object.fromEntries(DOMAIN_KEYS.map(d=>[d,1]));
  for(const d of PARTY_DOMAINS[party]??[])weights[d]=1.6;
  const priorities=policyContext.platforms?.[party]?.priorities;
  if(priorities)for(const d of DOMAIN_KEYS)if(Number.isFinite(priorities[d]))weights[d]=.5+1.5*Math.max(0,Math.min(1,priorities[d]));
  const before=bestValues(owned,party),after=bestValues([...owned,card],party);
  let gains=0,total=0;
  for(const [d,w]of Object.entries(weights)){gains+=w*Math.max(0,after[d]-before[d]);total+=w;}
  const covered=new Set(owned.flatMap(c=>[...domains(c)]));
  const flexibility=.55*[...domains(card)].filter(d=>!covered.has(d)).length;
  const horizon=.9+.06*Math.max(0,8-round_no);
  // Auction evaluates the six public policy domains, NEVER the undisclosed
  // agenda or an agenda axis smuggled through context. Alignment promotes our
  // own desired policy, rather than treating opposition as automatic rejection.
  const fit=DOMAIN_KEYS.reduce((sum,d)=>sum+weights[d]*policyFit(card,party,d,null,policyContext),0)/total;
  return Math.round(Math.max(0,gains/total*horizon+flexibility+fit+news_recruit_value(policyContext.newsGame,1,card))*10000)/10000;
}
export function auction_decision(card,owned,party,round_no,cash,opponent_owned=[],context={}) {
  // scoreGap = computer score minus human score. Positive pollDebuff is a
  // publicly visible penalty, NOT a license to inspect upcoming events.
  const funds=Number.isFinite(cash)?Math.max(0,Math.floor(cash)):0;
  let evaluatedValue=null;
  const result=(limit,branch,...reasons)=>({value:evaluatedValue,limit:Math.min(funds,Math.max(0,Math.floor(limit))),branch,reasons});
  if(!can_recruit(party,card))return result(0,'party_recruitment_ban','recruitment_forbidden');
  if(is_neutral_chair(card))return result(0,'neutral_presidium','neutral_chair_not_a_faction_recruit');
  if(!funds)return result(0,'budget_empty','no_cash');
  if(owned.some(c=>identity(c)===identity(card)))return result(0,'duplicate','already_owned');
  const price=context.startPrice??starting_price(card);
  if(funds<price)return result(0,'unaffordable','below_starting_price');
  const value=card_value(card,owned,party,round_no,context);evaluatedValue=value;
  const roster=unique(owned,party),coverage=new Map();
  for(const c of roster)for(const d of domains(c))coverage.set(d,(coverage.get(d)??0)+1);
  const novel=[...domains(card)].filter(d=>!coverage.has(d));
  const leaderGain=number(card,'leadership')-Math.max(0,...roster.map(c=>number(c,'leadership')));
  const ranked=roster.map(c=>strength(c,party)).sort((a,b)=>b-a);
  const competitive=strength(card,party)>=(ranked[Math.min(MAX_DEPLOYMENT-1,ranked.length-1)]??0)*.85;
  const depthGap=competitive&&roster.length<MAX_DEPLOYMENT+5&&[...domains(card)].some(d=>(coverage.get(d)??0)<2);
  const trailing=Number.isFinite(context.scoreGap)&&context.scoreGap<0;
  const penalty=Number.isFinite(context.pollDebuff)?Math.max(0,context.pollDebuff):0;
  const bonusAuction=context.bonusAuction===true;
  const totalRounds=Number.isInteger(context.totalRounds)&&context.totalRounds>0?context.totalRounds:8;
  // Scheduled special rounds have two extra lots, only if a real pair remains.
  const bonusScheduled=context.bonusScheduled??is_bonus_round(round_no);
  const finalAuction=round_no>=totalRounds&&(bonusAuction?context.slot===2:context.slot===3&&!bonusScheduled);
  const bonusTier=bonusAuction&&number(card,'tier')>=4;
  const mandate=validMandate(card);
  const defendLeader=mandate?.scope==='fraktion'&&caucus_key(card.party)===caucus_key(party);
  const raidLeader=mandate?.scope==='fraktion'&&typeof context.opponentParty==='string'&&caucus_key(card.party)===caucus_key(context.opponentParty)&&caucus_key(party)!==caucus_key(context.opponentParty);
  let branch='incremental_upgrade',floorValue=0,reasons=['marginal_lineup_gain'];
  if(defendLeader){branch='defend_caucus_leader';floorValue=price+2+Math.min(4,mandate.influence*4)+Math.min(2,Math.max(0,totalRounds-round_no)*.3);reasons=['protect_own_caucus_organization','verified_fraktion_mandate','avoid_persistent_organization_loss'];}
  else if(raidLeader){branch='contest_opponent_leader';floorValue=price+Math.min(2,mandate.influence*2);reasons=['contest_public_opponent_caucus_leader','verified_fraktion_mandate'];}
  else if(roster.length<MAX_DEPLOYMENT){branch='roster_fill';floorValue=price+1;reasons=['complete_deployment_lineup'];}
  else if(novel.length){branch='domain_gap';floorValue=price+1;reasons=['uncovered_policy_domain'];}
  else if(leaderGain>=1&&competitive){
    const mandate=mandatePremium(card);
    branch='leader_upgrade';floorValue=price+.5+mandate.bonus;
    reasons=['stronger_coordinator',mandate.reason];
  }
  else if(value<1.25&&depthGap){branch='depth_rotation';floorValue=price;reasons=['specialist_reserve'];}
  else if(bonusTier&&competitive&&value>=.65){branch='high_tier_opportunity';floorValue=price+Math.min(2,value*.35);reasons=['useful_high_tier_upgrade'];}
  else if(value<.65)return result(0,'weak_replacement','no_useful_lineup_or_reserve_gain');
  if(context.platforms?.[party]){
    reasons.push('advance_own_policy_goals');
    if(novel.some(d=>(context.platforms[party].priorities?.[d]??0)>=.8))reasons.push('policy_priority_coverage');
    if(card.party!==party&&DOMAIN_KEYS.some(d=>policyFit(card,party,d,null,context)>.4))reasons.push('policy_cooperation_channel');
  }
  // Trailing can justify fighting for an improvement, never for a useless card.
  if(trailing&&value>=1.25){if(!defendLeader&&!raidLeader)branch='comeback';floorValue=Math.max(floorValue,price+1);reasons.push('trailing_on_public_score');}
  if(penalty>0&&number(card,'resilience',3)>=4){floorValue+=.5;reasons.push('resilience_against_public_penalty');}
  const opponentGain=opponent_owned.length?card_value(card,opponent_owned,'',round_no):0;
  const denial=Math.min(Math.max(value,.5)*.35,opponentGain*.3);
  if(denial>=.5)reasons.push('deny_public_roster_improvement');
  let willingness=Math.max(floorValue,value*1.05+denial+(trailing?Math.min(1.5,value*.2):0));
  // Cash now carries forward. Every nonterminal bid retains future value,
  // especially ahead of the publicly scheduled high-tier auction.
  let ceiling=Math.max(price,Math.floor(funds*(value>=8?.9:roster.length<MAX_DEPLOYMENT?.8:.75)));
  if(defendLeader||raidLeader)ceiling=Math.max(price,funds-2);
  if(bonusTier){
    willingness+=Math.min(2,Math.max(.5,value*.25));
    ceiling=Math.max(ceiling,Math.floor(funds*.9));
    reasons.push('compete_for_useful_bonus_high_tier');
  }
  if(!bonusAuction&&bonusScheduled&&!defendLeader){
    const reserve=roster.length<MAX_DEPLOYMENT?2:4;
    ceiling=Math.min(ceiling,Math.max(0,funds-reserve));
    reasons.push('reserve_for_scheduled_high_tier_auction');
  }
  // Surplus is useful only if the card improves a live route. Release it as
  // remaining public purchase opportunities shrink, rather than saving forever.
  if(value>=.65&&roster.length>=MAX_DEPLOYMENT){const lots=Math.max(1,(totalRounds-round_no)*3+Math.max(0,4-(context.slot||1)));const surplus=Math.max(0,funds-12);const premium=Math.min(value*1.4,surplus/lots*1.8);willingness+=premium;if(premium>=1)reasons.push('spend_surplus_on_useful_upgrade');}
  if(round_no<=2&&roster.length<MAX_DEPLOYMENT&&!defendLeader){const missingAfter=Math.max(0,MAX_DEPLOYMENT-1-roster.length);ceiling=Math.min(ceiling,Math.max(price,funds-missingAfter*3),price+3);reasons.push('protect_early_deployment_budget');}
  if(finalAuction){ceiling=funds;willingness+=Math.min(1.5,Math.max(.5,value*.15));reasons.push('final_game_auction_no_future_budget_value');if(branch==='incremental_upgrade')branch='final_auction';}
  else reasons.push('carry_cash_without_interest');
  const limit=Math.min(ceiling,Math.floor(willingness));
  if(limit<price)return result(0,'price_exceeds_value',...reasons,'save_for_better_card');
  return result(limit,branch,...reasons);
}
export function bid_limit(card,owned,party,round_no,cash,opponent_owned=[]) {
  return auction_decision(card,owned,party,round_no,cash,opponent_owned).limit;
}
export function should_upgrade(level,cost,cash,bonus,round_no,total_rounds=8) {
  if(level>=6||cost<=0||cash<cost||round_no>=total_rounds)return false;
  const remaining=total_rounds-round_no;
  // Early investment is valuable while leaving an actual auction contest possible.
  const reserve=round_no<=3?4:Math.max(4,level);
  if(cash-cost<reserve)return false;
  return bonus*remaining+Math.min(2.5,remaining*.4)>=cost*1.15;
}
export function choose_deployment(owned,agenda,limit=MAX_DEPLOYMENT,party='',role='opposition',policyContext={}) {
  const count=Math.min(MAX_DEPLOYMENT,Math.max(0,Math.trunc(limit)),unique(owned).length);
  if(!count)return [];
  const weights=agenda_weights(agenda);
  const primary=Object.entries(weights).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const pool=shortlist(owned,primary,party,role);
  let best=[],bestScore=-Infinity;
  for(const lineup of combinations(pool,Math.min(count,pool.length))){
    // Once the agenda is public, unrelated field breadth no longer provides
    // current-round power. Weight relevant expertise and minister portfolios.
    const coverage=new Map();for(const c of lineup)for(const d of domains(c))coverage.set(d,(coverage.get(d)||0)+1);
    const offTopicBreadth=1.1*coverage.size+[...coverage.values()].reduce((sum,n)=>sum+.8*Math.min(2,n-1),0);
    let score=0;for(const [domain,weight] of Object.entries(weights)){score+=weight*(lineupValue(lineup,domain,party,role)-offTopicBreadth+lineup.reduce((sum,c)=>sum+(domains(c).has(domain)?4:0)+(ministerMatches(c,domain)?1:0)+policyFit(c,party,domain,agenda.policy?.axis,policyContext),0));}
    if(policyContext.allianceGame?.data.tacticalEffects?.enabled)score+=opposition_active(lineup,agenda).reduce((sum,s)=>sum+s.value,0);
    if(policyContext.allianceGame)score+=hidden_lineup_value(policyContext.allianceGame,policyContext.alliancePlayer??1,lineup.map(c=>c.id));
    if(policyContext.allianceGame)score+=alliance_lineup_value(policyContext.allianceGame,policyContext.alliancePlayer??1,lineup.map(c=>c.id),agenda);
    if(policyContext.allianceGame)score+=lineup.reduce((n,c)=>n+news_action_effect(policyContext.allianceGame,policyContext.alliancePlayer??1,c,'amend',agenda,lineup).rate*2,0);
    if(score>bestScore){best=lineup;bestScore=score;}
  }
  // Leadership gives initiative its value; deploy the coordinator first,
  // then opening rhetoric, without peeking at the simulation's event schedule.
  return best.toSorted((a,b)=>(number(b,'leadership')*.6+number(b,'oratory',3)*.4)-(number(a,'leadership')*.6+number(a,'oratory',3)*.4)||stableId(a,b)).map(c=>c.id);
}
