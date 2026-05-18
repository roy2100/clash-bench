import type { ScoreInput, ScoreOutput, Grade } from '../types';

export function computeScore(input: ScoreInput): ScoreOutput {
  const effectiveLatency = input.avgLatency * 0.7 + input.p95Latency * 0.3;
  const latencyScore = Math.min(12000, 10000 * (50 / Math.max(effectiveLatency, 1)));
  const stabilityFactor = Math.pow(Math.min(1, Math.max(0, input.successRate)), 2);
  const jitterFactor = 1 / (1 + input.jitter / 100);
  const throughputBonus = input.throughputMbps
    ? 1 + Math.min(0.5, input.throughputMbps / 250)
    : 1.0;

  const total = Math.min(12000, Math.max(0, Math.round(
    latencyScore * stabilityFactor * jitterFactor * throughputBonus
  )));

  return {
    total,
    subscores: {
      latency: Math.round(latencyScore),
      stabilityFactor: Number(stabilityFactor.toFixed(3)),
      jitterFactor: Number(jitterFactor.toFixed(3)),
      throughputBonus: Number(throughputBonus.toFixed(3)),
    },
    grade: getGrade(total),
  };
}

export function getGrade(score: number): Grade {
  if (score >= 8000) return 'S';
  if (score >= 5000) return 'A';
  if (score >= 3000) return 'B';
  if (score >= 1500) return 'C';
  if (score >= 500)  return 'D';
  return 'F';
}
