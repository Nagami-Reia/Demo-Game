# 党团纪律、领袖外溢与副作用：依据与边界

核查日期2026-11-05。leadership.json为2025年政府成立时期的历史职务配置，Bas党主席条目从2025-06-27才成立；不得在5月提前启用。文件不是2026年当前职务表。influence全部是0–1游戏假设，不是实测动员率、能力排名或现实个人心理。

## 已实际读取的原始来源

1. [基本法第38条](https://www.gesetze-im-internet.de/gg/art_38.html)：议员代表全体人民，不受命令约束，只服从良心。不得用领袖卡直接覆盖全党所有个人决策。
2. [联邦议院：Fraktionsdisziplin](https://www.bundestag.de/services/glossar/fraktionsdisziplin-857034)：共同路线来自讨论，不存在法律上的强制党团投票；成员可预告异议。这支持协调压力，不支持“必定跟票”。
3. [联邦议院2025党团领导改组](https://www.bundestag.de/dokumente/textarchiv/2025/kw10-fraktionsvorstaende-1056150)：Spahn于5月5日接Merz任联合党团主席；Miersch于5月7日接Klingbeil。Weidel/Chrupalla、Dröge/Haßelmann、Reichinnek/Pellmann分别是另三党团双主席；部长、党主席、党团主席必须分开。
4. [SPD 2025-06-27主席选举](https://www.spd.de/service/pressemitteilungen/detail/news/baerbel-bas-und-lars-klingbeil-als-spd-vorsitzende-gewaehlt/27/06/2025)：Bas与Klingbeil是党主席，不是SPD党团双主席；当选日期不能提前到政府成立日。
5. [Die Linke：Jan van Aken历史党领导页](https://www.die-linke.de/partei/parteidemokratie/parteivorstand/parteivorstand-2024-2026/mitglieder-des-parteivorstandes/jan-van-aken/)：自2024年10月为共同党主席。与Reichinnek/Pellmann的党团职务不同；其全国党组织影响不能当作直接指挥议会票。
6. [联邦议院：秘密选举](https://www.bundestag.de/services/glossar/geh-wahl-245424)：总理等人事选举采用秘密票；法律草案等事项表决不能秘密进行。因此公开票与秘密选举必须分开规则；秘密票无法逐人确定叛离者。
7. [联邦议院：记名表决](https://www.bundestag.de/services/glossar/nam_abst-245502)：记名表决发布名单及结果，部分程序事项不可记名。普通公开表决并不全部等于记名票。
8. [CDU 2025党代会原始页面](https://www.cdu.de/37-parteitag/)：2025年2月材料标明Merz为党主席；结合5月党团改组，不能保留他同时拥有当时已卸任的党团主席权限。
9. [联邦内阁官方入口](https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett)：用于交叉核查行政职务。动态页面不应覆盖历史快照。

## 学术来源核查限制

查到Ulrich Sieberer (2006), *Party Unity in Parliamentary Democracies: A Comparative Analysis*, DOI [10.1080/13572330600739413](https://www.tandfonline.com/doi/abs/10.1080/13572330600739413)，出版社检索摘要将一致性解释为议员面对制度激励与约束的个人决策结果。然而出版社正文返回403，大学[作者存储入口](https://madoc.bib.uni-mannheim.de/6243/)受到验证页面限制，**未读到全文**。不据此填写德国2025党团服从率，也不声称验证了具体惩罚或领导谈判因果系数。以上8项实际可读取官方来源支撑制度边界；学术全文复核仍待补足。

## 对游戏规则的约束

- 党团领导的谈判结果可以通过已传递的党团建议、组织协调与共同议题，有限影响该党团未部署成员的倾向；必须显式记录领导权限、信息传递、政策相容性和关系。不是购买领袖就获得其全党控制权。
- scope=fraktion只代表所属党团协调；CDU/CSU是联合党团，不能让CDU领袖仅凭相同party字符串随意控制其他党团。scope=party作用于党组织沟通；executive作用于政府议程/资源协调。scope之间不得无条件互换。
- 双主席/多重职务效果需设共享上限，不能简单累加成超过100%的跟随率。co-leader influence相同只是设计对称性，不是两位真实人物能力相等的断言。
- 协调的正面作用可设计为降低谈判成本、提高共同方案可执行性、形成可预测的公开立场；这些是对制度功能的游戏化解释，数值尚未实证校准。
- 副作用可设计为让步引起的政策目标损失、对另一党团的承诺成本、争议带来的内部异议，以及重复施压的关系损伤。官方材料支持异议可能存在，并不证明某领袖必然引起这些心理反应；具体反馈必须标为模型假设并有上下限。
- 秘密选举保留个体决定和不确定性；日志只显示依法公开的总数，不对未知个人票构造“背叛名单”。不能把秘密投票参数机械套用在法案表决上。
- 公开记名票允许后续人物根据实际可见投票行为更新关系；非记名公开表决则不能自动获得每人精确记录。游戏私有全知日志不等于人物可用情报。
- 高一致性可能来自共同政策偏好而非纪律惩罚，不能仅观察同票就推断领袖控制。领袖谈判成功和党团跟票之间的外溢系数应单独做敏感性测试，不从tier或部长身份自动生成。

## 数据适用

leadership.json允许同一个id有多项有来源职务；调用方按as_of和scope过滤并设效果总上限。没有为普通T4部长自动赋予党团领袖身份。不存在于roster的人员不会填入。全套2025研究并未穷尽所有委员会主席，缺少条目表示未核查，不表示该人没有职务。
