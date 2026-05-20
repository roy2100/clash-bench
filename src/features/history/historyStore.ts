import { create } from 'zustand';
import type { BenchResult } from '../../types';
import { exportCSV, downloadCSV } from '../../lib/export';
import { initDb, db_addResult, db_getResults, db_removeResult, db_clearResults } from '../../lib/db';

interface HistoryStore {
  records: BenchResult[];
  ready: boolean;
  add: (result: BenchResult) => void;
  remove: (startedAt: number) => void;
  clear: () => void;
  exportAndDownload: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => {
  initDb()
    .then(() => set({ records: db_getResults(), ready: true }))
    .catch((err) => console.error('SQLite init failed:', err));

  return {
    records: [],
    ready: false,

    add(result) {
      db_addResult(result);
      set({ records: db_getResults() });
    },

    remove(startedAt) {
      db_removeResult(startedAt);
      set({ records: db_getResults() });
    },

    clear() {
      db_clearResults();
      set({ records: [] });
    },

    exportAndDownload() {
      const csv = exportCSV(get().records);
      downloadCSV(csv);
    },
  };
});
