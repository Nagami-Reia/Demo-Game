# 程序评分与战术资格核对

范围：核对当前代码及用户提供的对局摘要。此次未取得对应原始JSON，不能声称已完整重放该存档、核对每轮选人与每笔资金。未调整评分系数、CSU收入或跨党招募成本。

| Issue ID | Severity / Classification | Evidence | Root cause | Reproduction | Fix / disposition |
|---|---|---|---|---|---|
| PROC-01 | P0 BALANCE_RISK | 摘要R2战力39.00/40.02；当前代码复现程序分0.5/2.5 | 胜方2.5+0.5m，败方0.5(1−m)，m为战力差占总战力比例；平局双方1.5 | procedure-qualification-audit.test.mjs | 保留原公式，单独讨论是否改连续计分，不能当作重复结算bug |
| LAW-01 | P1 INSUFFICIENT_EVIDENCE（原案例未见异常） | 当前CSV标签中Wegge和Demir均为SPD法律与消费者保护工作组成员 | 主领域domains与旧links并非战术资格的完整数据；战术读取allianceTags与definitions | 两人实际ID组成队伍，法律工作组count=2且接手者属于members | 不撤销这对合法资格；未取得旧存档，不能确定旧版本当时数据 |
| LAW-02 | P1 CONFIRMED_BUG | 当前资格识别的法律正则曾把Menschenrechte匹配为Recht | 无词边界的德文子串匹配 | 仅两名人权工作组成员也会得到law能力 | 法律工作组匹配增加词边界；不改人数门槛，已回归 |
| DATA-01 | P1 DESIGN_LIMITATION（旧导出不自包含） | Green卡的旧links只涵盖部分合作关系，导出不包含其完整普通盟约资格 | profiles未把独立标签数据库的资格写入人物快照 | Droege等特殊ID有真实allianceTags，但旧快照无法从links看出 | 人物快照新增allianceTags和allianceMemberships（名称、分类、组织、来源）；ID不变、战斗不额外加成、历史结果不重写 |
| ECO-01 | P2 BALANCE_RISK | 摘要报告CSU余款155及隐藏收入119 | 收入与支出机会可能不匹配，但余额不能证明重复收益 | 需要原始资金日志逐笔核对 | 不削弱经济，不新增消费系统 |
| AI-01 | P2 DESIGN_LIMITATION | 摘要AI 9名SPD/5名Green | 普通跨党专家允许招募；现有关系成本仍可能被专业收益覆盖 | 需要原始阵容、行动与参数对照 | 不擅自改跨党惩罚或招募限制 |

程序分读取的是已实际结算的power，包括行动属性、领域匹配、新闻、谈判选择、战术及组织完整度/指挥等。组织等级、现金、总持有人数不直接等价于本轮有效战力。只出4人会少于5人的原始行动总量；程序分不会按出战人数平均归一化。上述属于当前公式含义，不凭输赢倒推bug。

新增资格回归同时验证：不把人权组当法律组；真实法律成员可以接力；Green常用名/特殊ID映射存在；程序分跳变与现公式一致。新增人物资格字段随正常owned导出及存档恢复使用，不引入新机关权限。

验证：独立HTML构建成功；完整自动回归222项通过，0失败。此次未取得原始对局JSON，尚未完成该局的逐轮重放验证。
