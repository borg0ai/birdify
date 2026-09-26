# RFC 0006: CLI-first Birdify skill delivery

**Status:** Draft

## Summary

Keep the repository root workspace private and named `birdify-monorepo`. Publish `apps/cli` as npm package `@borg0ai/birdify` with executable `birdify`; move reusable runtime APIs into `packages/`, and update the installed skill to invoke the executable with `npx`. Keep the skill payload focused on instructions, references, examples and assets. Compile only TypeScript that must become Node-executable JavaScript or package type declarations; keep native `.mjs` tools directly executable.

## Problem

The skill currently invokes generated scripts under `birdify/scripts/` for validation, rendering, constraint discovery, rule compilation, freshness checks and mode management. That makes the skill depend on files copied into its own payload and duplicates the user command surface that should belong to a publishable CLI. Core implementation is under root `src/`, so it is not yet a clean package dependency of `apps/cli`.

Third-party runtime packages such as TypeBox and Ajv are bundled into generated skill code to preserve a dependency-free payload. Once those operations move behind an npm CLI and shared package, their dependencies can be installed and declared through npm manifests. A dependency by itself is not a reason to compile TypeScript or bundle JavaScript.

## Goals

- Put the public `birdify` executable and command handlers in `apps/cli` and publish package `@borg0ai/birdify` on npm.
- Keep repository root as a private pnpm/Turbo workspace coordinator; never publish the root workspace package.
- Put shared contracts and operations in one or a few consumer-facing packages under `packages/`; choose boundaries from actual consumers, not source-file count.
- Make the CLI the skill's execution path for validation, rendering, constraint workflows and project-mode operations.
- Let skill installation remain separate from CLI installation. Document `npx --yes @borg0ai/birdify <command>` so users can run the published `birdify` executable on demand.
- Keep only skill-specific instructions, references, examples, static assets and any truly skill-owned minimal scripts in `birdify/`. Skill scripts must not duplicate CLI business logic.
- Manage apps and packages with pnpm workspaces and Turbo task graph.
- Compile `.ts` sources only when required for the supported Node runtime, published JavaScript entry points, or `.d.ts` consumer types. Run native `.mjs` repository helpers directly.
- Preserve existing map, activity, constraint and project-mode semantics while migrating commands.

## Non-goals

- Add new architecture-map or constraint capabilities.
- Publish the skill directory as a replacement for the npm CLI.
- Publish the repository root or its workspace coordinator manifest.
- Bundle Node third-party dependencies into the CLI just to make `npx` work; declare runtime dependencies in the npm package manifests.
- Compile small `.mjs` helpers or move repository-only tools into published packages.
- Change Node support policy or reserve a guessed npm package name without checking registry ownership.
- Add remote Turbo cache, telemetry or an install-time project mutation.

## Design

### Workspace

Keep the repository root package private, named `birdify-monorepo`, and use it only as the pnpm/Turbo workspace orchestrator. Add workspace manifests for `apps/*` and `packages/*`; root package has no release tarball. Put published CLI package `@borg0ai/birdify` in `apps/cli`; retain website as `apps/site`; place shareable runtime code in `packages/*`. Each published app or package owns its release manifest and tarball. Root quality and release tools that are not package APIs remain plain `tools/*.mjs`.

### Shared package boundary

Audit current imports and consumers before moving code. Initial candidate is one `packages/core` with contract schemas/types, validation, constraint discovery/review/history/freshness and HTML rendering APIs. The package exports callable functions and declares TypeBox, Ajv and other direct runtime dependencies. Split browser-only viewer assets only if an actual dependency or publish-size boundary requires it. CLI owns argument parsing, filesystem interaction, diagnostics and exit codes; it delegates domain work to package APIs.

### CLI and runtime artifacts

Create one documented CLI with subcommands for current operations: doctor, setup/mode/uninstall, validate, render, constraint discovery, reviewed-rule compilation/history, freshness inspection and standalone constraint rendering. Each command must preserve current input/output formats and path behavior. CLI TypeScript is built with Vite into one Node ESM entry, `dist/birdify.mjs`. Shared package TypeScript compiles with `tsc` to package-local ESM `.mjs`. Direct `.mjs` adapters and repository helpers need no compilation. Vite keeps `@birdify/core`, TypeBox, and Ajv external; third-party packages stay declared runtime dependencies and are not inlined.

The installable skill already contains its viewer scripts. Do not compile TypeScript into `birdify/` and check in the output. Rendering reads those skill files and inlines them into standalone HTML. Keep the schema exporter and other small repository orchestration helpers as direct `.mjs` unless a concrete typed package API requires otherwise.

### Skill migration and release

Update paired English and Chinese skill instructions and references to call the CLI through `npx --yes @borg0ai/birdify <command>`. The npm package is named `@borg0ai/birdify`; its `bin` command is `birdify`. `npx skills` continues installing the skill; it does not install the CLI. The skill must explicitly tell the agent/user how to invoke the CLI and what Node/network prerequisites apply.

Remove shipped scripts whose responsibility moved to the CLI after clean-consumer verification. Retain scripts only when they perform an essential skill-local task that has no CLI equivalent; keep these small, self-contained and `.mjs` when compilation is unnecessary. Preserve static schemas/examples/assets only where installation-time references or rendering require them.

During migration, keep old script commands as thin compatibility adapters until the skill documentation and package tests use the new CLI. Remove those adapters only after parity and packed-package checks pass.

## Acceptance

- pnpm workspace install and Turbo task graph build/check CLI, shared package, site and tests in dependency order without running unrelated tasks.
- npm package `@borg0ai/birdify` exposes executable `birdify` through `bin`, declares Node engine and direct runtime dependencies, and has a bounded npm `files` list.
- CLI delegates validation/rendering/constraint behavior to shared package exports; no second implementation is copied into command handlers.
- A clean temporary consumer runs the packed CLI through `npx` for help, validation, rendering, project mode and a representative constraint workflow without a source checkout.
- CLI behavior matches existing script behavior for representative valid and invalid inputs, output paths, exit codes, and paths with spaces.
- Skill can be installed with `npx skills` independently, then its documented `npx` CLI invocations work with no repository-relative scripts.
- Skill payload contains no duplicate implementation for migrated CLI operations; remaining scripts are documented as essential skill-local helpers and need no unnecessary compile step.
- CLI `.ts` sources produce one Vite ESM entry and are not checked into the skill. Shared package `.ts` sources produce executable ESM outside `birdify/`. Native `.mjs` helpers run directly. Third-party dependencies install from manifests and stay outside the CLI bundle. Skill viewer files ship as themselves.
- Existing schemas, public JSON formats, generated viewer output and project mode behavior remain compatible.
- English/Chinese docs agree. Release checks inspect both skill and npm tarball contents and reject stale script paths.
