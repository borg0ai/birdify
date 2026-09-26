# Project Activation Mode

[中文](modes.zh.md)

Birdify is on-demand by default, defaulting to `on-demand`. It runs when the user selects the skill, explicitly requests Birdify or asks for an architecture/constraint/change map. Ordinary coding, small fixes and feature planning do not trigger it; planning alone does not authorize editing.

## Invocation

Use the host skill selector or explicitly request Birdify. Slash-command support is host-defined. Invocation applies to the current task. Merely discussing Birdify does not start mapping.

## Configuration and migration

```sh
npx --yes @borg0ai/birdify setup --project <project-root>
npx --yes @borg0ai/birdify mode auto --project <project-root>
npx --yes @borg0ai/birdify mode on-demand --project <project-root>
npx --yes @borg0ai/birdify mode off --project <project-root>
npx --yes @borg0ai/birdify mode --project <project-root>
npx --yes @borg0ai/birdify uninstall --project <project-root>
```

`setup` defaults new projects to `on-demand` and preserves any existing `auto`, `on-demand` or `off` mode. Use `mode auto` to opt in to activation before every code-changing task, including small edits, and planning that explicitly analyzes affected modules. Use `mode on-demand` to return to explicit invocation. Queries are read-only. Updating skill files does not rewrite other projects; verify the selected mode in a fresh task.

Foundation rules are separate from map activation. `setup`, `mode auto` and `mode on-demand` install [foundation.txt](foundation.txt), covering focused source reading, evidence, proportional verification and collaboration records without requiring skill reading or mapping. `off` disables foundation and mapping except for explicit invocation in the current task. `uninstall` removes only the project block, preserving the file, other rules, skill and maps; retaining the skill restores default on-demand behavior.

## Storage and boundaries

Use absolute paths for installed skill and target project root. Without `--project`, only current directory is used; parents are not searched. Birdify always manages `AGENTS.md`; files are not synchronized. From any directory, run `npx --yes @borg0ai/birdify mode`. Node.js 22 or newer is required; the skill directory does not contain the command.

Only the block between `<!-- birdify:mode:start -->` and `<!-- birdify:mode:end -->` is modified; surrounding bytes are preserved. Repeated configuration is idempotent; malformed or duplicate markers and non-regular files prevent writes. Managed blocks contain English machine instructions.

These settings depend on host loading, not filesystem interception. Do not overwrite conflicting instructions elsewhere; report known conflicts. Existing sessions may retain old instructions, and CLI tests establish configuration behavior only; verify actual skill selection and artifacts in a new task.
