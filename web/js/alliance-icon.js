const allianceGlyphs={
 legal:'<path d="M10 3v14m-5 0h10M3 6h14M5 6l-2 5h4zM15 6l-2 5h4z"/>',
 security:'<path d="M10 3l6 3v4c0 3-2 5-6 7-4-2-6-4-6-7V6z"/>',
 economy:'<path d="M4 15v-4m6 4V8m6 7V5M3 17h14"/>',
 social:'<path d="M10 5v10m-5-5h10"/>',
 climate:'<path d="M4 14C2 7 10 4 16 4c-1 7-4 12-10 11m-2 2 8-8"/>',
 digital:'<rect x="6" y="6" width="8" height="8"/><path d="M8 4v2m4-2v2m-4 8v2m4-2v2M4 8h2m-2 4h2m8-4h2m-2 4h2"/>',
 foreign:'<circle cx="10" cy="10" r="6"/><ellipse cx="10" cy="10" rx="2.5" ry="6"/><path d="M4 10h12"/>',
 institution:'<path d="M3 8l7-4 7 4M4 9h12M6 10v5m4-5v5m4-5v5M4 16h12"/>',
 regional:'<path d="M10 17c2-3 5-5 5-8a5 5 0 0 0-10 0c0 3 3 5 5 8z"/><circle cx="10" cy="9" r="1.5"/>',
};
function alliance_glyph(route){
 const de=route.name?.de||'',zh=route.name?.zh||'';
 if(route.category==='state')return allianceGlyphs.regional;
 if(route.id==='legal'||/\b(?:Recht|Justiz)\b/i.test(de)||/司法|法律/.test(zh))return allianceGlyphs.legal;
 if(/\b(?:Innen|Inneres|Innenpolitik|Verteidigung)\b/i.test(de)||/内政|国防/.test(zh))return allianceGlyphs.security;
 return allianceGlyphs[route.domains?.[0]]||allianceGlyphs.institution;
}

export function alliance_ring(route,target){
 const segment=100/target;
 const arcs=Array.from({length:target},(_,i)=>
  `<circle class="alliance-segment${i<route.count?' is-lit':''}" cx="16" cy="16" r="14" pathLength="100" stroke-dasharray="${segment-3.5} ${100-segment+3.5}" transform="rotate(${-90+(i+.5)*360/target-(segment-3.5)*1.8} 16 16)"/>`).join('');
 return `<svg class="alliance-ring" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle class="alliance-ring-center" cx="16" cy="16" r="10"/>${arcs}<g class="alliance-ring-glyph" transform="translate(7 7) scale(.9)">${alliance_glyph(route)}</g></svg>`;
}
