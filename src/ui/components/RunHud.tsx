import { useEffect, useState } from 'react';
import { computeAccuracy, liveWpm } from '@/engine/stats';
import { elapsedMs } from '@/engine/typingEngine';
import { nowMs } from '@/engine/clock';
import { useT } from '@/i18n';
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
  const t = useT();
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!live) return undefined; // paused: values are frozen, no ticker needed
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [live]);
  const now = nowMs();
  const wpm = liveWpm(typing, now);
  const accuracy = computeAccuracy(typing.keystrokes, typing.errors);
  const seconds = elapsedMs(typing, now) / 1000;
  const progress = Math.round((typing.cursor / typing.text.length) * 100);
  return (
    <div className="grid grid-cols-4 gap-3">
      <Cell label="WPM" value={wpm.toFixed(0)} />
      <Cell label={t('run.hud.accuracy')} value={`${Math.round(accuracy * 100)}${t('unit.percent')}`} />
      <Cell label={t('run.hud.time')} value={`${seconds.toFixed(1)} s`} />
      <Cell label={t('run.hud.progress')} value={`${progress}${t('unit.percent')}`} />
    </div>
  );
}
