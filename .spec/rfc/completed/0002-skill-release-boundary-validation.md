# RFC 0002: Skill release-boundary validation and metadata hygiene

**Status:** Implemented

## Summary

Make Birdify's installable `birdify/` directory release-safe and add a repository-local validator for the Skillify package contract. Preserve current runtime behavior and keep this work limited to packaging hygiene, metadata consistency, and validation tooling.

## Problem

At the initial review, the existing archive passed typecheck, distributed-artifact checks, example validation, archive installation, and `doctor`. The following findings are historical context, not acceptance evidence for subsequent changes:

- `birdify/node_modules/` exists in the working tree and must never be part of a skill release;
- tracked `birdify/build-artifacts.json` is generated output rather than runtime input;
- the required `scripts/validate-skill.mjs` gate does not exist;
- `skill-release.json` declares `channel: development` with stable version `0.1.1`;
- package contents include documentation and demonstration material whose runtime necessity is not explicitly verified.

Without a repository-side release validator, a successful `npx skills` discovery check can hide release-boundary and metadata failures.

## Goals

- keep `birdify/` self-contained and free of dependency directories, tests, fixtures, and unnecessary generated output;
- maintain the release validator at `tools/validate-skill.mjs`, outside the installed skill;
- enforce `SKILL.md` frontmatter, directory/name/`skillId` identity, relative-link integrity, metadata version/channel consistency, and forbidden-content checks;
- make release metadata use a valid version/channel pair;
- document the release-safe package contents and verification commands;
- preserve current CLI, renderer, schema, example, and archive-install behavior.

## Non-goals

This RFC does not redesign Birdify's architecture map, activity contract, renderer, viewer, activation policy, or host integration. It does not remove runtime assets or examples until link and execution analysis proves they are unnecessary.

General internal-tool relocation and conversion from `.mts` to `.mjs` belong exclusively to [RFC 0003](0003-internal-tooling-layout.md). This RFC owns release validation behavior and payload safety only.

## Design

The published boundary is `birdify/`. Repository development files live outside that directory, organized by responsibility.

### Internal tooling and shipped runtime

| Location | Responsibility | Shipped with skill |
| --- | --- | --- |
| `birdify/SKILL*.md`, `birdify/references/` | Activation and usage instructions | Yes |
| `birdify/scripts/` | User commands for doctor, modes, architecture validation, rendering and constraints | Yes |
| `birdify/assets/`, `birdify/schemas/`, `birdify/examples/` | Required viewer resources, contracts and usage examples | Yes |
| `birdify/skill-release.json`, licenses and notices | Release identity and redistribution terms | Yes |
| `tools/*.mjs` | Internal build, test, documentation and release helpers | No |
| `config/` | Development metadata, including `build-artifacts.json` | No |
| `src/` | Typed runtime source; generated runtime output belongs in `birdify/` | No |
| `test/`, `.build-tools/`, `.test-build/`, `node_modules/` | Tests, generated tooling and development dependencies | No |
| `apps/`, `docs/`, `.spec/`, `.github/`, root manifests and guides | Website, repository documentation and CI | No |

`validate-skill` validates release packaging and runs as `node tools/validate-skill.mjs birdify`. Its relocation is tracked under RFC 0003; this RFC defines its checks. `birdify/scripts/validate.mjs` validates users' architecture data and remains shipped. The table defines release inclusion, not a mandate to migrate all internal tooling in this RFC.

The validator runs from a clean checkout and checks:

1. exactly one canonical `SKILL.md` exists;
2. required metadata and license files exist;
3. frontmatter name matches the directory and `skill-release.json` `skillId`;
4. release version follows SemVer and agrees with its channel;
5. relative Markdown links resolve inside `birdify/`;
6. forbidden directories, fixtures, dependency folders, secrets, absolute local paths, and unapproved generated files are absent;
7. every runtime script, schema, asset, and reference used by the skill exists.

The release process runs this validator alongside `npx skills add . --list`, repository build checks, example validation, and clean archive installation. Package slimming remains evidence-driven: files are removed only after confirming no runtime or documentation link requires them.

## Acceptance

- validator exits zero for the intended release package;
- validator exits non-zero for each forbidden-content and metadata mismatch case;
- `birdify/node_modules/` is absent from the release workspace and archive;
- development-only artifact inventories are absent from the skill payload;
- release validation runs from `tools/validate-skill.mjs`; no packaging-only validator ships in `birdify/`;
- `skill-release.json` uses a channel/version pair accepted by the release contract;
- `npx skills add . --list` still discovers exactly `birdify`;
- `pnpm run typecheck`, `pnpm run check:build`, `pnpm run validate:examples`, `pnpm run check:install`, and `node birdify/scripts/birdify.mjs doctor` remain green;
- README and release documentation state the same validation commands and package boundary;
- RFC, roadmap, and task tracker remain synchronized.

## Work breakdown

1. Define validator contract and negative cases.
2. Implement release validation checks and negative tests using the internal entrypoint coordinated with RFC 0003.
3. Clean or justify package contents and align release metadata.
4. Update release documentation and CI integration.
5. Run all acceptance checks from a clean archive.

## Scope history

An earlier draft included general internal-tool migration. That scope is superseded by RFC 0003 and is not part of this RFC's acceptance criteria.

## Verification

Verified on 2026-09-20: `pnpm run validate:skill` accepted the 90-file payload. The 86-test unit suite includes rejection cases for dependency directories, fixtures, internal inventory, TypeScript source, missing license, boundary-escaping links, null/non-object metadata, unsupported schema/channel, invalid release URLs, malformed SemVer and channel/version mismatches. `pnpm run check:install` passed for an isolated working-tree copy and separately for the prior committed archive. Build parity, examples and documentation checks passed. No new release or commit is claimed.
