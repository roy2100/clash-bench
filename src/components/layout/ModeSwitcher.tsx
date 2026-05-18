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
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl border border-gray-300">
      {MODES.map(m => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          className={`relative flex flex-col items-center px-5 py-2 rounded-lg transition-all duration-200 ${
            mode === m.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {mode === m.key && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-cyan-600/8 to-transparent" />
          )}
          <span className="relative text-sm font-mono font-bold tracking-wide">{m.label}</span>
          <span className="relative text-xs text-gray-500 mt-0.5">{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
