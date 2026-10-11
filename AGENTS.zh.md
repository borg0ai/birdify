# Birdify 仓库约束

[English](AGENTS.md)

遵循 [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md) 中的提交规则和文档维护要求。这些规则适用于维护本仓库，不适用于使用 Birdify 技能的其他项目。

## 黄金法则：零 API Key 与独立运行

- **黄金法则 — 零 API Key**：Birdify 纯粹是 100% 确定性的本地优先工程工具。它**绝对不**需要任何外部大模型 API Key，**零**远程模型 API 调用，**零** Token 消耗，且完全支持断网离线运行。在任何情况下，绝不允许任何功能或依赖项要求或调用远程 AI 模型 API Key。
- **双模运作**：Birdify 既是 AI 编程 Agent 的 Skill，也是可完全脱离 Agent 在终端独立运行的开发者 CLI 工具（直接通过 `npx @borg0ai/birdify validate`、`render`、`init` 等命令运行）。

