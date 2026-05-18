import './index.css';
import { useState } from 'react';
import { Header } from './components/layout/Header';
import { ModeSwitcher } from './components/layout/ModeSwitcher';
import { useModeStore } from './store/modeStore';
import { SingleRunView } from './features/single/SingleRunView';
import { MultiRunView } from './features/multi/MultiRunView';
import { StressView } from './features/stress/StressView';
import { HistoryView } from './features/history/HistoryView';

type Tab = 'bench' | 'history';

export default function App() {
  const { mode } = useModeStore();
  const [tab, setTab] = useState<Tab>('bench');

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa] text-gray-900 overflow-hidden">
      <Header />

      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-300">
        <ModeSwitcher />
        <div className="flex gap-1">
          <TabBtn label="跑分" active={tab === 'bench'} onClick={() => setTab('bench')} />
          <TabBtn label="历史" active={tab === 'history'} onClick={() => setTab('history')} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'bench' ? (
          <>
            {mode === 'single' && <SingleRunView />}
            {mode === 'multi' && <MultiRunView />}
            {mode === 'stress' && <StressView />}
          </>
        ) : (
          <HistoryView />
        )}
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-mono rounded-lg transition-colors ${
        active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}
