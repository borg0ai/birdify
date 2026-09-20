# 贡献指南

[English](CONTRIBUTING.md)

## 开发

可安装技能完整位于 [`birdify/`](birdify/)；TypeScript 源码、测试、构建配置和仓库工具保留在根目录。使用 Node.js 18 或更高版本：

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run check:build
pnpm test
pnpm run validate:examples
pnpm run check:docs
```

查看器或渲染器改动后运行 `pnpm run build:demo`，审阅演示 diff，并使用 `pnpm run test:browser` 做浏览器检查。只报告实际执行的命令和剩余限制。不要提交私有源码数据或凭据。

## 包边界

安装载荷是 `birdify/`。完整仓库归档还包含开发文件，不等于技能安装包。

| 位置 | 用途 | 随技能分发 |
| --- | --- | --- |
| `birdify/SKILL*.md`、`birdify/references/` | 触发与使用说明 | 是 |
| `birdify/scripts/` | 安装用户使用的命令：诊断、项目模式、校验、渲染和约束处理 | 是 |
| `birdify/assets/`、`birdify/schemas/`、`birdify/examples/` | 查看器资源、数据契约和使用示例 | 是 |
| `birdify/skill-release.json`、许可证与声明 | 发布身份和再分发条款 | 是 |
| `src/` | 编译为运行文件或内部工具的可编辑源码 | 否 |
| `tools/`、`config/` | 内部工具与开发元数据，包括构建产物清单 | 否 |
| `.build-tools/`、`.test-build/`、`test/`、`node_modules/` | 生成的工具、测试和开发依赖 | 否 |
| `apps/`、`docs/`、`.spec/`、`.github/`、根目录清单与指南 | 网站、仓库文档、提案和 CI | 否 |

小型内部工具统一归入 `tools/*.mjs`，通过 Node 直接运行，无需 TypeScript 编译。类型化 Schema 导出工具位于 `tools/contracts/`。发布包结构校验由位于发布目录外的 `tools/validate-skill.mjs` 执行，架构数据校验器 `birdify/scripts/validate.mjs` 仍作为用户命令随技能分发。`src/` 内的源码直接编译至 `birdify/scripts/`，无需向终端用户暴露内部构建脚本。

`birdify/SKILL.md` 是技能入口。TypeScript 源码在 `src/`，生成后的运行命令在 `birdify/scripts/`，查看器资源在 `birdify/assets/`；Schema、示例和参考文档在 `birdify/` 内，测试在 `test/`。不得新增宿主专属安装分支或旧品牌别名。

生成 JavaScript 和 Schema 必须从 TypeScript 重新生成：

```sh
pnpm run build
pnpm run check:build
```

不要直接修改生成文件。`pnpm run check:install` 会审计嵌套包的干净 Git 归档，在临时目录验证无依赖安装契约，运行 `birdify doctor` 和项目模式检查。

## 文档

根目录 `docs/` 和 `birdify/` 下的 Markdown 必须维护中英文配对。链接、命令、标识符和约束保持等价。运行：

```sh
pnpm run check:docs
```

审阅双语内容后再更新哈希记录：

```sh
pnpm run check:docs --update
```

## Pull Request

保持改动聚焦。未经明确授权，不得暂存、提交、推送、创建分支或重写历史。提交标题使用 Conventional Commits：`type(scope): 中文说明 / English summary`。请求审查前检查最终 diff 并运行相关包检查。
