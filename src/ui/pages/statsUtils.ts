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
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, []);
    order.push(key);
  }
  for (const r of runs) {
    const d = new Date(r.date);
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets.has(key) && now - r.date < days * 86_400_000) buckets.get(key)!.push(r);
  }
  return order.map((key) => {
    const list = buckets.get(key)!;
    const mean = (f: (r: RunRecord) => number) =>
      list.length === 0 ? 0 : list.reduce((s, r) => s + f(r), 0) / list.length;
    return { day: key, avgWpm: mean((r) => r.wpm), avgAccuracy: mean((r) => r.accuracy), runs: list.length };
  });
}
