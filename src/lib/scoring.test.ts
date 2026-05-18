import { describe, it, expect } from 'vitest';
import { computeScore, getGrade } from './scoring';
import { calcStats } from './stats';

// --- calcStats ---

describe('calcStats', () => {
  it('returns nulls for empty array', () => {
    const s = calcStats([]);
    expect(s.avg).toBeNull();
    expect(s.p95).toBeNull();
    expect(s.stddev).toBeNull();
    expect(s.count).toBe(0);
  });

  it('single sample: avg = value, stddev = 0', () => {
    const s = calcStats([100]);
    expect(s.avg).toBe(100);
    expect(s.stddev).toBe(0);
    expect(s.min).toBe(100);
    expect(s.max).toBe(100);
  });

  it('avg of [100, 200] = 150', () => {
    expect(calcStats([100, 200]).avg).toBe(150);
  });

  it('p95 of 20 samples picks ~19th sorted value', () => {
    const arr = Array.from({ length: 20 }, (_, i) => i * 10); // [0..190]
    const s = calcStats(arr);
    // p95 index = ceil(0.95*20)-1 = ceil(19)-1 = 18 → arr[18]=180
    expect(s.p95).toBe(180);
  });

  it('stddev of [0,0,0] = 0', () => {
    expect(calcStats([0, 0, 0]).stddev).toBeCloseTo(0);
  });

  it('stddev of [0, 100] ≈ 50', () => {
    expect(calcStats([0, 100]).stddev).toBeCloseTo(50);
  });
});

// --- computeScore ---

describe('computeScore', () => {
  it('perfect node: 50ms avg, 60ms p95, 5ms jitter, 100% success → score > 8000 (S)', () => {
    const result = computeScore({ avgLatency: 50, p95Latency: 60, jitter: 5, successRate: 1 });
    expect(result.total).toBeGreaterThan(8000);
    expect(result.grade).toBe('S');
  });

  it('good node: 100ms avg, 150ms p95, 20ms jitter, 98% success → A or B', () => {
    const result = computeScore({ avgLatency: 100, p95Latency: 150, jitter: 20, successRate: 0.98 });
    expect(result.total).toBeGreaterThan(3000);
    expect(['A', 'B']).toContain(result.grade);
  });

  it('bad node: 500ms avg, 800ms p95, 100ms jitter, 80% success → D or C', () => {
    const result = computeScore({ avgLatency: 500, p95Latency: 800, jitter: 100, successRate: 0.8 });
    expect(result.total).toBeLessThan(3000);
  });

  it('all samples timeout (successRate=0) → total = 0', () => {
    const result = computeScore({ avgLatency: 9999, p95Latency: 9999, jitter: 9999, successRate: 0 });
    expect(result.total).toBe(0);
    expect(result.grade).toBe('F');
  });

  it('total never exceeds 12000', () => {
    const result = computeScore({ avgLatency: 1, p95Latency: 1, jitter: 0, successRate: 1, throughputMbps: 10000 });
    expect(result.total).toBeLessThanOrEqual(12000);
  });

  it('total is never negative', () => {
    const result = computeScore({ avgLatency: 99999, p95Latency: 99999, jitter: 99999, successRate: 0 });
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('throughput bonus caps at 1.5x', () => {
    const without = computeScore({ avgLatency: 100, p95Latency: 150, jitter: 10, successRate: 1 });
    const with1000Mbps = computeScore({ avgLatency: 100, p95Latency: 150, jitter: 10, successRate: 1, throughputMbps: 1000 });
    expect(with1000Mbps.subscores.throughputBonus).toBe(1.5);
    expect(with1000Mbps.total).toBeGreaterThan(without.total);
  });

  it('subscores.latency >= total when all factors < 1', () => {
    const r = computeScore({ avgLatency: 200, p95Latency: 300, jitter: 50, successRate: 0.9 });
    expect(r.subscores.latency).toBeGreaterThanOrEqual(r.total);
  });
});

// --- getGrade ---

describe('getGrade', () => {
  it('8000 → S', () => expect(getGrade(8000)).toBe('S'));
  it('5000 → A', () => expect(getGrade(5000)).toBe('A'));
  it('3000 → B', () => expect(getGrade(3000)).toBe('B'));
  it('1500 → C', () => expect(getGrade(1500)).toBe('C'));
  it('500  → D', () => expect(getGrade(500)).toBe('D'));
  it('499  → F', () => expect(getGrade(499)).toBe('F'));
  it('0    → F', () => expect(getGrade(0)).toBe('F'));
  it('12000 → S', () => expect(getGrade(12000)).toBe('S'));
});
