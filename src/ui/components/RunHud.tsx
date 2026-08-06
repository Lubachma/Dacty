import { useEffect, useState } from 'react';
import { computeAccuracy, liveWpm } from '@/engine/stats';
import { elapsedMs } from '@/engine/typingEngine';
import type { TypingState } from '@/engine/types';

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-2 text-center backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="font-type text-xl font-bold">{value}</p>
    </div>
  );
}

export function RunHud({ typing, live = true }: { typing: TypingState; live?: boolean }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!live) return undefined; // en pause, les valeurs sont gelées : pas de ticker
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [live]);
  const now = Date.now();
  const wpm = liveWpm(typing, now);
  const accuracy = computeAccuracy(typing.keystrokes, typing.errors);
  const seconds = elapsedMs(typing, now) / 1000;
  const progress = Math.round((typing.cursor / typing.text.length) * 100);
  return (
    <div className="grid grid-cols-4 gap-3">
      <Cell label="WPM" value={wpm.toFixed(0)} />
      <Cell label="Précision" value={`${Math.round(accuracy * 100)} %`} />
      <Cell label="Temps" value={`${seconds.toFixed(1)} s`} />
      <Cell label="Progression" value={`${progress} %`} />
    </div>
  );
}
