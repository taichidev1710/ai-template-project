/**
 * The P1 run engine — client-side state that drives fake jobs through the domain
 * job state machine (queued → processing → success/error, spec §14) honouring the
 * plan's concurrency and submit delay (spec §10). No network: outcomes come from
 * `fakeProvider`. In P2 this hook is replaced by TanStack Query polling the real
 * backend queue; the components above it stay the same.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { buildRunPlan, type AspectRatio, type Job, type JobErrorCode, type PlannedJob, type RunConfig } from '@/domain/video';
import type { PlannableScene } from '@/domain/video';
import { fakeOutputPath, rollLifecycle, type FakeResult } from '../fake/fakeProvider';
import { generationApi } from '../api/generation-api';

/** Stable key for a job = scene + variant index. */
export const jobKey = (sceneId: string, index: number): string => `${sceneId}#${index}`;

const TICK_MS = 250;
/** Poll interval for a REAL Veo job (generation is slow — minutes, spec §2.1). */
const POLL_MS = 6000;

/**
 * Extra context the REAL (Veo) path needs but the mock path ignores. `projectId`
 * scopes the backend generate/poll endpoints; `promptFor` yields a scene's composed
 * outgoing prompt (scene text + asset descriptions).
 */
export interface RunRuntime {
  projectId: string | null;
  promptFor: (sceneId: string) => string;
}

type JobMap = Record<string, Job>;

type Action =
  | { type: 'enqueue'; jobs: Job[] }
  | { type: 'merge'; patches: Record<string, Partial<Job>> }
  | { type: 'remove'; keys: string[] }
  | { type: 'reset' };

function reducer(state: JobMap, action: Action): JobMap {
  switch (action.type) {
    case 'reset':
      return {};
    case 'enqueue': {
      const next = { ...state };
      for (const j of action.jobs) next[j.id] = j;
      return next;
    }
    case 'merge': {
      const next = { ...state };
      for (const [key, patch] of Object.entries(action.patches)) {
        const cur = next[key];
        if (cur) next[key] = { ...cur, ...patch };
      }
      return next;
    }
    case 'remove': {
      const next = { ...state };
      for (const k of action.keys) delete next[k];
      return next;
    }
    default:
      return state;
  }
}

/** Per-job runtime bookkeeping the reducer state doesn't need to hold. */
interface Meta {
  order: number;
  sceneOrder: number;
  aspect: AspectRatio;
  /** Absolute time (ms) the job may start — plan submit time, or a retry backoff. */
  readyAt: number;
  startedAt?: number;
  durationMs?: number;
  result?: FakeResult;
}

export interface UseVideoRun {
  jobs: JobMap;
  /** True while any job is queued or processing. */
  isActive: boolean;
  /** Plan and enqueue every scene per the config's run mode. */
  startAll: () => void;
  /** Enqueue just one scene's jobs (the per-card "Tạo video" — spec §10.1 single). */
  runScene: (sceneId: string) => void;
  retry: (key: string) => void;
  cancel: (key: string) => void;
  cancelAll: () => void;
  reset: () => void;
  /** Seed the job map from persisted (terminal) jobs when opening a Project (§12.1). */
  hydrate: (entries: readonly HydrateEntry[]) => void;
}

/** One persisted terminal job restored into the grid when a Project is opened. */
export interface HydrateEntry {
  sceneId: string;
  index: number;
  sceneOrder: number;
  aspect: AspectRatio;
  status: Job['status'];
  attempts: number;
  outputPath?: string;
  error?: Job['error'];
}

/**
 * Drive fake jobs for `scenes` under `config`. A single interval pumps the queue:
 * it advances progress, finalises finished jobs, auto-retries retriable failures,
 * and starts queued jobs whose `readyAt` has passed while respecting concurrency.
 */
export function useVideoRun(
  scenes: readonly PlannableScene[],
  config: RunConfig,
  runtime: RunRuntime,
): UseVideoRun {
  const [jobs, dispatch] = useReducer(reducer, {});

  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  const metaRef = useRef<Record<string, Meta>>({});
  const concurrencyRef = useRef(1);
  /** Active poll timers for REAL jobs, keyed by jobKey — so cancel/reset can stop them. */
  const pollTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Real generation = a paid provider on the official API; anything else stays mock.
  const realMode = config.providerId !== 'mock' && config.source === 'api';

  // Keep the latest runtime in a ref so poll callbacks read current projectId/prompt.
  const runtimeRef = useRef(runtime);
  runtimeRef.current = runtime;

  const clearPoll = useCallback((key: string) => {
    const t = pollTimersRef.current[key];
    if (t) {
      clearTimeout(t);
      delete pollTimersRef.current[key];
    }
  }, []);

  const clearAllPolls = useCallback(() => {
    for (const key of Object.keys(pollTimersRef.current)) clearPoll(key);
  }, [clearPoll]);

  const setError = useCallback(
    (key: string, code: JobErrorCode, retriable: boolean, message?: string) => {
      dispatch({
        type: 'merge',
        patches: {
          [key]: {
            status: 'error',
            progress: undefined,
            attempts: 1,
            error: { code, retriable, ...(message ? { message } : {}) },
          },
        },
      });
    },
    [],
  );

  /** Poll one REAL operation until it finishes, then merge success/error. */
  const schedulePoll = useCallback(
    (key: string, op: string) => {
      const tick = (): void => {
        const projectId = runtimeRef.current.projectId;
        if (!projectId) return;
        void generationApi
          .poll(projectId, op)
          .then((r) => {
            const cur = jobsRef.current[key];
            if (!cur || cur.status === 'canceled') return; // user cancelled mid-flight
            if (r.status === 'processing') {
              pollTimersRef.current[key] = setTimeout(tick, POLL_MS);
              return;
            }
            delete pollTimersRef.current[key];
            if (r.status === 'success') {
              dispatch({
                type: 'merge',
                patches: { [key]: { status: 'success', progress: 100, outputPath: r.videoUri } },
              });
            } else {
              setError(key, r.error?.code ?? 'unknown', r.error?.retriable ?? false, r.error?.message);
            }
          })
          .catch(() => {
            // Transient poll failure — keep trying (the operation is still running).
            pollTimersRef.current[key] = setTimeout(tick, POLL_MS);
          });
      };
      pollTimersRef.current[key] = setTimeout(tick, POLL_MS);
    },
    [setError],
  );

  /** Submit ONE real job (scene+variant) to Veo, then start polling it. */
  const runOneReal = useCallback(
    (sceneId: string, index: number) => {
      const projectId = runtimeRef.current.projectId;
      const scene = scenes.find((s) => s.id === sceneId);
      if (!projectId || !scene) return;
      const key = jobKey(sceneId, index);
      const aspect = scene.aspectOverride ?? config.aspect;
      clearPoll(key);
      dispatch({
        type: 'enqueue',
        jobs: [{ id: key, sceneId, index, status: 'processing', attempts: 0, progress: undefined }],
      });
      void generationApi
        .submit(projectId, {
          sceneId,
          prompt: runtimeRef.current.promptFor(sceneId),
          model: config.modelId,
          aspectRatio: aspect,
          durationSeconds: config.durationSeconds,
        })
        .then((res) => {
          if (res.error) {
            setError(key, res.error.code, res.error.retriable, res.error.message);
          } else if (res.operationName) {
            schedulePoll(key, res.operationName);
          } else {
            setError(key, 'unknown', false);
          }
        })
        .catch(() => setError(key, 'unknown', false));
    },
    [scenes, config.aspect, config.modelId, config.durationSeconds, clearPoll, schedulePoll, setError],
  );

  const enqueuePlanned = useCallback((planned: PlannedJob[], baseTime: number) => {
    const jobsToAdd: Job[] = [];
    let order = Object.keys(metaRef.current).length;
    for (const p of planned) {
      const key = jobKey(p.sceneId, p.index);
      metaRef.current[key] = {
        order: order++,
        sceneOrder: p.sceneOrder,
        aspect: p.aspect,
        readyAt: baseTime + p.submitAtMs,
      };
      jobsToAdd.push({ id: key, sceneId: p.sceneId, index: p.index, status: 'queued', attempts: 0, progress: 0 });
    }
    dispatch({ type: 'enqueue', jobs: jobsToAdd });
  }, []);

  const startAll = useCallback(() => {
    metaRef.current = {};
    clearAllPolls();
    dispatch({ type: 'reset' });
    if (realMode) {
      if (!runtimeRef.current.projectId) return;
      for (const s of scenes) {
        const count = Math.max(0, Math.floor(s.countOverride ?? config.count));
        for (let i = 0; i < count; i++) runOneReal(s.id, i);
      }
      return;
    }
    const plan = buildRunPlan(scenes, config);
    concurrencyRef.current = Math.max(1, plan.concurrency);
    enqueuePlanned(plan.jobs, Date.now());
  }, [scenes, config, realMode, runOneReal, clearAllPolls, enqueuePlanned]);

  const runScene = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) return;
      if (realMode) {
        const count = Math.max(0, Math.floor(scene.countOverride ?? config.count));
        for (let i = 0; i < count; i++) runOneReal(sceneId, i);
        return;
      }
      // A single-scene run ignores batch delay: submit its variants immediately.
      const plan = buildRunPlan([scene], { ...config, runMode: 'single', delaySeconds: 0 });
      concurrencyRef.current = Math.max(concurrencyRef.current, plan.concurrency);
      enqueuePlanned(plan.jobs, Date.now());
    },
    [scenes, config, realMode, runOneReal, enqueuePlanned],
  );

  const retry = useCallback(
    (key: string) => {
      if (realMode) {
        const hash = key.lastIndexOf('#');
        const sceneId = key.slice(0, hash);
        const index = Number(key.slice(hash + 1));
        runOneReal(sceneId, index);
        return;
      }
      const meta = metaRef.current[key];
      if (!meta) return;
      meta.readyAt = Date.now();
      meta.startedAt = undefined;
      meta.durationMs = undefined;
      meta.result = undefined;
      dispatch({ type: 'merge', patches: { [key]: { status: 'queued', progress: 0, error: undefined } } });
    },
    [realMode, runOneReal],
  );

  const cancel = useCallback(
    (key: string) => {
      clearPoll(key);
      dispatch({ type: 'merge', patches: { [key]: { status: 'canceled', progress: undefined } } });
      delete metaRef.current[key];
    },
    [clearPoll],
  );

  const cancelAll = useCallback(() => {
    const patches: Record<string, Partial<Job>> = {};
    for (const [key, j] of Object.entries(jobsRef.current)) {
      if (j.status === 'queued' || j.status === 'processing') {
        patches[key] = { status: 'canceled', progress: undefined };
        delete metaRef.current[key];
        clearPoll(key);
      }
    }
    if (Object.keys(patches).length) dispatch({ type: 'merge', patches });
  }, [clearPoll]);

  const reset = useCallback(() => {
    metaRef.current = {};
    clearAllPolls();
    dispatch({ type: 'reset' });
  }, [clearAllPolls]);

  const hydrate = useCallback((entries: readonly HydrateEntry[]) => {
    metaRef.current = {};
    const jobsToAdd: Job[] = [];
    let order = 0;
    for (const e of entries) {
      const key = jobKey(e.sceneId, e.index);
      // Seed meta so a manual retry on a restored job still works.
      metaRef.current[key] = { order: order++, sceneOrder: e.sceneOrder, aspect: e.aspect, readyAt: Date.now() };
      jobsToAdd.push({
        id: key,
        sceneId: e.sceneId,
        index: e.index,
        status: e.status,
        attempts: e.attempts,
        progress: e.status === 'success' ? 100 : undefined,
        ...(e.outputPath ? { outputPath: e.outputPath } : {}),
        ...(e.error ? { error: e.error } : {}),
      });
    }
    dispatch({ type: 'reset' });
    dispatch({ type: 'enqueue', jobs: jobsToAdd });
  }, []);

  // The pump — one interval for the lifetime of the hook.
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const current = jobsRef.current;
      const meta = metaRef.current;
      const patches: Record<string, Partial<Job>> = {};

      let processing = 0;
      const queued: { key: string; order: number; readyAt: number }[] = [];

      for (const [key, job] of Object.entries(current)) {
        const m = meta[key];
        if (!m) continue;
        if (job.status === 'processing') {
          processing++;
          const elapsed = now - (m.startedAt ?? now);
          const dur = m.durationMs ?? 1;
          if (elapsed >= dur) finalize(key, job, m, patches, now);
          else {
            const pct = Math.min(99, Math.floor((elapsed / dur) * 100));
            if (pct !== job.progress) patches[key] = { progress: pct };
          }
        } else if (job.status === 'queued') {
          queued.push({ key, order: m.order, readyAt: m.readyAt });
        }
      }

      // Start queued jobs whose time has come, oldest first, up to concurrency.
      queued.sort((a, b) => a.order - b.order);
      for (const q of queued) {
        if (processing >= concurrencyRef.current) break;
        if (now < q.readyAt) continue;
        const m = meta[q.key];
        if (!m) continue;
        const life = rollLifecycle();
        m.startedAt = now;
        m.durationMs = life.durationMs;
        m.result = life.result;
        patches[q.key] = { status: 'processing', progress: 0, startedAt: new Date(now).toISOString() };
        processing++;
      }

      if (Object.keys(patches).length) dispatch({ type: 'merge', patches });
    }, TICK_MS);
    const timers = pollTimersRef.current;
    return () => {
      clearInterval(timer);
      for (const t of Object.values(timers)) clearTimeout(t);
    };
  }, []);

  const isActive = Object.values(jobs).some((j) => j.status === 'queued' || j.status === 'processing');

  return { jobs, isActive, startAll, runScene, retry, cancel, cancelAll, reset, hydrate };
}

/** Resolve a finished processing job into success, an auto-retry, or a final error. */
function finalize(
  key: string,
  job: Job,
  meta: Meta,
  patches: Record<string, Partial<Job>>,
  now: number,
): void {
  const result = meta.result ?? 'success';
  const finishedAt = new Date(now).toISOString();

  if (result === 'success') {
    patches[key] = {
      status: 'success',
      progress: 100,
      finishedAt,
      outputPath: fakeOutputPath(meta.sceneOrder, job.index, meta.aspect),
    };
    return;
  }

  // No silent auto-retry in the mock: each generate = exactly one processing pass.
  // A failure surfaces as `error` with a manual "Thử lại" button; the real queue's
  // auto-retry (spec §10.3) belongs to the P3 backend adapter.
  patches[key] = {
    status: 'error',
    progress: undefined,
    finishedAt,
    attempts: job.attempts + 1,
    error: result.error,
  };
}
