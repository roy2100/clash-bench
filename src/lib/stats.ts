export interface Stats {
  avg: number | null;
  p95: number | null;
  stddev: number | null;
  min: number | null;
  max: number | null;
  count: number;
}

export function calcStats(delays: number[]): Stats {
  if (delays.length === 0) {
    return { avg: null, p95: null, stddev: null, min: null, max: null, count: 0 };
  }

  const sorted = [...delays].sort((a, b) => a - b);
  const avg = delays.reduce((s, d) => s + d, 0) / delays.length;
  const variance = delays.reduce((s, d) => s + Math.pow(d - avg, 2), 0) / delays.length;
  const stddev = Math.sqrt(variance);

  const p95idx = Math.ceil(0.95 * sorted.length) - 1;
  const p95 = sorted[Math.min(p95idx, sorted.length - 1)] ?? null;

  return {
    avg,
    p95,
    stddev,
    min: sorted[0] ?? null,
    max: sorted[sorted.length - 1] ?? null,
    count: delays.length,
  };
}
