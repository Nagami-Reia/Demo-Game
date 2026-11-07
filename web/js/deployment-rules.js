import {is_neutral_chair} from './roles.js';

// Deployment capacity is separate from the three auction lots and action stages.
export const MAX_DEPLOYMENT=5;

export function initial_deployment_selection(game, draft){
 if(game.phase!=='DEPLOYMENT')return new Set();
 const previous=game.history?.findLast(entry=>entry.round===game.round-1);
 const ids=Array.isArray(draft)?draft:previous?.result?.teams?.[0]?.map(card=>card.id)??[];
 const eligible=new Set(game.players[0].owned.filter(card=>!is_neutral_chair(card)).map(card=>card.id));
 return new Set([...new Set(ids.filter(id=>eligible.has(id)))].slice(0,MAX_DEPLOYMENT));
}
