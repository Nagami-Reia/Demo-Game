import {is_neutral_chair} from './roles.js';
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
