import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionStore } from '../../store/connectionStore';
import { ProxyPicker } from '../../components/shared/ProxyPicker';
import { useSingleBench } from './useSingleBench';
import { RunningStage } from './RunningStage';
import { ResultStage } from './ResultStage';

export function SingleRunView() {
  const { status, proxies } = useConnectionStore();
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
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        </div>
        <div className="text-gray-400 font-mono text-sm">请先连接 Mihomo 控制器</div>
        <div className="text-gray-300 text-xs font-sans">点击右上角「连接」按钮配置 API 地址</div>
      </div>
    );
  }

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
            <div className="w-72 flex-shrink-0 p-6 border-r border-gray-300 flex flex-col">
              <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
                选择节点
              </div>
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
            <div className="flex-1 flex flex-col items-center justify-center gap-8 px-12">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-gray-900 mb-2">Single Run</div>
                <div className="text-gray-400 text-sm font-sans">
                  约 60 秒完成 Phase 1 + 2，得出标准化跑分
                </div>
              </div>

              {selectedProxy && (
                <div className="text-center">
                  <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1">已选节点</div>
                  <div className="text-gray-900 font-mono">{selectedProxy}</div>
                </div>
              )}

              <motion.button
                onClick={start}
                disabled={!selectedProxy}
                whileHover={selectedProxy ? { scale: 1.04 } : {}}
                whileTap={selectedProxy ? { scale: 0.97 } : {}}
                className={`relative w-40 h-40 rounded-full font-mono font-bold text-2xl uppercase tracking-widest transition-all duration-300 ${
                  selectedProxy
                    ? 'text-gray-900 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                style={selectedProxy ? {
                  background: 'radial-gradient(circle at center, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.04) 60%, transparent 100%)',
                  border: '2px solid rgba(0,150,200,0.5)',
                  boxShadow: '0 0 40px rgba(0,212,255,0.15), inset 0 0 40px rgba(0,212,255,0.04)',
                } : {
                  background: 'transparent',
                  border: '2px solid rgba(0,0,0,0.1)',
                }}
              >
                {selectedProxy && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ border: '1px solid rgba(0,212,255,0.2)' }}
                  />
                )}
                RUN
              </motion.button>

              <div className="text-center text-xs text-gray-400 font-mono space-y-1">
                <div>Phase 1: 20 轮 × 500ms — Phase 2: 30 轮 × 1000ms</div>
                <div>总测试时间约 40 秒</div>
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
