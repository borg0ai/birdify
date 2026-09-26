![Birdify Logo](birdify/assets/brand/logo-512.png)

# Birdify

面向 AI 编程 Agent 的架构优先可视化工具。

Birdify 要求 AI Agent 在修改代码前先梳理项目架构并声明受影响的模块与文件，生成独立、可交互的 HTML 视图以展示系统结构与变更范围。

> Fork 自 [Qiuner/birdview](https://github.com/Qiuner/birdview) 并受其启发进行定制。

[快速开始](#快速开始) · [系统架构](docs/architecture.zh.md) · [工作原理](#工作原理) · [交互演示](birdify/examples/harness-activity.html) · [English](README.md)

---

## 核心特性

- **项目架构全景**：可视化展示模块职责、文件归属与源码依据。
- **变更范围预判**：在编码前高亮目标模块与预定修改文件。
- **零依赖独立输出**：校验数据一致性并生成单文件 HTML 快照，无需部署后台。

## 快速开始

### 安装 Skill

```sh
npx --yes @borg0ai/birdify install
```

这会把技能装进每个已检测到的 agent 的全局技能目录。它实际运行：

```sh
npx --yes skills add borg0ai/birdify --skill birdify --agent '*' --global --copy --yes
```

### 使用方式

在 Agent 中输入提示词：

```text
$birdify 展示这个项目的架构和约束，不修改代码
```

Agent 将生成 `.birdify/architecture.json` 并渲染可在浏览器中打开的 `.birdify/architecture.html`。

## 工作原理

```text
项目源码 ──────> architecture.json ─┐
                                    ├──> 校验 ──> 渲染 ──> 独立 HTML
Agent 声明 ─────> activity.jsonl ────┘
```

1. **建立地图**：Agent 阅读源码，梳理模块边界、文件归属与证据链。
2. **声明变更**：Agent 标出任务范围、拟改动文件及验证步骤。
3. **渲染快照**：生成交互式架构视图供确认后再执行修改。

## 手动生成

直接校验与渲染架构文件：

```sh
pnpm exec birdify validate .birdify/architecture.json
pnpm exec birdify render .birdify/architecture.json .birdify/architecture.html
```

附带任务活动记录：

```sh
pnpm exec birdify validate .birdify/architecture.json .birdify/activity.jsonl
pnpm exec birdify render .birdify/architecture.json .birdify/activity.html .birdify/activity.jsonl
```

## 目录结构

- [`birdify/schemas/`](birdify/schemas) — 架构与活动 JSON Schema
- [`apps/cli/`](apps/cli) — 校验器与独立渲染 CLI
- [`birdify/assets/`](birdify/assets) — 查看器模板与前端资源
- [`birdify/examples/`](birdify/examples) — 架构与活动示例文件
- [`birdify/references/`](birdify/references) — 契约规范与流程参考

## 本地开发

```sh
pnpm install
pnpm run validate:examples
pnpm test
pnpm run build:demo
```

## 开源协议

[MIT](LICENSE)
