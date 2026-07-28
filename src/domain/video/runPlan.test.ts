import { describe, it, expect } from 'vitest';
import {
  sceneJobCount,
  countJobs,
  buildRunPlan,
  classifyError,
  isRetriable,
  type PlannableScene,
} from './runPlan';
import { defaultRunConfig, PROVIDER_VEO31 } from './providerCapabilities';
import type { RunConfig } from './types';

const veoConfig = (over: Partial<RunConfig> = {}): RunConfig => ({
  ...defaultRunConfig(PROVIDER_VEO31),
  ...over,
});

const scene = (id: string, order: number, over: Partial<PlannableScene> = {}): PlannableScene => ({
  id,
  order,
  ...over,
});

describe('sceneJobCount / countJobs', () => {
  it('uses the scene override, else the config count', () => {
    expect(sceneJobCount({}, { count: 2 })).toBe(2);
    expect(sceneJobCount({ countOverride: 4 }, { count: 2 })).toBe(4);
  });
  it('floors and never goes negative', () => {
    expect(sceneJobCount({ countOverride: 0 }, { count: 3 })).toBe(0);
  });
  it('sums across scenes', () => {
    expect(countJobs([scene('a', 1), scene('b', 2, { countOverride: 3 })], { count: 1 })).toBe(4);
  });
});

describe('buildRunPlan — job generation', () => {
  it('makes count jobs per scene in order, with the right aspect', () => {
    const plan = buildRunPlan(
      [scene('s1', 1), scene('s2', 2, { countOverride: 2, aspectOverride: '9:16' })],
      veoConfig({ count: 1, aspect: '16:9', runMode: 'sequential' }),
    );
    expect(plan.totalJobs).toBe(3);
    expect(plan.jobs.map((j) => `${j.sceneId}#${j.index}:${j.aspect}`)).toEqual([
      's1#0:16:9',
      's2#0:9:16',
      's2#1:9:16',
    ]);
  });

  it("spaces submits by the delay in 'all' mode", () => {
    const plan = buildRunPlan(
      [scene('s1', 1, { countOverride: 3 })],
      veoConfig({ runMode: 'all', delaySeconds: 30, count: 1 }),
    );
    expect(plan.jobs.map((j) => j.submitAtMs)).toEqual([0, 30_000, 60_000]);
    expect(plan.spanMs).toBe(60_000);
  });

  it('submits everything at 0 in sequential mode and forces concurrency 1', () => {
    const plan = buildRunPlan(
      [scene('s1', 1, { countOverride: 2 })],
      veoConfig({ runMode: 'sequential', concurrency: 5 }),
    );
    expect(plan.jobs.every((j) => j.submitAtMs === 0)).toBe(true);
    expect(plan.concurrency).toBe(1);
  });

  it('clamps concurrency to the provider max', () => {
    const plan = buildRunPlan([scene('s1', 1)], veoConfig({ runMode: 'all', concurrency: 999 }));
    expect(plan.concurrency).toBe(10); // Veo maxConcurrent
  });
});

describe('buildRunPlan — warnings', () => {
  const codes = (plan: ReturnType<typeof buildRunPlan>) => plan.warnings.map((w) => w.code);

  it('warns when the delay is below the rpm-safe minimum', () => {
    const plan = buildRunPlan([scene('s1', 1)], veoConfig({ runMode: 'all', delaySeconds: 0 }));
    const w = plan.warnings.find((x) => x.code === 'delay-below-rpm');
    expect(w?.meta).toEqual({ suggested: 6, chosen: 0 });
  });

  it('does not warn about delay outside all mode', () => {
    const plan = buildRunPlan([scene('s1', 1)], veoConfig({ runMode: 'sequential', delaySeconds: 0 }));
    expect(codes(plan)).not.toContain('delay-below-rpm');
  });

  it('warns when jobs exceed the per-run cap', () => {
    const plan = buildRunPlan(
      [scene('s1', 1, { countOverride: 3 })],
      veoConfig({ maxJobsPerRun: 2, runMode: 'sequential' }),
    );
    const w = plan.warnings.find((x) => x.code === 'exceeds-max-jobs');
    expect(w?.meta).toEqual({ total: 3, cap: 2 });
  });

  it('flags an unsupported aspect and a crop-only aspect distinctly', () => {
    const unsupported = buildRunPlan([scene('s1', 1)], veoConfig({ aspect: '1:1' }));
    expect(unsupported.warnings.find((w) => w.code === 'aspect-unsupported')?.meta).toEqual({ aspect: '1:1' });

    const crop = buildRunPlan([scene('s1', 1)], veoConfig({ aspect: '4:5' }));
    expect(codes(crop)).toContain('aspect-needs-crop');
  });

  it('reports each offending aspect only once', () => {
    const plan = buildRunPlan(
      [scene('s1', 1, { countOverride: 3 })],
      veoConfig({ aspect: '1:1', runMode: 'sequential' }),
    );
    expect(codes(plan).filter((c) => c === 'aspect-unsupported')).toHaveLength(1);
  });

  it('warns on no scenes and on all-zero counts', () => {
    expect(codes(buildRunPlan([], veoConfig()))).toContain('no-scenes');
    expect(codes(buildRunPlan([scene('s1', 1, { countOverride: 0 })], veoConfig()))).toContain('no-jobs');
  });
});

describe('classifyError / isRetriable', () => {
  it('treats transient failures as retriable', () => {
    expect(classifyError({ kind: 'network' })).toEqual({ code: 'network', retriable: true });
    expect(classifyError({ kind: 'timeout' })).toEqual({ code: 'network', retriable: true });
    expect(classifyError({ kind: 'download' })).toEqual({ code: 'download', retriable: true });
    expect(classifyError({ status: 429 })).toEqual({ code: 'rate-limit', retriable: true });
    expect(classifyError({ status: 503 })).toEqual({ code: 'provider-5xx', retriable: true });
  });

  it('treats content and billing failures as fatal', () => {
    expect(classifyError({ status: 400 })).toEqual({ code: 'content-policy', retriable: false });
    expect(classifyError({ status: 422 })).toEqual({ code: 'content-policy', retriable: false });
    expect(classifyError({ status: 402 })).toEqual({ code: 'billing', retriable: false });
    expect(classifyError({ status: 403 })).toEqual({ code: 'billing', retriable: false });
  });

  it('is fatal when nothing is known', () => {
    expect(classifyError({})).toEqual({ code: 'unknown', retriable: false });
    expect(classifyError({ status: 404 })).toEqual({ code: 'unknown', retriable: false });
  });

  it('isRetriable agrees with the classes', () => {
    expect(isRetriable('rate-limit')).toBe(true);
    expect(isRetriable('content-policy')).toBe(false);
  });
});
