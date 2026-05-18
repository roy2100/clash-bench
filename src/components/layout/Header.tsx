import { useState } from 'react';
import { useConnectionStore } from '../../store/connectionStore';

export function Header() {
  const { apiBase, apiSecret, configLabel, status, errorMsg, setConfig, connect, disconnect } = useConnectionStore();
  const [showConfig, setShowConfig] = useState(false);
  const [localBase, setLocalBase] = useState(apiBase);
  const [localSecret, setLocalSecret] = useState(apiSecret);
  const [localLabel, setLocalLabel] = useState(configLabel);

  const statusDot: Record<string, string> = {
    idle: 'bg-ff-4',
    connecting: 'bg-yellow-500',
    connected: 'bg-green-600',
    error: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    idle: '未连接',
    connecting: '连接中…',
    connected: '已连接',
    error: '连接失败',
  };

  const handleConnect = () => {
    setConfig(localBase, localSecret, localLabel);
    connect();
    setShowConfig(false);
  };

  return (
    <header className="flex items-center justify-between px-6 py-2.5 border-b border-fs-1 bg-fn-1">
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-sm bg-brand flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="4" height="4" rx="0.5" fill="white" opacity="0.9" />
            <rect x="7" y="1" width="4" height="4" rx="0.5" fill="white" opacity="0.6" />
            <rect x="1" y="7" width="4" height="4" rx="0.5" fill="white" opacity="0.6" />
            <rect x="7" y="7" width="4" height="4" rx="0.5" fill="white" opacity="0.9" />
          </svg>
        </div>
        <span className="font-semibold text-ff-1 text-sm tracking-tight">Clash Bench</span>
        <span className="text-ff-4 text-xs font-mono">v0.1</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 text-sm"
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
          <span className="text-xs text-ff-3">{statusLabels[status]}</span>
          {status === 'connected' && (
            <>
              {configLabel && (
                <span className="text-xs text-ff-2 font-medium">{configLabel}</span>
              )}
              <span className="text-xs text-ff-4 font-mono truncate max-w-32">{apiBase}</span>
            </>
          )}
        </button>

        {status === 'connected' ? (
          <button
            onClick={disconnect}
            className="text-xs text-ff-3 hover:text-ff-1 border border-fs-1 hover:border-fs-2 rounded px-2.5 py-1 transition-colors"
          >
            断开
          </button>
        ) : (
          <button
            onClick={() => setShowConfig(true)}
            className="text-xs text-brand hover:text-brand-hover border border-brand/40 hover:border-brand/70 rounded px-2.5 py-1 transition-colors bg-brand-light/0 hover:bg-brand-light"
          >
            连接
          </button>
        )}
      </div>

      {showConfig && (
        <div className="absolute top-12 right-6 z-50 bg-fn-1 border border-fs-1 rounded-xl p-4 w-76 shadow-f16">
          <div className="text-sm font-semibold text-ff-1 mb-3">Mihomo Controller</div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-ff-3 mb-1 block">API Base URL</label>
              <input
                type="text"
                value={localBase}
                onChange={e => setLocalBase(e.target.value)}
                className="w-full bg-fn-1 border border-fs-1 rounded px-3 py-1.5 text-sm text-ff-1 font-mono outline-none focus:border-brand transition-colors"
                placeholder="http://127.0.0.1:9090"
              />
            </div>
            <div>
              <label className="text-xs text-ff-3 mb-1 block">Secret（可选）</label>
              <input
                type="password"
                value={localSecret}
                onChange={e => setLocalSecret(e.target.value)}
                className="w-full bg-fn-1 border border-fs-1 rounded px-3 py-1.5 text-sm text-ff-1 font-mono outline-none focus:border-brand transition-colors"
                placeholder="API Secret"
              />
            </div>
            <div>
              <label className="text-xs text-ff-3 mb-1 block">配置名称（可选）</label>
              <input
                type="text"
                value={localLabel}
                onChange={e => setLocalLabel(e.target.value)}
                className="w-full bg-fn-1 border border-fs-1 rounded px-3 py-1.5 text-sm text-ff-1 outline-none focus:border-brand transition-colors"
                placeholder="机场A、自建节点…"
              />
            </div>

            {status === 'error' && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConnect}
                disabled={status === 'connecting'}
                className="flex-1 bg-brand hover:bg-brand-hover text-white text-sm rounded py-1.5 transition-colors disabled:opacity-50"
              >
                {status === 'connecting' ? '连接中…' : '连接'}
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 text-sm text-ff-3 hover:text-ff-1 border border-fs-1 hover:border-fs-2 rounded py-1.5 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
