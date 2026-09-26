# RFC 0009: CLI command to install the Birdify skill globally

**Status:** Implemented

## Summary

Add `birdify install`. It runs the existing public skill install and does not copy skill files itself:

```sh
npx --yes skills add borg0ai/birdify --skill birdify --agent '*' --global --copy --yes
```

`--agent '*'` is the `skills` CLI form for every detected agent. The star is one argument, not a shell glob. `apps/site/src/content.ts` `INSTALL_COMMAND` is that same line. The npm package `@borg0ai/birdify` stays the CLI only.

## Problem

Installing Birdify is two steps. `npx skills add borg0ai/birdify --skill birdify` installs the agent skill. `npx --yes @borg0ai/birdify <command>` runs the CLI. The site already shows the global form with `--global --copy --yes`. The CLI help lists `doctor`, `setup`, `mode`, and `uninstall`, and none of them install the skill.

`setup` only writes the project `AGENTS.md` mode block. `doctor` checks the renderer against the skill runtime shipped inside the CLI package. A user who has the CLI still has to remember a second tool and the exact flags to put `birdify` where a global agent can see it.

## Goals

- Add one command, `birdify install`, whose only job is to invoke that fixed `skills add` line.
- Install into the global agent skills directory, not the current project.
- Pass a fixed argument list to `npx`. Do not build the command in a shell string.
- Show the `skills` CLI output and return its exit status.
- Let tests assert the argument list without contacting the network or writing into the real home directory.
- Document the command next to the existing install line so the README, Chinese README, CLI help, and site command stay the same skill source.

## Non-goals

- Do not vendor the `skills` CLI or reimplement skill discovery, agent detection, or file copy.
- Do not put `birdify/` inside the npm tarball. Skill bytes still come from the GitHub skill directory through `npx skills`.
- Do not change `setup`, `mode`, `uninstall`, or `doctor`.
- Do not install the skill into the current repository by default.
- Do not add update, uninstall-skill, or agent-selection commands in this RFC.
- Do not change skill-release metadata, viewer assets, or the published package name.

## Design

### Command

`birdify install` takes no required arguments. With no extra arguments it spawns, without a shell:

```text
npx --yes skills add borg0ai/birdify --skill birdify --agent '*' --global --copy --yes
```

Constants own the source `borg0ai/birdify`, the skill name `birdify`, and the flag list. Help text names `install` and states that it installs the agent skill globally. It does not install or configure the current project.

`stdio` is inherited. A non-zero child status is the command status. If `npx` cannot be spawned, the command exits `1` and prints the spawn error. Unknown arguments fail before any process is spawned.

### Why these flags

`--agent '*'` asks the `skills` CLI to install for every detected agent. `--global` selects that CLI's global skills directory for each agent. This command does not accept a path and does not list those directories.

`--skill birdify` installs only the Birdify skill from `borg0ai/birdify`.

`--copy` matches the command already shown on the site. The installed directory is a full copy, so it does not depend on a symlink into the `skills` cache.

`--yes` on `skills add`, and `--yes` on `npx`, skip both confirmation prompts.

The symlink install (`skills add` without `--copy`) is the `skills` CLI default and is not used here. One public install line is easier to test and to keep aligned with the site.

### What this command does not touch

It does not write `AGENTS.md`, `.birdify/`, or project `.agents/skills/`. After install, project mode is still `birdify setup` or `birdify mode`. Runtime checks are still `birdify doctor`.

### Tests

Tests run `apps/cli/dist/birdify.mjs` with a fake `npx` at the front of `PATH`. They assert the exact argument vector, that an unknown argument does not spawn, that a non-zero child status is propagated, and that a signalled child (`status === null`) exits `1`. They do not call the real `skills` registry and do not write a skill into the developer home directory. Birdify does not check afterwards that a skill directory exists.

## Acceptance

- `birdify install` with no arguments spawns `npx --yes skills add borg0ai/birdify --skill birdify --agent '*' --global --copy --yes` and no other arguments. A signalled child exits `1`.
- `birdify --help` lists `install` and still lists the existing commands.
- An unknown `install` argument exits non-zero and does not spawn.
- The child exit status is the `birdify install` exit status.
- `setup` still only edits the managed `AGENTS.md` block. `doctor` still performs the example render check.
- English and Chinese quick-start text, skill modes, and `SKILL.md` show `npx --yes @borg0ai/birdify install` and the same `skills add` line. The site `INSTALL_COMMAND` is that `skills add` line.
- The npm package still does not contain the `birdify/` skill directory.
