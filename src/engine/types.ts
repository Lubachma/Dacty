export type CharStatus = 'pending' | 'correct' | 'incorrect';

export interface KeystrokeEvent {
  at: number;
  kind: 'char' | 'backspace';
  /** true pour un caractère correct ou un backspace (non une « réussite », juste pas une erreur) */
  correct: boolean;
}

export interface TypingState {
  text: string;
  statuses: CharStatus[];
  cursor: number;
  /** erreurs commises, y compris corrigées ensuite */
  errors: number;
  backspaces: number;
  /** frappes de caractères (hors backspace) */
  keystrokes: number;
  events: KeystrokeEvent[];
  startedAt: number | null;
  finishedAt: number | null;
  pausedMs: number;
  pauseStartedAt: number | null;
}
