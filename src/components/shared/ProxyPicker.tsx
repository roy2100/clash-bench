import { useState } from 'react';
import type { Proxy } from '../../types';

interface ProxyPickerProps {
  proxies: Proxy[];
  selected: string[];
  multiSelect?: boolean;
  onChange: (selected: string[]) => void;
}

export function ProxyPicker({ proxies, selected, multiSelect = false, onChange }: ProxyPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = proxies.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (name: string) => {
    if (multiSelect) {
      onChange(selected.includes(name) ? selected.filter(n => n !== name) : [...selected, name]);
    } else {
      onChange([name]);
    }
  };

  const selectAll = () => onChange(filtered.map(p => p.name));
  const clearAll = () => onChange([]);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="搜索节点..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 font-sans"
        />
        {multiSelect && (
          <div className="flex gap-1">
            <button
              onClick={selectAll}
              className="px-2 py-1 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded transition-colors"
            >
              全选
            </button>
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded transition-colors"
            >
              清空
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-white/30 font-mono">
        {filtered.length} 个节点{multiSelect && selected.length > 0 ? ` · 已选 ${selected.length}` : ''}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1" style={{ maxHeight: 320 }}>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">无匹配节点</div>
        ) : (
          filtered.map(proxy => {
            const isSelected = selected.includes(proxy.name);
            return (
              <button
                key={proxy.name}
                onClick={() => toggle(proxy.name)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                    : 'bg-white/[0.02] border border-transparent text-white/60 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                {multiSelect && (
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'bg-cyan-400 border-cyan-400' : 'border-white/20'
                  }`}>
                    {isSelected && <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8L2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono truncate">{proxy.name}</div>
                </div>
                <div className="text-xs text-white/30 flex-shrink-0 font-mono">{proxy.type}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
