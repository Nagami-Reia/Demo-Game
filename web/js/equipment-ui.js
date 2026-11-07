import {EQUIPMENT_ITEMS} from './equipment-data.js';
import {equipment_phase,equipment_open,equipment_target,equipment_cash,equipment_compatible} from './equipment-shop.js';

function equipment_tooltip(id,t,esc){
 const item=EQUIPMENT_ITEMS[id];
 const effect=t('item_effect_'+id),details=t('item_detail_'+id),special=t('item_exclusive_'+id);
 return `<span class="equipment-tooltip" role="tooltip"><b>${esc(t('item_'+id))}</b><span>${esc(effect)}</span>
 ${details!=='item_detail_'+id?`<span>${esc(details)}</span>`:''}
 ${item.exclusive&&special!=='item_exclusive_'+id?`<strong class="equipment-exclusive">${esc(special)}</strong>`:''}</span>`;
}

export function equipment_card(game,c,t,esc){
 const owner=game?.players.find(p=>p.owned.some(card=>card.id===c.id));
 const slots=owner?.equipment?.slots[c.id]||[null,null];
 const target=owner===game?.players[0]&&owner&&equipment_phase(game);
 return {
  attrs:`data-equipped="${slots.filter(Boolean).length}" data-equipment-party="${esc(c.party)}" ${target?`data-equipment-card="${esc(c.id)}"`:''}`,
  mask:target?`<div class="equipment-mask" hidden><div class="equipment-slots">${slots.map((piece,index)=>`<span class="equipment-hover"><button type="button" data-equipment-slot="${index}" class="${piece?'filled':''}">${piece?esc(t('item_'+piece.id)):t('equipmentSlot')+' '+(index+1)}</button>${piece?equipment_tooltip(piece.id,t,esc):''}</span>`).join('')}<small></small></div></div>`:''
 };
}

export function equipment_sidebar(game,t,esc){
 if(!equipment_phase(game))return '';
 const state=equipment_open(game,0),item=EQUIPMENT_ITEMS[state.offer],p=game.players[0];
 return `<section class="equipment-shop"><h3>${t('equipmentShop')}</h3>
 <div class="equipment-offer equipment-hover" tabindex="0">${item?`<strong>${esc(t('item_'+state.offer))}</strong><div>${esc(t('item_flavor_'+state.offer))}</div><p>${esc(t('item_effect_'+state.offer))}</p>${item.exclusive?`<strong class="equipment-exclusive">${esc(t('item_exclusive_'+state.offer))}</strong>`:''}${equipment_tooltip(state.offer,t,esc)}`:t('equipmentSold')}</div>
 <div class="actions"><button data-equipment-action="equipment_buy" ${!item||equipment_cash(game,0)<item.price?'disabled':''}>${t('equipmentBuy')}${item?' · €'+item.price:''}</button><button data-equipment-action="equipment_refresh" ${state.refreshed||equipment_cash(game,0)<1?'disabled':''}>${state.refreshed?t('equipmentRefreshed'):t('equipmentRefresh')+' · €1'}</button></div>
 <h4>${t('equipmentInventory')}</h4><div class="equipment-inventory">${state.inventory.map(piece=>`<span class="equipment-hover"><button draggable="true" data-equipment-item="${piece.uid}">${esc(t('item_'+piece.id))}</button>${equipment_tooltip(piece.id,t,esc)}</span>${equipment_compatible(game,0,EQUIPMENT_ITEMS[piece.id])?'':`<button data-equipment-action="equipment_refund" data-uid="${piece.uid}">${t('equipment_refund')} · €${EQUIPMENT_ITEMS[piece.id].price}</button>`}`).join('')||'—'}</div>
 <div class="equipment-fallback" hidden><select aria-label="${t('equipmentTarget')}">${p.owned.filter(c=>!c.neutralChair).map(c=>`<option value="${esc(c.id)}">${esc(c.displayName||c.name)}</option>`).join('')}</select><button data-equipment-action="equipment_pick">${t('equipmentTarget')}</button></div>
 <small role="status" class="equipment-status"></small><dialog class="equipment-choice"></dialog></section>`;
}

function equipment_preserve_scroll(render){
 const scrollers=['.deployment-grid','#deployment-effects','#deployment-skills','.collection-scroll','.sidebar-scroll'];
 const positions=scrollers.map(selector=>{
  const el=document.querySelector(selector);
  return [selector,el?.scrollTop||0,el?.scrollLeft||0];
 });
 const left=window.scrollX,top=window.scrollY;
 const visible=[...document.querySelectorAll('[data-equipment-card]')].find(el=>{
  const rect=el.getBoundingClientRect();
  return rect.height>0&&rect.bottom>0&&rect.top<window.innerHeight;
 });
 const cardId=visible?.dataset.equipmentCard,cardTop=visible?.getBoundingClientRect().top;
 render();
 for(const [selector,y,x] of positions){
  const el=document.querySelector(selector);
  if(el){el.scrollTop=y;el.scrollLeft=x;}
 }
 const replacement=cardId&&[...document.querySelectorAll('[data-equipment-card]')].find(el=>el.dataset.equipmentCard===cardId);
 const restoredTop=replacement?window.scrollY+replacement.getBoundingClientRect().top-cardTop:top;
 window.scrollTo({left,top:restoredTop,behavior:'instant'});
}

export function equipment_bind({getGame,getIds,render,t,loc,esc}){
 let picked=null,dragging=null,shown=null,choice=null;
 const cardOf=el=>el.closest('.card-bookmarks')?null:el.closest('[data-equipment-card]');
 const status=msg=>{const el=document.querySelector('.equipment-status');if(el)el.textContent=t(msg);};
 const execute=(action,args)=>{
  try{getGame().command(action,args);picked=null;dragging=null;choice=null;show(null);equipment_preserve_scroll(render);status('equipmentDone');}
  catch(err){status(err.message);}
 };
 function show(card,slot){
  if(shown&&shown!==card)shown.querySelector('.equipment-mask').hidden=true;
  shown=card;
  if(!card)return {};
  const target=equipment_target(getGame(),0,dragging??picked,card.dataset.equipmentCard,getIds());
  const mask=card.querySelector('.equipment-mask');
  mask.hidden=!target.item;
  mask.querySelector('small').textContent=target.valid?(target.slots?'':t('equipmentUse')):t('equipment_unavailable');
  mask.querySelectorAll('[data-equipment-slot]').forEach(el=>{
   el.disabled=!target.valid||Boolean(target.slots?.[Number(el.dataset.equipmentSlot)]);
   el.classList.toggle('over',el===slot&&!el.disabled);
  });
  return target;
 }
 function give(uid,id,slot){
  const ids=getIds(),target=equipment_target(getGame(),0,uid,id,ids);
  if(!target.valid){status('equipment_unavailable');return;}
  const args={uid,id,slot,ids};
  if(target.routes){
   choice=args;
   openChoices(target.routes.map(r=>[r.id,`${loc(r.name)} +${r.amount}`]),'route');
  }else if(target.slots&&slot===undefined){
   choice=args;openChoices([0,1].filter(n=>!target.slots[n]).map(n=>[n,t('equipmentSlot')+' '+(n+1)]),'slot');
  }else execute('equipment_assign',args);
 }
 function openChoices(options,key){
  const dialog=document.querySelector('.equipment-choice');
  dialog.innerHTML=`<form method="dialog">${options.map(([v,label])=>`<button type="button" data-equipment-option="${esc(v)}" data-equipment-key="${key}">${esc(label)}</button>`).join('')}<button>${t('equipmentCancel')}</button></form>`;
  dialog.showModal();
 }
 document.addEventListener('click',event=>{
  const el=event.target,action=el.closest('[data-equipment-action]'),piece=el.closest('[data-equipment-item]'),option=el.closest('[data-equipment-option]'),slot=el.closest('[data-equipment-slot]'),card=cardOf(el);
  if(!action&&!piece&&!option&&!slot&&!(card&&picked!==null&&equipment_phase(getGame())))return;
  event.stopImmediatePropagation();
  if(piece){
   picked=Number(piece.dataset.equipmentItem);show(null);
   document.querySelector('.equipment-fallback').hidden=false;
   document.querySelectorAll('[data-equipment-item]').forEach(button=>button.setAttribute('aria-pressed',String(button===piece)));
  }else if(action?.dataset.equipmentAction==='equipment_pick')give(picked,document.querySelector('.equipment-fallback select').value);
  else if(action)execute(action.dataset.equipmentAction,{uid:Number(action.dataset.uid)});
  else if(option&&choice){
   const key=option.dataset.equipmentKey,value=option.dataset.equipmentOption;
   execute('equipment_assign',{...choice,[key]:key==='slot'?Number(value):value});
  }else if(slot&&card)give(picked,card.dataset.equipmentCard,Number(slot.dataset.equipmentSlot));
  else if(card)show(card);
 },true);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!document.querySelector('.equipment-choice')?.open){picked=null;show(null);}
 });
 document.addEventListener('dragstart',event=>{
  const piece=event.target.closest('[data-equipment-item]');if(!piece)return;
  dragging=Number(piece.dataset.equipmentItem);event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('application/x-kp-equipment',piece.dataset.equipmentItem);
 });
 document.addEventListener('dragover',event=>{
  if(dragging===null)return;
  const card=cardOf(event.target),slot=event.target.closest('[data-equipment-slot]'),target=show(card,slot);
  if(card){event.preventDefault();event.dataTransfer.dropEffect=target.valid&&(!target.slots||(slot&&!slot.disabled))?'copy':'none';}
 });
 document.addEventListener('drop',event=>{
  const card=cardOf(event.target);if(!card||dragging===null)return;
  event.preventDefault();
  const uid=Number(event.dataTransfer.getData('application/x-kp-equipment'));
  const slot=event.target.closest('[data-equipment-slot]');
  const target=equipment_target(getGame(),0,uid,card.dataset.equipmentCard,getIds());
  if(uid===dragging&&(!target.slots||slot))give(uid,card.dataset.equipmentCard,slot?Number(slot.dataset.equipmentSlot):undefined);
  dragging=null;show(null);
 });
 document.addEventListener('dragend',()=>{dragging=null;show(null);});
 return ()=>{picked=null;dragging=null;choice=null;show(null);};
}
