# 安装 Birdify

[English](installation.md)

## 使用 skills CLI 安装

使用 [skills CLI](https://github.com/vercel-labs/skills) 将 Birdify 安装到任意支持技能的 Agent：

```sh
npx skills add Qiuner/birdify --skill birdify
npx skills add Qiuner/birdify --skill birdify --global --copy --yes
```

省略 `--global` 可安装到当前项目。安装器负责选择宿主目录；Birdify 不绑定某个 Agent。包已自包含，安装器输出的目录中直接执行：

```sh
node scripts/birdify.mjs doctor
```

`doctor` 只检查安装和内置示例渲染，不验证宿主是否实际调用技能。

## 手动安装

安装 Node.js 18 或更高版本。从 GitHub Releases 下载完整源码压缩包，将目录放到宿主支持的技能目录。`SKILL.md` 必须直接位于 `birdify` 目录下，不能多嵌套一层。保留脚本、Schema、资源、参考文档、示例、版本元数据和许可证声明；只复制 `SKILL.md` 不够。

验证自包含运行时：

```sh
node scripts/validate.mjs examples/architecture.json
```

校验器应报告 `"ok": true`。然后在 Agent 新任务中明确要求：“用 Birdify 展示这个项目的架构，不修改代码。”确认 Agent 读取技能并生成 HTML 预览。

## 项目模式

安装完整技能后，可对目标项目写入通用 `AGENTS.md` 管理块：

```sh
node <skill-root>/scripts/birdify.mjs setup --project <project-root>
node <skill-root>/scripts/birdify.mjs mode auto --project <project-root>
node <skill-root>/scripts/birdify.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdify.mjs mode off --project <project-root>
node <skill-root>/scripts/birdify.mjs mode --project <project-root>
```

新项目默认 `on-demand`，并保留已有模式。`auto` 在每次代码修改前触发；`on-demand` 只在 Agent 明确调用时触发；`off` 同时关闭基础约束和自动触发。CLI 只修改 `AGENTS.md` 中的 Birdify 管理块，不覆盖其他规则。

宿主的技能选择器和斜杠命令由宿主决定。Birdify 不假定某个 Agent 的专属安装目录或命令。

## 更新或卸载

更新后重新执行 `setup`，刷新管理块并保留现有模式。卸载项目规则：

```sh
node <skill-root>/scripts/birdify.mjs uninstall --project <project-root>
```

该命令只删除管理块，不删除用户规则、技能文件、项目地图或活动记录。包保持私有；安装方式是 `npx skills`，不是 `pnpm install -g birdify`。
