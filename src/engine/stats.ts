import type { KeystrokeEvent, TypingState } from './types';
import { elapsedMs } from './typingEngine';

export function computeWpm(correctChars: number, ms: number): number {
  if (ms <= 0) return 0;
  return correctChars / 5 / (ms / 60_000);
}

export function computeAccuracy(keystrokes: number, errors: number): number {
  if (keystrokes === 0) return 1;
  return Math.max(0, (keystrokes - errors) / keystrokes);
}

export function correctCharCount(state: TypingState): number {
  return state.statuses.filter((s) => s === 'correct').length;
}

export function liveWpm(state: TypingState, now: number): number {
  return computeWpm(correctCharCount(state), elapsedMs(state, now));
}

export function wpmTimeline(
  events: KeystrokeEvent[],
  startedAt: number,
  endedAt: number,
  bucketMs = 1000,
): number[] {
  if (endedAt <= startedAt) return [];
  const buckets = Math.ceil((endedAt - startedAt) / bucketMs);
  const correctPerBucket = Array<number>(buckets).fill(0);
  for (const e of events) {
    if (e.kind !== 'char' || !e.correct) continue;
    const idx = Math.min(buckets - 1, Math.floor((e.at - startedAt) / bucketMs));
    if (idx >= 0) correctPerBucket[idx] += 1;
  }
  return correctPerBucket.map((n) => n / 5 / (bucketMs / 60_000));
}
