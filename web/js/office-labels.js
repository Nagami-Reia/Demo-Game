const officeLabels={
 Bundeskanzler:['联邦总理','Federal Chancellor'],
 'Bundesminister der Finanzen':['财政部长','Minister of Finance'],
 'Bundesminister des Innern':['内政部长','Minister of the Interior'],
 'Bundesminister des Auswärtigen':['外交部长','Foreign Minister'],
 'Bundesminister der Verteidigung':['国防部长','Minister of Defence'],
 'Bundesministerin für Forschung, Technologie und Raumfahrt':['研究、技术与航天部长','Minister for Research, Technology and Space'],
 'Bundesminister für Verkehr':['交通部长','Minister of Transport'],
 'Bundesminister für Umwelt, Klimaschutz, Naturschutz und nukleare Sicherheit':['环境、气候保护与核安全部长','Minister for the Environment, Climate Action and Nuclear Safety'],
 'Bundesminister für Gesundheit':['卫生部长','Minister of Health'],
 'Bundesminister für Landwirtschaft, Ernährung und Heimat':['农业、食品与乡土事务部长','Minister of Agriculture, Food and Regional Identity'],
 'Bundesministerin für wirtschaftliche Zusammenarbeit und Entwicklung':['经济合作与发展部长','Minister for Economic Cooperation and Development'],
 'Bundesministerin für Wohnen, Stadtentwicklung und Bauwesen':['住房、城市发展与建设部长','Minister for Housing, Urban Development and Building'],
 'Bundesministerin für besondere Aufgaben / Chefin des Bundeskanzleramtes':['特别事务部长、总理府主任','Minister for Special Affairs and Head of the Chancellery'],
 'Bundestagspräsidentin':['联邦议院议长','President of the Bundestag'],
 'Vizepräsident/in des Deutschen Bundestages':['联邦议院副议长','Vice-President of the Bundestag']
};
export function office_label(office,lang='zh'){
 const label=officeLabels[office.role];if(label)return lang==='de'?office.role:label[lang==='en'?1:0];
 if(lang==='de')return office.role;
 const party=office.role.match(/^(CDU\/CSU|SPD|AfD|Grüne|Linke)-/)?.[1];
 if(party&&office.scope==='fraktion')return `${party} ${lang==='en'?'parliamentary group chair':'党团'+(office.role.includes('Ko-')?'共同主席':'主席')}`;
 if(party&&office.scope==='party')return `${party} ${lang==='en'?'party chair':'党主席'}`;
 return office.role; // A precise untranslated title is better than a generic invented one.
}
