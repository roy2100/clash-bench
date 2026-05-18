import { useRef, useState } from 'react';
import type { BenchResult } from '../../types';
import { BenchRunner } from '../../lib/bench';
import { useConnectionStore } from '../../store/connectionStore';
import { useModeStore } from '../../store/modeStore';

export interface StressPoint {
  time: number;
  score: number;
  round: number;
}

export interface StressState {
  status: 'idle' | 'running' | 'done';
  rounds: StressPoint[];
  currentRound: number;
}

const MINI_CONFIG = {
  phase1Rounds: 0,
  phase1IntervalMs: 500,
  phase2Rounds: 10,
  phase2IntervalMs: 1000,
  throughputEnabled: false,
};

export function useStressBench() {
  const { api, proxies } = useConnectionStore();
  const { config } = useModeStore();

  const [selectedProxy, setSelectedProxy] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [durationMin, setDurationMin] = useState(10);
  const [state, setState] = useState<StressState>({ status: 'idle', rounds: [], currentRound: 0 });
  const abortRef = useRef(false);

  const start = async () => {
    if (!api || !selectedProxy) return;
    abortRef.current = false;
    setState({ status: 'running', rounds: [], currentRound: 0 });

    const endAt = Date.now() + durationMin * 60 * 1000;
    let round = 0;
    const rounds: StressPoint[] = [];

    while (Date.now() < endAt && !abortRef.current) {
      round++;
      setState(prev => ({ ...prev, currentRound: round }));

      const miniConfig = { ...config, ...MINI_CONFIG };
      const result: BenchResult = await new BenchRunner(api, selectedProxy, selectedType, miniConfig).run();

      const pt: StressPoint = { time: Date.now(), score: result.score.total, round };
      rounds.push(pt);
      setState(prev => ({ ...prev, rounds: [...rounds] }));

      if (!abortRef.current && Date.now() < endAt) {
        await new Promise<void>(r => setTimeout(r, 1000));
      }
    }

    setState(prev => ({ ...prev, status: 'done' }));
  };

  const abort = () => { abortRef.current = true; };
  const reset = () => setState({ status: 'idle', rounds: [], currentRound: 0 });

  const getAnalysis = () => {
    const { rounds } = state;
    if (rounds.length < 2) return null;
    const scores = rounds.map(r => r.score);
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const firstTenth = scores.slice(0, Math.max(1, Math.floor(scores.length * 0.1)));
    const lastTenth = scores.slice(Math.floor(scores.length * 0.9));
    const firstAvg = firstTenth.reduce((s, v) => s + v, 0) / firstTenth.length;
    const lastAvg = lastTenth.reduce((s, v) => s + v, 0) / lastTenth.length;
    const decay = firstAvg > 0 ? ((firstAvg - lastAvg) / firstAvg) * 100 : 0;
    const variance = scores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / scores.length;
    const stddev = Math.sqrt(variance);
    return { avg, min, max, decay, stddev };
  };

  return {
    selectedProxy, selectedType, durationMin,
    setSelectedProxy, setSelectedType, setDurationMin,
    state, start, abort, reset,
    analysis: getAnalysis(),
    proxies,
  };
}
