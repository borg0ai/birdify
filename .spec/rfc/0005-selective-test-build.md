# RFC 0005: Build only the selected test suite

**Status:** Withdrawn

Vitest runs the selected suite directly. `pnpm test` is `vitest run --project unit` (`test/**/*.test.ts`). `pnpm run test:browser` is `vitest run --project browser` (`test/**/*.browser.ts`, one file at a time). There is no esbuild prebuild and no `.test-build/` output. `tsc --project tsconfig.test.json` still typechecks the test sources. The design below is not implemented.

## Summary

Select unit or browser test entries before invoking esbuild so each test command builds only the suite it will execute. Preserve existing test execution and type-check coverage.

## Problem

`tools/build-tests.mjs` currently bundles every `.test.ts` and `.browser.ts` entry before reading `--unit` or `--browser`. It selects the execution list afterward. Unit-only runs therefore transform browser tests unnecessarily, and invalid arguments can write output before rejection.

## Goals

Reduce unnecessary test transformation and output files while preserving existing command behavior and all test cases.

## Non-goals

No conversion of test source to `.mjs`, no removal or narrowing of `tsc --noEmit` coverage, no changes to runtime builds, no cache framework, no test-runner replacement, and no schema-export changes.

## Design

In `tools/build-tests.mjs`, validate the mode before building. Discover entries once, then select `.test.ts` for `--unit`, `.browser.ts` for `--browser`, and both for no mode. Feed the selected list to esbuild and derive execution paths from that same list.

Keep no-mode behavior: build both suites without executing. Preserve Node test runner invocation for unit tests, sequential browser execution, non-zero failure propagation, output paths, and the distributed-source resolution plugin. Reject an explicit suite with no entries rather than report a successful empty run.

Old outputs may remain in `.test-build/`, but execution must use only the current selected source list, never a generated-file glob. Do not add broad cleanup or a new build abstraction. Keep `package.json` command names and existing `tsconfig.test.json` checks unchanged; these checks use `noEmit` and do not generate a second set of JavaScript files.

Retaining all-entry bundling keeps current code but performs unused work. Separate per-suite build systems would duplicate configuration. Early filtering in the existing tool is the smallest change.

## Acceptance

Use isolated temporary fixture directories to verify that unit mode emits only unit entries, browser mode emits only browser entries, and no mode emits both without running tests. An invalid mode must exit non-zero before output is written. An empty explicitly selected suite must fail clearly.

Seed stale output from the other suite and verify it is not executed. Preserve failing-test exit status and the distributed-source mapping. Run the full type-check gate and both real test suites; report any unavailable browser environment rather than count it as a pass. Record selected entry counts before and after to demonstrate reduced build work without unsupported speed claims.
