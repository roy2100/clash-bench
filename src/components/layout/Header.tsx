import { useState } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import { useModeStore } from '../../store/modeStore';
import { DEFAULT_THROUGHPUT_URL } from '../../types';

export function Header() {
  const { apiBase, apiSecret, status, errorMsg, setConfig, connect, disconnect } = useConnectionStore();
  const { config, updateConfig } = useModeStore();
  const [showConfig, setShowConfig] = useState(false);
  const [localBase, setLocalBase] = useState(apiBase);
  const [localSecret, setLocalSecret] = useState(apiSecret);

  const statusColors = {
    idle: 'text-gray-400',
    connecting: 'text-yellow-500',
    connected: 'text-green-600',
    error: 'text-red-500',
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
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-300 bg-[#f5f7fa]">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_12px_#00d4ff60]" />
        <span className="font-mono font-bold text-gray-900 tracking-wider text-sm uppercase">
          Clash Bench
        </span>
        <span className="text-gray-400 text-xs font-mono">v0.1</span>
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
            <span className="text-xs text-gray-400 font-mono truncate max-w-32">{apiBase}</span>
          )}
        </button>

        {status === 'connected' ? (
          <button
            onClick={disconnect}
            className="text-xs text-gray-400 hover:text-gray-700 font-mono border border-gray-200 hover:border-gray-300 rounded px-2 py-1 transition-colors"
          >
            断开
          </button>
        ) : (
          <button
            onClick={() => setShowConfig(true)}
            className="text-xs text-cyan-700 hover:text-cyan-600 font-mono border border-cyan-600/40 hover:border-cyan-600/60 rounded px-2 py-1 transition-colors"
          >
            连接
          </button>
        )}
      </div>

      {showConfig && (
        <div className="absolute top-14 right-6 z-50 bg-white border border-gray-200 rounded-xl p-4 w-80 shadow-2xl shadow-gray-300/50">
          <div className="text-sm font-mono text-gray-600 mb-3">Mihomo Controller</div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 font-mono mb-1 block">API Base URL</label>
              <input
                type="text"
                value={localBase}
                onChange={e => setLocalBase(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono outline-none focus:border-cyan-600/60"
                placeholder="http://127.0.0.1:9090"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-mono mb-1 block">Secret (可选)</label>
              <input
                type="password"
                value={localSecret}
                onChange={e => setLocalSecret(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono outline-none focus:border-cyan-600/60"
                placeholder="API Secret"
              />
            </div>

            {status === 'error' && (
              <div className="text-xs text-red-500 font-mono bg-red-50 border border-red-200 rounded p-2">
                {errorMsg}
              </div>
            )}

            <div className="border-t border-gray-200 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">带宽测试 Phase 3</span>
                <button
                  onClick={() => updateConfig({
                    throughputEnabled: !config.throughputEnabled,
                    ...(!config.throughputEnabled && !config.throughputUrl ? { throughputUrl: DEFAULT_THROUGHPUT_URL } : {}),
                  })}
                  className={`relative w-8 h-4 rounded-full transition-colors ${config.throughputEnabled ? 'bg-cyan-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${config.throughputEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {config.throughputEnabled && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 font-mono mb-1 block">下载测速 URL</label>
                    <input
                      type="text"
                      value={config.throughputUrl ?? ''}
                      onChange={e => updateConfig({ throughputUrl: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono outline-none focus:border-cyan-600/60"
                      placeholder="https://speed.cloudflare.com/__down?bytes=10000000"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-mono mb-1 block">代理组名称</label>
                    <input
                      type="text"
                      value={config.throughputGroupName ?? ''}
                      onChange={e => updateConfig({ throughputGroupName: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 font-mono outline-none focus:border-cyan-600/60"
                      placeholder="GLOBAL 或 Proxy"
                    />
                    <p className="text-[10px] text-gray-400 font-mono mt-1">
                      测速前自动切换该组至被测节点，完成后还原。需 Mihomo 已设为系统代理。
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConnect}
                disabled={status === 'connecting'}
                className="flex-1 bg-cyan-600/10 hover:bg-cyan-600/15 border border-cyan-600/40 text-cyan-700 text-sm font-mono rounded py-2 transition-colors disabled:opacity-50"
              >
                {status === 'connecting' ? '连接中...' : '连接'}
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded py-2 transition-colors"
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
