# RFC 0004: Direct schema export without tool compilation

**Status:** Draft

## Summary

Run schema export directly from `tools/contracts/export.mjs`, consuming the already-built runtime contract module. Remove the separate internal-tool compilation pass while preserving runtime type checks and schema compatibility.

## Problem

`tsconfig.tools.json` compiles `tools/contracts/export.mts` plus its imported runtime contracts into `.build-tools/`. The normal runtime build already compiles those contracts. The exporter mainly serializes schema objects; compiling a second module tree adds outputs and path dependencies without a required user capability.

## Goals

Eliminate exporter compilation and duplicate contract emission. Keep one runtime contract source and retain `tsc --noEmit` checks. Keep internal tooling outside the installed skill.

## Non-goals

No wholesale `.mts` to `.mjs` conversion, no changes to contract types or JSON Schema semantics, no test-build optimization, no removal of browser/dependency bundling, and no new runtime dependency or Node-version requirement. RFC 0003 remains completed; this RFC supersedes only its allowance for a compiled schema exporter.

## Design

Rename `tools/contracts/export.mts` to `tools/contracts/export.mjs`, remove TypeScript-only syntax, and import the existing exports from `birdify/scripts/contracts/models.mjs`. Verify the bundled module exposes every symbol used for public `$defs`. Resolve output paths relative to the tool's actual location, independent of working directory.

Keep build ordering explicit in `package.json`: compile runtime source, bundle runtime dependencies, build viewer assets, then run the exporter directly. Remove `tsconfig.tools.json` and its CI compilation command once no consumers remain. Update `tools/check-build.mjs`, relevant test fixtures, and paired documentation to invoke the direct exporter without fallback to obsolete generated tools.

Preserve `--check`: compare existing schema files without writing. Normal export writes the same stable JSON, public `$id` and `$defs` anchors as before. Missing runtime artifacts must fail non-zero with an actionable build prerequisite; do not silently generate an alternative contract or fall back to stale `.build-tools/` files.

Retaining exporter TypeScript would preserve its tuple assertion but continue a separate compilation tree. Direct `.mjs` is preferred because contract type safety stays in runtime source and the exporter performs serialization only.

## Acceptance

From a clean temporary checkout with dependencies installed but no `.build-tools/`, build succeeds without tool compilation. Compare generated schemas with the pre-change baseline and run contract-parity tests; schema bytes and public anchors remain unchanged.

Run export and `--check` from an unrelated directory. Prove `--check` rejects a changed schema without modifying it, and a missing runtime module fails clearly. Run typecheck, build parity, unit tests, example validation and installation checks. Verify scripts and CI no longer reference `tsconfig.tools.json` or the compiled exporter. Record emitted-file counts before and after; do not claim a timing improvement without measurement.
