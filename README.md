<div align="center">
  <img src="birdify/assets/brand/logo-512.png" alt="Birdify logo" width="120" height="120">
  <h1>Birdify</h1>
  <p><strong>Transform your development workflow with Birdify! Shift your focus from code to architecture—and break open the black box of AI coding!</strong></p>
  <p><strong>The last advantage of coding by hand was architectural awareness—Birdify has eliminated that reason entirely.</strong></p>
  <p><strong>The future of programming comes down to just two things: constraints and architecture.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/version-0.1.1-2f81f7?style=flat-square" alt="Version 0.1.1">
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js 18 or newer">
    <img src="https://img.shields.io/badge/license-MIT-2da44e?style=flat-square" alt="MIT License">
    <img src="https://img.shields.io/badge/output-standalone%20HTML-e34f26?style=flat-square&amp;logo=html5&amp;logoColor=white" alt="Standalone HTML output">
    <img src="https://img.shields.io/badge/docs-English%20%7C%20%E4%B8%AD%E6%96%87-8250df?style=flat-square" alt="English and Chinese documentation">
    <a href="https://linux.do"><img src="https://img.shields.io/badge/linux.do-%E7%A4%BE%E5%8C%BA-1f7aec?style=flat-square" alt="linux.do community"></a>
  </p>
</div>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="birdify/examples/harness-activity.html">Live Demo</a> ·
  <a href="https://qiuner.github.io/birdify/">Project Site</a> ·
  <a href="README.zh.md">简体中文</a>
</p>

<!-- [简体中文](README.zh.md) -->

Birdify is a skill for AI coding agents. Before editing code, it asks the agent to map the project, state which modules and files the task will affect, and only then begin implementation. The result is a standalone, interactive HTML page that opens directly in a browser and requires no deployed service.

**[Project site](https://qiuner.github.io/birdify/):** [qiuner.github.io/birdify](https://qiuner.github.io/birdify/) · **[Topics](https://github.com/Qiuner/birdify#readme):** `agent-tools` `architecture-as-code` `code-visualization` `coding-agents` `developer-tools` `software-architecture`

For example, suppose you ask AI to "add rate limiting to the login endpoint":

- Normal flow: the AI searches and edits immediately, leaving you to inspect the final diff for missed or unrelated changes.
- Birdify flow: the AI first shows which modules handle login, which files it plans to edit, and which source evidence supports that plan. It then implements against that map and records the checks it actually ran.

Birdify does not automatically observe every agent action, and it does not replace Git diffs, tests, or code review. It puts the agent's understanding of the system and its declared change scope on one architecture map, so scope mistakes can be caught before the implementation is finished.

## What Birdify Shows

Logs tell you which actions the AI took, and diffs tell you which lines changed. Neither directly answers: where does this change sit in the system, what else can it affect, and why did the AI decide these files belong to the task?

Birdify puts those answers on one page:

- **System map:** the modules in the project, what each owns, and how they connect.
- **Current change:** the modules and files the agent says it will touch, plus its current step.
- **Source evidence:** the files or code locations behind each architectural claim.
- **Comparison:** the full architecture and current change scope on the same layout.
- **Verification:** the checks the agent actually ran and whether they passed.

Everything is packaged into one HTML file with light and dark themes, relationship filters, module details, and Chinese and English controls. The architecture data and activity records are checked for structure and consistency before the page is generated.

## Quick Start

Install it with the third-party `skills` CLI:

```sh
npx skills add Qiuner/birdify --skill birdify
```

Start a new agent task and explicitly invoke the skill. **By default, Birdify runs only when requested; ordinary edits do not trigger it unless you enable project auto mode.**

**All supported hosts:** use the host skill selector or explicitly ask:

```text
$birdify Show this project's architecture and constraints; do not edit code.
```

Slash-command support depends on the host.

Confirm that the agent creates `.birdify/architecture.json` and an HTML architecture map that opens in a browser. See the [installation guide](docs/installation.md) for setup and verification steps.

### Run the Demo from Source

Developing Birdify or running the bundled demo requires Node.js 18 or newer:

```sh
pnpm install --frozen-lockfile
pnpm run validate:examples
pnpm test
pnpm run build:demo
```

Open [`birdify/examples/harness-activity.html`](birdify/examples/harness-activity.html) in a browser. The project and agent activity shown in the demo are simulated.

## Community and Feedback

For installation help, inaccurate architecture maps, or discussion about Architecture-first Coding, join the Birdify user community.

<p align="center"><strong>QQ group: 627760389</strong></p>

You can also [share feedback on GitHub](https://github.com/Qiuner/birdify/issues/new?template=usage_feedback.yml). Successful runs, missing modules, incorrect relationships, and installation problems are all welcome. No private source code is needed; screenshots and sanitized examples are optional.

## Viewer Guide

After opening the generated HTML, switch between **Architecture**, **Changes**, and **Side by Side**. Select a module to inspect its responsibility, owned files, and source evidence. The activity history shows the plan, progress, and checks declared by the agent.

On the first visit, follow **Guide** for a short walkthrough, or skip it and press Escape at any time. You can reopen it later from the toolbar.

## Explicit Invocation

Once activated in either mode, Birdify displays the map and proposed changes, then waits for your confirmation before editing code. Confirmed work continues without repeated prompts within the same scope; material scope changes require a new confirmation. Map-only requests end after delivery. This is agent guidance, not a write lock enforced by the HTML page.

Birdify runs **on demand by default**. Ordinary coding, small fixes and feature planning do not trigger it unless project auto mode is enabled.

- **All supported hosts:** use the host skill selector or explicitly ask to use Birdify; slash-command support depends on the host.

For example: “Use Birdify to show this project's architecture and constraints without changing code.” Selection applies to the current task, not future edits. The skill checks project mode before starting its workflow; host invocation policy permits opt-in auto mode.

Auto mode is optional: it activates before every code change, including small edits, and planning that explicitly analyzes affected modules. New projects default to on-demand. Existing `Birdify mode: auto` blocks in `AGENTS.md` remain effective. Choose or query project mode:

```sh
node <skill-root>/scripts/birdify.mjs mode auto --project <project-root>
node <skill-root>/scripts/birdify.mjs mode on-demand --project <project-root>
node <skill-root>/scripts/birdify.mjs mode --project <project-root>
```

Setup defaults new projects to `on-demand` and preserves existing `auto`, `on-demand` or `off` settings. Birdify manages `AGENTS.md`; other projects are not rewritten automatically. Start a new task after upgrading. See [mode details](birdify/references/modes.md).

## Generate the HTML Directly

The agent normally handles these steps. If you already have an architecture file in the expected format, you can validate it and generate the HTML yourself:

```sh
node birdify/scripts/validate.mjs .birdify/architecture.json
node birdify/scripts/render.mjs .birdify/architecture.json .birdify/architecture.html
```

To also show the task activity declared by the agent, add an activity history:

```sh
node birdify/scripts/validate.mjs .birdify/architecture.json .birdify/activity.jsonl
node birdify/scripts/render.mjs .birdify/architecture.json .birdify/activity.html .birdify/activity.jsonl
```

Add `--bilingual` when both Chinese and English content must be validated. Use `--simulation` only to mark fictional demo activity.

## How It Works

```text
project source ──> architecture.json ─┐
                                     ├──> validate ──> render ──> standalone HTML
agent declarations ─> activity.jsonl ┘
```

`architecture.json` describes project modules, responsibilities, file ownership, source evidence, and relationships. The optional `activity.jsonl` records the task scope, current target, progress, and verification results declared by the agent, one event per line. The renderer checks that the two inputs agree before generating the HTML.

The workflow has two stages:

1. **Understand the project:** the agent reads the source, creates or updates the architecture map, and links modules to source evidence.
2. **Carry out a task:** on the same map, the agent marks its planned change scope, current progress, and real check results.

See [Stage 1: Map a project](birdify/references/map-project.md) and [Stage 2: Show changes](birdify/references/show-changes.md) for the complete workflow.

## Data Contracts

| Input | Purpose |
| --- | --- |
| `architecture.json` | Project identity, modules, ownership, evidence, relationships, groups, and stable layout |
| `activity.jsonl` | Ordered, agent-declared task scope, targets, files, phases, and verification records |
| `architecture.html` | Generated standalone viewer containing the validated map and optional activity history |

The schemas enforce structure. [`birdify/scripts/validate.mjs`](birdify/scripts/validate.mjs) also checks cross-record rules such as stable map identity, contiguous sequences, valid scope and targets, file ownership, and consistent check results. Validation does not prove that architecture claims are true or that referenced source files exist.

## Project Layout

| Path | Contents |
| --- | --- |
| [`birdify/schemas/`](birdify/schemas) | Architecture and activity JSON Schemas |
| [`birdify/scripts/`](birdify/scripts) | Validator, standalone renderer, and documentation checks |
| [`birdify/assets/`](birdify/assets) | Shared viewer template, styling, routing, activity, and localization code |
| [`birdify/examples/`](birdify/examples) | Fictional maps, activity records, and the generated interactive demo |
| [`birdify/references/`](birdify/references) | Authoring workflow, contract, activity, and bilingual guidance |
| [`test/`](test) | Contract, rendering, and optional browser-level checks |

## Current Boundaries

Birdify v0.1 is deliberately file-based:

- Activity is declared by an agent; Birdify does not automatically observe coding operations.
- Updates require regenerating the HTML and refreshing the browser.
- Live transport, automatic refresh, and rendered-display acknowledgements are not implemented.
- A `completed` event does not prove checks passed; only recorded check results make that claim.
- The package is currently marked private and is not published to npm.

## Development

```sh
pnpm test                                  # Contract and renderer tests
pnpm run validate:examples
pnpm run build:demo                        # Rebuild the fictional activity demo
pnpm run check:docs
```

Browser-level checks live in [`test/viewer.browser.mts`](test/viewer.browser.mts) and require a local Playwright installation or `BIRDIFY_PLAYWRIGHT_PATH` pointing to one.

For the field semantics and invariants, read the [Birdify contract](birdify/references/contract.md). Documentation changes must follow the bilingual rules in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 Qiuner.
Third-party notices are preserved in [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES).

For release preparation, see the [release checklist](docs/releasing.md).
