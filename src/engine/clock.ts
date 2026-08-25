/**
 * Monotonic clock (performance.now) for measuring run durations: keystrokes, pauses,
 * HUD timer, focus guard. Immune to system clock jumps (NTP, manual adjustment) and
 * accurate to sub-millisecond precision.
 * NEVER mix with Date.now() (different origins): wall-clock dates (run.date, streaks,
 * achievements, profile) stay on Date.now().
 */
export const nowMs = (): number => performance.now();
