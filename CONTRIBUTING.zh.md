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
