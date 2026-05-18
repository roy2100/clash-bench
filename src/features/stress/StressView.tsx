import { useConnectionStore } from '../../store/connectionStore';
import { ProxyPicker } from '../../components/shared/ProxyPicker';
import { ScoreTimeline } from '../../components/charts/ScoreTimeline';
import { useStressBench } from './useStressBench';

const DURATIONS = [10, 30, 60];

export function StressView() {
  const { status, proxies } = useConnectionStore();
  const {
    selectedProxy, durationMin,
    setSelectedProxy, setSelectedType, setDurationMin,
    state, start, abort, reset, analysis,
  } = useStressBench();

  if (status !== 'connected') {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 font-mono text-sm">
        请先连接 Mihomo 控制器
      </div>
    );
  }

  const timelinePoints = state.rounds.map(r => ({ time: r.time, score: r.score }));

  return (
    <div className="h-full flex">
      {/* Left: config */}
      {state.status === 'idle' && (
        <div className="w-72 flex-shrink-0 p-6 border-r border-gray-300 flex flex-col gap-4">
          <div>
            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">选择节点</div>
            <ProxyPicker
              proxies={proxies}
              selected={selectedProxy ? [selectedProxy] : []}
              multiSelect={false}
              onChange={([name]) => {
                const proxy = proxies.find(p => p.name === name);
                setSelectedProxy(name ?? '');
                setSelectedType(proxy?.type ?? '');
              }}
            />
          </div>

          <div>
            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">测试时长</div>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDurationMin(d)}
                  className={`flex-1 py-2 text-sm font-mono rounded-lg border transition-colors ${
                    durationMin === d
                      ? 'bg-cyan-600/10 border-cyan-600/40 text-cyan-700'
                      : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={start}
            disabled={!selectedProxy}
            className="mt-auto py-3 font-mono text-sm font-bold text-cyan-700 bg-cyan-600/10 hover:bg-cyan-600/15 border border-cyan-600/40 rounded-lg disabled:opacity-30 transition-colors"
          >
            开始拷机
          </button>
        </div>
      )}

      {/* Right: timeline */}
      <div className="flex-1 flex flex-col p-6 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-mono font-bold text-gray-900">Stress Test</div>
            {state.status === 'running' && (
              <div className="text-xs text-yellow-400 font-mono">
                第 {state.currentRound} 轮 · {selectedProxy}
              </div>
            )}
            {state.status === 'done' && (
              <div className="text-xs text-green-400 font-mono">拷机完成 · {state.rounds.length} 轮</div>
            )}
          </div>
          {state.status === 'running' && (
            <button onClick={abort} className="px-4 py-2 text-sm font-mono text-red-400/70 hover:text-red-400 border border-red-400/20 rounded-lg">中止</button>
          )}
          {state.status === 'done' && (
            <button onClick={reset} className="px-4 py-2 text-sm font-mono text-cyan-700 border border-cyan-600/30 rounded-lg">重置</button>
          )}
        </div>

        {/* Chart — fixed height so analysis cards stay visible */}
        {state.rounds.length > 0 && (
          <div
            className="bg-white border border-gray-200 rounded-xl p-4"
            style={{ height: analysis ? 'calc(100vh - 340px)' : 'calc(100vh - 220px)', minHeight: 220 }}
          >
            <ScoreTimeline points={timelinePoints} />
          </div>
        )}

        {/* Analysis */}
        {analysis && (
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: '平均分', value: Math.round(analysis.avg).toLocaleString(), color: undefined },
              { label: '最高分', value: analysis.max.toLocaleString(), color: '#00e676' },
              { label: '最低分', value: analysis.min.toLocaleString(), color: '#ff9800' },
              {
                label: '衰减',
                value: `${analysis.decay.toFixed(1)}%`,
                color: analysis.decay > 30 ? '#ff4444' : analysis.decay > 15 ? '#ff9800' : '#00e676',
              },
              {
                label: '波动 σ',
                value: Math.round(analysis.stddev).toLocaleString(),
                color: analysis.stddev > 500 ? '#ff9800' : undefined,
              },
            ].map(item => (
              <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{item.label}</div>
                <div className="text-lg font-mono font-bold mt-1" style={{ color: item.color ?? '#1c2333' }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {state.status === 'idle' && (
          <div className="flex-1 flex items-center justify-center text-gray-300 font-mono text-sm">
            选择节点和时长后开始拷机
          </div>
        )}
      </div>
    </div>
  );
}
