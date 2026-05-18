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
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <div className="text-ff-2 font-semibold text-sm">请先连接 Mihomo 控制器</div>
      </div>
    );
  }

  const completedNames = new Set(state.results.map(r => r.proxyName));
  const pendingProxies = selectedProxies.filter(
    n => !completedNames.has(n) && n !== state.currentProxy
  );

  return (
    <div className="h-full flex">
      {state.status === 'idle' && (
        <div className="w-64 flex-shrink-0 p-5 border-r border-fs-1 flex flex-col gap-4">
          <div className="text-xs font-semibold text-ff-2 uppercase tracking-wide">选择节点（多选）</div>
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

      <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-ff-1">Multi Run</div>
            {state.status === 'running' && (
              <div className="text-xs text-ff-3 mt-0.5">
                节点 {state.currentIdx + 1}/{state.totalProxies} · {state.currentProxy}
              </div>
            )}
            {state.status === 'done' && (
              <div className="text-xs text-green-600 mt-0.5">
                全部完成 · {state.results.length} 个节点
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {state.status === 'idle' && (
              <button
                onClick={start}
                disabled={selectedProxies.length === 0}
                className="px-5 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded disabled:opacity-30 transition-colors"
              >
                开始测试（{selectedProxies.length} 节点）
              </button>
            )}
            {state.status === 'running' && (
              <button
                onClick={abort}
                className="px-4 py-2 text-sm text-red-500/70 hover:text-red-600 border border-red-400/20 hover:border-red-400/50 rounded transition-colors"
              >
                中止
              </button>
            )}
            {state.status === 'done' && (
              <>
                <button
                  onClick={() => downloadCSV(exportCSV(state.results))}
                  className="px-4 py-2 text-sm text-ff-3 hover:text-ff-1 border border-fs-1 hover:border-fs-2 rounded transition-colors"
                >
                  导出 CSV
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm text-brand hover:text-brand-hover border border-brand/30 hover:border-brand/60 rounded transition-colors"
                >
                  再来一次
                </button>
              </>
            )}
          </div>
        </div>

        {state.status === 'running' && (
          <div className="h-1 bg-fn-3 rounded-sm overflow-hidden">
            <div
              className="h-full bg-brand rounded-sm transition-all duration-500"
              style={{ width: `${(state.currentIdx / state.totalProxies) * 100}%` }}
            />
          </div>
        )}

        {state.status !== 'idle' && (
          <div className="flex-1 overflow-y-auto">
            <Leaderboard
              results={state.results}
              currentProxy={state.currentProxy}
              pendingProxies={pendingProxies}
            />
          </div>
        )}

        {state.status === 'idle' && selectedProxies.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-ff-4 text-sm">
            从左侧选择节点后点击开始
          </div>
        )}
        {state.status === 'idle' && selectedProxies.length > 0 && (
          <div className="flex-1 flex items-center justify-center text-ff-3 text-sm">
            已选 {selectedProxies.length} 个节点，每节点约 20 秒
          </div>
        )}
      </div>
    </div>
  );
}
