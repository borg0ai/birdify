# RFC 0015: Publish @birdify/core as @borg0ai/birdify-core

**Status:** Implemented

## Summary

Publish the shared runtime package as a public npm package `@borg0ai/birdify-core` (renamed from the private `@birdify/core`). The CLI (`@borg0ai/birdify`) declares it as a normal runtime `dependency` instead of inlining it into the bundle. This reverses the decision in RFC 0006/0010, which explicitly kept core private and bundled it into the CLI.

## Problem

RFC 0006 set `packages/core` as a private workspace package consumed only by the CLI build. RFC 0010 went further and inlined it directly into `apps/cli/dist/birdify.mjs` so the published CLI tarball would be self-contained, specifically to avoid the npm 404 that occurs when a private workspace dependency gets rewritten to a static version on publish.

That constraint no longer applies once core itself is a published public package: `workspace:*` resolves to a real, installable npm package at publish time, so there is nothing left to 404 on. Keeping core inlined after publishing it separately would mean maintaining the runtime logic in two places at once — once in the published `@borg0ai/birdify-core` package, and once duplicated inside every `@borg0ai/birdify` CLI bundle — with no way to guarantee the two stay in sync between releases.

## Goals

- Rename `packages/core` from `@birdify/core` to `@borg0ai/birdify-core`.
- Remove `"private": true` from `packages/core/package.json`; add `publishConfig.access: "public"` and a `license` field matching the CLI package.
- Move `@borg0ai/birdify-core` in `apps/cli/package.json` from `devDependencies` to `dependencies` (it is a real runtime dependency once external).
- Add `@borg0ai/birdify-core` to the Vite `external` list in `apps/cli/vite.config.ts` so it is no longer inlined into `dist/birdify.mjs`.
- Update every source and test import of `@birdify/core` to `@borg0ai/birdify-core` across `apps/cli/src`, `test/`, and the root `package.json` devDependency list.
- Update `apps/cli/src/__tests__/cli-bundle.test.ts` to assert the bundle imports `@borg0ai/birdify-core` as an external module, instead of asserting it is absent.

## Non-goals

- Do not change the CLI's public command surface (`validate`, `render`, `install`, `doctor`, `setup`, `mode`, `uninstall`).
- Do not change what `runtimeRoot()` resolves or how skill assets are discovered (RFC 0011 behavior is unaffected).
- Do not publish `birdify/` skill assets as part of either package.
- Do not change the skill's own release channel or `skill-release.json` versioning scheme.

## Design

### 1. Package manifest (`packages/core/package.json`)

```json
{
  "name": "@borg0ai/birdify-core",
  "version": "0.1.6",
  "publishConfig": { "access": "public" },
  "license": "MIT"
}
```

### 2. CLI dependency (`apps/cli/package.json`)

`@borg0ai/birdify-core` moves from `devDependencies` to `dependencies`, declared with `workspace:*` during development; changesets/qingniao rewrites it to a real published version range at release time, same as any other npm runtime dependency.

### 3. Build configuration (`apps/cli/vite.config.ts`)

```ts
const EXTERNAL = ['@borg0ai/birdify-core', '@sinclair/typebox', 'ajv'];
```

Vite no longer bundles `packages/core` source into `apps/cli/dist/birdify.mjs`; it stays a plain `import` resolved from `node_modules` at install time.

### 4. Import paths

All `from '@birdify/core'` references in `apps/cli/src/commands/*.ts` and `test/**/*.ts` become `from '@borg0ai/birdify-core'`.

### 5. Bundle test

`cli-bundle.test.ts` now asserts the opposite of RFC 0010's version: the compiled bundle must contain `from "@borg0ai/birdify-core"` as an external import, not inline the package's code.

## Acceptance

- `pnpm install` resolves `@borg0ai/birdify-core` as a workspace package with no `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`.
- `pnpm run typecheck` passes with zero errors across all workspaces.
- `pnpm test` (77 unit tests) and `pnpm --filter @borg0ai/birdify test` (15 CLI tests) pass.
- `pnpm --filter @borg0ai/birdify build` produces a smaller `dist/birdify.mjs` than the previous inlined build (core code no longer duplicated into the bundle).
- `npm publish --dry-run` from `packages/core` succeeds with public access (verify before the first real publish; not yet run as of this RFC's authoring).
