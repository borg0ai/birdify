# Install Birdify

[中文](installation.zh.md)

## Install with skills CLI

Use [skills CLI](https://github.com/vercel-labs/skills) to install Birdify into any supported agent:

```sh
npx skills add Qiuner/birdify --skill birdify
npx skills add Qiuner/birdify --skill birdify --global --copy --yes
```

Omit `--global` for project scope. Installer chooses supported destination and host. The package is a self-contained skill source bundle, not a host-specific plugin. In the installed directory, run `node scripts/birdify.mjs doctor`.

## Manual installation

Install Node.js 18 or newer. Download and extract the source archive for the release you want from this repository's GitHub Releases page. Place the complete extracted directory at `~/.agents/skills/birdify` (`~` is your user home). `SKILL.md` must be directly inside `birdify`, not inside another nested directory. Keep the scripts, schemas, assets, references, documentation, examples, release metadata and license notices together; copying only `SKILL.md` is insufficient.

Validate the self-contained runtime in that directory:

```powershell
# Windows PowerShell
node "$HOME/.agents/skills/birdify/scripts/validate.mjs" "$HOME/.agents/skills/birdify/examples/architecture.json"
```

```sh
# macOS / Linux
node "$HOME/.agents/skills/birdify/scripts/validate.mjs" "$HOME/.agents/skills/birdify/examples/architecture.json"
```

The validator should report `"ok": true`. Start a fresh task in your target agent and ask: "Use Birdify to show this project's architecture; do not edit code." Confirm that the agent reads the skill, reports whether an existing map was found, and produces or updates an HTML preview. Successful validation alone does not verify activation.

## Choose a mode

After installing the bundle, enable persistent foundation rules for each selected project:

```sh
node <skill-root>/scripts/birdify.mjs setup --project <project-root>
```

Setup writes one host-neutral managed block to `AGENTS.md`. New projects default to on-demand and preserve existing auto, on-demand or off. The installer only installs skill files and does not execute setup. In on-demand mode, foundation still guides coding without loading the skill or requiring a map. Use `mode off` to disable both while retaining installation.

The distributed skill is **on-demand by default**. Select Birdify through your agent's skill selector or explicitly ask to use Birdify. Ordinary edits do not trigger it unless auto mode is enabled. Configure or query using absolute paths:

```sh
node <skill-root>/scripts/birdify.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdify.mjs mode --project <project-root>
```

Use `mode auto` to enable automatic activation; `mode on-demand` restores explicit invocation. The CLI manages one block in target project's `AGENTS.md`; it does not configure all projects or synchronize instruction files. See [mode details](../birdify/references/modes.md). These are agent instructions, not enforced interception of edits.

## Update or remove

Before updating, preserve any local skill customizations and note the installed version. Replace the installed source with the chosen release; release defaults can overwrite local customizations. Project mode blocks remain in their projects. Do not keep an old copy inside another scanned skill directory.

After updating, rerun `setup` for each configured project. Before removing installed `birdify` directory, run `node <skill-root>/scripts/birdify.mjs uninstall --project <project-root>`. This removes only managed block, not user rules or installed files. If skill is already gone, remove only complete block between `<!-- birdify:mode:start -->` and `<!-- birdify:mode:end -->` manually. Project maps and activity records remain.

The package is private; `pnpm install -g birdify` is not this project's installation method. For development from a checkout, follow [CONTRIBUTING.md](../CONTRIBUTING.md).
