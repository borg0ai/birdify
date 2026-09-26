# 项目触发模式

[English](modes.md)

Birdify 默认按需调用，默认 `on-demand`。用户选择技能、明确要求 Birdify 或架构/约束/更改图时才运行。普通编码、小修复和功能规划不触发；仅讨论方案不授权编辑。

## 调用入口

使用宿主提供的技能选择器或明确请求 Birdify。不同宿主的斜杠命令不属于 Birdify 契约。调用作用于当前任务。仅讨论 Birdify 不会启动建图。

## 安装技能

```sh
npx --yes @borg0ai/birdify install
```

这会把技能装进每个已检测到的 agent 的全局技能目录。它运行：

```sh
npx --yes skills add borg0ai/birdify --skill birdify --agent '*' --global --copy --yes
```

它不写 `AGENTS.md`。项目模式仍用 `setup` 和 `mode`。退出成功只等于 `skills` CLI 的状态，不表示检查过技能目录是否存在。

## 配置与迁移

```sh
npx --yes @borg0ai/birdify setup --project <project-root>
npx --yes @borg0ai/birdify mode auto --project <project-root>
npx --yes @borg0ai/birdify mode on-demand --project <project-root>
npx --yes @borg0ai/birdify mode off --project <project-root>
npx --yes @borg0ai/birdify mode --project <project-root>
npx --yes @borg0ai/birdify uninstall --project <project-root>
```

`setup` 为新项目默认选择 `on-demand`，保留已有 `auto`、`on-demand` 或 `off`。使用 `mode auto` 主动开启每次改代码（含小改动）及明确分析涉及模块的规划前自动介入；使用 `mode on-demand` 恢复按需调用。查询只读。更新技能不会重写其他项目，请在新任务中验证所选模式。

基础约束与画图触发独立。`setup`、`mode auto` 和 `mode on-demand` 从 [foundation.txt](foundation.txt) 安装基础约束，要求聚焦源码、依据证据、适度验证和查看协作记录，不要求读取技能或生成地图。`off` 停用基础约束和画图，当前任务明确调用除外。`uninstall` 仅移除项目管理段，保留文件、其他规则、技能与地图；保留技能时恢复默认按需行为。

## 存储与边界

使用已安装技能和目标项目根目录的绝对路径。省略 `--project` 时只使用当前目录，不搜索父目录。Birdify 始终管理 `AGENTS.md`，不跨文件同步。在任意目录运行 `npx --yes @borg0ai/birdify mode`。需要 Node.js 22 或更新版本；技能目录里没有这条命令。

只修改 `<!-- birdify:mode:start -->` 与 `<!-- birdify:mode:end -->` 间的管理段，保留周围字节。重复配置不产生变化；损坏或重复标记、非普通文件导致拒绝写入。管理段为英文机器指令。

这些配置依赖宿主加载，不是文件写入拦截。不要覆盖其他位置的冲突指令；报告已知冲突。已有会话可能保留旧指令，CLI 测试只证明配置行为；新任务仍需检查真实技能选择和产物。
