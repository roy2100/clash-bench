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
    <div className="flex">
      {MODES.map(m => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          className={`relative flex flex-col items-start px-4 py-3 transition-colors ${
            mode === m.key ? 'text-brand' : 'text-ff-3 hover:text-ff-1'
          }`}
        >
          <span className="text-sm font-semibold leading-tight">{m.label}</span>
          <span className={`text-xs leading-tight mt-0.5 ${mode === m.key ? 'text-brand/70' : 'text-ff-4'}`}>
            {m.desc}
          </span>
          {mode === m.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
          )}
        </button>
      ))}
    </div>
  );
}
