"""Build self-contained, offline and GitHub Pages compatible HTML. Python is build-time only."""
from pathlib import Path
import json,re,base64
from tools.portrait_catalog import portrait_catalog
ROOT=Path(__file__).resolve().parent
parts=['web/vendor/stronghold/shared/stateDelta.js','web/js/agenda-domains.js','web/js/roles.js','web/js/political-state.js','web/js/sandbox.js','web/js/policy.js','web/js/party-relations.js','web/js/combination-groups.js','web/js/profiles.js','web/js/auction-schedule.js','web/js/deployment-rules.js','web/js/opponent.js','web/js/factions.js','web/js/economy.js','web/js/environment.js','web/js/discipline.js','web/js/organization.js','web/js/personal-links.js','web/js/team-effects.js','web/js/institution-effects.js','web/js/scoring.js','web/js/simulation.js','web/js/recruitment.js','web/js/bonus-auction.js','web/js/controller.js','web/js/i18n.js','web/js/environment-view.js','web/js/replay-view.js','web/js/poll-chart.js','web/js/finale-view.js','web/js/result-view.js','web/js/save-migration.js','web/js/portraits.js','web/js/ui-motion.js','web/js/office-labels.js','web/js/app.js']
parts.insert(parts.index('web/js/opponent.js'),'web/js/opposition-skills.js')
parts.insert(parts.index('web/js/opponent.js'),'web/js/news-effects.js')
parts.insert(parts.index('web/js/controller.js'),'web/js/news-state.js')
parts.insert(parts.index('web/js/app.js'),'web/js/news-view.js')
parts.insert(parts.index('web/js/opponent.js'),'web/js/alliances.js')
parts.insert(parts.index('web/js/opponent.js'),'web/js/hidden-relations.js')
parts.insert(parts.index('web/js/simulation.js'),'web/js/tactical-state.js')
parts.insert(parts.index('web/js/simulation.js'),'web/js/tactical-actions.js')
parts.insert(parts.index('web/js/simulation.js'),'web/js/tactical-settlement.js')
parts.insert(parts.index('web/js/simulation.js'),'web/js/negotiation-phase.js')
parts.insert(parts.index('web/js/app.js'),'web/js/tactical-view.js')
parts.insert(parts.index('web/js/deployment-preview.js') if 'web/js/deployment-preview.js' in parts else parts.index('web/js/app.js'),'web/js/hidden-view.js')
parts.insert(parts.index('web/js/app.js'),'web/js/alliance-icon.js')
parts.insert(parts.index('web/js/app.js'),'web/js/deployment-preview.js')
parts.insert(parts.index('web/js/app.js'),'web/js/deployment-view.js')
parts.insert(parts.index('web/js/app.js'),'web/js/state-colors.js')
parts.insert(parts.index('web/js/app.js'),'web/js/card-facts.js')
parts.insert(parts.index('web/js/app.js'),'web/opening-preview/opening.js')
parts.insert(parts.index('web/js/controller.js'),'web/js/crisis.js')
parts.insert(parts.index('web/js/result-view.js'),'web/js/crisis-view.js')
parts[0:0]=['web/js/equipment-data.js','web/js/equipment-shop.js','web/js/equipment-ui.js']
data={k:json.loads((ROOT/'data'/f'{k}.json').read_text()) for k in ['roster','agendas','events','leadership','offices','relationships','backgrounds','policy-platforms','policy-relations','working-groups','regional-links','alliance-definitions','alliance-tags','hidden-relations','negotiation-scenes','news-events','crises','tactical-effects','pss-profiles']}
data['gameRecruitmentBans']=True
data['pssProfiles']=data.pop('pss-profiles')
data['tacticalEffects']=data.pop('tactical-effects')
data['newsEvents']=data.pop('news-events')
data['hiddenRelations']=data.pop('hidden-relations');data['negotiationScenes']=data.pop('negotiation-scenes')
data['allianceDefinitions']=data.pop('alliance-definitions');data['allianceTags']=data.pop('alliance-tags')
data['workingGroups']=data.pop('working-groups');data['regionalLinks']=data.pop('regional-links')
data['portraits']=portrait_catalog(ROOT,data['roster'])
data['platforms']=data.pop('policy-platforms');data['policyRelations']=data.pop('policy-relations')
js='let CONTENT='+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';\n'
for name in parts:
 s=(ROOT/name).read_text();s=re.sub(r'^import .*?;\s*$','',s,flags=re.M);s=re.sub(r'\bexport (?=(const|(?:async )?function|class|let)\b)','',s)
 js+='\n'+s
 if name=='web/js/profiles.js': js+='\nCONTENT=apply_offices(CONTENT);\n'
style_paths=['web/styles/theme.css','web/style.css','web/styles/news.css','web/styles/portraits.css','web/styles/preparation.css','web/styles/cards.css','web/styles/equipment.css','web/opening-preview/opening.css','web/styles/faction-board.css','web/styles/crisis.css']
styles=[]
for name in style_paths:
 css=(ROOT/name).read_text()
 if name=='web/styles/news.css':
  for token,filename,mime in [('__NEWS_FONT__','UnifrakturMaguntia-Book.ttf','font/ttf'),('__NEWS_EAGLE__','bundestag-eagle.png','image/png'),('__NEWS_REICHSTAG__','reichstag.svg','image/svg+xml')]:
   encoded=base64.b64encode((ROOT/'web/assets/news'/filename).read_bytes()).decode()
   css=css.replace(token,f'data:{mime};base64,{encoded}')
 if re.search(r'^\s*(?:import|export|const|let|function)\b',css,re.M):
  raise ValueError(f'JavaScript found in stylesheet: {name}; refusing to overwrite index.html')
 if name=='web/style.css':
  for selector in ['.scoreboard{','.workspace{','.card{','.metrics{']:
   if selector not in css: raise ValueError(f'Missing core layout {selector} in {name}')
 styles.append(css)
html=(ROOT/'web/template.html').read_text().replace('/*STYLE*/','\n'.join(styles)).replace('/*SCRIPT*/',js.replace('</script','<\\/script'))
(ROOT/'index.html').write_text(html)
print('Built',ROOT/'index.html')
