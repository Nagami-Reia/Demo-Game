# 卫戍协议盟约叠层：源码核查

核查日期：2026-11-06。读取的是 sganggs/Stronghold-Protocol 的固定提交 `f07b8965061bbc311ad7aa815879b09264a1e47d`，以下结论来自实际实现与数据；不是仅根据 README 推测，也不把这个社区复刻的细节全部宣称为官方客户端规则。源码里的 `[ASSUMED]` 仍是复刻作者的假设。

## 最重要的区别

**人数激活、跨回合累计层数、战斗中暂时叠的增益是三个不同变量。** 不是“凑三人，固定加一点属性”就叫盟约叠层，也不是每次花掉全部层数换一次效果。

|状态|源码保存位置|什么时候改变|用途|
|---|---|---|---|
|人数 count / 阶段 tier|`computeBonds()` 每次从棋盘重算|上阵、退场、变形同构、人数修正|决定是否激活、是否到更高人数门槛|
|持久层数 layers|`PlayerState.layers[bondId]`|购买/获得/准备期结束/战斗特质等事件|按不同公式强化盟约，跨回合保留|
|临时增益 stack|单位的 buffs（如萨尔贡）|开技能增加，独立计时到期|决定此刻有几层攻速/攻击力增益|

保存层数见 [PlayerState.js:207](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/match/PlayerState.js#L207)。[bondsMeta.js 的 membership/rawCount/computeBonds](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/match/bondsMeta.js#L54)把场上不同角色、手牌是否参与、精锐计数等分别处理；一般同角色普通/精锐不重复算人数，绝技等例外按 countMode 单独处理。`computeBonds()` 把旧 layers 带回新的激活状态，没有因为缺人数删掉历史层数。调和加的是核心盟约激活人数，不是给每条盟约凭空加持久层数。

## 加层入口、保留与防止重复

1. 准备期通过 [PlayerEconomy.addLayers():44](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/match/player/economy.js#L44)写入持久层数、重新计算盟约，随后发 `onLayers`。`requireActive` 由具体来源决定；不能概括为所有来源都必须先激活，或者所有来源都无条件有效。
2. 战斗中通过 [gainLayers():409](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/support/index.js#L409)检查是否允许叠层、是否激活以及该来源的局内额度，再调用 [BattleEconomy.addLayers():22](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/battle/economy.js#L22)。它同时更新战斗副本和本场 `layerGains`，因此本场后续效果即可读取新层数。
3. 正常战斗结束后，[settle.js:64](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/match/match/settle.js#L64)将本场增量并回持久层数。[player/round.js:14](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/match/player/round.js#L14)重置当轮买卖/刷新统计，不重置 layers。预览结果的 `pendingLayerGains` 与持久入账分开，避免显示提前入账变成重复生产。
4. [constants.js:107](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/shared/constants.js#L107)统一上限 **999**；`layerGainRoom` 只返回余量。到顶实际增量为0，不再发 `onLayers`，防止空事件继续奖励。每条盟约单独封顶；部分角色另有每场次数/层数上限，不能理解成每个人都能无限刷。对应回归测试见 [layercap.test.js](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/test/match/layercap.test.js)。

## 三条完整构筑链

### 1. 小满＋获得干员：持久层数直接变攻击力

角色数据 `chess_char_2_04_a` 指向 `garrison_31_a`。[garrisons.json](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/data/garrisons.json)把该特质定义为准备期结束，按本轮获得干员数为已激活的炎加层，普通小满系数1。

**触发 → 加层 → 读取 → 正反馈：**

- 小满在场、炎已激活，准备期结束；`SERVER_ADD_BOND_METHOD.run()` 的 `round_gain_char` 分支读取 `roundStats().gainedChess`，乘 `multi`，写入炎层数。入口见 [garrisons/meta.js:145](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/garrisons/meta.js#L145)。不是直接按当前手牌数，也不是买了又卖就删去历史贡献。
- [installYan():188](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/bonds/core.js#L188)读取炎持久层数 L，给成员 `0.23 + 0.009L` 攻击力增幅；`onLayers` 使战斗内新层数也能更新效果。
- 例：L=20 时攻击倍率1.41；本轮获得4名干员，加4后倍率1.446。层数未被消费，下轮仍是24起步。数值来自该提交的 [bonds.json](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/data/bonds.json)。
- 6名炎又开出基于成员开战属性总和的炎佑；这是**人数升级的额外功能**，与L的连续成长叠加，而非取代L。购买/获得路线支持战斗成长，战斗变强再降低漏怪风险，但代码没有把每点伤害自动转钱。

### 2. 菲莱＋频繁开技能：L延长独立临时增益，产生重叠收益

`chess_char_3_06_a` 的 `garrison_43_a` 设置 `IN_BATTLE / act1autochess_gar_event_useskill / bond_add_count:6 / sargonShip`。[garrisons/battle.js:283](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/garrisons/battle.js#L283)监听该角色 `skillStart`，调用 [fireGain():215](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/garrisons/battle.js#L215)，只给已激活目标盟约加6层。

- [installSargon():220](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/bonds/core.js#L220)在成员开技能时读取当时L；每名在场成员获得一层+12攻速，持续 `5+0.22L` 秒。
- 每次增益使用 `refresh:'independent'`，各自到期，最多同时25层，而不是永远延长同一层。L=0时5秒，L=50时16秒；同样技能频率下，16秒窗口更易覆盖多次技能产生的增益，所以收益不只是面板上固定+若干。
- 普通6人萨尔贡使每个临时stack再给12%攻击力，最多300%。指定策略的六人效果有替换分支，不能把两个分支无条件相加。
- **反馈闭环：**开技能→持久L上升→后续技能给出的buff寿命更长→更易保持多层临时增益→作战效率上升。这里持久L与临时25层限制不同；本场层数最终回写，下场继续积累。

### 3. 薄绿＋不同阶维多利亚：连续伤害成长＋累计里程碑装备

`chess_char_3_08_a` 的 `garrison_48_a` 设置准备期结束，场上每一种不同T阶的维多利亚给已激活维多利亚+2层。[garrisons/meta.js:157](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/garrisons/meta.js#L157)实际调用 `distinctTiers()`，不是人数越多必然给越多；三个不同人物但全T3只算一种阶。

- [installVictoria():277](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/bonds/core.js#L277)：携带装备的成员伤害倍率 `1.25+0.008L`，随L连续增长；6人还按装备件数和普通/进阶类型提升攻击力。
- [payHammers():715](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/sim/content/bonds/core.js#L715)：目标累计支付次数 `floor(L/25)`，与已付counter比较，仅补未领里程碑；不是减25层换锤。L=24→30，只领一件，L仍为30。
- 先写已付counter，再发物品；物品引发嵌套 `onGain` 也不会重复领。失活时暂不付，重新激活时补已达未付里程碑；反复上下阵不会反复领。hook列表包含onLayers/onActiveBonds等，见同文件746行。
- **反馈闭环：**保留不同T阶成员→每轮L更快增长→伤害增幅＋每25层装备→装备又满足维多利亚伤害条件，并放大六人成装收益。原码回路是“构筑结构→成长→可兑现资源→战斗表现”，不是金币放着生息。

## 另一个真正的倍触发例子

[EffectsDispatcher.investRepeat():204](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/server/match/effectsMeta.js#L204)使激活投资人时的“获得时”特质从1次变2次；达到100持久层后变3次。dispatch对onGain应用这个repeat（342、392行）。这会放大其他角色的获得时加层，但没有将所有hook一概翻倍；也不能给我们游戏的退款/回放/预览套这个生产机制。

## 激活预览也实际读了源码

[BondStrip():91](https://github.com/sganggs/Stronghold-Protocol/blob/f07b8965061bbc311ad7aa815879b09264a1e47d/public/js/ui/bondStrip.js#L91)接收已算好的count/active/tier/layers，读取thresholds找下一门槛，显示人数进度；active控制点亮，layers独立显示，不在渲染中生产层数。禁用模式与缺人数分别处理。`BondPopup()` 149–196行再将L代入当前效果公式。可借鉴其**人数＋历史层数＋激活状态**的分离；不用照抄圆盘、弹层、渐变或整套布局。

## 对本项目的约束

- 我们是五人出战、八轮政治对抗；原库含共同防守、联防和特殊不叠层战斗，不能把队友共享/帮队友加层照搬为敌对党互利。
- 值得移植的是个人多标签、事件驱动累计、人数激活、连续成长、累计里程碑、幂等与效果账本。999、25秒、100层等数值不适合直接照搬。
- v0.2的0–9可消费库存不能单独代表上述层数。新版应使用持久L，小幅成长跨回合保留；如以后有可消费资源，另设C，不能用兑换把L清空。
- 党际分歧、防火墙、招募红线仍先检查；同工作组、同州、具名私交仍是有源组合，不自动当作所有盟约成长的生产器。特选是第3轮真实T4、第6轮T5，T6暂停；现金保留无息。
