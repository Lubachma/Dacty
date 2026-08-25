export type CharStatus = 'pending' | 'correct' | 'incorrect';

export interface KeystrokeEvent {
  at: number;
  kind: 'char' | 'backspace';
  /** true for a correct character or a backspace (not a "success", just not an error) */
  correct: boolean;
}

export interface TypingState {
  text: string;
  statuses: CharStatus[];
  cursor: number;
  /** errors made, including ones later corrected */
  errors: number;
  backspaces: number;
  /** character keystrokes (excluding backspace) */
  keystrokes: number;
  events: KeystrokeEvent[];
  startedAt: number | null;
  finishedAt: number | null;
  pausedMs: number;
  pauseStartedAt: number | null;
}
