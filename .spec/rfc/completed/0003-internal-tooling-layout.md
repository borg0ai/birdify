# RFC 0003: Internal tooling layout

**Status:** Implemented

## Summary

Separate repository-only tooling from runtime source. Keep small internal tools in `tools/*.mjs`, executed directly by Node, and development metadata in `config/`.

## Problem

Internal build, test and release helpers currently share `src/` with runtime source. Small helpers require compilation, and a transitional release validator is emitted into the skill payload. File placement obscures which commands installed users need.

## Scope

This RFC owns internal-tool placement, removal of unnecessary tool compilation, and associated caller updates. [RFC 0002](0002-skill-release-boundary-validation.md) owns release validation rules and package acceptance. Neither RFC duplicates the other's implementation tasks.

## Design

- Move small internal helpers such as build-tests, build-viewer, bundle-runtime, check-docs and check-install from `src/` to `tools/*.mjs`; preserve command behavior.
- Keep `tools/check-build.mjs` directly executable and its inventory at `config/build-artifacts.json`.
- Move the transitional release validator from `src/validate-skill.mts` and `birdify/scripts/validate-skill.mjs` to `tools/validate-skill.mjs`. Preserve its current behavior; additional checks belong to RFC 0002.
- Keep user-facing architecture validation at `birdify/scripts/validate.mjs`.
- Move the typed schema exporter under tooling. It may retain TypeScript when needed for shared typed contracts; generated tooling stays outside `birdify/`.
- Update package scripts, compiler includes/excludes, tests and CI references. Remove obsolete tracked outputs; do not rewrite unrelated concurrent changes.
- Do not add shell wrappers, dependencies or abstractions solely for this relocation.

Runtime TypeScript, browser bundling and schema generation remain supported. Installed skill users require no build. Website implementation and broad runtime rewrites are out of scope.

## Alternatives

Retaining compiled small helpers under `src/` avoids moves but retains the source-boundary ambiguity and compilation requirement. Direct `.mjs` under `tools/` is selected for small helpers; typed contract consumers may retain compilation where justified.

## Acceptance

- Small internal helpers execute from `tools/*.mjs` without compiling those helpers first.
- Development metadata remains under `config/`, outside the root file list and skill payload.
- No internal helper source remains mixed into runtime `src/`; no packaging-only validator is emitted into `birdify/`.
- Package scripts, compiler configuration, tests and CI contain no obsolete relocated paths.
- Existing build, typecheck and relevant tool tests pass; runtime output and user command behavior are preserved.
- Installation checks distinguish current working-tree verification from committed archive verification; old HEAD success does not verify new uncommitted changes.
- Contribution documentation describes the final layout in both languages.

## Work breakdown

1. Inventory internal helpers and typed-contract dependencies.
2. Relocate helpers and metadata, converting small helpers to direct `.mjs`.
3. Update callers and remove obsolete compilation entries and tracked outputs.
4. Verify tool behavior, runtime artifact parity and documentation consistency.

## Risks

Directory-relative paths and compiler output locations can change behavior. Preserve existing command interfaces and verify helpers from unrelated working directories. Retain type checking for shared contract consumers where conversion would lose useful guarantees.

## Verification

Verified on 2026-09-20: internal helpers reside under `tools/`, the release validator is absent from `birdify/`, and the inventory resides under `config/`. Build, typecheck, artifact parity and 86 unit tests passed. The typed schema exporter retains compilation under `tools/contracts/`; CI explicitly compiles it before artifact checks without overwriting runtime artifacts. Documentation checks passed for 17 pairs. Installation checks exercised the isolated working-tree copy and old committed archive separately.
