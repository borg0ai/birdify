# Contribution Guidelines

[中文](CONTRIBUTING.zh.md)

## Development

The installable skill lives entirely in [`birdify/`](birdify/). TypeScript source, tests, build configuration and repository tooling remain at root. Use Node.js 22 or newer:

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run check:build
pnpm test
pnpm run validate:examples
pnpm run check:docs
```

For viewer or renderer changes, run `pnpm run build:demo`, review the tracked demo, and run browser checks with `pnpm run test:browser`. Report commands actually run and remaining limitations. Never include private source data or credentials.

## Package boundary

The installable payload is `birdify/`. A full repository archive also contains development files; it is not the skill payload.

| Location | Purpose | Ships with skill |
| --- | --- | --- |
| `birdify/SKILL*.md`, `birdify/references/` | Activation and usage instructions | Yes |
| `birdify/scripts/` | Generated browser modules used by the viewer | Yes |
| `apps/cli/`, `packages/` | Published `birdify` CLI and shared runtime. Not part of the skill payload | No |
| `birdify/assets/`, `birdify/schemas/`, `birdify/examples/` | Viewer resources, data contracts and usage examples | Yes |
| `birdify/skill-release.json`, licenses and notices | Release identity and redistribution terms | Yes |
| `templates/viewer/` | Viewer TypeScript compiled into `birdify/assets` | No |
| `toolings/birdify-dev/` | Development CLI `birdify-dev`, including the viewer asset build | No |
| `tools/`, `config/` | Internal tools and development metadata, including the artifact inventory | No |
| `.build-tools/`, `test/`, `node_modules/` | Generated tooling, tests and development dependencies | No |
| `apps/`, `docs/`, `.spec/`, `.github/`, root manifests and guides | Website, repository documentation, proposals and CI | No |

Small internal tools belong in `tools/*.mjs` and run directly with Node. They need no TypeScript compilation. Viewer assets are the exception: `toolings/birdify-dev` is the Vite-built `birdify-dev` CLI, and `birdify-dev build-viewer` compiles `templates/viewer` into `birdify/assets`. Schema export is `tools/contracts/export.mjs`: it reads the built `@birdify/core` contracts and does not compile a second module tree. Release packaging validation is `tools/validate-skill.mjs`. User commands are the `birdify` executable from npm package `@borg0ai/birdify` in `apps/cli`, which calls `packages/core`. The skill tells agents to run `npx --yes @borg0ai/birdify`.

`birdify/SKILL.md` is the skill entrypoint. Shared runtime TypeScript lives in `packages/core/src/`; the published CLI lives in `apps/cli/`; viewer source lives in `templates/viewer/` and is compiled by `birdify-dev`; viewer assets live in `birdify/assets/`; schemas, examples and references stay inside `birdify/`; tests live in `test/`. Do not add host-specific installation branches or legacy brand aliases.

Generated JavaScript and schemas must be regenerated from TypeScript:

```sh
pnpm run build
pnpm run check:build
```

Do not edit generated files directly. `pnpm run check:install` audits a clean Git archive of the nested package, verifies its dependency-free install contract in a temporary directory, runs `birdify doctor`, and tests project mode.

## Documentation

Pair English and Chinese Markdown under root `docs/` and `birdify/`. Keep links, commands, identifiers and constraints equivalent. Run:

```sh
pnpm run check:docs
```

Update the hash record only after reviewing both languages:

```sh
pnpm run check:docs --update
```

## Pull requests

Keep changes focused. Do not stage, commit, push, create branches or rewrite history without explicit authorization. Use Conventional Commit titles: `type(scope): 中文说明 / English summary`. Inspect the final diff and run relevant package checks before requesting review.
