import type { BenchResult } from '../types';
import { fmtDate, fmtDuration, fmtMs } from './format';
import { calcStats } from './stats';

export function exportCSV(records: BenchResult[]): string {
  const header = [
    'Node', 'Type', 'Date', 'Duration', 'Score', 'Grade',
    'Avg Latency', 'P95 Latency', 'Jitter', 'Success Rate',
    'Throughput (Mbps)'
  ].join(',');

  const rows = records.map(r => {
    const valid = r.samples.map(s => s.delay).filter((d): d is number => d !== null);
    const stats = calcStats(valid);
    const successRate = r.samples.length > 0 ? valid.length / r.samples.length : 0;
    return [
      `"${r.proxyName}"`,
      r.proxyType,
      `"${fmtDate(r.startedAt)}"`,
      fmtDuration(r.durationMs),
      r.score.total,
      r.score.grade,
      fmtMs(stats.avg),
      fmtMs(stats.p95),
      fmtMs(stats.stddev),
      `${Math.round(successRate * 100)}%`,
      r.throughputMbps ? r.throughputMbps.toFixed(1) : '',
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

export function downloadCSV(content: string, filename = 'clash-bench.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
