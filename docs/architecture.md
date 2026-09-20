# Architecture & Dogfooding

[中文](architecture.zh.md)

Birdify is designed with an architecture-first visibility model. To ensure robustness, maintainability, and contract fidelity, Birdify uses its own tools and formats to model, validate, and visualize itself.

## System Architecture

Birdify is structured into seven cohesive modules with explicit ownership and directional relationships:

```
[ cli ] ----------> [ validator ] ----------> [ contracts ]
   |                      ^                         ^
   |                      |                         |
   +--------------> [ renderer ] -------------------+
                          |
                          v
                    [ viewer-ui ] <---------- [ site-app ]
                          ^
                          |
                [ constraint-engine ]
```

### Modules

1. **`cli` (Birdify CLI & Doctor)**
   - **Role**: Backend / Tooling
   - **Responsibility**: Command-line entry point for mode switching (`setup`, `uninstall`), runtime verification (`doctor`), and diagnostic checks.
   - **Key files**: `birdify/scripts/birdify.mjs`, `src/birdify.mts`

2. **`validator` (Schema & Graph Validator)**
   - **Role**: Backend / Verification
   - **Responsibility**: Enforces TypeBox JSON Schemas and cross-record semantic invariants on architecture graphs and activity timelines. Supports `--authoring` (module role classification) and `--bilingual` (translation completeness) checks.
   - **Key files**: `birdify/scripts/validate.mjs`, `src/validate.mts`

3. **`contracts` (Data Contracts & Schemas)**
   - **Role**: Data / Specifications
   - **Responsibility**: Canonical definitions for architecture graphs, activity event logs, and constraint catalogs. Emits standard JSON Schemas for validation across tools.
   - **Key files**: `birdify/schemas/architecture.schema.json`, `birdify/schemas/activity.schema.json`, `src/contracts/models.mts`

4. **`renderer` (HTML Snapshot Renderer)**
   - **Role**: Backend / Build
   - **Responsibility**: Validates input data models, embeds viewer assets and styles, and compiles self-contained, zero-dependency HTML snapshots for offline viewing and collaboration.
   - **Key files**: `birdify/scripts/render.mjs`, `src/render.mts`

5. **`constraint-engine` (Constraint Extraction & Rule Graph)**
   - **Role**: Backend / Analysis
   - **Responsibility**: Discovers constraints across project documentation, instructions, and skills; compiles reviewed rules; renders interactive constraint rule canvases.
   - **Key files**: `birdify/scripts/discover-constraints.mjs`, `birdify/scripts/compile-constraint-rules.mjs`, `birdify/scripts/render-constraints.mjs`

6. **`viewer-ui` (Interactive Canvas Viewer Runtime)**
   - **Role**: Frontend / UI Runtime
   - **Responsibility**: Self-contained client-side visualization canvas featuring orthogonal SVG routing, dark/light theme switching, module inspector panel, relationship filters, and real-time language toggling.
   - **Key files**: `birdify/assets/viewer.js`, `birdify/assets/viewer.css`, `birdify/assets/theme.js`, `birdify/assets/constraint-canvas.js`

7. **`site-app` (Landing Site Application)**
   - **Role**: Frontend / Web Application
   - **Responsibility**: Static showcase website and documentation portal deployed to GitHub Pages.
   - **Key files**: `apps/site/index.html`, `apps/site/src/main.mts`, `apps/site/site.css`

---

## Dogfooding Birdify on Itself

Birdify models its own repository architecture and project constraints using its native workflows.

### 1. Verification with Doctor

Verify that the local environment and Birdify toolchain are sound:

```bash
node birdify/scripts/birdify.mjs doctor
```

### 2. Architecture Map Authoring & Validation

The canonical architecture definition of Birdify lives at `.birdify/architecture.json`.

Validate the map with strict authoring and bilingual checks:

```bash
node birdify/scripts/validate.mjs .birdify/architecture.json --authoring --bilingual
```

### 3. Standalone HTML Snapshot

Compile the architecture map into a standalone, interactive HTML document:

```bash
node birdify/scripts/render.mjs .birdify/architecture.json .birdify/architecture.html
```

The resulting file (`.birdify/architecture.html`) can be opened directly in any web browser without a local server.

### 4. Constraints Discovery & Canvas

Extract all documentation and instruction constraints, and render the constraint canvas:

```bash
# Discover constraint sources across the project
node birdify/scripts/discover-constraints.mjs . .birdify/constraints.sources.json "birdify"

# Render the constraint source canvas
node birdify/scripts/render-constraints.mjs .birdify/constraints.sources.json .birdify/constraints.html --sources
```
