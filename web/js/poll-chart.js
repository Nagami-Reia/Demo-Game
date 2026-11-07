import {poll_share} from './environment.js';
// Older exports contain full round-end `polls.after` rows, newer ones snapshots.
export function poll_series(g){
 const rounds=g.history||[],first=rounds[0]?.result?.polls||[];
 const initial=g.pollReference||Object.fromEntries(first.map(c=>[c.party,c.before]));
 const snapshots=[{round:0,shares:initial},...rounds.map(h=>({round:h.round,shares:h.result.pollShares||Object.fromEntries((h.result.polls||[]).map(c=>[c.party,c.after]))}))];
 return g.players.map(p=>({party:['CDU','CSU'].includes(p.party)?'CDU/CSU':p.party,values:snapshots.map(s=>({round:s.round,value:(['CDU','CSU'].includes(p.party)?Number.isFinite(s.shares.CDU)&&Number.isFinite(s.shares.CSU):Number.isFinite(s.shares[p.party]))?poll_share(s.shares,p.party):null}))}));
}
export function poll_chart(g,t,esc){
 const series=poll_series(g);if(!series.some(s=>s.values.some(v=>v.value!==null)))return '';
 const roundMax=Math.max(1,...series.flatMap(s=>s.values.map(v=>v.round)));
 const values=series.flatMap(s=>s.values.filter(v=>v.value!==null).map(v=>v.value));
 const lo=Math.max(0,Math.floor(Math.min(...values)-2)),hi=Math.min(100,Math.max(lo+5,Math.ceil(Math.max(...values)+2)));
 const y=v=>180-(v-lo)/(hi-lo)*150;
 return `<section class="panel finale-chart poll-chart"><h2>${t('pollTrajectory')}</h2><p class="muted">${t('pollChartNote')}</p><svg viewBox="0 0 680 220" role="img" aria-label="${t('pollTrajectory')}">${[lo,(lo+hi)/2,hi].map(v=>`<path d="M45 ${y(v)}H640" stroke="currentColor" opacity=".15"/><text x="2" y="${y(v)+4}" fill="currentColor" font-size="12">${v.toFixed(1)}%</text>`).join('')}${series.map((s,i)=>{let segments=[],current=[];for(const p of s.values){if(p.value===null){if(current.length)segments.push(current);current=[];}else current.push(p);}if(current.length)segments.push(current);return segments.map(segment=>`<polyline points="${segment.map(p=>`${45+p.round/roundMax*595},${y(p.value)}`).join(' ')}" fill="none" stroke="${i?'var(--muted)':'var(--accent)'}" stroke-width="${i?3:4}" ${i?'stroke-dasharray="8 5"':''}/>${segment.map(p=>`<circle cx="${45+p.round/roundMax*595}" cy="${y(p.value)}" r="3" fill="${i?'var(--muted)':'var(--accent)'}"><title>${esc(s.party)} · ${t('round')} ${p.round}: ${p.value.toFixed(2)}%</title></circle>`).join('')}`).join('');}).join('')}${Array.from({length:roundMax+1},(_,r)=>`<text x="${45+r/roundMax*595}" y="205" fill="currentColor" font-size="12" text-anchor="middle">${r}</text>`).join('')}</svg><p>${series.map((s,i)=>`${i?'┄':'━'} ${esc(s.party)} · ${s.values.at(-1)?.value?.toFixed(2)??'—'}%`).join('　')}</p></section>`;
}
