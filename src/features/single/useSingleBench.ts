import { useRef, useState } from 'react';
import type { DelaySample, BenchResult } from '../../types';
import { BenchRunner } from '../../lib/bench';
import { computeScore } from '../../lib/scoring';
import { calcStats } from '../../lib/stats';
import { useConnectionStore } from '../../store/connectionStore';
import { useModeStore } from '../../store/modeStore';
import { useHistoryStore } from '../history/historyStore';
import type { PhaseKey } from '../../components/shared/PhaseList';

export type RunStage = 'idle' | 'running' | 'result';

export interface LiveData {
  currentPhase: PhaseKey | null;
  phaseProgress: Partial<Record<PhaseKey, { current: number; total: number }>>;
  samples: DelaySample[];
  liveScore: number;
  liveGrade: ReturnType<typeof computeScore>['grade'];
}

export function useSingleBench() {
  const { api, configLabel } = useConnectionStore();
  const { config } = useModeStore();
  const { add } = useHistoryStore();

  const [stage, setStage] = useState<RunStage>('idle');
  const [selectedProxy, setSelectedProxy] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [liveData, setLiveData] = useState<LiveData>({
    currentPhase: null,
    phaseProgress: {},
    samples: [],
    liveScore: 0,
    liveGrade: 'F',
  });
  const [result, setResult] = useState<BenchResult | null>(null);
  const runnerRef = useRef<BenchRunner | null>(null);

  const start = () => {
    if (!api || !selectedProxy) return;
    setStage('running');
    setResult(null);

    const samples: DelaySample[] = [];
    const phaseProgress: Partial<Record<PhaseKey, { current: number; total: number }>> = {};

    const updateLiveScore = (currentSamples: DelaySample[]) => {
      const valid = currentSamples.map(s => s.delay).filter((d): d is number => d !== null);
      if (valid.length === 0) return;
      const stats = calcStats(valid);
      const rate = valid.length / currentSamples.length;
      const scored = computeScore({
        avgLatency: stats.avg ?? 9999,
        p95Latency: stats.p95 ?? 9999,
        jitter: stats.stddev ?? 9999,
        successRate: rate,
      });
      setLiveData(prev => ({
        ...prev,
        samples: [...currentSamples],
        liveScore: scored.total,
        liveGrade: scored.grade,
      }));
    };

    const runner = new BenchRunner(api, selectedProxy, selectedType, config, {
      onPhaseStart(phase) {
        phaseProgress[phase] = { current: 0, total: phase === 'burst' ? config.phase1Rounds : phase === 'hold' ? config.phase2Rounds : 1 };
        setLiveData(prev => ({ ...prev, currentPhase: phase, phaseProgress: { ...phaseProgress } }));
      },
      onSample(sample) {
        samples.push(sample);
        updateLiveScore(samples);
      },
      onProgress(progress) {
        const key = progress.phase as PhaseKey;
        phaseProgress[key] = { current: progress.current, total: progress.total };
        setLiveData(prev => ({ ...prev, phaseProgress: { ...phaseProgress } }));
      },
      onComplete(benchResult) {
        const labeled = configLabel ? { ...benchResult, configLabel } : benchResult;
        add(labeled);
        setResult(labeled);
        setStage('result');
      },
    });

    runnerRef.current = runner;
    runner.run().catch((err) => {
      console.error('BenchRunner error:', err);
      setStage('idle');
    });
  };

  const abort = () => {
    runnerRef.current?.abort();
    setStage('idle');
  };

  const reset = () => {
    setStage('idle');
    setResult(null);
    setLiveData({ currentPhase: null, phaseProgress: {}, samples: [], liveScore: 0, liveGrade: 'F' });
  };

  return {
    stage,
    selectedProxy,
    selectedType,
    liveData,
    result,
    setSelectedProxy,
    setSelectedType,
    start,
    abort,
    reset,
  };
}
