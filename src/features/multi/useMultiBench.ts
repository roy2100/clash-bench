import { useRef, useState } from 'react';
import type { BenchResult } from '../../types';
import { BenchRunner } from '../../lib/bench';
import { useConnectionStore } from '../../store/connectionStore';
import { useModeStore } from '../../store/modeStore';
import { useHistoryStore } from '../history/historyStore';

export interface MultiRunState {
  status: 'idle' | 'running' | 'done';
  currentIdx: number;
  currentProxy: string;
  results: BenchResult[];
  totalProxies: number;
}

export function useMultiBench() {
  const { api, proxies, configLabel } = useConnectionStore();
  const { config } = useModeStore();
  const { add } = useHistoryStore();

  const [selectedProxies, setSelectedProxies] = useState<string[]>([]);
  const [state, setState] = useState<MultiRunState>({
    status: 'idle', currentIdx: 0, currentProxy: '', results: [], totalProxies: 0,
  });
  const abortRef = useRef(false);

  const start = async () => {
    if (!api || selectedProxies.length === 0) return;
    abortRef.current = false;

    setState({ status: 'running', currentIdx: 0, currentProxy: '', results: [], totalProxies: selectedProxies.length });

    const results: BenchResult[] = [];

    for (let i = 0; i < selectedProxies.length; i++) {
      if (abortRef.current) break;
      const proxyName = selectedProxies[i]!;
      const proxyType = proxies.find(p => p.name === proxyName)?.type ?? 'Unknown';

      setState(prev => ({ ...prev, currentIdx: i, currentProxy: proxyName }));

      const multiConfig = { ...config, phase1Rounds: 10, phase1IntervalMs: 500, phase2Rounds: 10, phase2IntervalMs: 1000 };

      const raw = await new BenchRunner(api, proxyName, proxyType, multiConfig).run();
      const result = configLabel ? { ...raw, configLabel } : raw;
      results.push(result);
      add(result);

      setState(prev => ({
        ...prev,
        results: [...results].sort((a, b) => b.score.total - a.score.total),
      }));
    }

    setState(prev => ({ ...prev, status: 'done', currentProxy: '' }));
  };

  const abort = () => { abortRef.current = true; };
  const reset = () => {
    setState({ status: 'idle', currentIdx: 0, currentProxy: '', results: [], totalProxies: 0 });
  };

  return { selectedProxies, setSelectedProxies, state, start, abort, reset };
}
