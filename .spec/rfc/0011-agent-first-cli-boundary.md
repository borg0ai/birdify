# RFC 0011: Agent-First CLI Asset Discovery and Direct-Use Boundary

**Status:** Implemented

## Summary

Establish that the Birdify CLI is an auxiliary execution tool designed exclusively for AI coding agents invoking the Birdify skill, not for standalone manual human usage. The published CLI package does not bundle or distribute skill assets (`birdify/assets/`). Instead, the CLI locates the installed skill dynamically from the agent environment, and gracefully rejects unassisted direct human invocation with an explicit notice directing the user to install the agent skill.

## Problem

1. **Conflation of CLI and Skill Boundaries**:
   - The Birdify skill (`birdify/`) contains usage instructions, data schemas, and the interactive viewer assets (`assets/architecture.html`, `viewer.js`, `theme.js`, and SVG icons).
   - Past packaging scripts (`tools/stage-runtime.mjs`, `tools/pack-cli.mjs`) attempted to vendor these assets under arbitrary directories (e.g. `skill-runtime`), violating the principle that the npm package `@borg0ai/birdify` is strictly an executable tool and the skill lives independently.
   - When stripped of bundled assets, the CLI must still know where to find the viewer templates when an AI agent requests an architecture render.

2. **Module-Level Startup Crashes**:
   - In `packages/core/src/render.ts` and `render-constraints.ts`, top-level module statements eagerly evaluated `runtimeRoot()`.
   - Any invocation of the CLI (such as `birdify --help`, `birdify validate`, or `birdify install`) would crash before executing if the template directory was absent from the current working tree, even when the command had nothing to do with HTML rendering.

3. **Ambiguity for Direct Human Invocations**:
   - If a human user runs `birdify render` directly without an AI coding agent or without having installed the Birdify skill, generic file errors (`ENOENT` or `Missing runtime assets`) provide misleading feedback rather than informing the user that the CLI is an agent-companion tool.

## Goals

- Keep the published `@borg0ai/birdify` CLI package strictly minimal and free of duplicate skill assets (`files: ["bin", "dist", "README.md"]`).
- Defer all skill asset resolution in `packages/core` to runtime rendering calls rather than top-level module evaluation.
- Dynamically resolve the installed Birdify skill assets from agent environments:
  1. Environment variable: `BIRDIFY_SKILL_DIR`
  2. Project-local skill directory: `./birdify`
  3. Monorepo development path (for tests and local development)
  4. Standard AI coding agent skill install directories (`~/.gemini/antigravity-cli/skills/birdify`, `~/.claude/skills/birdify`, `~/.cursor/skills/birdify`, etc.)
- Clearly reject manual human direct use when the skill is not installed:
  `This CLI is designed for AI coding agents using the Birdify skill, not for direct manual use. Birdify skill assets not found. Install the skill into your agent first (e.g. npx --yes @borg0ai/birdify install).`

## Non-goals

- Do not bundle `birdify/assets` into the published npm CLI package.
- Do not provide an interactive human wizard or standalone human-facing UI for the CLI.
- Do not modify the data contracts or command-line syntax for `validate`, `render`, `install`, or `doctor`.

## Design

### 1. Lazy Asset Evaluation (`render.ts` & `render-constraints.ts`)

Asset root discovery is moved from module scope into the body of the rendering functions:

```ts
export function renderArchitecture(...): string {
  const root = runtimeRoot();
  const read = (file: string): string => fs.readFileSync(path.join(root, file), 'utf8');
  ...
}
```

This guarantees that non-rendering operations (`birdify --help`, `birdify validate`, `birdify install`) execute without checking for or requiring local HTML templates.

### 2. Priority-Based Dynamic Skill Resolution (`runtimeRoot()`)

`packages/core/src/runtime-root.ts` resolves skill assets using the following hierarchy:

1. `process.env.BIRDIFY_SKILL_DIR`: Explicit override by tooling or custom environments.
2. `path.resolve(process.cwd(), 'birdify')`: Project-level installed skill.
3. Monorepo development source checkout relative to module directory.
4. Standard AI coding agent global skill paths (`~/.gemini/antigravity-cli/skills/birdify`, `~/.claude/skills/birdify`, `~/.cursor/skills/birdify`, etc.).
5. If none are found, throw an informative error explaining that the CLI is designed for AI coding agents and directing the user to install the skill.

## Verification

1. **Agent Skill Execution**:
   - `pnpm test` and `pnpm --filter @borg0ai/birdify test` pass against the monorepo skill assets.
2. **Pristine Smoke Test**:
   - In an isolated environment without local skill assets, `npx birdify --help` and `npx birdify validate` execute cleanly.
   - Attempting `render` in an empty directory without the skill correctly returns the agent-first error message.
