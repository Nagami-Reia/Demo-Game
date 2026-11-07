// UI shades adapted from the Länder coats of arms in bpb's HanisauLand overview.
const stateColors={
 'Baden-Württemberg':'#84600b', Bayern:'#226fa5', Berlin:'#36363b',
 Brandenburg:'#ab2840', Bremen:'#913e50', Hamburg:'#b02c2c',
 Hessen:'#294e8f', 'Mecklenburg-Vorpommern':'#3b6384', Niedersachsen:'#932520',
 'Nordrhein-Westfalen':'#296d49', 'Rheinland-Pfalz':'#742b37', Saarland:'#354678',
 Sachsen:'#306b33', 'Sachsen-Anhalt':'#73591d', 'Schleswig-Holstein':'#235c6d',
 Thüringen:'#394c9a'
};
const stateAbbreviations={
 'Baden-Württemberg':'BW', Bayern:'BY', Berlin:'BE', Brandenburg:'BB',
 Bremen:'HB', Hamburg:'HH', Hessen:'HE', 'Mecklenburg-Vorpommern':'MV',
 Niedersachsen:'NI', 'Nordrhein-Westfalen':'NRW', 'Rheinland-Pfalz':'RP',
 Saarland:'SL', Sachsen:'SN', 'Sachsen-Anhalt':'ST', 'Schleswig-Holstein':'SH', Thüringen:'TH'
};

export function state_accent(state){
 return Object.hasOwn(stateColors,state)?stateColors[state]:'';
}

export function state_abbreviation(state){
 return Object.hasOwn(stateAbbreviations,state)?stateAbbreviations[state]:'';
}
