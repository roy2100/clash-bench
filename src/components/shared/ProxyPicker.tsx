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
          className="flex-1 bg-fn-1 border border-fs-1 rounded px-3 py-1.5 text-sm text-ff-1 placeholder-ff-4 outline-none focus:border-brand transition-colors"
        />
        {multiSelect && (
          <div className="flex gap-1">
            <button
              onClick={selectAll}
              className="px-2 py-1 text-xs text-ff-3 hover:text-ff-1 border border-fs-1 hover:border-fs-2 rounded transition-colors"
            >
              全选
            </button>
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs text-ff-3 hover:text-ff-1 border border-fs-1 hover:border-fs-2 rounded transition-colors"
            >
              清空
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-ff-4">
        {filtered.length} 个节点{multiSelect && selected.length > 0 ? ` · 已选 ${selected.length}` : ''}
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1" style={{ maxHeight: 320 }}>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-ff-4 text-sm">无匹配节点</div>
        ) : (
          filtered.map(proxy => {
            const isSelected = selected.includes(proxy.name);
            return (
              <button
                key={proxy.name}
                onClick={() => toggle(proxy.name)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${
                  isSelected
                    ? 'bg-brand/8 border border-brand/25 text-ff-1'
                    : 'border border-transparent text-ff-2 hover:bg-fn-3 hover:text-ff-1'
                }`}
              >
                {multiSelect && (
                  <div className={`w-4 h-4 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-brand border-brand' : 'border-fs-2'
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>{proxy.name}</div>
                </div>
                <div className={`text-xs flex-shrink-0 font-mono ${isSelected ? 'text-brand/70' : 'text-ff-4'}`}>
                  {proxy.type}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
