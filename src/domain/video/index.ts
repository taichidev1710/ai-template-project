/**
 * Video Studio domain — public API. Framework-agnostic (no React/AntD/network);
 * UI features import from here (`@/domain/video`). Pure logic for the P0 layer of
 * the batch-video feature: scene parsing, character tagging, cost estimation, run
 * planning, and the provider capability registry. See `docs/specs/video-studio.md`.
 */
export * from './types';

export {
  PROVIDERS,
  DEFAULT_PROVIDERS,
  PROVIDER_VEO31,
  PROVIDER_NANOBANANA,
  PROVIDER_MOCK,
  getCapabilities,
  getAllProviders,
  setProviderRegistry,
  getSpeedTier,
  supportsSpeed,
  supportsAspect,
  suggestMinDelaySeconds,
  suggestDelayOption,
  resolvePreset,
  defaultRunConfig,
} from './providerCapabilities';
export type { ResolvedPreset } from './providerCapabilities';

export { CREDENTIAL_PROVIDERS, getCredentialProvider, previewFieldOf } from './credentialProviders';
export type { CredentialField, CredentialProviderSpec } from './credentialProviders';

export { parseScenes, reparseScenes, joinScenes } from './sceneParser';
export type { ParsedScene, SceneParseOptions, MergeableScene, ReparseResult } from './sceneParser';

export {
  findCharacterRefs,
  characterKeysInText,
  highlightSegments,
  checkCharacters,
  buildScenePrompt,
} from './characterTagger';
export type {
  TaggableCharacter,
  CharacterRef,
  HighlightSegment,
  CharacterIssue,
  CharacterIssueCode,
  PromptMarkerMode,
  BuildScenePromptInput,
  BuiltScenePrompt,
} from './characterTagger';

export { sceneAssets, checkAssets, composeScenePrompt } from './assets';
export type { AssetScene, AssetIssue, AssetIssueCode } from './assets';

export { estimateRunCost, estimateJobCost } from './costEstimator';
export type { CostBreakdown } from './costEstimator';

export {
  sceneJobCount,
  countJobs,
  buildRunPlan,
  classifyError,
  isRetriable,
} from './runPlan';
export type {
  PlannableScene,
  PlannedJob,
  RunPlan,
  RunPlanWarning,
  RunPlanWarningCode,
  ErrorSignal,
} from './runPlan';
