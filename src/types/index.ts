export interface Proxy {
  name: string;
  type: string;
}

export interface DelaySample {
  timestamp: number;
  delay: number | null;
  phase: 'burst' | 'hold' | 'throughput';
}

export interface ScoreInput {
  avgLatency: number;
  p95Latency: number;
  jitter: number;
  successRate: number;
  throughputMbps?: number;
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface ScoreOutput {
  total: number;
  subscores: {
    latency: number;
    stabilityFactor: number;
    jitterFactor: number;
    throughputBonus: number;
  };
  grade: Grade;
}

export interface BenchResult {
  proxyName: string;
  proxyType: string;
  configLabel?: string;
  startedAt: number;
  durationMs: number;
  samples: DelaySample[];
  throughputMbps?: number;
  score: ScoreOutput;
}

export interface BenchConfig {
  testUrl: string;
  timeoutMs: number;
  phase1Rounds: number;
  phase1IntervalMs: number;
  phase2Rounds: number;
  phase2IntervalMs: number;
  throughputEnabled: boolean;
  throughputUrl?: string;
  throughputGroupName?: string;
}

export type AppMode = 'single' | 'multi' | 'stress';

export const DEFAULT_THROUGHPUT_URL = 'https://speed.cloudflare.com/__down?bytes=10000000';

export const DEFAULT_BENCH_CONFIG: BenchConfig = {
  testUrl: 'https://www.gstatic.com/generate_204',
  timeoutMs: 5000,
  phase1Rounds: 20,
  phase1IntervalMs: 500,
  phase2Rounds: 50,
  phase2IntervalMs: 1000,
  throughputEnabled: false,
  throughputUrl: DEFAULT_THROUGHPUT_URL,
};

export const GRADE_COLORS: Record<Grade, string> = {
  S: '#00d4ff',
  A: '#00e676',
  B: '#a0e02c',
  C: '#ffd740',
  D: '#ff9800',
  F: '#ff4444',
};

export const GRADE_LABELS: Record<Grade, string> = {
  S: '旗舰节点 / 4K 串流无压力',
  A: '优秀 / 日常完美',
  B: '良好 / 1080p 视频可用',
  C: '一般 / 偶有卡顿',
  D: '较差 / 仅适合文字',
  F: '不可用',
};
