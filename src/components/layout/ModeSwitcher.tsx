import { useModeStore } from '../../store/modeStore';
import type { AppMode } from '../../types';

const MODES: { key: AppMode; label: string; desc: string }[] = [
  { key: 'single', label: 'Single Run', desc: '单节点跑分' },
  { key: 'multi', label: 'Multi Run', desc: '天梯榜' },
  { key: 'stress', label: 'Stress Test', desc: '拷机模式' },
];

export function ModeSwitcher() {
  const { mode, setMode } = useModeStore();

  return (
    <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.04]">
      {MODES.map(m => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          className={`relative flex flex-col items-center px-5 py-2 rounded-lg transition-all duration-200 ${
            mode === m.key
              ? 'bg-white/[0.08] text-white shadow-inner'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          {mode === m.key && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-cyan-500/10 to-transparent" />
          )}
          <span className="relative text-sm font-mono font-bold tracking-wide">{m.label}</span>
          <span className="relative text-xs text-white/30 mt-0.5">{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
