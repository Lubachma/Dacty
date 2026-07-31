import type { RunRecord } from '@/db/types';

export interface DayStat {
  day: string;
  avgWpm: number;
  avgAccuracy: number;
  runs: number;
}

export function dailyAverages(runs: RunRecord[], days = 30, now = Date.now()): DayStat[] {
  const buckets = new Map<string, RunRecord[]>();
  const order: string[] = [];
  const dayKey = (d: Date): string =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const cursor = new Date(now);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - i);
    const key = dayKey(d);
    buckets.set(key, []);
    order.push(key);
  }
  const oldest = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - (days - 1));
  for (const r of runs) {
    const d = new Date(r.date);
    if (d < oldest) continue;
    const key = dayKey(d);
    if (buckets.has(key)) buckets.get(key)!.push(r);
  }
  return order.map((key) => {
    const list = buckets.get(key)!;
    const mean = (f: (r: RunRecord) => number) =>
      list.length === 0 ? 0 : list.reduce((s, r) => s + f(r), 0) / list.length;
    return { day: key, avgWpm: mean((r) => r.wpm), avgAccuracy: mean((r) => r.accuracy), runs: list.length };
  });
}
