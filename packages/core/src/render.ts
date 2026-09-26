import fs from 'node:fs';
import path from 'node:path';
import { validate } from './validate.js';
import { inspectConstraintFreshness } from './constraint-freshness.js';
import { buildConstraintGraph, renderConstraintCatalog } from './render-constraints.js';
import { runtimeRoot } from './runtime-root.js';
import type { Architecture } from './contracts/models.js';
import type { ConstraintFreshness, ConstraintGraph, ReviewedConstraintCatalog } from './constraint-types.js';

export interface RenderOptions {
  simulation?: boolean;
  repository?: string;
  constraintCatalog?: ReviewedConstraintCatalog;
  constraintSourceHref?: string;
}
const root = runtimeRoot();
const read = (file: string): string => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n?/g, '\n');
const dataUrl = (file: string, type: string): string => `data:${type};base64,${fs.readFileSync(path.join(root, file)).toString('base64')}`;

export function renderArchitecture(map: unknown, events: readonly unknown[] = [], { simulation = false, repository, constraintCatalog, constraintSourceHref }: RenderOptions = {}): string {
  const result = validate(map, events);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  const architecture = map as Architecture;
  const icons = Object.fromEntries(['sun', 'moon', 'layers', 'database', 'zoom-in', 'zoom-out', 'maximize', 'scan', 'x', 'panel-right', 'panels-top-left', 'code', 'zap', 'list-ordered', 'shield-check', 'box', 'skip-forward', 'columns-2', 'chevron-left', 'chevron-right'].map((name) => [name, read(`assets/icons/${name}.svg`)]));
  const brandLogo = dataUrl('assets/brand/logo-192.png', 'image/png');
  const constraintFreshness: ConstraintFreshness | undefined = repository ? inspectConstraintFreshness(architecture, repository) : undefined;
  let constraintView: { graph: ConstraintGraph; snapshot: string; scope: string; rules: Array<{ id: string; modules: string[] }> } | undefined;
  if (constraintCatalog) {
    const binding = constraintCatalog.architectureBinding;
    if (constraintCatalog.project.name !== architecture.project.name) throw new Error('Constraint and architecture project names differ');
    if (binding && (binding.mapId !== architecture.mapId || binding.mapRevision !== architecture.revision || binding.sourceRevision !== constraintCatalog.project.revision)) throw new Error('Stale architecture binding');
    for (const rule of constraintCatalog.rules) {
      if (rule.modules !== undefined && (!binding || rule.modules.some(id => !architecture.modules.some(module => module.id === id)))) throw new Error(`Invalid module binding: ${rule.id}`);
    }
    constraintView = { graph: buildConstraintGraph(constraintCatalog, constraintSourceHref ? { sourceHref: constraintSourceHref } : {}), snapshot: constraintCatalog.project.revision,
      scope: constraintCatalog.ruleReview.scope, rules: constraintCatalog.rules.map(({ id, modules = [] }) => ({ id, modules })) };
  }
  const data = JSON.stringify({ map: architecture, icons, events, simulation, brandLogo, constraintFreshness, constraintView }).replace(/</g, '\\u003c');
  return read('assets/architecture.html')
    .replace('/* BIRDIFY_THEME */', () => read('assets/theme.js'))
    .replace('<head>', () => `<head>\n<!--\n${read('LICENSE')}\n${read('THIRD_PARTY_NOTICES')}\n-->`)
    .replace('/* BIRDIFY_FAVICON */', () => dataUrl('assets/brand/favicon-32.png', 'image/png'))
    .replace('/* BIRDIFY_CSS */', () => read('assets/demo.css'))
    .replace('/* BIRDIFY_DATA */', () => `const DATA = ${data};`)
    .replace('/* BIRDIFY_JS */', () => read('assets/viewer.js'))
    .replace('/* BIRDIFY_GUIDE_CSS */', () => read('assets/architecture-guide.css'))
    .replace('/* BIRDIFY_CONSTRAINTS_CSS */', () => read('assets/architecture-constraints.css') + (constraintView ? `\n${read('assets/constraint-canvas.css')}\n${read('assets/architecture-constraint-view.css')}` : ''));
}
