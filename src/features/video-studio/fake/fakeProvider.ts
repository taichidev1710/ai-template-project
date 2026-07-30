/**
 * Fake provider for P1 (spec §17): simulates an async video job — a duration and
 * a random outcome (mostly success, sometimes a retriable or fatal error) — so
 * the whole UX can be built and reviewed with no API key and no spend. It reuses
 * the domain `classifyError`, so the error codes it produces are the real ones
 * the grid and retry logic will see against a live provider.
 */
import { classifyError, type AspectRatio, type JobError } from '@/domain/video';
import { buildOutputPath } from '../outputPath';

export type FakeResult = 'success' | { error: JobError };

export interface FakeLifecycle {
  /** How long the fake "generation" takes before it resolves. */
  durationMs: number;
  result: FakeResult;
}

/** Error signals the fake can roll: some retriable, some fatal. */
const RETRIABLE = [{ status: 429 }, { status: 503 }, { kind: 'network' as const }];
const FATAL = [{ status: 400 }, { status: 402 }];

const rand = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

/** Roll one job's lifecycle: mostly success, occasional error to show that state. */
export function rollLifecycle(): FakeLifecycle {
  const durationMs = 1200 + Math.floor(Math.random() * 2800);
  const r = Math.random();
  if (r < 0.9) return { durationMs, result: 'success' };
  const signal = r < 0.96 ? rand(RETRIABLE) : rand(FATAL);
  return { durationMs, result: { error: classifyError(signal) } };
}

/** A plausible relative save path for a finished mock clip (shares the real naming). */
export function fakeOutputPath(sceneOrder: number, index: number, aspect: AspectRatio): string {
  return buildOutputPath({ projectName: 'video', sceneOrder, index, provider: 'mock', aspect });
}
