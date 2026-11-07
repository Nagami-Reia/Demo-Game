// Optional local assets: no remote requests or guessed image URLs on missing cards.
export function portrait_spec(card,catalog={}){
 const p=catalog[card.id];
 if(!p||typeof p.file!=='string'||!p.file.startsWith('foto/')||p.file.includes('..'))return null;
 const value=(k,f,lo,hi)=>Number.isFinite(p[k])?Math.max(lo,Math.min(hi,p[k])):f;
 return {url:p.file.split('/').map(encodeURIComponent).join('/'),x:value('x',75,0,100),y:value('y',0,0,100),height:value('height',65,30,90),aspect:value('aspect',1,.1,10),faceX:value('faceX',.5,0,1),faceY:value('faceY',.25,0,1),faceHeight:value('faceHeight',.3,.05,1)};
}
export function portrait_style(p){return p?`;--portrait-url:url(&quot;${p.url}&quot;);--portrait-position:${p.x}% ${p.y}%;--portrait-height:${p.height}%`:'';}

// Face anchors were inspected on each source photograph; only the display crop changes.
export function portrait_geometry(p,width,areaHeight=289){
 const faceSize=Math.min(130,Math.max(86,width*.48));
 // The photo itself reaches both vertical edges; the source stays unmodified.
 const height=Math.max(faceSize/p.faceHeight,areaHeight),imageWidth=height*p.aspect;
 const y=Math.max(areaHeight-height,Math.min(0,88-p.faceY*height));
 return {width:imageWidth,height,x:width*.73-p.faceX*imageWidth,y};
}

let cardPortraitObserver;
export function refresh_portraits(root=document,catalog={}){
 cardPortraitObserver?.disconnect();
 const cards=[...(root.querySelectorAll?.('.has-portrait')||[])];
 const fit=card=>{const layer=card.querySelector('.card-portrait'),p=layer?._portraitSpec;if(!layer||!p)return;const rect=card.getBoundingClientRect(),edge=layer.getBoundingClientRect(),attributes=card.querySelector('.attributes');const areaHeight=attributes?Math.max(1,attributes.getBoundingClientRect().top-edge.top):289;layer.style.height=`${areaHeight}px`;const g=portrait_geometry(p,rect.width,areaHeight);const photo=layer.querySelector('.portrait-photo');if(photo){photo.style.width=`${g.width}px`;photo.style.height=`${g.height}px`;photo.style.left=`${g.x}px`;photo.style.top=`${g.y}px`;}};
 for(const card of cards){const p=portrait_spec({id:card.dataset.portraitId},catalog);if(p){card.querySelector('.card-portrait')._portraitSpec=p;fit(card);}}
 if(typeof ResizeObserver!=='undefined'){cardPortraitObserver=new ResizeObserver(entries=>entries.forEach(e=>fit(e.target)));cards.forEach(card=>cardPortraitObserver.observe(card));}
}
