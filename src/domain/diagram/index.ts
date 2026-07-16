/**
 * Diagram domain — public API. Framework-agnostic; UI features import from here.
 */
export * from './types';
export { buildAdjacency, computeDerivedPairs, computeRanks } from './derive';
export type { Adjacency, DerivedPair } from './derive';
export { effectiveRules, validate, edgeWouldViolate } from './rules';
export { BUILTIN_RULE_SETS, BUILTIN_TEMPLATES } from './seed';
