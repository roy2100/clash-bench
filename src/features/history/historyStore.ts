import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BenchResult } from '../../types';
import { exportCSV, downloadCSV } from '../../lib/export';

interface HistoryStore {
  records: BenchResult[];
  add: (result: BenchResult) => void;
  remove: (index: number) => void;
  clear: () => void;
  exportAndDownload: () => void;
}

const MAX_RECORDS = 100;

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      records: [],

      add(result) {
        set((s) => {
          const next = [result, ...s.records];
          return { records: next.slice(0, MAX_RECORDS) };
        });
      },

      remove(index) {
        set((s) => ({ records: s.records.filter((_, i) => i !== index) }));
      },

      clear() {
        set({ records: [] });
      },

      exportAndDownload() {
        const csv = exportCSV(get().records);
        downloadCSV(csv);
      },
    }),
    { name: 'clash-bench-history' }
  )
);
