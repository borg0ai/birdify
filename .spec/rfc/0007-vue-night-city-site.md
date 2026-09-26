# RFC 0007: Rebuild Birdify Site with Vue and Night City Theme

**Status:** Draft

## Summary

Replace the vanilla TypeScript landing page in `apps/site` with a Vue 3 single-page site built by Vite and deployed as static files to the existing GitHub Pages workflow. Rebrand the presentation around Birdify and use a night-city visual direction to explain its real workflow: install the skill, let an agent inspect architecture and constraints, review evidence-linked scope, then make code changes with that context.

## Problem

The current site is a hand-built HTML/CSS page with imperative DOM translation and copy handlers. It presents feature claims but does not clearly show how the skill and the separately published `@borg0ai/birdify` CLI cooperate. The repository already deploys `apps/site/dist` through `.github/workflows/pages.yml`; the rebuild should improve the product explanation and maintainability without adding a second deployment mechanism.

## Goals

- Build `apps/site` with Vue 3 and Vite, producing static output under `apps/site/dist` for GitHub Pages.
- Make Birdify the clear product identity and explain the actual sequence: skill activation, architecture/constraint inspection, evidence-linked map, proposed change scope, implementation.
- Use a distinctive night-city visual theme where city structure and illuminated paths communicate architecture and planned changes.
- Preserve responsive behavior, accessible navigation, English/Chinese language switching, install commands, copy actions, demo and documentation links.
- Preserve existing GitHub Pages deployment workflow and project URL compatibility.

## Non-goals

- Change the published CLI package name, CLI behavior, skill activation policy or architecture/constraint contracts.
- Add a backend, runtime site data service, user accounts, analytics or a CMS.
- Redesign the interactive architecture viewer or replace standalone rendered maps.
- Change GitHub Pages hosting provider or release process.

## Design

Use Vue 3 single-file components with Vite as the site build tool. Keep page content and interaction state in Vue components rather than querying and replacing HTML strings. Configure Vite's base path for this repository's GitHub Pages project URL while retaining static assets and output in `apps/site/dist`. Keep `.github/workflows/pages.yml` as deployment entry point; adjust it only if Vite build invocation or artifact path requires it.

Compose the landing page from a small set of focused areas: navigation and language switch, hero with a custom city/architecture visual, an illustrated workflow that explains what Birdify does and does not do, installation steps using `npx skills` and `npx --yes @borg0ai/birdify`, community/demo links, and footer. Keep English and Chinese copy equivalent. Use CSS and existing brand assets where useful; avoid remote image dependencies. Respect reduced-motion preferences and preserve keyboard-visible focus.

Update `apps/site/package.json`, Vite configuration, site entry/components/styles, root package scripts or workspace dependencies as required, and relevant site browser tests. Update paired architecture documentation only if its site implementation description becomes stale. Leave skill and CLI packages untouched.

## Acceptance

- `pnpm install --frozen-lockfile` resolves the Vue/Vite workspace changes.
- `pnpm --filter @birdify/site run build` produces a static `apps/site/dist` with correct asset URLs for the GitHub Pages project path.
- Existing `.github/workflows/pages.yml` uploads the generated site artifact without relying on a development server.
- Site browser tests verify primary content, language switching, install/runtime commands, copy actions, and mobile layout behavior.
- `pnpm run check:docs` passes after any paired documentation edits.
- Manual visual review confirms night-city art reads as Birdify architecture/change-scope explanation and remains legible at desktop and mobile sizes.
