import type { CharStatus, TypingState } from './types';

export function createRun(text: string): TypingState {
  if (text.length === 0) throw new Error('createRun: texte vide');
  return {
    text,
    statuses: Array<CharStatus>(text.length).fill('pending'),
    cursor: 0,
    errors: 0,
    backspaces: 0,
    keystrokes: 0,
    events: [],
    startedAt: null,
    finishedAt: null,
    pausedMs: 0,
    pauseStartedAt: null,
  };
}

function active(state: TypingState): boolean {
  return state.finishedAt === null && state.pauseStartedAt === null;
}

export function typeChar(state: TypingState, char: string, now: number): TypingState {
  if (!active(state) || state.cursor >= state.text.length || char.length !== 1) return state;
  const correct = state.text[state.cursor] === char;
  const statuses = state.statuses.slice();
  statuses[state.cursor] = correct ? 'correct' : 'incorrect';
  const next: TypingState = {
    ...state,
    statuses,
    cursor: state.cursor + 1,
    errors: correct ? state.errors : state.errors + 1,
    keystrokes: state.keystrokes + 1,
    startedAt: state.startedAt ?? now,
    events: [...state.events, { at: now, kind: 'char', correct }],
  };
  if (next.cursor === next.text.length && next.statuses.every((s) => s === 'correct')) {
    next.finishedAt = now;
  }
  return next;
}

export function pressBackspace(state: TypingState, now: number): TypingState {
  if (!active(state) || state.cursor === 0) return state;
  const statuses = state.statuses.slice();
  statuses[state.cursor - 1] = 'pending';
  return {
    ...state,
    statuses,
    cursor: state.cursor - 1,
    backspaces: state.backspaces + 1,
    events: [...state.events, { at: now, kind: 'backspace', correct: true }],
  };
}

export function pauseRun(state: TypingState, now: number): TypingState {
  if (state.finishedAt !== null || state.pauseStartedAt !== null || state.startedAt === null) {
    return state;
  }
  return { ...state, pauseStartedAt: now };
}

export function resumeRun(state: TypingState, now: number): TypingState {
  if (state.pauseStartedAt === null) return state;
  return {
    ...state,
    pausedMs: state.pausedMs + (now - state.pauseStartedAt),
    pauseStartedAt: null,
  };
}

export function isFinished(state: TypingState): boolean {
  return state.finishedAt !== null;
}

export function elapsedMs(state: TypingState, now: number): number {
  if (state.startedAt === null) return 0;
  const end = state.finishedAt ?? state.pauseStartedAt ?? now;
  return Math.max(0, end - state.startedAt - state.pausedMs);
}
