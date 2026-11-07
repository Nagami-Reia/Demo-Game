// Shared membership is factual; strength and action channels are game rules.
export function membership_links(groups=[]){return groups.filter(g=>g.members?.length>=2).map(g=>({...g,label:{zh:(g.nameZh||g.name).replace(/^CDU\/CSU联邦议院党团/,''),en:g.name.replace(/ der CDU\/CSU-Bundestagsfraktion$/,''),de:g.name.replace(/ der CDU\/CSU-Bundestagsfraktion$/,'')},description:{zh:g.category==='regional'?'共同的议会所属州；不是出生地认定。':'官方名单中同一党团工作组的成员。'},source:g.members[0].source,category:g.category||'working_group',strength:g.category==='regional'?.3:.5,effect:g.category==='regional'?'negotiation':'coordination',memberRequirement:g.category==='regional'?3:2,typed:true}));}
export function combined_relations(data,team=[],routes=[]){
 const deployed=new Set(team.map(c=>c.id));
 const groups=[...membership_links(data.workingGroups),...membership_links(data.regionalLinks)];
 const fallback=groups.flatMap(group=>{
  const covered=new Set(routes.filter(route=>route.active&&route.legacyLinkIds?.includes(group.id))
   .flatMap(route=>route.members.filter(id=>!route.virtualMemberIds?.includes(id))));
  if(!covered.size)return [group];
  if(group.members.filter(m=>deployed.has(m.id)).every(m=>covered.has(m.id)))return [];
  return [{...group,coveredMemberIds:[...covered]}];
 });
 return [...(data.relationships||[]),...fallback];
}
export function link_action_bonus(links,id,action,stage){
 const row=links.channels?.[id]||{},legacy=row.legacy||0;
 const coordination=stage===0&&['coordinate','negotiate'].includes(action)?row.coordination||0:0;
 const negotiation=stage===0&&['coordinate','negotiate'].includes(action)?row.negotiation||0:0;
 const resilience=stage===2?row.resilience||0:0;
 return Math.min(1,legacy+coordination+negotiation+resilience);
}
export function combination_view(links,t,loc,esc){
 return links.map(r=>`<span class="combination-box combination-${['working_group','regional','personal'].includes(r.category)?r.category:'partnership'}" title="${esc(loc(r.description))} ${esc(t('combo_effect_'+(r.effect||'cooperation')))}">${esc(loc(r.label))}</span>`).join('');
}
