/**
 * Run planning + the job state helpers (spec §10, §14).
 *
 * Pure: turns scenes + a `RunConfig` into an ORDERED list of jobs with submit
 * timing, plus warnings (delay under the rate limit, over the job cap, an aspect
 * the provider can't render). Warnings are CODES the UI translates (spec §13.5).
 * This module also owns `countJobs`, so cost estimation and planning can never
 * disagree on how many videos a batch produces (spec §15: estimate must match).
 */
import type { AspectRatio, JobError, JobErrorCode, RunConfig, RunMode } from './types';
import { getCapabilities, suggestMinDelaySeconds } from './providerCapabilities';

/** The subset of a `Scene` planning reads (a full `Scene` satisfies this). */
export interface PlannableScene {
  id: string;
  order: number;
  aspectOverride?: AspectRatio;
  countOverride?: number;
}

/** Videos a single scene yields = its count override, else the config default. */
export function sceneJobCount(
  scene: Pick<PlannableScene, 'countOverride'>,
  config: Pick<RunConfig, 'count'>,
): number {
  const n = scene.countOverride ?? config.count;
  return Math.max(0, Math.floor(n));
}

/** Total jobs across every scene — the single source of truth for the count. */
export function countJobs(
  scenes: readonly Pick<PlannableScene, 'countOverride'>[],
  config: Pick<RunConfig, 'count'>,
): number {
  return scenes.reduce((sum, s) => sum + sceneJobCount(s, config), 0);
}

/** One planned job: which scene/variant, at what aspect, submitted when. */
export interface PlannedJob {
  sceneId: string;
  sceneOrder: number;
  /** 0..count-1 variant index within the scene. */
  index: number;
  /** The aspect this job requests (scene override, else the config default). */
  aspect: AspectRatio;
  /**
   * Milliseconds from run start at which this job is SUBMITTED (spec §10.2:
   * delay is between submits, not completions). 0 for `sequential`/`single`,
   * where the server serialises by completion instead.
   */
  submitAtMs: number;
}

/** A code the UI maps to a `t('...')` warning — never localised prose here. */
export type RunPlanWarningCode =
  /** Chosen delay is below the safe minimum for the provider's rpm (spec §10.2). */
  | 'delay-below-rpm'
  /** Total jobs exceed `RunConfig.maxJobsPerRun` (spec §4.2 spend guard). */
  | 'exceeds-max-jobs'
  /** A requested aspect the provider cannot render natively at all (spec §11). */
  | 'aspect-unsupported'
  /** A requested aspect that must be reached by cropping (e.g. 4:5, spec §11). */
  | 'aspect-needs-crop'
  /** There are no scenes to run. */
  | 'no-scenes'
  /** There are scenes, but every count is 0, so nothing would run. */
  | 'no-jobs';

export interface RunPlanWarning {
  code: RunPlanWarningCode;
  /** Structured context for the translated message (suggested delay, aspect, …). */
  meta?: Record<string, number | string>;
}

export interface RunPlan {
  jobs: PlannedJob[];
  mode: RunMode;
  /** Effective concurrency: 1 for `sequential`, else clamped to the provider. */
  concurrency: number;
  totalJobs: number;
  /** Total submit span in ms (last job's `submitAtMs`); 0 unless mode is `all`. */
  spanMs: number;
  warnings: RunPlanWarning[];
}

/**
 * Plan a run for the given scenes (spec §10). For `all`, submits are spaced by
 * `delaySeconds`; `sequential`/`single` submit at 0 and are serialised by the
 * server. Concurrency is clamped to the provider's `maxConcurrent`. Warnings are
 * accumulated but NEVER block — the UI decides whether to gate on them.
 *
 * Pass a single scene to plan a `single`-mode run for one card (spec §10.1).
 */
export function buildRunPlan(scenes: readonly PlannableScene[], config: RunConfig): RunPlan {
  const caps = getCapabilities(config.providerId);
  const delayMs = config.runMode === 'all' ? config.delaySeconds * 1000 : 0;
  const jobs: PlannedJob[] = [];

  let submitIndex = 0;
  for (const scene of scenes) {
    const count = sceneJobCount(scene, config);
    const aspect = scene.aspectOverride ?? config.aspect;
    for (let index = 0; index < count; index++) {
      jobs.push({
        sceneId: scene.id,
        sceneOrder: scene.order,
        index,
        aspect,
        submitAtMs: submitIndex * delayMs,
      });
      submitIndex++;
    }
  }

  const totalJobs = jobs.length;
  const concurrency =
    config.runMode === 'sequential'
      ? 1
      : clamp(config.concurrency, 1, caps?.maxConcurrent ?? config.concurrency);
  const spanMs = jobs.length > 0 ? jobs[jobs.length - 1]!.submitAtMs : 0;

  const warnings: RunPlanWarning[] = [];

  if (scenes.length === 0) warnings.push({ code: 'no-scenes' });
  else if (totalJobs === 0) warnings.push({ code: 'no-jobs' });

  if (config.runMode === 'all') {
    const min = suggestMinDelaySeconds(config.providerId);
    if (min > 0 && config.delaySeconds < min) {
      warnings.push({ code: 'delay-below-rpm', meta: { suggested: min, chosen: config.delaySeconds } });
    }
  }

  if (config.maxJobsPerRun !== undefined && totalJobs > config.maxJobsPerRun) {
    warnings.push({ code: 'exceeds-max-jobs', meta: { total: totalJobs, cap: config.maxJobsPerRun } });
  }

  // One warning per distinct requested aspect the provider can't render natively.
  if (caps) {
    const seen = new Set<AspectRatio>();
    for (const job of jobs) {
      if (caps.aspects.includes(job.aspect) || seen.has(job.aspect)) continue;
      seen.add(job.aspect);
      warnings.push({
        code: job.aspect === '4:5' ? 'aspect-needs-crop' : 'aspect-unsupported',
        meta: { aspect: job.aspect },
      });
    }
  }

  return { jobs, mode: config.runMode, concurrency, totalJobs, spanMs, warnings };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/* ============================================================
   Job error classification (spec §10.3, §14)
   ============================================================ */

/** What we know about a failure when classifying it. */
export interface ErrorSignal {
  /** HTTP status from the provider, if the failure was an HTTP response. */
  status?: number;
  /** A non-HTTP failure kind (a fetch that never got a response, or a file write). */
  kind?: 'network' | 'timeout' | 'download';
}

/** Whether a given error class should be auto-retried by the queue (spec §10.3). */
export function isRetriable(code: JobErrorCode): boolean {
  return code === 'network' || code === 'rate-limit' || code === 'provider-5xx' || code === 'download';
}

/**
 * Map a raw failure to a `JobError` (spec §14). Transient classes (network,
 * timeout, 429, 5xx, download) are retriable; content/policy (4xx) and billing
 * are not and wait for the user. Unknown is treated as fatal so the queue does
 * not spin on a failure it doesn't understand.
 */
export function classifyError(signal: ErrorSignal): JobError {
  const code = classifyCode(signal);
  return { code, retriable: isRetriable(code) };
}

function classifyCode(signal: ErrorSignal): JobErrorCode {
  if (signal.kind === 'network' || signal.kind === 'timeout') return 'network';
  if (signal.kind === 'download') return 'download';

  const status = signal.status;
  if (status === undefined) return 'unknown';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'provider-5xx';
  if (status === 402) return 'billing';
  if (status === 401 || status === 403) return 'billing'; // auth / quota / no credit
  if (status === 400 || status === 422) return 'content-policy';
  return 'unknown';
}
