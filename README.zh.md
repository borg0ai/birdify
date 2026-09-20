<div align="center">
  <img src="birdify/assets/brand/logo-512.png" alt="Birdify Logo" width="120" height="120">
  <h1>Birdify</h1>
  <p><strong>用 Birdify 来改变开发的流程！真正地从关注代码到关注架构！解决 AI coding 的黑盒！</strong></p>
  <p><strong>古法编程最后的优势是感知架构——Birdify 彻底终结了这个理由。</strong></p>
  <p><strong>编程的未来只剩两件事：约束与架构。</strong></p>
  <p>
    <img src="https://img.shields.io/badge/%E7%89%88%E6%9C%AC-0.1.1-2f81f7?style=flat-square" alt="版本 0.1.1">
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js 18 或更高版本">
    <img src="https://img.shields.io/badge/license-MIT-2da44e?style=flat-square" alt="MIT 许可证">
    <img src="https://img.shields.io/badge/%E8%BE%93%E5%87%BA-%E7%8B%AC%E7%AB%8B%20HTML-e34f26?style=flat-square&amp;logo=html5&amp;logoColor=white" alt="独立 HTML 输出">
    <img src="https://img.shields.io/badge/%E6%96%87%E6%A1%A3-English%20%7C%20%E4%B8%AD%E6%96%87-8250df?style=flat-square" alt="中英文文档">
    <a href="https://linux.do"><img src="https://img.shields.io/badge/linux.do-%E7%A4%BE%E5%8C%BA-1f7aec?style=flat-square" alt="linux.do 社区"></a>
  </p>
</div>

<p align="center">
  <a href="#快速开始">快速开始</a> ·
  <a href="#工作原理">工作原理</a> ·
  <a href="birdify/examples/harness-activity.html">交互演示</a> ·
  <a href="https://qiuner.github.io/birdify/">项目介绍页</a> ·
  <a href="README.md">English</a>
</p>

<!-- [English](README.md) -->

Birdify 是一个安装给 AI 编程 Agent 的 Skill。它要求 Agent 在改代码前先整理项目结构，说明这次任务会影响哪些模块和文件，再开始编辑。结果会生成一个独立、可交互的 HTML 页面，在浏览器中直接打开即可，不需要部署服务。

**[项目介绍页](https://qiuner.github.io/birdify/)：** [qiuner.github.io/birdify](https://qiuner.github.io/birdify/) · **[主题](https://github.com/Qiuner/birdify#readme)：** `agent-tools` `architecture-as-code` `code-visualization` `coding-agents` `developer-tools` `software-architecture`

例如，你让 AI“给登录接口增加限流”：

- 普通流程：AI 直接搜索和修改代码，你最后从 diff 中判断它是否漏改或误改。
- Birdify 流程：AI 先展示登录接口经过哪些模块、准备修改哪些文件、这些判断来自哪些源码，再按这张图实施修改并记录验证结果。

Birdify 不会自动监听 Agent 的每一步，也不会替代 Git diff、测试或代码审查。它把 Agent 对项目的理解和它声明的修改范围放到同一张架构图上，让你更早发现范围错误，而不是等代码写完再猜。

## Birdify 能看到什么

日志能告诉你 AI 做过哪些操作，diff 能告诉你哪些代码行变了，但它们很难直接回答：这个改动位于系统的哪一部分？还会影响谁？AI 为什么认为这些文件属于本次任务？

Birdify 把这些信息放进同一个页面：

- **项目全图：** 系统有哪些模块、每个模块负责什么、模块之间怎样连接。
- **本次改动：** Agent 声明要触碰哪些模块和文件，目前进行到哪一步。
- **判断依据：** 每个架构结论对应哪些源码文件或代码位置。
- **前后对照：** 在同一布局中比较完整架构与本次改动范围。
- **验证记录：** Agent 实际运行了哪些检查，以及检查是否通过。

所有内容都打包在一个 HTML 文件中，支持明暗主题、关系筛选、模块详情和中英文界面。架构数据和活动记录在生成页面前会经过结构与一致性检查。

## 快速开始

使用第三方 `skills` CLI 安装：

```sh
npx skills add Qiuner/birdify --skill birdify
```

在 Agent 中发起一个新任务，主动调用技能。**默认仅在明确要求时运行；主动开启项目自动模式后，才会在普通代码修改前触发。**

**所有支持的宿主：** 使用宿主技能选择器，或明确要求：

```text
$birdify 展示这个项目的架构和约束，不修改代码
```

**other hosts：** 输入：

```text
/birdify 展示这个项目的架构和约束，不修改代码
```

斜杠命令支持取决于宿主。

确认 Agent 生成 `.birdify/architecture.json` 和可在浏览器中打开的 HTML 架构图。安装方法和验证步骤见[安装指南](docs/installation.zh.md)。

### 从源码运行演示

开发或试用仓库内置演示需要 Node.js 18 或更高版本：

```sh
pnpm install --frozen-lockfile
pnpm run validate:examples
pnpm test
pnpm run build:demo
```

在浏览器中打开 [`birdify/examples/harness-activity.html`](birdify/examples/harness-activity.html)。演示中的项目和 Agent 活动均为模拟数据。

## 交流与反馈

遇到安装问题、架构图不准确，或者想交流 Architecture-first Coding，欢迎加入 Birdify 用户交流群。

<p align="center"><strong>QQ 群：627760389</strong></p>

也可以直接在 GitHub [分享使用反馈](https://github.com/Qiuner/birdify/issues/new?template=usage_feedback.yml)：成功使用、遗漏模块、错误关系或安装问题都可以。不需要提供私有源码，截图和脱敏示例选填。

## 查看器指引

打开生成的 HTML 后，可以在**完整架构**、**本次修改**和**并排对照**之间切换。点击模块可查看职责、所属文件和源码依据；活动历史显示 Agent 声明的计划、进度与检查结果。

第一次打开时可跟随**使用指引**浏览，也可以随时跳过或按 Escape 退出。之后仍可从工具栏重新打开指引。

## 显式调用

无论哪种模式，激活后都会先展示地图和拟修改范围，等待你确认后再改代码。同一已确认范围内不重复询问，范围发生实质变化时再确认。仅看图的请求在交付后结束。这是 Agent 执行规则，不是 HTML 页面的强制写入锁。

Birdify **默认按需调用**。普通编码、小修复和功能规划默认不触发，可主动开启项目自动模式。

- **所有支持的宿主：** 使用宿主的技能选择器，或明确要求使用 Birdify；斜杠命令支持取决于宿主。

例如：“使用 Birdify 展示这个项目的架构和约束，不修改代码。”调用只作用于当前任务，不延伸到未来修改。技能在开始流程前检查项目模式；宿主调用配置允许项目主动启用自动模式。

自动模式为可选项：开启后，每次改代码（含小改动）及明确分析涉及模块的规划前都会触发。新项目默认按需；`AGENTS.md` 中已有的 `Birdify mode: auto` 继续有效。选择或查询项目模式：

```sh
node <skill-root>/scripts/birdify.mjs mode auto --project <project-root>
node <skill-root>/scripts/birdify.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdify.mjs mode --project <project-root>
```

初始化为新项目采用 `on-demand`，保留已有 `auto`、`on-demand` 或 `off` 设置。Birdify 管理 `AGENTS.md`，不会自动重写其他项目。升级后请新建任务。详见[模式说明](birdify/references/modes.zh.md)。

## 直接生成 HTML

通常由 Agent 完成下面的步骤。如果你已经有符合格式的架构文件，也可以手动校验并生成 HTML：

```sh
node birdify/scripts/validate.mjs .birdify/architecture.json
node birdify/scripts/render.mjs .birdify/architecture.json .birdify/architecture.html
```

如果还要展示 Agent 声明的任务过程，加入活动记录：

```sh
node birdify/scripts/validate.mjs .birdify/architecture.json .birdify/activity.jsonl
node birdify/scripts/render.mjs .birdify/architecture.json .birdify/activity.html .birdify/activity.jsonl
```

需要同时校验中英文内容时添加 `--bilingual`。`--simulation` 只用于明确标记虚构的演示数据。

## 工作原理

```text
项目源码 ──────> architecture.json ─┐
                                    ├──> 校验 ──> 渲染 ──> 独立 HTML
Agent 声明 ─────> activity.jsonl ────┘
```

`architecture.json` 描述项目模块、职责、文件归属、源码依据和模块关系。可选的 `activity.jsonl` 逐行记录 Agent 声明的任务范围、当前目标、进度和验证结果。渲染器先检查两份数据是否互相一致，再生成 HTML。

整个流程分为两步：

1. **认识项目：** Agent 阅读源码，建立或更新架构图，并为模块附上源码依据。
2. **执行任务：** Agent 在同一张图上标出计划修改的范围、当前进度和真实检查结果。

完整流程见[阶段 1：建立项目地图](birdify/references/map-project.zh.md)和[阶段 2：表达变更](birdify/references/show-changes.zh.md)。

## 数据契约

| 输入 | 用途 |
| --- | --- |
| `architecture.json` | 项目标识、模块、归属、证据、关系、分组和稳定布局 |
| `activity.jsonl` | 有序的 Agent 声明，包括任务范围、目标、文件、阶段和验证记录 |
| `architecture.html` | 包含已校验地图与可选活动历史的独立查看器 |

Schema 负责约束结构。[`birdify/scripts/validate.mjs`](birdify/scripts/validate.mjs) 还会检查稳定地图标识、连续序号、合法范围与目标、文件归属以及一致的检查结果等跨记录规则。校验不会证明架构声明真实，也不会证明引用的源码文件存在。

## 项目结构

| 路径 | 内容 |
| --- | --- |
| [`birdify/schemas/`](birdify/schemas) | 架构与活动 JSON Schema |
| [`birdify/scripts/`](birdify/scripts) | 校验器、独立页面渲染器和文档检查 |
| [`birdify/assets/`](birdify/assets) | 共享查看器模板、样式、连线路由、活动与本地化代码 |
| [`birdify/examples/`](birdify/examples) | 虚构地图、活动记录和生成后的交互演示 |
| [`birdify/references/`](birdify/references) | 编写流程、契约、活动与双语指引 |
| [`test/`](test) | 契约、渲染和可选的浏览器级检查 |

## 当前边界

Birdify v0.1 有意采用文件快照模式：

- 活动由 Agent 声明，Birdify 不会自动观测编码操作。
- 更新后需要重新生成 HTML 并刷新浏览器。
- 尚未实现实时传输、自动刷新和显示确认回执。
- `completed` 事件不能证明检查通过，只有明确记录的检查结果才能表达这一结论。
- 当前包标记为私有，尚未发布到 npm。

## 开发

```sh
pnpm test                                  # 契约与渲染器测试
pnpm run validate:examples
pnpm run build:demo                        # 重新生成虚构活动演示
pnpm run check:docs
```

浏览器级检查位于 [`test/viewer.browser.mts`](test/viewer.browser.mts)，需要本地安装 Playwright，或通过 `BIRDIFY_PLAYWRIGHT_PATH` 指向相应模块。

字段语义和约束见 [Birdify 契约](birdify/references/contract.zh.md)。文档修改必须遵循 [CONTRIBUTING.zh.md](CONTRIBUTING.zh.md) 中的双语规则。

## 许可证

采用 [MIT 许可证](LICENSE)。Copyright (c) 2026 Qiuner。
第三方许可证声明保留在 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES) 中。

发版准备见[发布检查清单](docs/releasing.zh.md)。
