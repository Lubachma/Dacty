import { create } from 'zustand';
import {
  createRun, isFinished, pauseRun, pressBackspace, resumeRun, typeChar,
} from '@/engine/typingEngine';
import { wpmTimeline } from '@/engine/stats';
import type { TypingState } from '@/engine/types';
import { buildRunRecord, completeRun, type RunConfig, type RunResult } from '@/game/runFlow';
import { useToasts } from './toastStore';

// incrémenté à chaque start/reset : invalide les completeRun encore en vol
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
    let next = typeChar(typing, char, Date.now());
    if (next === typing) return;
    // auto-indentation : après un saut de ligne correct, tape les espaces attendus
    if (char === '\n' && next.statuses[next.cursor - 1] === 'correct') {
      while (next.text[next.cursor] === ' ' && !isFinished(next)) {
        next = typeChar(next, ' ', Date.now());
      }
    }
    if (isFinished(next)) {
      set({ typing: next, status: 'finished' });
      // un start/reset pendant completeRun rend ce résultat obsolète : on l'ignore
      const generation = runGeneration;
      void completeRun(next, config, Date.now())
        .then((result) => {
          if (runGeneration !== generation) return;
          set({ result });
        })
        .catch(() => {
          if (runGeneration !== generation) return;
          // IndexedDB indisponible (navigation privée) : résultats affichés, rien n'est persisté
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
          useToasts.getState().push({
            title: 'Sauvegarde impossible',
            description: 'Le stockage local est indisponible : cette run ne sera pas enregistrée.',
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
    const next = pressBackspace(typing, Date.now());
    if (next !== typing) set({ typing: next });
  },

  pause() {
    const { typing, status } = get();
    if (!typing || status !== 'running') return;
    set({ typing: pauseRun(typing, Date.now()), status: 'paused' });
  },

  resume() {
    const { typing, status } = get();
    if (!typing || status !== 'paused') return;
    set({ typing: resumeRun(typing, Date.now()), status: 'running' });
  },

  invalidate() {
    set({ status: 'invalidated', typing: null, result: null });
  },

  reset() {
    runGeneration += 1;
    set({ status: 'idle', config: null, typing: null, result: null });
  },
}));
