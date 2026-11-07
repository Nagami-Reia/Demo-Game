# 职务身份审计：历史快照与当前可验证职务

核查日：2026-11-05。只采用官方党团、联邦议院、政府和党派原始页面。offices.json是已核查职务增补，不是630名人物所有现任职务的完整目录。influence与domains映射是游戏假设，不是官方能力测量。`historical`不得作为当前职务触发；`verified_current`表示核查当日官方页面仍列该职务，非永久有效。

## Jens Spahn：必须纠正

[CDU/CSU当前领导页](https://www.cducsu.de/fraktion)列Thorsten Frei为Fraktionsvorsitzender。[2026-07-29党团选举公告](https://www.cducsu.de/presse/thorsten-frei-zum-neuen-vorsitzenden-der-cducsu-fraktion-gewaehlt)明确在Spahn辞任后选出Frei。[同日原始报道](https://www.cducsu.de/aktuelles/thorsten-frei-neuer-vorsitzender-der-cducsu-fraktion)同样称Spahn为前任，并说明其辞职在此前约两周。没有以新闻争议细节推导人物属性。

因此Spahn的党团主席仅保留为2025历史职务，当前不赋予党团主席权限。官方材料足以证明卸任党团主席，不能据此扩张为退出CDU、退出党团或退出Bundestag；这些额外断言未证实。由于本次读到的党团公告未给精确辞职日，未编造valid_to精确日期。Frei现任党团主席valid_from=2026-07-29。

## 当前政府与2025内阁已不同

[当前联邦内阁总表](https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett)已实际读取，列出Merz、Klingbeil、Dobrindt、Wadephul、Pistorius、Reiche、Bär、Hubig、Prien、Schweitzer、Wildberger、Bilger、Schneider、Linnemann、Rainer、Alabali Radovan、Hubertz、Warken。

- [Warken官方履历](https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett/nina-warken-2342850)明确：2025-05-06至2026-07-29为卫生部长，自2026-07-29任总理府负责人。
- [Linnemann当前卫生部长页面](https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett/carsten-linnemann-2448406)与总表一致。
- [Bilger当前交通部长页面](https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett/steffen-bilger-2448424)与总表一致，不能继续以Schnieder作为当前交通部长。
- [Schweitzer当前劳动部长页面](https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett/alexander-schweitzer-2456608)与总表一致，Bas不得保留当前劳动部长权限。
- Reiche、Hubig、Prien、Schweitzer、Wildberger未在读取到的2025当选roster中找到，**不虚构MDB卡牌ID**；政府任职并不要求具备Bundestag议员席位。当前职务文件仅写能匹配现有人物ID者。

## 其他党团

- [Miersch当前SPD人物页](https://www.spdfraktion.de/abgeordnete/miersch)：检索内容明确仍列自2025-05-07担任主席；直接打开曾403，证据强度低于完整读到页面者，保留该限制。
- [Grüne官方领导页](https://www.gruene-bundestag.de/wir-im-bundestag/unsere-fraktion/fraktionsvorsitz-und-fraktionsvorstand/)：Dröge、Haßelmann。
- [联邦议院AfD页](https://www.bundestag.de/parlament/fraktionen/afd)：Weidel、Chrupalla。
- [联邦议院Linke页](https://www.bundestag.de/parlament/fraktionen/linke/linke-245198)：Reichinnek、Pellmann。
- [CDU/CSU原始2026-07-29报道](https://www.cducsu.de/aktuelles/thorsten-frei-neuer-vorsitzender-der-cducsu-fraktion)：Hoppermann改任CDU秘书长。党组织权限与党团投票协调不同。

## 历史数据范围

roster全部人物仅根据2025-03-25成立名单记录historical mandate。这证明当时进入议会，不证明每人截至2026-11-05仍在任、党籍未变或没有其他职务。原leadership.json历史条目整体纳入historical，避免2025职务暗中当作实时事实。未核查现职的普通人物只显示“2025成立快照议员”，不得写“现任普通议员”或声称完成所有630人当前身份核查。

Bas在2025-06-27的党主席身份是历史可证；本次未读到可用的最新SPD官方职务页，故不以旧新闻或旧当选声明维持其当前党主席权限。van Aken同样仅保留已验证的2025历史党主席身份。普通部长不是党团主席；部门专业域不等同于可控制整党投票。

## 接入规则

当前模式只取status=verified_current，不让historical触发现任权限。2025-07历史模式按as_of/有效期选择历史职务，不能混入2026新任职务。相同人物的minister、executive、party、fraktion权限各自作用，禁止重复叠加成100%跟票。文件没有覆盖的职务应显示“当前职务未核查”，不要由tier、leadership数值或姓名猜测。

## 当前党主席补核

- [CDU第38届党代会](https://www.cdu.de/38-parteitag/)列2026-02 Merz再次当选主席，补入当前party。
- [SPD当前领导页](https://www.spd.de/ueber-uns)已成功完整读取，列Klingbeil为Parteivorsitzender，不列Bas；[SPD地方组织的原始声明](https://www.spd-kreis-neuss.de/daniel-rinkert-zum-ruecktritt-von-baerbel-bas-und-zum-sonderparteitag-der-spd/)2026-10-12明确感谢Bas此前党主席与部长工作（检索原文可见，页面直接打开失败）。结合政府现任名单，Bas不转为当前，历史valid_to补2026-10-12。
- [AfD 2026-07-04原始选举公告](https://www.afd.de/pressemitteilung-der-afd-bundesparteitag-waehlt-neuen-bundesvorstand/)完整读取，Weidel/Chrupalla仍为Bundessprecher。
- [Grüne当前联邦领导页](https://www.gruene.de/leute/unser-bundesvorstand)完整读取，Brantner/Banaszak为党主席；与Dröge/Haßelmann的党团领导不同。
- [Linke 2026–2028领导名单](https://www.die-linke.de/partei/parteidemokratie/parteivorstand/parteivorstand-2026-2028/)官方检索列Schwerdtner/Pantisano；主页面打开两次超时，另核对[党地方组织原始祝贺声明](https://www.kornwestheim.die-linke-bw.de/politik/aktuelles/detail/news/die-linke-bawue-gratuliert-ines-schwerdtner-und-luigi-pantisano-zur-wahl-als-parteivorsitzende/)。van Aken不转当前。

## 旧高阶卡逐人审计及稀有度建议

游戏稀有度不等于现任职位。以下是当前读取roster中全部T4/T5卡（18人），不是默认只有这些人有高位。新任部长/党主席的游戏稀有度需单独平衡，不能仅靠旧30人名单。

|人物|当前核查|建议|
|---|---|---|
|Bas|前劳社部长/前党主席，仅历史|若T4原以现任部长为由，应降T3或保留T4但明确历史稀有卡，现任加成清零|
|Bär|现科研技术航天部长|T4可保留；不授党团主席权限|
|Chrupalla|现党与党团共同主席|T4可保留；同人多职效果需封顶|
|Dobrindt|现内政部长|T4可保留；不是现CSU议会领袖|
|Dröge|现Grüne党团共同主席|T4可保留|
|Frei|现CDU/CSU党团主席，前总理府负责人|T4可保留，权限必须换职|
|Haßelmann|现Grüne党团共同主席|T4可保留|
|Klingbeil|现财政部长及SPD党主席|T5可作为稀有度保留；不是现SPD党团主席|
|Klöckner|现议院主席，补presidium身份|T4可保留；中立主持不转为全党拉票加成|
|Merz|现总理及CDU党主席|T5可保留；不是现联合党团主席|
|Miersch|现SPD党团主席|T4可保留|
|Pellmann|现Linke党团共同主席|T4可保留|
|Pistorius|现防长|T4可保留；不授党团主席权限|
|Reichinnek|现Linke党团共同主席|T4可保留|
|Spahn|前联合党团主席|建议T3；删除现任全党/党团主席标签|
|Wadephul|现外长|T4可保留；不授党团主席权限|
|Warken|现总理府负责人，前卫生部长|T4可保留，领域/权限换职|
|Weidel|现党与党团共同主席|T5可作为稀有度保留；不等于法定职位比其他共同主席高|

本次不直接修改roster稀有度，避免与父任务并发冲突。新增8条党主席均以已核实官方来源为依据，影响值仍为游戏假设。
