import { useState } from 'react';
import { useConnectionStore } from '../../store/connectionStore';

export function Header() {
  const { apiBase, apiSecret, status, errorMsg, setConfig, connect, disconnect } = useConnectionStore();
  const [showConfig, setShowConfig] = useState(false);
  const [localBase, setLocalBase] = useState(apiBase);
  const [localSecret, setLocalSecret] = useState(apiSecret);

  const statusColors = {
    idle: 'text-white/40',
    connecting: 'text-yellow-400',
    connected: 'text-green-400',
    error: 'text-red-400',
  };

  const statusLabels = {
    idle: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    error: '连接失败',
  };

  const handleConnect = () => {
    setConfig(localBase, localSecret);
    connect();
    setShowConfig(false);
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04] bg-[#050810]">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_12px_#00d4ff60]" />
        <span className="font-mono font-bold text-white tracking-wider text-sm uppercase">
          Clash Bench
        </span>
        <span className="text-white/20 text-xs font-mono">v0.1</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 text-sm"
        >
          <span className={`text-xs font-mono ${statusColors[status]}`}>
            ● {statusLabels[status]}
          </span>
          {status === 'connected' && (
            <span className="text-xs text-white/30 font-mono truncate max-w-32">{apiBase}</span>
          )}
        </button>

        {status === 'connected' ? (
          <button
            onClick={disconnect}
            className="text-xs text-white/30 hover:text-white/60 font-mono border border-white/10 hover:border-white/20 rounded px-2 py-1 transition-colors"
          >
            断开
          </button>
        ) : (
          <button
            onClick={() => setShowConfig(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono border border-cyan-500/30 hover:border-cyan-400/50 rounded px-2 py-1 transition-colors"
          >
            连接
          </button>
        )}
      </div>

      {showConfig && (
        <div className="absolute top-14 right-6 z-50 bg-[#0a0f1a] border border-white/10 rounded-xl p-4 w-80 shadow-2xl shadow-black/50">
          <div className="text-sm font-mono text-white/70 mb-3">Mihomo Controller</div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 font-mono mb-1 block">API Base URL</label>
              <input
                type="text"
                value={localBase}
                onChange={e => setLocalBase(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono outline-none focus:border-cyan-500/50"
                placeholder="http://127.0.0.1:9090"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 font-mono mb-1 block">Secret (可选)</label>
              <input
                type="password"
                value={localSecret}
                onChange={e => setLocalSecret(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono outline-none focus:border-cyan-500/50"
                placeholder="API Secret"
              />
            </div>

            {status === 'error' && (
              <div className="text-xs text-red-400 font-mono bg-red-400/10 rounded p-2">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConnect}
                disabled={status === 'connecting'}
                className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 text-sm font-mono rounded py-2 transition-colors disabled:opacity-50"
              >
                {status === 'connecting' ? '连接中...' : '连接'}
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 text-sm text-white/40 hover:text-white/60 border border-white/10 rounded py-2 transition-colors"
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
