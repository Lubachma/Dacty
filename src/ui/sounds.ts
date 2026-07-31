let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundsEnabled(v: boolean): void {
  enabled = v;
}

function beep(freq: number, durationMs: number, type: OscillatorType, gainValue: number): void {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // audio indisponible : silencieux
  }
}

export const playKey = (): void => beep(600, 30, 'sine', 0.02);
export const playError = (): void => beep(160, 80, 'square', 0.03);
export const playSuccess = (): void => {
  beep(520, 90, 'sine', 0.04);
  setTimeout(() => beep(780, 120, 'sine', 0.04), 90);
};
