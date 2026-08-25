import { create } from 'zustand';
import {
  createRun, isFinished, pauseRun, pressBackspace, resumeRun, typeChar,
} from '@/engine/typingEngine';
import { nowMs } from '@/engine/clock';
import { wpmTimeline } from '@/engine/stats';
import type { TypingState } from '@/engine/types';
import { buildRunRecord, completeRun, type RunConfig, type RunResult } from '@/game/runFlow';
import { translate } from '@/i18n/translate';
import { useSettings } from './settingsStore';
import { useToasts } from './toastStore';

// incremented on every start/reset: invalidates any completeRun still in flight
let runGeneration = 0;

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished' | 'invalidated';

interface RunStore {
  status: RunStatus;
  config: RunConfig | null;
  typing: TypingState | null;
  result: RunResult | null;
  start(config: RunConfig, text: string): void;
  key(char: string): void;
  backspace(): void;
  pause(): void;
  resume(): void;
  invalidate(): void;
  reset(): void;
}

export const useRunStore = create<RunStore>((set, get) => ({
  status: 'idle',
  config: null,
  typing: null,
  result: null,

  start(config, text) {
    runGeneration += 1;
    set({ config, typing: createRun(text), result: null, status: 'running' });
  },

  key(char) {
    const { typing, config, status } = get();
    if (!typing || !config || status !== 'running') return;
    let next = typeChar(typing, char, nowMs());
    if (next === typing) return;
    // auto-indentation: after a correct newline, types the expected spaces
    // (synthetic keystrokes: count toward neither keystrokes nor the timeline)
    if (char === '\n' && next.statuses[next.cursor - 1] === 'correct') {
      while (next.text[next.cursor] === ' ' && !isFinished(next)) {
        next = typeChar(next, ' ', nowMs(), true);
      }
    }
    if (isFinished(next)) {
      set({ typing: next, status: 'finished' });
      // a start/reset during completeRun makes this result stale: ignore it
      const generation = runGeneration;
      void completeRun(next, config, Date.now())
        .then((result) => {
          if (runGeneration !== generation) return;
          set({ result });
        })
        .catch(() => {
          if (runGeneration !== generation) return;
          // IndexedDB unavailable (private browsing): results are shown, nothing is persisted
          const now = Date.now();
          set({
            result: {
              run: buildRunRecord(next, config, now),
              timeline: wpmTimeline(next.events, next.startedAt ?? now, next.finishedAt ?? now),
              newAchievements: [],
              tierUp: null,
              progress: null,
              newRecords: [],
            },
          });
          const uiLanguage = useSettings.getState().profile.uiLanguage;
          useToasts.getState().push({
            title: translate(uiLanguage, 'run.saveError.title'),
            description: translate(uiLanguage, 'run.saveError.description'),
            kind: 'info',
          });
        });
    } else {
      set({ typing: next });
    }
  },

  backspace() {
    const { typing, status } = get();
    if (!typing || status !== 'running') return;
    const next = pressBackspace(typing, nowMs());
    if (next !== typing) set({ typing: next });
  },

  pause() {
    const { typing, status } = get();
    if (!typing || status !== 'running') return;
    set({ typing: pauseRun(typing, nowMs()), status: 'paused' });
  },

  resume() {
    const { typing, status } = get();
    if (!typing || status !== 'paused') return;
    set({ typing: resumeRun(typing, nowMs()), status: 'running' });
  },

  invalidate() {
    set({ status: 'invalidated', typing: null, result: null });
  },

  reset() {
    runGeneration += 1;
    set({ status: 'idle', config: null, typing: null, result: null });
  },
}));
