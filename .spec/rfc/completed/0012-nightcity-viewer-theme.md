# RFC 0012: Night City Theme for Birdify Interactive Viewer

**Status:** Implemented

## Summary

Upgrade the visual theme of the Birdify interactive viewer (`architecture.html`, `demo.css`, `constraint-canvas.css`, and associated styles) to a cyberpunk "Night City" aesthetic. Transform the dark palette from muted olive-gray to deep obsidian and electric neon (cyan, amber, violet, rose, blue), add luminous trace effects for active relationships and target scopes, render a subtle cybernetic grid on the map canvas, while maintaining light-theme accessibility and full test compatibility.

## Problem

The current viewer interface uses an early prototype palette characterized by drab olive tones (`#141617`, `#242a2b`, `#9ee9ca`, `#6d7c76`). In contrast:
1. RFC 0007 establishes the modern "Night City" brand identity for Birdify—a high-tech, cyberpunk visual language where system architecture resembles an illuminated metropolis seen from above.
2. The viewer is the primary artifact inspected by engineers and agents when reviewing architecture and activity scope. A dull, low-contrast palette fails to clearly convey active boundaries, signal flows, and module roles.
3. Bright neon accents and glowing traces make the flow of dependencies, planned changes, and constraint boundaries immediately legible at a glance.

## Goals

- **Deep Obsidian & Cyber Canvas**: Replace the muddy `#141617` canvas with a sleek dark foundation (`#090d16` / `#0c101b`) with a subtle cybernetic grid.
- **Vibrant Cyberpunk Palette**: Update role tones (`blue`, `teal`, `cyan`, `violet`, `amber`, `rose`, `slate`) to luminous neon tones with dark translucent card surfaces.
- **Luminous Edge & Flow Traces**: Enhance active relationships (`.edge.relevant`, `.flow-dot`, `.flow-hover`) with vivid neon glow filters (`drop-shadow` / `box-shadow`).
- **Sci-Fi Frame Boundaries**: Update `.group-frame` boundaries to look like crisp translucent zoning perimeters.
- **Maintain Light Theme & Accessibility**: Retain full support for `data-theme="light"` with balanced daylight contrast.
- **100% Contract & Layout Parity**: Keep exact node dimensions (164×72px), layout coordinates, responsive breakpoints, and DOM structure so all existing tests pass without deviation.

## Non-goals

- Alter data schemas, layout calculation algorithms, or routing math (`templates/viewer/routing.ts`).
- Remove light theme support.
- Alter the agent CLI or skill contract.
- Introduce heavy external font or icon dependencies.

## Design

### 1. Palette & Surface Tokens

- **Ground & Canvas**: `--bg-ground: #090d16`, `--bg-panel: #0d121f`, `--line: #1c2638`.
- **Primary Cyber Accent**: `#00f0ff` (electric neon cyan replacing `#9ee9ca`), with complementary cyberpunk accents:
  - Frontend (`blue`): `#38bdf8` border / `#0d2035` surface.
  - Backend (`teal`): `#00f0ff` border / `#0a262c` surface.
  - Cache (`cyan`): `#22d3ee` border / `#092832` surface.
  - Database (`violet`): `#c084fc` border / `#221538` surface.
  - Queue (`amber`): `#fbbf24` border / `#2c200c` surface.
  - Security (`rose`): `#fb7185` border / `#331422` surface.
  - Generic (`slate`): `#94a3b8` border / `#182230` surface.

### 2. Illumination & Glow

- Selected, hovered, or active target modules emit neon outer box-shadow glows.
- Flow lines and animated dots illuminate with `--flow-accent` filters (`drop-shadow(0 0 5px var(--flow-accent))`).
- Canvas background displays a subtle electric grid: `radial-gradient(rgba(0, 240, 255, 0.12) 1px, transparent 1px)` or subtle cross-grid.

### 3. Constraint Canvas Harmonization

- Harmonize `.bv-constraints` ground, card borders, and edges with the Night City palette for cohesive visual presentation across both Architecture and Constraint views.

## Acceptance

- `pnpm run build:viewer` compiles cleanly.
- `pnpm run build:demo` produces the updated demo artifact.
- `pnpm test` (all unit tests, including coordinate and routing checks) passes.
- `pnpm run check:build` passes with zero drift.
- Visual inspection confirms deep cyberpunk obsidian background, neon accents, crisp glowing traces, and clean light-mode switching.
