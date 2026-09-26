# RFC 0013: Viewer Asset Generation Guardrails and Source Clarity

**Status:** Draft

## Summary

Viewer JS is authored in `templates/viewer/*.ts` and compiled by `toolings/birdify-dev` into `birdify/assets/*.js`, which ships inside the skill payload. Both locations are committed to git, the compiled output is not gitignored, and only a CI step (`pnpm run check:build`) catches drift if someone edits the generated file directly. Add a local pre-commit guard and strengthen source discoverability so contributors reliably edit the template, not the compiled artifact, without waiting on CI to find out.

## Problem

1. **Two committed locations for the same logic**: `templates/viewer/{main,i18n,routing,theme,constraint-canvas}.ts` is the hand-written source; `birdify/assets/{viewer,theme,constraint-canvas}.js` is the esbuild output consumed at runtime by `packages/core/src/render.ts` via `runtimeRoot()`. Both are tracked in git (`birdify/assets` is not gitignored), so both look equally "real" to someone browsing the repo.
2. **Drift is only caught in CI, not locally**: `build-viewer.ts` already writes a banner (`// Generated from templates/viewer/<entry>. Do not edit directly.`) and `pnpm run check:build` runs `birdify-dev build-viewer --check` in `ci.yml`. But nothing runs this locally before a commit — a direct edit to `birdify/assets/viewer.js` is only discovered after push, costing a CI round trip.
3. **Same pattern applies to icons**: `build-viewer.ts` also copies `lucide-static` SVGs into `birdify/assets/icons/*.svg` and checks them the same way, with no local guard either.
4. **No pointer from the generated side back to the workflow**: the banner names the source file but not the command (`pnpm run build:viewer`) to regenerate it, so a contributor who does open the generated file has to go find `package.json` to know how to fix a stale build.

## Goals

- Add a local pre-commit hook (or equivalent, e.g. a `lint-staged`-style check) that runs `birdify-dev build-viewer --check` when staged changes touch `templates/viewer/**` or `birdify/assets/**`, blocking the commit on drift instead of waiting for CI.
- Extend the generated-file banner to name the regeneration command, e.g. `// Generated from templates/viewer/main.ts by \`pnpm run build:viewer\`. Do not edit directly.`
- Document the source-of-truth relationship (`templates/viewer` → `birdify/assets`) in the nearest README or CONTRIBUTING section so it isn't only discoverable by reading `build-viewer.ts`.

## Non-goals

- Do not change the build pipeline itself (esbuild, bundling, target, or the set of compiled pages).
- Do not gitignore `birdify/assets/*` — it must stay committed since it ships as part of the published skill payload.
- Do not add a file-watcher/auto-rebuild-on-save workflow; this RFC only closes the commit-time gap.

## Design

1. **Pre-commit hook**: wire a hook (matching whatever hook mechanism this repo already uses, if any — check for `.husky/` or `simple-git-hooks` config before adding a new one) that runs `pnpm run check:build` (already includes `build-viewer --check`) scoped to changed paths, or unconditionally if the existing `check:build` is already fast enough.
2. **Banner update** (`toolings/birdify-dev/src/commands/build-viewer.ts`): change `BANNER_PREFIX`/`BANNER_SUFFIX` constants to embed the regeneration command name.
3. **Docs**: add a short paragraph to the repo's contribution doc (per `AGENTS.md` → `CONTRIBUTING.md` convention already in force) explaining: edit `templates/viewer/*.ts`, never `birdify/assets/*.js` or `birdify/assets/icons/*.svg`, run `pnpm run build:viewer` to regenerate, CI/pre-commit will reject drift.

## Acceptance

- Staging a direct edit to `birdify/assets/viewer.js` (without touching `templates/viewer/main.ts`) and attempting to commit is blocked locally with a message pointing at `pnpm run build:viewer`.
- Regenerated `birdify/assets/*.js` banners include the regeneration command.
- `pnpm run check:build` still passes unmodified for a clean checkout.
- Contribution doc has a discoverable section naming `templates/viewer` as the sole source of truth.
