# 第21届联邦议院完整人物卡池

核验日期：2026-11-05。现有 `roster.json` 共 **630人**，采用 **2025-03-25第21届议会成立时点**，不是2026年11月实时席位/职务/党籍数据库。

## 官方数据与署名

来源：**Die Bundeswahlleiterin, Wiesbaden 2025**。

- [官方当选议员下载入口](https://www.bundeswahlleiterin.de/bundestagswahlen/2025/gewaehlte.html)
- [CSV官方ZIP](https://www.bundeswahlleiterin.de/dam/jcr/eeb02132-caeb-430a-ae1f-6cd5907f1809/btw25_gewaehlte_utf8.zip)，内部 `btw25_gewaehlte_utf8.csv`，最终结果，数据时间2025-03-12 09:05。
- [官方递补记录](https://www.bundeswahlleiterin.de/dam/jcr/0a69949e-27cc-48c5-aff4-cdb1ff30a4ed/btw25_nachfolger.pdf)：Schnurrbusch拒绝就任，Alexis Giersch于2025-03-25成为议员。卡池据此替换。2025-06以后递补不纳入本快照。
- ZIP SHA-256：`c9edfde04946814a1c2fd45ca5da65f075fa62de6703e57b55ff9eb938641127`。
- 源数据声明：[Datenlizenz Deutschland – Namensnennung – Version 2.0](https://www.govdata.de/dl-de/by-2-0)。请在分发时保留本署名及修改说明。

党派数量按2025当选口径：CDU164、CSU44、SPD120、AfD152、Grüne85、Die Linke64、SSW1，总计630。JSON `Linke` 对应 Die Linke。SSW人物可进入公共卡池，无需因此增加初始阵营。FDP没有2025当选议员，未作为现役人物党团填入。

仅导入游戏所需姓名、党派及来源，没有导入CSV中的住址、邮编、出生地等个人细节。保留最初30张卡的ID、名称和既有数值；新增条目使用由正式姓名规范化而来的 `mdb_...` ID。初始30人的名称采用常用简写，新导入者可能含多个正式名字。这不是虚构人物或重复副本。

2025成立快照包含当时在任、后来离任的人物，如Baerbock、Habeck；这不表示其2026仍在任。现行查询应切换另一时期快照并按递补记录更新，不应静默覆盖历史快照。源文件的党派是当选党派，不能用来推断后来退党/转党。

## 属性：明确为游戏设定

`resources`、`leadership`、`negotiation`、`oratory`、`expertise`、`resilience` 全部为整数1–5。`tier` 为1–6游戏稀有度；`domains` 取 economy/social/climate/security/digital/foreign。

**所有数值及领域均是游戏设计假设，不是客观个人能力、道德评价、心理测量或现实预测。** 官方CSV仅核实名字、当选身份与当选党派，不能引用它证明领导力、口才或韧性评分。全员含 `attribute_status: GAME_DESIGN_ASSUMPTION_NOT_MEASURED_ABILITY`。

- 初始30张卡保留已有原型设计；新增四项数值使用姓名SHA-256的不同字节稳定映射至1–5，便于产生可复现的原型差异，不冒称逐人研究得到。
- 新增600名的优势领域以源数据职业关键词作粗略游戏分类（社会服务、技术、法律、经济）；没有匹配的使用稳定散列分工。**散列生成的分工不表达现实专长**。
- 新增人物的T1/T2参考CSV是否前届当选标记，以原型卡池构成为目的；并非精确职位层级。原30人中的T3–T5保留设计。T6保留未来特殊游戏版本，不为凑档虚构现实职位。
- 这些数值是可玩的完整基础配置，后续可独立逐人调校，不影响人物身份资料。不要对外声称630个人物已经完成深度考据。
- 与箱庭Persona按实际ID映射匹配；未匹配人物采用轻量游戏属性，不代表已拥有完整人格档案。

## 校验

导入脚本验证：630条、630个唯一ID、初始30个ID全部保留、六项数值都在1–5内；总党派人数与官方选举结果相符。属性字段齐全，可由界面直接展示和电脑策略读取。
