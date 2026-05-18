export function fmtMs(ms: number | null): string {
  if (ms === null) return '—';
  return `${Math.round(ms)} ms`;
}

export function fmtScore(n: number): string {
  return n.toLocaleString('en-US');
}

export function fmtPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function fmtMbps(mbps: number): string {
  return `${mbps.toFixed(1)} Mbps`;
}

export function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString();
}
