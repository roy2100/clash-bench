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
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <div className="text-ff-2 font-semibold text-sm">请先连接 Mihomo 控制器</div>
      </div>
    );
  }

  const timelinePoints = state.rounds.map(r => ({ time: r.time, score: r.score }));

  return (
    <div className="h-full flex">
      {state.status === 'idle' && (
        <div className="w-64 flex-shrink-0 p-5 border-r border-fs-1 flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-ff-2 uppercase tracking-wide mb-3">选择节点</div>
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
            <div className="text-xs font-semibold text-ff-2 uppercase tracking-wide mb-2">测试时长</div>
            <div className="flex gap-1.5">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDurationMin(d)}
                  className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
                    durationMin === d
                      ? 'bg-brand/8 border-brand/30 text-brand font-semibold'
                      : 'border-fs-1 text-ff-3 hover:text-ff-1 hover:border-fs-2'
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
            className="mt-auto py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded disabled:opacity-30 transition-colors"
          >
            开始拷机
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col p-6 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-ff-1">Stress Test</div>
            {state.status === 'running' && (
              <div className="text-xs text-ff-3 mt-0.5">
                第 {state.currentRound} 轮 · {selectedProxy}
              </div>
            )}
            {state.status === 'done' && (
              <div className="text-xs text-green-600 mt-0.5">
                拷机完成 · {state.rounds.length} 轮
              </div>
            )}
          </div>
          {state.status === 'running' && (
            <button
              onClick={abort}
              className="px-4 py-2 text-sm text-red-500/70 hover:text-red-600 border border-red-400/20 hover:border-red-400/50 rounded transition-colors"
            >
              中止
            </button>
          )}
          {state.status === 'done' && (
            <button
              onClick={reset}
              className="px-4 py-2 text-sm text-brand hover:text-brand-hover border border-brand/30 hover:border-brand/60 rounded transition-colors"
            >
              重置
            </button>
          )}
        </div>

        {state.rounds.length > 0 && (
          <div
            className="bg-fn-1 border border-fs-1 rounded-lg p-4 shadow-f2"
            style={{ height: analysis ? 'calc(100vh - 340px)' : 'calc(100vh - 220px)', minHeight: 220 }}
          >
            <ScoreTimeline points={timelinePoints} />
          </div>
        )}

        {analysis && (
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: '平均分',  value: Math.round(analysis.avg).toLocaleString(), color: undefined },
              { label: '最高分',  value: analysis.max.toLocaleString(),             color: '#38b000' },
              { label: '最低分',  value: analysis.min.toLocaleString(),             color: '#f76707' },
              {
                label: '衰减',
                value: `${analysis.decay.toFixed(1)}%`,
                color: analysis.decay > 30 ? '#e03131' : analysis.decay > 15 ? '#f76707' : '#38b000',
              },
              {
                label: '波动 σ',
                value: Math.round(analysis.stddev).toLocaleString(),
                color: analysis.stddev > 500 ? '#f76707' : undefined,
              },
            ].map(item => (
              <div key={item.label} className="bg-fn-1 border border-fs-1 rounded-lg p-3 shadow-f2">
                <div className="text-[10px] text-ff-4 uppercase tracking-wider">{item.label}</div>
                <div
                  className="text-base font-mono font-semibold mt-1"
                  style={{ color: item.color ?? '#242424' }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {state.status === 'idle' && (
          <div className="flex-1 flex items-center justify-center text-ff-4 text-sm">
            选择节点和时长后开始拷机
          </div>
        )}
      </div>
    </div>
  );
}
