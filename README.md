![Birdify logo](birdify/assets/brand/logo-512.png)

# Birdify

Architecture-first visibility into AI coding agent changes.

Birdify asks AI coding agents to map project architecture and declare affected modules and files before editing code, generating an interactive, standalone HTML view of the system and planned changes.

> Forked from and inspired by [Qiuner/birdview](https://github.com/Qiuner/birdview) to customize.

[Quick Start](#quick-start) · [Architecture](docs/architecture.md) · [How It Works](#how-it-works) · [Live Demo](birdify/examples/harness-activity.html) · [简体中文](README.zh.md)

---

## What Birdify Does

- **System Architecture Map**: Visualizes modules, ownership, file boundaries, and evidence-linked dependencies.
- **Change Scope & Intent**: Lights up planned modules and affected files before implementation begins.
- **Verifiable Output**: Validates structure and renders a zero-dependency, self-contained HTML snapshot.

## Quick Start

### Install Skill

```sh
npx skills add borg0ai/birdify --skill birdify
```

### Usage

Ask your agent:

```text
$birdify Show this project's architecture and constraints; do not edit code.
```

The agent generates `.birdify/architecture.json` and renders `.birdify/architecture.html` to open in your browser.

## How It Works

```text
project source ──> architecture.json ─┐
                                     ├──> validate ──> render ──> standalone HTML
agent declarations ─> activity.jsonl ┘
```

1. **Map Project**: Agent scans the codebase, identifies modules, file ownership, and evidence links.
2. **Declare Changes**: Agent records target scope, planned edits, and verification checks.
3. **Render Snapshot**: Generates an interactive viewer for review before executing changes.

## Manual Execution

Validate and render architecture files directly:

```sh
pnpm exec birdify validate .birdify/architecture.json
pnpm exec birdify render .birdify/architecture.json .birdify/architecture.html
```

With activity history:

```sh
pnpm exec birdify validate .birdify/architecture.json .birdify/activity.jsonl
pnpm exec birdify render .birdify/architecture.json .birdify/activity.html .birdify/activity.jsonl
```

## Project Structure

- [`birdify/schemas/`](birdify/schemas) — Architecture and activity JSON schemas
- [`apps/cli/`](apps/cli) — CLI validator and HTML renderer
- [`birdify/assets/`](birdify/assets) — Interactive viewer template and assets
- [`birdify/examples/`](birdify/examples) — Sample architecture and activity files
- [`birdify/references/`](birdify/references) — Workflow contracts and specifications

## Development

```sh
pnpm install
pnpm run validate:examples
pnpm test
pnpm run build:demo
```

## License

[MIT](LICENSE)