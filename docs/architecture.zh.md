# 架构与自举实践（Dogfooding）

[English](architecture.md)

Birdify 遵循“架构优先的可视化”设计理念。为了确保工具链的高可靠性、可维护性与契约规范，Birdify 使用自身的工具与格式对自身代码库进行建模、校验与可视化。

## 系统架构

Birdify 由七个职责内聚的模块构成，各模块具有明确的代码归属与单向依赖关系：

```
[ cli ] ----------> [ validator ] ----------> [ contracts ]
   |                      ^                         ^
   |                      |                         |
   +--------------> [ renderer ] -------------------+
                          |
                          v
                    [ viewer-ui ] <---------- [ site-app ]
                          ^
                          |
                [ constraint-engine ]
```

### 核心模块

1. **`cli`（CLI 与运行环境诊断）**
   - **角色**：Backend / 工具入口
   - **职责**：命令行总入口，负责模式切换（`setup`、`uninstall`）、环境自检（`doctor`）与诊断。
   - **核心代码**：`birdify/scripts/birdify.mjs`、`src/birdify.mts`

2. **`validator`（模式与图校验器）**
   - **角色**：Backend / 规范校验
   - **职责**：执行 TypeBox JSON Schema 校验以及架构图和活动时间线的跨记录语义不变式。支持 `--authoring`（显式角色审查）与 `--bilingual`（双语完整性）模式。
   - **核心代码**：`birdify/scripts/validate.mjs`、`src/validate.mts`

3. **`contracts`（数据契约与模式规范）**
   - **角色**：Data / 规范定义
   - **职责**：定义架构图、活动事件流和约束目录的标准契约规范，输出可用于跨工具校验的 JSON Schema。
   - **核心代码**：`birdify/schemas/architecture.schema.json`、`birdify/schemas/activity.schema.json`、`src/contracts/models.mts`

4. **`renderer`（HTML 快照渲染器）**
   - **角色**：Backend / 构建渲染
   - **职责**：校验输入数据模型，嵌入前端资源与样式，打包输出零依赖、完全自包含的交互式 HTML 快照。
   - **核心代码**：`birdify/scripts/render.mjs`、`src/render.mts`

5. **`constraint-engine`（约束规则提取与画布）**
   - **角色**：Backend / 规则分析
   - **职责**：从项目文档、指令与技能中提取约束源，编译审查规则，生成交互式规则画布。
   - **核心代码**：`birdify/scripts/discover-constraints.mjs`、`birdify/scripts/compile-constraint-rules.mjs`、`birdify/scripts/render-constraints.mjs`

6. **`viewer-ui`（查看器界面与画布运行时）**
   - **角色**：Frontend / 浏览器运行时
   - **职责**：自包含的前端可视化画布，提供 SVG 正交连线、明暗主题切换、模块详情面板、关系过滤及实时中英切换。
   - **核心代码**：`birdify/assets/viewer.js`、`birdify/assets/viewer.css`、`birdify/assets/theme.js`、`birdify/assets/constraint-canvas.js`

7. **`site-app`（官网与发布站点应用）**
   - **角色**：Frontend / 静态门户应用
   - **职责**：用于 GitHub Pages 部署的产品介绍页面与文档门户应用。
   - **核心代码**：`apps/site/index.html`、`apps/site/src/main.mts`、`apps/site/site.css`

---

## 自身自举（Dogfooding）流程

Birdify 使用自身的原生工作流对本仓库的代码架构与项目约束进行自举建模。

### 1. 使用 Doctor 进行环境诊断

验证本地环境与 Birdify 工具链完整无损：

```bash
node birdify/scripts/birdify.mjs doctor
```

### 2. 架构图编写与双语严格校验

Birdify 的标准架构定义存储于 `.birdify/architecture.json`。

使用角色约束与双语完整性模式进行校验：

```bash
node birdify/scripts/validate.mjs .birdify/architecture.json --authoring --bilingual
```

### 3. 生成独立 HTML 架构快照

将架构图渲染为完全自包含的交互式 HTML 文件：

```bash
node birdify/scripts/render.mjs .birdify/architecture.json .birdify/architecture.html
```

生成的 `.birdify/architecture.html` 可在任意浏览器中直接离线打开。

### 4. 约束提取与画布渲染

提取仓库内所有文档与指令的约束规范，并渲染约束画布：

```bash
# 采集全库约束源
node birdify/scripts/discover-constraints.mjs . .birdify/constraints.sources.json "birdify"

# 渲染约束源画布
node birdify/scripts/render-constraints.mjs .birdify/constraints.sources.json .birdify/constraints.html --sources
```
