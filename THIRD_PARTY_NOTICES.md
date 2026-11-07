# 来源与迁移说明

## Stronghold-Protocol

来源：https://github.com/sganggs/Stronghold-Protocol ，2026-11-05读取master。

原样保留 shared/stateDelta.js 和 server/stateTransport.js。前者在本游戏中用于不可变界面快照，后者只作为未来网络传输参考；没有迁入原作人物、美术、音频或官方卡池。源仓库package.json标注GPL-3.0-or-later，许可证原文保存为LICENSE-GPL-3.0。包含这些代码的本游戏代码按GPL-3.0-or-later提供；原作者权利与原有声明保留。

## Hakoniwa / 箱庭

来自用户当前提供的本地项目。vendor/hakoniwa_reference保留political_state_system.py、persona_v2.py、external_environment.py参考快照。web/js/sandbox.js为游戏尺度的JavaScript适配，使用有界状态、结果反馈、定向信任、事件ID防重和时间恢复结构；并非原引擎逐行移植，也不宣称具有原引擎完整行为。原项目sources及源码未改动。

议员资料及议题来源见data/roster_sources.md和data/sources.md。所有等级、资源、领导力、事件概率和评分系数为游戏设计假设。网页无需任何远程字体、图片、API或大模型服务。

## 动画节奏参考（2026-11-06）

读取 Stronghold-Protocol 的 public/js/ui/toasts.js、transitions.js、turnBanner.js（master树 f07b8965061bbc311ad7aa815879b09264a1e47d）。参考通知停留、入场/稳定/退出分段与减少动态效果处理，重新实现于web/js/ui-motion.js；未迁入Preact组件或官方图像素材。阶段提示2400ms、成交2800ms为本游戏适配值。
