/**
 * Diagram domain — public API. Framework-agnostic; UI features import from here.
 */
export * from './types';
export { buildAdjacency, buildAdjacencyByRelation, computeDerivedPairs, computeRanks } from './derive';
export type { Adjacency, DerivedPair } from './derive';
export { effectiveRules, validate, edgeWouldViolate } from './rules';
export { generateSample } from './sample';
export type { SampleContent } from './sample';
export { generateStress, MAX_STRESS_BLOCKS } from './stress';
export {
  BUILTIN_RULE_SETS,
  BUILTIN_TEMPLATES,
  BUILTIN_BLOCK_TYPES,
  BUILTIN_RELATIONS,
} from './seed';
