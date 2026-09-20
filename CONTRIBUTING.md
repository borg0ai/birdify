# Contribution Guidelines

[中文](CONTRIBUTING.zh.md)

## Development

The installable skill lives entirely in [`birdify/`](birdify/). TypeScript source, tests, build configuration and repository tooling remain at root. Use Node.js 18 or newer:

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

`birdify/SKILL.md` is the skill entrypoint. TypeScript source lives in `src/`; generated runtime commands live in `birdify/scripts/`; viewer assets live in `birdify/assets/`; schemas, examples and references stay inside `birdify/`; tests live in `test/`. Do not add host-specific installation branches or legacy brand aliases.

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
