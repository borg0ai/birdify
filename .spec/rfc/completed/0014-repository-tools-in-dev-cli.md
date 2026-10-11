# RFC 0014: Move Repository Tools into the birdify-dev CLI

**Status:** Implemented

## Summary

Move the remaining repository maintenance tools from `tools/*.mjs` into the private `@birdify/birdify-dev` CLI. Expose build, documentation, installation, skill-package validation and schema-export operations as `birdify-dev` commands. Keep existing root `pnpm` command names as thin CLI entrypoints and remove the standalone `tools/` implementation directory.

## Problem

Repository checks currently use two execution models: viewer generation runs through `birdify-dev`, while build checks, documentation checks, installation checks, skill release validation and schema export run as separate scripts under `tools/`. This splits repository command discovery and implementation across unrelated entrypoints. RFC 0003 established the `tools/` layout; this RFC supersedes that placement decision for the remaining maintenance tools while preserving their behavior and keeping them outside the installed skill and published agent CLI.

## Goals

- Provide `birdify-dev` subcommands for `check-build`, `check-docs`, `check-install`, `validate-skill` and `export-schemas`.
- Preserve existing command behavior, failure conditions, output artifacts and documented root `pnpm` script names.
- Run schema export through `birdify-dev` after Core runtime contracts have been compiled.
- Keep `birdify-dev` private to the repository and keep development tools out of both `birdify/` and the published `@borg0ai/birdify` package.
- Remove the migrated implementations from `tools/` and update callers, tests and paired contribution documentation.

## Non-goals

- Do not add repository maintenance commands to the agent-facing `birdify` CLI.
- Do not move development metadata from `config/` or test suites from `test/`.
- Do not change skill release contents, runtime contracts, viewer generation behavior or public agent CLI syntax.
- Do not restore `bundle-runtime.mjs` or the redundant `pack-cli.mjs`; their removal is handled separately, with `pack-cli` covered by RFC 0010.
- Do not add shell wrappers or dependencies solely for this migration.

## Design

1. Add typed command implementations under `toolings/birdify-dev/src/commands/` for build checks, documentation checks, installation checks, skill release validation and schema export. Reuse the existing CLI's repository-root and error-reporting conventions; do not leave implementations in `tools/` behind thin wrappers.
2. Register the commands in `toolings/birdify-dev/src/birdify-dev.ts` and document their arguments in CLI help. Preserve `check-docs --update`, the optional skill directory argument and schema export's `--check` behavior.
3. Update root `package.json` scripts to call `birdify-dev` subcommands. Update `packages/core/package.json` so its build runs `birdify-dev export-schemas` after TypeScript compilation.
4. Update existing tool regression coverage in `test/unit/tools.test.ts` to exercise the CLI commands and preserve the current negative cases. Keep the tests in the repository test suite.
5. Update English and Chinese `CONTRIBUTING` descriptions and their synchronization record. Remove the migrated `.mjs` files and the now-empty `tools/` directory.

The schema exporter must read the already-built `packages/core/dist/contracts/models.js`; it must not compile a second contract tree. Commands that currently work independently of the caller's working directory must retain equivalent repository path resolution. Root `pnpm` scripts remain the stable entrypoints for CI and contributors.

## Acceptance

- All five operations run through `birdify-dev`; migrated implementation files no longer exist under `tools/`.
- Root package scripts and the Core build invoke the corresponding dev CLI commands; CI keeps using the stable root scripts.
- Skill validation remains outside the installable `birdify/` payload, and the npm agent CLI package contains no development commands.
- Existing command regression cases cover success, stale/missing artifacts, invalid arguments or package contents, and schema export from an unrelated working directory.
- `pnpm run build`, `pnpm run typecheck`, `pnpm run check:build`, `pnpm test`, `pnpm run check:docs`, `pnpm run validate:skill` and `pnpm run check:install` pass.
- English and Chinese contribution docs stay paired, links resolve, and `pnpm run check:docs` passes.
