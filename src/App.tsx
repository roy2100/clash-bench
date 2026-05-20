import './index.css';
import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { ModeSwitcher } from './components/layout/ModeSwitcher';
import { useModeStore } from './store/modeStore';
import { useConnectionStore } from './store/connectionStore';
import { SingleRunView } from './features/single/SingleRunView';
import { MultiRunView } from './features/multi/MultiRunView';
import { StressView } from './features/stress/StressView';
import { HistoryView } from './features/history/HistoryView';

type Tab = 'bench' | 'history';

export default function App() {
  const { mode } = useModeStore();
  const [tab, setTab] = useState<Tab>('bench');
  const { wasConnected, connect } = useConnectionStore();

  useEffect(() => {
    if (wasConnected) connect();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-fn-2 text-ff-1 overflow-hidden">
      <Header />

      <div className="flex items-center justify-between px-6 py-0 border-b border-fs-1 bg-fn-1">
        <ModeSwitcher />
        <div className="flex">
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
      className={`relative px-4 py-3 text-sm transition-colors ${
        active ? 'text-brand font-semibold' : 'text-ff-3 hover:text-ff-1'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
      )}
    </button>
  );
}
