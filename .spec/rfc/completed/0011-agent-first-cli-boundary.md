# RFC 0011:  Agent-First CLI Asset Discovery and Direct-Use Boundary

**Status:** Implemented

## Summary

Keep the Birdify CLI agent-first: it is an execution tool for agents using the Birdify skill, not a standalone human workflow. Resolve runtime assets from the separately installed skill. Prefer explicit `BIRDIFY_SKILL_DIR` for development, then project and monorepo paths, then global agent skill directories such as `~/.agents/skills/birdify`. If no skill is found, report the missing agent skill and direct installation; do not infer caller identity.

## Problem

1. **Conflation of CLI and Skill Boundaries**:
   - The Birdify skill (`birdify/`) contains usage instructions, data schemas, and the interactive viewer assets (`assets/architecture.html`, `viewer.js`, `theme.js`, and SVG icons).
   - The former `tools/stage-runtime.mjs` copied skill assets into `packages/core/skill-runtime/`, and `tools/pack-cli.mjs` copied that duplicate into a packed CLI. The staging copy is unnecessary: the skill already owns these assets and can be installed independently. `tools/pack-cli.mjs` is marked for removal in RFC 0010.
   - The CLI still needs to find the installed skill assets when rendering architecture or constraint views.
2. **Module-Level Startup Crashes**:
   - In `packages/core/src/render.ts` and `render-constraints.ts`, top-level module statements eagerly evaluated `runtimeRoot()`.
   - Any invocation of the CLI (such as `birdify --help`, `birdify validate`, or `birdify install`) would crash before executing if the template directory was absent from the current working tree, even when the command had nothing to do with HTML rendering.
3. **Missing Skill Diagnostics**:
   - When no skill assets exist in configured locations, generic file errors (`ENOENT` or `Missing runtime assets`) hide the actual setup problem. The error should identify the missing Birdify agent skill and give the install command.

## Goals

- Keep the published `@borg0ai/birdify` CLI package strictly minimal and free of duplicate skill assets (`files: ["bin", "dist", "README.md"]`).
- Defer all skill asset resolution in `packages/core` to runtime rendering calls rather than top-level module evaluation.
- Resolve assets in this order: `BIRDIFY_SKILL_DIR`, project `./birdify`, monorepo development source, then supported global agent skill directories including `~/.agents/skills/birdify`.
- If no assets are found, report a missing Birdify agent skill and direct the user to `npx --yes @borg0ai/birdify install`; mention `BIRDIFY_SKILL_DIR` as the development override.
- Keep tests pointed at assets sourced from the repository while exercising both the global agent path and explicit environment override.

## Non-goals

- Do not bundle `birdify/assets` into the published npm CLI package.
- Do not attempt to detect whether caller is human or agent; asset availability controls rendering readiness.
- Do not provide an interactive human wizard or standalone human-facing UI for the CLI.
- Do not modify the data contracts or command-line syntax for `validate`, `render`, `install`, or `doctor`.

## Design

### 1. Lazy Asset Evaluation (`render.ts` &amp; `render-constraints.ts`)

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

1. `process.env.BIRDIFY_SKILL_DIR`: Explicit override for development and custom environments.
2. `path.resolve(process.cwd(), 'birdify')`: Project-level installed skill.
3. Monorepo development source checkout relative to module directory.
4. Global agent skill paths, in order: `~/.agents/skills/birdify`, `~/.gemini/antigravity-cli/skills/birdify`, `~/.claude/skills/birdify`, `~/.cursor/skills/birdify`, and `~/.config/opencode/skills/birdify`.
5. If none are found, throw: `Birdify agent skill not found. Install it with npx --yes @borg0ai/birdify install, or set BIRDIFY_SKILL_DIR to the skill directory for development.`

The `skill-runtime` staging directory, its build step, and its runtime fallback are removed. Tests load assets from the repository skill directory by copying it into a temporary agent home or by setting `BIRDIFY_SKILL_DIR`.

## Acceptance

1. The published CLI package contains no duplicated `birdify/assets` or `skill-runtime` payload.
2. `runtimeRoot()` honors `BIRDIFY_SKILL_DIR`, project-local assets, monorepo development assets, and global agent skill paths in the documented order.
3. Packed CLI smoke checks source assets from repository `birdify/` and succeed through `~/.agents/skills/birdify` with `BIRDIFY_SKILL_DIR` unset.
4. A separate packed CLI smoke check succeeds with `BIRDIFY_SKILL_DIR` set and no skill in the temporary home.
5. With no skill in any search location, rendering reports that the Birdify agent skill is missing and directs installation with `npx --yes @borg0ai/birdify install`.
6. Asset lookup remains lazy: `--help`, `validate`, and `install` work without skill assets.
