# 提示阅读时间与机构职责

## 动画参考

实际阅读了同人仓库的[toasts.js](https://github.com/sganggs/Stronghold-Protocol/blob/master/public/js/ui/toasts.js)、[turnBanner.js](https://github.com/sganggs/Stronghold-Protocol/blob/master/public/js/ui/turnBanner.js)、[transitions.js](https://github.com/sganggs/Stronghold-Protocol/blob/master/public/js/ui/transitions.js)。通知与阶段横幅使用不同节奏，并将退出与停留区分。本游戏重新实现，不使用其官方图片或Preact组件。

阶段提示从440ms改为2400ms，约192ms入场、1992ms稳定阅读、216ms退出；成交提示2800ms。连续阶段提示取消旧动画并重置阅读时间，成交提示只保留最新一条避免堆满。减少动态效果时保留相同阅读时间，只停用位移；提示仍不阻挡操作。卡面选择不引发整组动画。

## 政府和委员会

机构职责与党籍、等级、党团控制分开。政府职责最高+0.4，委员会工作最高+0.3，按议题领域权重折算。同类多个头衔取最大匹配值，不逐头衔叠加；已有部长领域加成时不再重复给政府职务加成。历史头衔和中立主席团不触发。

机构来源来自已经逐页读取的官方议员资料：目前新增覆盖175名Union历史卡池人物，共258条政府或委员会任职记录；同时支持其他党派卡牌中已有的verified_current委员会/行政职务。没有将未核实的其他党派成员默认填成委员会成员，也没有据党籍猜委员会；这不是全630人委员会名单完成考据的声明。具体源链接保留在每条institutionalRoles中，卡面可折叠查看；回放列明政府职责/委员会分工的实际加成。

委员分组依据官方个人页“Bundestag”分类下的委员会名；资料未区分正式/候补时不编造精确席位等级。任职事实与0.4/0.3系数分开，后者是游戏平衡设定，不是现实职务能力量化。新增机构权限不自动赋予全党纪律或整党动员。
