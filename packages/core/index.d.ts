// Public types for the workspace CLI. TypeBox schema values cannot be
// declaration-emitted (TS4023), so this file is the package types entry.
// Keep these shapes aligned with packages/core/src.

import type { ValidateFunction } from 'ajv';
import type {
  Architecture,
  ActivityEvent,
  Module,
  Relationship,
  Constraint,
} from './src/contracts/models.js';
import type {
  ConstraintCatalog,
  ReviewedConstraintCatalog,
  ReviewedSelection,
  ConstraintGraph,
  ConstraintGraphNode,
  ConstraintRule,
  ConstraintRole,
  RuleApplicability,
  FreshnessStatus,
  ConstraintFreshness,
  SourceHistory,
  SourceSection,
  ConstraintSource,
  HistoryCommit,
  TrackedRuleHistory,
  UntrackedRuleHistory,
  RuleHistory,
} from './src/constraint-types.js';

export type {
  Architecture,
  ActivityEvent,
  Module,
  Relationship,
  Constraint,
  ConstraintCatalog,
  ReviewedConstraintCatalog,
  ReviewedSelection,
  ConstraintGraph,
  ConstraintGraphNode,
  ConstraintRule,
  ConstraintRole,
  RuleApplicability,
  FreshnessStatus,
  ConstraintFreshness,
  SourceHistory,
  SourceSection,
  ConstraintSource,
  HistoryCommit,
  TrackedRuleHistory,
  UntrackedRuleHistory,
  RuleHistory,
};

export const constraintRoles: Record<string, { light: string[]; dark: string[] }>;

export interface RenderOptions {
  simulation?: boolean;
  repository?: string;
  constraintCatalog?: ReviewedConstraintCatalog;
  constraintSourceHref?: string;
}

export interface Diagnostic { code: string; location: string; message: string }
export interface ValidationOptions { requireBilingual?: boolean; requireRoles?: boolean }
export type ValidationResult = { ok: false; errors: Diagnostic[] } | {
  ok: boolean;
  modules: number;
  relationships: number;
  events: number;
  errors: Diagnostic[];
  warnings: Diagnostic[];
};

export function compileConstraintRules(catalog: ConstraintCatalog, selection: ReviewedSelection): ReviewedConstraintCatalog;
export function inspectConstraintFreshness(map: unknown, repository: string): ConstraintFreshness;
export function collectRuleHistory(catalog: ReviewedConstraintCatalog, repository: string): ReviewedConstraintCatalog;
export function discoverConstraints(repository: string, options?: { title?: string; maxSources?: number }): ConstraintCatalog;
export function renderArchitecture(map: unknown, events?: readonly unknown[], options?: RenderOptions): string;
export function renderConstraintCatalog(catalog: ConstraintCatalog, shell?: string, options?: { view?: 'rules' | 'sources'; sourceHref?: string }): string;
export function runtimeRoot(): string;
export function validate(map: unknown, events?: readonly unknown[], options?: ValidationOptions): ValidationResult;
export const checkArchitecture: ValidateFunction<Architecture>;
export const checkActivity: ValidateFunction<ActivityEvent>;
