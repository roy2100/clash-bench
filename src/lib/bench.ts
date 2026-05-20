import type { ClashAPI } from '../api/clash';
import type { BenchConfig, BenchResult, DelaySample } from '../types';
import { computeScore } from './scoring';
import { calcStats } from './stats';

export interface BenchProgress {
  phase: 'burst' | 'hold' | 'throughput';
  current: number;
  total: number;
}

export interface BenchEvents {
  onPhaseStart?: (phase: 'burst' | 'hold' | 'throughput') => void;
  onSample?: (sample: DelaySample) => void;
  onProgress?: (progress: BenchProgress) => void;
  onComplete?: (result: BenchResult) => void;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export class BenchRunner {
  private aborted = false;

  constructor(
    private api: ClashAPI,
    private proxyName: string,
    private proxyType: string,
    private config: BenchConfig,
    private events: BenchEvents = {}
  ) {}

  abort() { this.aborted = true; }

  async run(): Promise<BenchResult> {
    const samples: DelaySample[] = [];
    const startedAt = Date.now();

    this.events.onPhaseStart?.('burst');
    for (let i = 0; i < this.config.phase1Rounds; i++) {
      if (this.aborted) break;
      const delay = await this.api.testDelay(
        this.proxyName, this.config.testUrl, this.config.timeoutMs
      );
      const sample: DelaySample = { timestamp: Date.now(), delay, phase: 'burst' };
      samples.push(sample);
      this.events.onSample?.(sample);
      this.events.onProgress?.({ phase: 'burst', current: i + 1, total: this.config.phase1Rounds });
      if (i < this.config.phase1Rounds - 1 && !this.aborted) {
        await sleep(this.config.phase1IntervalMs);
      }
    }

    if (!this.aborted) {
      this.events.onPhaseStart?.('hold');
      for (let i = 0; i < this.config.phase2Rounds; i++) {
        if (this.aborted) break;
        const delay = await this.api.testDelay(
          this.proxyName, this.config.testUrl, this.config.timeoutMs
        );
        const sample: DelaySample = { timestamp: Date.now(), delay, phase: 'hold' };
        samples.push(sample);
        this.events.onSample?.(sample);
        this.events.onProgress?.({ phase: 'hold', current: i + 1, total: this.config.phase2Rounds });
        if (i < this.config.phase2Rounds - 1 && !this.aborted) {
          await sleep(this.config.phase2IntervalMs);
        }
      }
    }

    let throughputMbps: number | undefined;
    if (this.config.throughputEnabled && this.config.throughputUrl && !this.aborted) {
      this.events.onPhaseStart?.('throughput');

      const group = this.config.throughputGroupName?.trim();
      let prevSelection: string | null = null;
      if (group) {
        prevSelection = await this.api.getGroupNow(group);
        await this.api.setGroupProxy(group, this.proxyName);
      }

      try {
        throughputMbps = await this.measureThroughput(this.config.throughputUrl);
      } finally {
        if (group && prevSelection) {
          await this.api.setGroupProxy(group, prevSelection);
        }
      }
    }

    const holdSamples = samples.filter(s => s.phase === 'hold');
    const validDelays = holdSamples.map(s => s.delay).filter((d): d is number => d !== null);
    const stats = calcStats(validDelays);
    const successRate = holdSamples.length > 0 ? validDelays.length / holdSamples.length : 0;

    const score = computeScore({
      avgLatency: stats.avg ?? 9999,
      p95Latency: stats.p95 ?? 9999,
      jitter: stats.stddev ?? 9999,
      successRate,
      throughputMbps,
    });

    const result: BenchResult = {
      proxyName: this.proxyName,
      proxyType: this.proxyType,
      startedAt,
      durationMs: Date.now() - startedAt,
      samples,
      throughputMbps,
      score,
    };

    this.events.onComplete?.(result);
    return result;
  }

  private async measureThroughput(url: string): Promise<number> {
    try {
      const t0 = performance.now();
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok || !res.body) return 0;
      const reader = res.body.getReader();
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
      }
      const elapsed = (performance.now() - t0) / 1000;
      return (received * 8) / elapsed / 1e6;
    } catch {
      return 0;
    }
  }
}
