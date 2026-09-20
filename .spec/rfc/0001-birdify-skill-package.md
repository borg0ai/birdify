# RFC 0001: Birdify generic skill package and npx skills migration

**Status:** Approved

## Summary

Move the distributable Birdify skill into a dedicated `birdify/` package directory that follows the layout used by `../archify`. Make `npx skills add ... --skill birdify` the only supported installation path, keep TypeScript and tests in the repository development workspace, remove host-specific integrations, and remove every legacy brand reference from source, generated artifacts, documentation, tests, and package paths.

## Problem

Current repository mixes skill payload, TypeScript source, tests, repository tooling, website assets, and host-specific installation behavior. Installing the `birdify/` directory would expose `.mts` source and development dependencies that customers do not need. The layout also forces the CLI to know individual agent names. Legacy branding survives in filenames, generated output, tests, and installation text. The result is not a clean generic skill package.

## Goals

The migration aims to:

- place all runtime skill content under `birdify/`;
- keep TypeScript source, tests, compiler configuration and development dependencies outside the distributable package;
- expose `SKILL.md` directly inside the `birdify/` package;
- use `npx skills add <repository> --skill birdify` for installation;
- make setup and mode management host-neutral through `AGENTS.md`;
- remove host-specific installation branches and legacy brand strings;
- preserve architecture, activity, schema, rendering, and validation contracts;
- compile repository source into checked-in package artifacts;
- verify clean archive installation and generated artifact parity.

## Non-goals

The migration does not redesign architecture JSON, activity JSONL, renderer behavior, viewer UX, constraint semantics, or project-mode policy. It does not publish an npm package, preserve a legacy CLI alias, or add integrations for individual agent products.

## Design

The repository keeps development infrastructure at root and introduces this skill package boundary:

```text
birdify/
├── SKILL.md
├── scripts/
├── references/
├── schemas/
├── assets/
├── examples/
├── LICENSE
└── THIRD_PARTY_NOTICES
```

The repository development workspace owns `src/`, `test/`, TypeScript configuration, build dependencies and build commands. The `birdify/` directory contains only the installable skill: `SKILL.md`, generated `scripts/*.mjs`, runtime assets, schemas, examples, references, licenses and `skill-release.json`. The build emits runtime JavaScript from repository `src/` into `birdify/scripts/`; installed users never compile TypeScript. Package-local runtime paths resolve relative to `birdify/`; repository checks resolve the package root explicitly. The package name, executable, state directory, environment variables, generated markers, documentation, tests, and fixture names use `birdify`. Host selection is delegated to `skills` CLI and the host's own skill selector. Project mode CLI accepts only `--project` and manages `AGENTS.md`.

The migration is performed in phases: define the package boundary, move development source and tests outside the package, emit generated runtime artifacts into `birdify/`, remove host-specific branches, rewrite paired documentation, regenerate tracked artifacts, then validate package discovery and clean archive installation.

## Acceptance

Acceptance requires all of the following:

- RFC validation and governance sync-check pass through the Specify workflow;
- `birdify/SKILL.md` exists at the package root and no root-level skill payload remains;
- `birdify/` contains no TypeScript source, test source, compiler configuration, development dependency metadata or build-only tool;
- repository source compiles into checked-in `birdify/scripts/*.mjs` and installed users do not need a build step;
- `npx skills add <repository> --skill birdify` resolves the package in a clean checkout;
- `birdify` doctor, validation, rendering, and mode commands work from an unrelated directory;
- typecheck, build, unit tests, example validation, documentation checks, and clean archive installation pass;
- repository search finds no legacy brand string in tracked text, source filenames, generated artifacts, runtime metadata, or tests;
- architecture and activity contract fixtures remain compatible.
