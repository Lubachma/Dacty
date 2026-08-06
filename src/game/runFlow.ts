import type { TypingState } from '@/engine/types';
import { elapsedMs } from '@/engine/typingEngine';
import { computeAccuracy, computeWpm, wpmTimeline } from '@/engine/stats';
import { challengerPoints } from '@/scoring/points';
import type { Tier } from '@/scoring/league';
import type { ChallengerProgress, GameMode, RunRecord } from '@/db/types';
import { personalBests, saveRun } from '@/db/runsRepo';
import { recordChallengerResult } from '@/db/challengerRepo';
import { getOfficialTexts } from '@/texts/corpus';
import { buildContext, unlockNew } from '@/achievements/check';
import type { AchievementDef } from '@/achievements/definitions';
import type { Language, TextOptions } from '@/texts/types';

export interface RunConfig {
  mode: GameMode;
  language: Language;
  textId: string;
  options: TextOptions;
}

export type RecordKind = 'wpm' | 'accuracy' | 'longest';

export interface RunResult {
  run: RunRecord;
  timeline: number[];
  newAchievements: AchievementDef[];
  tierUp: Tier | null;
  progress: ChallengerProgress | null;
  newRecords: RecordKind[];
}

export function buildRunRecord(state: TypingState, config: RunConfig, now: number): RunRecord {
  const durationMs = elapsedMs(state, now);
  const wpm = computeWpm(state.text.length, durationMs);
  const accuracy = computeAccuracy(state.keystrokes, state.errors);
  return {
    date: now,
    mode: config.mode,
    language: config.language,
    textId: config.textId,
    options: config.options,
    durationMs,
    wpm,
    accuracy,
    points: challengerPoints(wpm, accuracy, config.options),
    errors: state.errors,
    backspaces: state.backspaces,
    chars: state.text.length,
    noBackspace: state.backspaces === 0,
  };
}

export async function completeRun(state: TypingState, config: RunConfig, now: number): Promise<RunResult> {
  const run = buildRunRecord(state, config, now);
  const { durationMs, wpm, accuracy, points } = run;

  const bests = await personalBests();
  const newRecords: RecordKind[] = [];
  if (bests.bestWpm === null) {
    newRecords.push('wpm', 'accuracy', 'longest');
  } else {
    if (wpm > bests.bestWpm.wpm) newRecords.push('wpm');
    if (durationMs >= 10_000 && accuracy > (bests.bestAccuracy?.accuracy ?? 0)) {
      newRecords.push('accuracy');
    }
    if (state.text.length > (bests.longestRun?.chars ?? 0)) newRecords.push('longest');
  }

  const id = await saveRun(run);
  run.id = id;

  let tierUp: Tier | null = null;
  let progress: ChallengerProgress | null = null;
  if (config.mode === 'challenger') {
    const officialIds = getOfficialTexts(config.language).map((t) => t.id);
    const r = await recordChallengerResult(config.language, config.textId, points, now, officialIds);
    tierUp = r.tierUp;
    progress = r.progress;
  }

  const ctx = await buildContext(run);
  const newAchievements = await unlockNew(ctx);

  const timeline = wpmTimeline(state.events, state.startedAt ?? now, state.finishedAt ?? now);

  return { run, timeline, newAchievements, tierUp, progress, newRecords };
}
