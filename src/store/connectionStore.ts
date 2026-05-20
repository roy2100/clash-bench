import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClashAPI } from '../api/clash';
import type { Proxy } from '../types';

interface ConnectionStore {
  apiBase: string;
  apiSecret: string;
  configLabel: string;
  wasConnected: boolean;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  errorMsg: string;
  proxies: Proxy[];
  api: ClashAPI | null;
  setConfig: (base: string, secret: string, label: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      apiBase: 'http://127.0.0.1:9090',
      apiSecret: '',
      configLabel: '',
      wasConnected: false,
      status: 'idle',
      errorMsg: '',
      proxies: [],
      api: null,

      setConfig(base, secret, label) {
        set({ apiBase: base, apiSecret: secret, configLabel: label, status: 'idle', errorMsg: '' });
      },

      async connect() {
        const { apiBase, apiSecret } = get();
        set({ status: 'connecting', errorMsg: '', proxies: [] });
        try {
          const api = new ClashAPI(apiBase, apiSecret);
          await api.getVersion();
          const proxies = await api.getProxies();
          set({ api, proxies, status: 'connected', wasConnected: true });
        } catch (e) {
          set({
            status: 'error',
            errorMsg: e instanceof Error ? e.message : 'Connection failed',
            api: null,
            wasConnected: false,
          });
        }
      },

      disconnect() {
        set({ status: 'idle', api: null, proxies: [], errorMsg: '', wasConnected: false });
      },
    }),
    {
      name: 'clash-bench-connection',
      partialize: (state) => ({
        apiBase: state.apiBase,
        apiSecret: state.apiSecret,
        configLabel: state.configLabel,
        wasConnected: state.wasConnected,
      }),
    }
  )
);
