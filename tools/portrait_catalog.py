"""Build an optional local portrait index. No downloads and no surname-only guessing."""
from pathlib import Path
import json,re,unicodedata
from PIL import Image, ImageOps

def portrait_key(name):
    text=unicodedata.normalize('NFC',name).casefold()
    for a,b in [('ä','ae'),('ö','oe'),('ü','ue'),('ß','ss')]:text=text.replace(a,b)
    return ''.join(c for c in text if c.isalnum())

def portrait_catalog(root,roster):
    folder=root/'foto';config_path=root/'data/portraits.json'
    config=json.loads(config_path.read_text()) if config_path.exists() else {}
    facts_path=root/'research/union-official-profile-facts.json'
    facts=json.loads(facts_path.read_text()).get('profiles',[]) if facts_path.exists() else []
    official={p.get('url'):re.sub(r'^(?:(?:Prof\.|Dr\.|med\.|jur\.)\s*)+','',p.get('name','')) for p in facts}
    files=[p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in {'.jpg','.jpeg','.png','.webp','.avif'}] if folder.exists() else []
    result={}
    for card in roster:
        setting=config.get(card['id'],config.get(card['name'],{}))
        if isinstance(setting,str):setting={'file':setting}
        names=[card.get('displayName',''),card['name'],card['id'],official.get(card.get('assessment',{}).get('source'),''),*setting.get('aliases',[])]
        keys={portrait_key(n) for n in names if n}
        matches=[p for p in files if portrait_key(p.stem) in keys]
        if setting.get('file'):
            matches=[p for p in files if p.name==setting['file']]
        if len(matches)>1:
            print('Portrait ambiguous; set portraits.json file explicitly:',card['name']);continue
        if not matches:continue
        def bounded(key,default,lo,hi):
            value=setting.get(key,default)
            return max(lo,min(hi,value)) if isinstance(value,(int,float)) and not isinstance(value,bool) else default
        result[card['id']]={'file':'foto/'+matches[0].name,'x':bounded('x',75,0,100),'y':bounded('y',0,0,100),'height':bounded('height',65,30,90)}
        if all(k in setting for k in ['aspect','faceX','faceY','faceHeight']):
            result[card['id']].update(aspect=bounded('aspect',1,0.1,10),faceX=bounded('faceX',.5,0,1),faceY=bounded('faceY',.25,0,1),faceHeight=bounded('faceHeight',.3,.05,1))
        # Image proportions come from the actual asset, never a square default.
        with Image.open(matches[0]) as original:
            oriented=ImageOps.exif_transpose(original)
            result[card['id']]['aspect']=oriented.width/oriented.height
    return result
