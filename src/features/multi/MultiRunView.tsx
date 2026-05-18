import { useConnectionStore } from '../../store/connectionStore';
import { ProxyPicker } from '../../components/shared/ProxyPicker';
import { Leaderboard } from './Leaderboard';
import { useMultiBench } from './useMultiBench';
import { downloadCSV, exportCSV } from '../../lib/export';

export function MultiRunView() {
  const { status, proxies } = useConnectionStore();
  const { selectedProxies, setSelectedProxies, state, start, abort, reset } = useMultiBench();

  if (status !== 'connected') {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 font-mono text-sm">
        请先连接 Mihomo 控制器
      </div>
    );
  }

  const completedNames = new Set(state.results.map(r => r.proxyName));
  const pendingProxies = selectedProxies.filter(
    n => !completedNames.has(n) && n !== state.currentProxy
  );

  return (
    <div className="h-full flex">
      {/* Left: proxy picker (only in idle) */}
      {state.status === 'idle' && (
        <div className="w-72 flex-shrink-0 p-6 border-r border-gray-300 flex flex-col">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
            选择节点（多选）
          </div>
          <div className="flex-1">
            <ProxyPicker
              proxies={proxies}
              selected={selectedProxies}
              multiSelect
              onChange={setSelectedProxies}
            />
          </div>
        </div>
      )}

      {/* Right: main content */}
      <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-mono font-bold text-gray-900">Multi Run</div>
            {state.status === 'running' && (
              <div className="text-xs text-gray-400 font-mono">
                节点 {state.currentIdx + 1}/{state.totalProxies} · 当前: {state.currentProxy}
              </div>
            )}
            {state.status === 'done' && (
              <div className="text-xs text-green-400 font-mono">
                全部完成 · {state.results.length} 个节点
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {state.status === 'idle' && (
              <button
                onClick={start}
                disabled={selectedProxies.length === 0}
                className="px-6 py-2 font-mono text-sm font-bold text-cyan-700 bg-cyan-600/10 hover:bg-cyan-600/15 border border-cyan-600/40 rounded-lg disabled:opacity-30 transition-colors"
              >
                开始测试 ({selectedProxies.length} 节点)
              </button>
            )}
            {state.status === 'running' && (
              <button
                onClick={abort}
                className="px-4 py-2 font-mono text-sm text-red-400/70 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 rounded-lg transition-colors"
              >
                中止
              </button>
            )}
            {state.status === 'done' && (
              <>
                <button
                  onClick={() => downloadCSV(exportCSV(state.results))}
                  className="px-4 py-2 font-mono text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                >
                  导出 CSV
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 font-mono text-sm text-cyan-700 border border-cyan-600/30 hover:border-cyan-600/50 rounded-lg transition-colors"
                >
                  再来一次
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {state.status === 'running' && (
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-600 rounded-full transition-all duration-500"
              style={{ width: `${(state.currentIdx / state.totalProxies) * 100}%` }}
            />
          </div>
        )}

        {/* Leaderboard */}
        {(state.status !== 'idle') && (
          <div className="flex-1 overflow-y-auto">
            <Leaderboard
              results={state.results}
              currentProxy={state.currentProxy}
              pendingProxies={pendingProxies}
            />
          </div>
        )}

        {state.status === 'idle' && selectedProxies.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-300 font-mono text-sm">
            从左侧选择节点后点击开始
          </div>
        )}
        {state.status === 'idle' && selectedProxies.length > 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-mono text-sm">
            已选 {selectedProxies.length} 个节点，每节点约 20 秒
          </div>
        )}
      </div>
    </div>
  );
}
