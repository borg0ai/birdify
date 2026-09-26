# RFC 0008: Modularize TypeScript and Test Configurations to Reduce Root-Level Files

**Status:** Implemented

## Summary

Reduce root-level configuration files and eliminate configuration drift by modularizing TypeScript and test configurations across packages:
1. Delete the obsolete and unused `tsconfig.types.json`.
2. Move `tsconfig.viewer.json` into `templates/viewer/tsconfig.json`.
3. Move `tsconfig.test.json` into `test/tsconfig.json`.
4. Move `vitest.config.ts` into `test/vitest.config.ts`.
5. Establish root `tsconfig.json` as the shared base configuration (`extends: "../../tsconfig.json"`) for packages (`packages/core`, `apps/cli`, `toolings/birdify-dev`, `templates/viewer`, and `test`), eliminating duplicated compiler options.
6. Update `package.json` scripts (`typecheck`, `test`, `test:browser`) and test assertions to reference the modularized paths.

## Problem

Following the monorepo restructuring (moving code into `packages/core`, `apps/cli`, `toolings/birdify-dev`, and `templates/viewer`):
- **Root Pollution**: Five separate configuration files remained in the project root (`tsconfig.json`, `tsconfig.types.json`, `tsconfig.test.json`, `tsconfig.viewer.json`, `vitest.config.ts`).
- **Dead Configuration**: `tsconfig.types.json` was completely unused in all build, check, and CI workflows. It still targeted deleted `src/**/*.ts` paths.
- **Config Duplication**: `packages/core/tsconfig.json`, `apps/cli/tsconfig.json`, and `toolings/birdify-dev/tsconfig.json` did not extend root `tsconfig.json`, but copied and repeated the entire `compilerOptions` block verbatim (`target`, `module`, `strict`, `exactOptionalPropertyTypes`, etc.).
- **Misplaced Module Config**: `templates/viewer/` contains browser-targeted code (requiring `DOM` and `DOM.Iterable` libs) but lacked its own `tsconfig.json`, instead depending on root `tsconfig.viewer.json`.
- **Misplaced Test Config**: `vitest.config.ts` was placed at root despite solely managing test runner configuration under `test/`.

## Goals

- Clean project root by removing 4 obsolete/misplaced configuration files (`tsconfig.types.json`, `tsconfig.viewer.json`, `tsconfig.test.json`, `vitest.config.ts`).
- Make each workspace and template self-contained with its own `tsconfig.json`.
- Enforce DRY configuration: all sub-packages extend root `tsconfig.json` as the single source of truth for baseline compiler settings.
- Maintain full type-checking coverage and pass all existing unit, integration, and browser tests.

## Non-goals

- No change to compiler targets (`ES2022`, `NodeNext`).
- No change to output directory structures (`packages/core/dist`, `toolings/birdify-dev/dist`, etc.).
- No change to skill release payload boundary rules (`birdify/`).

## Design & Implementation

### 1. Delete `tsconfig.types.json`
Removed root `tsconfig.types.json`. It is no longer referenced anywhere in `package.json` or CI.

### 2. Move Viewer Configuration
Relocated `tsconfig.viewer.json` $\rightarrow$ `templates/viewer/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": [],
    "noEmit": true
  },
  "include": ["**/*.ts"]
}
```

### 3. Move Test Configuration
Relocated `tsconfig.test.json` $\rightarrow$ `test/tsconfig.json`:
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true
  },
  "include": ["**/*.ts"]
}
```

### 4. Move Vitest Configuration
Relocated `vitest.config.ts` $\rightarrow$ `test/vitest.config.ts`, setting `root: ROOT` where `ROOT` resolves to repository root.

### 5. Standardize Package Configurations to Extend Root Base
Refactored existing package tsconfigs (`packages/core/tsconfig.json`, `apps/cli/tsconfig.json`, `toolings/birdify-dev/tsconfig.json`) to inherit base compiler settings via `"extends"`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": false
  },
  "include": ["src/**/*.ts"]
}
```

### 6. Update Root `package.json` Scripts
Updated `typecheck`, `test`, and `test:browser` to reflect the new paths:
```json
"typecheck": "tsc -p packages/core/tsconfig.json --noEmit --pretty false && tsc -p apps/cli/tsconfig.json --noEmit --pretty false && tsc -p toolings/birdify-dev/tsconfig.json --noEmit --pretty false && tsc -p templates/viewer/tsconfig.json --noEmit --pretty false && tsc -p test/tsconfig.json --noEmit --pretty false",
"test": "vitest run -c test/vitest.config.ts --project unit",
"test:browser": "vitest run -c test/vitest.config.ts --project browser --no-file-parallelism"
```

### 7. Update Test Assertions
In `test/tools.test.ts`, updated the forbidden development files check to ensure no internal tsconfig files or templates leak into the `birdify` skill payload.

## Acceptance

1. Root contains only `tsconfig.json` (as the shared base config).
2. `pnpm run typecheck` executes successfully with zero errors across all workspaces and templates.
3. `pnpm run check:build`, `pnpm run validate:skill`, and `pnpm test` pass.
4. Pre-commit hook runs and verifies all checks without regressions.
