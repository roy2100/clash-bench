import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionStore } from '../../store/connectionStore';
import { ProxyPicker } from '../../components/shared/ProxyPicker';
import { useSingleBench } from './useSingleBench';
import { RunningStage } from './RunningStage';
import { ResultStage } from './ResultStage';
import { useModeStore } from '../../store/modeStore';

export function SingleRunView() {
  const { status, proxies } = useConnectionStore();
  const { config } = useModeStore();
  const {
    stage,
    selectedProxy,
    liveData,
    result,
    setSelectedProxy,
    setSelectedType,
    start,
    abort,
    reset,
  } = useSingleBench();

  if (status !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <div className="w-12 h-12 rounded-lg border border-fs-1 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-sm bg-ff-4" />
        </div>
        <div className="text-ff-2 font-semibold text-sm">请先连接 Mihomo 控制器</div>
        <div className="text-ff-4 text-xs">点击右上角「连接」按钮配置 API 地址</div>
      </div>
    );
  }

  const totalSec = Math.round(
    (config.phase1Rounds * config.phase1IntervalMs + config.phase2Rounds * config.phase2IntervalMs) / 1000
  );

  return (
    <div className="h-full relative">
      <AnimatePresence mode="wait">
        {stage === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex"
          >
            {/* Left: node picker */}
            <div className="w-64 flex-shrink-0 p-5 border-r border-fs-1 flex flex-col gap-4">
              <div className="text-xs font-semibold text-ff-2 uppercase tracking-wide">选择节点</div>
              <div className="flex-1">
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
            </div>

            {/* Right: run panel */}
            <div className="flex-1 flex flex-col items-center justify-center gap-7 px-12">
              {/* Title block */}
              <div className="text-center">
                <div className="text-2xl font-semibold text-ff-1 mb-1.5">Single Run</div>
                <div className="text-sm text-ff-3">
                  约 {totalSec} 秒完成 Phase 1 + 2，得出标准化跑分
                </div>
              </div>

              {/* Selected node */}
              {selectedProxy && (
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-ff-4 uppercase tracking-wider mb-1">已选节点</div>
                  <div className="text-base font-semibold text-ff-1">{selectedProxy}</div>
                </div>
              )}

              {/* RUN button */}
              <motion.button
                onClick={start}
                disabled={!selectedProxy}
                whileHover={selectedProxy ? { scale: 1.03 } : {}}
                whileTap={selectedProxy ? { scale: 0.97 } : {}}
                className={`w-36 h-36 rounded-full font-semibold text-xl tracking-widest transition-colors duration-200 ${
                  selectedProxy
                    ? 'text-brand border-2 border-brand/50 bg-brand/6 hover:bg-brand/10 hover:border-brand/70 cursor-pointer'
                    : 'text-ff-4 border-2 border-fs-1 cursor-not-allowed'
                }`}
              >
                RUN
              </motion.button>

              {/* Config meta */}
              <div className="text-center space-y-1">
                <div className="text-xs text-ff-3">
                  Phase 1: {config.phase1Rounds} 轮 × {config.phase1IntervalMs}ms
                  <span className="mx-2 text-ff-4">·</span>
                  Phase 2: {config.phase2Rounds} 轮 × {config.phase2IntervalMs}ms
                </div>
                <div className="text-xs text-ff-4">总测试时间约 {totalSec} 秒</div>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'running' && (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <RunningStage
              proxyName={selectedProxy}
              liveData={liveData}
              onAbort={abort}
            />
          </motion.div>
        )}

        {stage === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <ResultStage
              result={result}
              onRunAgain={reset}
              onSaveToHistory={() => {}}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
