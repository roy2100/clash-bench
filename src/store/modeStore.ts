import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMode, BenchConfig } from '../types';
import { DEFAULT_BENCH_CONFIG } from '../types';

interface ModeStore {
  mode: AppMode;
  config: BenchConfig;
  setMode: (mode: AppMode) => void;
  updateConfig: (patch: Partial<BenchConfig>) => void;
}

export const useModeStore = create<ModeStore>()(
  persist(
    (set) => ({
      mode: 'single',
      config: DEFAULT_BENCH_CONFIG,
      setMode: (mode) => set({ mode }),
      updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
    }),
    {
      name: 'clash-bench-mode',
      // 深度合并：localStorage 里缺失的新字段从 DEFAULT_BENCH_CONFIG 补全
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<ModeStore>),
        config: {
          ...DEFAULT_BENCH_CONFIG,
          ...((persisted as Partial<ModeStore>).config ?? {}),
        },
      }),
    }
  )
);
