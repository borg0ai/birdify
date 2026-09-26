# RFC 0010: Standalone CLI Bundle for `@borg0ai/birdify`

**Status:** Proposed

## Summary

Bundle the internal `@birdify/core` workspace package directly into the `@borg0ai/birdify` CLI distribution (`dist/birdify.mjs`). Remove `@birdify/core` from the published CLI's runtime `dependencies` in `apps/cli/package.json` so that `npx @borg0ai/birdify` executes cleanly without attempting to resolve unpublished or private internal packages from the npm registry.

## Problem

1. **Broken npm Dependency Topology (404 on `@birdify/core`)**:
   - `packages/core` is a private workspace package (`"private": true`) named `@birdify/core`. It is not published to npm.
   - `apps/cli/package.json` declared `"dependencies": { "@birdify/core": "workspace:*" }`.
   - `apps/cli/vite.config.ts` marked `@birdify/core` as `EXTERNAL = ['@birdify/core', '@sinclair/typebox', 'ajv']`.
   - When published to npm using changesets / qingniao (`pnpm publish`), the `"workspace:*"` specifier was rewritten into a static version dependency `"@birdify/core": "0.1.2"`.
   - When an end-user or agent runs `npx --yes @borg0ai/birdify@0.1.2`, npm queries `https://registry.npmjs.org/@birdify%2fcore` to resolve the transitive dependency, which immediately responds with HTTP 404 (Not Found). Installation aborts.

2. **Divergent Packaging Implementations**:
   - `tools/pack-cli.mjs` was an ad-hoc local script that attempted to vendor `packages/core/dist` into `vendor/core` and rewrite imports post-hoc.
   - Standard monorepo publishing via `changesets` / `qingniao` runs `pnpm publish` directly on `apps/cli`, bypassing `tools/pack-cli.mjs` entirely.
   - The CLI build configuration itself must produce a self-contained, publication-ready bundle.

3. **Flawed Test Expectations in `cli-bundle.test.ts`**:
   - `apps/cli/src/__tests__/cli-bundle.test.ts` explicitly asserted:
     ```ts
     assert.match(bundle, /from ['"]@birdify\/core['"]/);
     ```
   - This test codified the broken assumption that `@birdify/core` should remain an external runtime dependency rather than being inlined into the CLI.

4. **CI Installation and Clean-checkout Symlink Gap**:
   - In CI or clean clones, `pnpm install` did not link the `birdify` binary into `node_modules/.bin/` because `apps/cli/package.json`'s `bin` pointed to `./dist/birdify.mjs`, which does not exist prior to running `pnpm run build`.
   - Adding a stable `./bin/birdify.mjs` wrapper (identical to `toolings/birdify-dev/bin/birdify-dev.mjs`) ensures the binary link exists immediately after `pnpm install`.

## Goals

- Inline `@birdify/core` directly into `apps/cli/dist/birdify.mjs` during `vite build`.
- Move `@birdify/core` to `devDependencies` in `apps/cli/package.json`.
- Ensure `apps/cli` only declares public, published npm packages in `dependencies` (`@sinclair/typebox`, `ajv`).
- Add a stable `./bin/birdify.mjs` executable wrapper in `apps/cli` to fix fresh-install symlinking in CI.
- Update `apps/cli/src/__tests__/cli-bundle.test.ts` to assert that `@birdify/core` is bundled and NOT external.
- Deprecate or align `tools/pack-cli.mjs` with the standard `apps/cli` build.
- Verify through automated packaging smoke testing (`npm pack` + installing in a pristine temporary folder without access to the workspace) that the packaged CLI installs and executes via npm/npx without registry errors.

## Non-goals

- Do not publish `@birdify/core` as an independent public npm package.
- Do not alter the skill directory structure or change the public CLI command interface (`validate`, `render`, `install`, `doctor`, `setup`, `mode`, `uninstall`).
- Do not bundle external third-party dependencies (`ajv`, `@sinclair/typebox`) that are already publicly available on npm unless needed.

## Design

### 1. Build Configuration (`apps/cli/vite.config.ts`)

Remove `'@birdify/core'` from the `EXTERNAL` list:

```ts
// Only externalize public third-party npm packages; inline internal workspace core
const EXTERNAL = ['@sinclair/typebox', 'ajv'];
```

Vite will bundle all TypeScript modules from `packages/core` directly into `apps/cli/dist/birdify.mjs`.

### 2. Package Manifest (`apps/cli/package.json`)

Update `dependencies` and `devDependencies`:

```json
{
  "name": "@borg0ai/birdify",
  "bin": {
    "birdify": "./bin/birdify.mjs"
  },
  "files": [
    "bin",
    "dist",
    "README.md"
  ],
  "dependencies": {
    "@sinclair/typebox": "0.34.41",
    "ajv": "8.20.0"
  },
  "devDependencies": {
    "@birdify/core": "workspace:*",
    "@types/node": "22.20.4",
    "typescript": "5.9.3",
    "vite": "6.4.3"
  }
}
```

Remove `"dependenciesMeta"` containing the unused `"injected": true`.

### 3. Stable Binary Wrapper (`apps/cli/bin/birdify.mjs`)

Add a stable wrapper entrypoint checked into git:

```js
#!/usr/bin/env node
// Stable entrypoint. pnpm links it during install; Vite bundle appears after build.
import '../dist/birdify.mjs';
```

This matches the pattern established in `toolings/birdify-dev/bin/birdify-dev.mjs`.

### 4. Bundle Test Update (`apps/cli/src/__tests__/cli-bundle.test.ts`)

Update tests to enforce bundling:

```ts
test('vite cli bundle inlines core and keeps third-party dependencies external', () => {
  assert.match(bundle, /^#!\/usr\/bin\/env node\n/);
  // Must NOT reference @birdify/core externally
  assert.equal(/from ['"]@birdify\/core['"]/.test(bundle), false);
  // Third-party libraries remain external
  assert.equal(bundle.includes('@sinclair/typebox'), true);
});
```

### 5. Verification Plan

1. **Build & Unit Tests**:
   - `pnpm run build`
   - `pnpm test`
   - `pnpm --filter @borg0ai/birdify test`
2. **Package Smoke Test**:
   - In a clean temporary directory, run `npm pack apps/cli`
   - Install the resulting `.tgz` into an isolated folder
   - Execute `node_modules/.bin/birdify --help` and verify no missing module or 404 errors occur.
3. **CI Validation**:
   - Push and verify GitHub Actions `CI` and `Deploy` workflows pass on Ubuntu and Windows.
