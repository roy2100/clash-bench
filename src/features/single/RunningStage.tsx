import { motion } from 'framer-motion';
import type { LiveData } from './useSingleBench';
import { ScoreDisplay } from '../../components/shared/ScoreDigit';
import { PhaseList } from '../../components/shared/PhaseList';
import { PulseGrid } from '../../components/shared/PulseGrid';
import { LatencyWaveform } from '../../components/charts/LatencyWaveform';
import { fmtMs } from '../../lib/format';
import { calcStats } from '../../lib/stats';
import { useModeStore } from '../../store/modeStore';
import { GRADE_COLORS } from '../../types';

interface RunningStageProps {
  proxyName: string;
  liveData: LiveData;
  onAbort: () => void;
}

export function RunningStage({ proxyName, liveData, onAbort }: RunningStageProps) {
  const { config } = useModeStore();
  const { currentPhase, phaseProgress, samples, liveScore, liveGrade } = liveData;

  const valid = samples.map(s => s.delay).filter((d): d is number => d !== null);
  const stats = calcStats(valid);
  const successRate = samples.length > 0 ? valid.length / samples.length : 1;

  const totalRounds = config.phase1Rounds + config.phase2Rounds;
  const completedRounds = (phaseProgress.burst?.current ?? 0) + (phaseProgress.hold?.current ?? 0);
  const overallPct = Math.round((completedRounds / totalRounds) * 100);

  const gradeColor = GRADE_COLORS[liveGrade];

  const successRateColor =
    successRate < 0.8 ? '#e03131' : successRate < 0.95 ? '#f5a623' : '#38b000';

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-fn-2">
      <PulseGrid grade={liveGrade} active />

      <div className="relative z-10 flex w-full h-full">
        {/* ── Left panel ── */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-5 p-5 border-r border-fs-1 bg-fn-1">
          <div>
            <div className="text-[10px] text-ff-4 uppercase tracking-wider mb-1">节点</div>
            <div className="text-sm text-ff-2 truncate font-mono" title={proxyName}>{proxyName}</div>
          </div>

          <PhaseList
            currentPhase={currentPhase}
            phaseProgress={phaseProgress}
            throughputEnabled={config.throughputEnabled}
          />

          <div className="mt-auto space-y-4">
            <div>
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-ff-4">总进度</span>
                <span className="text-ff-3 font-mono">{overallPct}%</span>
              </div>
              <div className="h-1 bg-fn-3 rounded-sm overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ background: gradeColor, borderRadius: 2 }}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            <button
              onClick={onAbort}
              className="w-full py-1.5 text-xs text-red-500/60 hover:text-red-600 border border-red-400/20 hover:border-red-400/50 rounded transition-colors"
            >
              中止测试
            </button>
          </div>
        </div>

        {/* ── Center: hero score + waveform ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-ff-4">实时得分</div>
            <ScoreDisplay score={liveScore} grade={liveGrade} size="hero" animated />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-xl"
          >
            <div className="text-[10px] uppercase tracking-wider mb-2 text-ff-4">延迟波形</div>
            <div className="h-36 rounded-lg overflow-hidden bg-fn-1 border border-fs-1 shadow-f2">
              <LatencyWaveform samples={samples} />
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: gradeColor }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-[10px] font-mono text-ff-4">
              {samples.length} 个样本 · 当前阶段{' '}
              <span style={{ color: gradeColor }}>
                {currentPhase === 'burst'
                  ? 'LATENCY BURST'
                  : currentPhase === 'hold'
                  ? 'STABILITY HOLD'
                  : currentPhase === 'throughput'
                  ? 'THROUGHPUT'
                  : '—'}
              </span>
            </span>
          </div>
        </div>

        {/* ── Right panel: live metrics ── */}
        <div className="w-48 flex-shrink-0 flex flex-col gap-4 p-5 border-l border-fs-1 bg-fn-1">
          <div className="text-[10px] uppercase tracking-wider text-ff-4">实时指标</div>

          <LiveMetric label="平均延迟" value={fmtMs(stats.avg)} />
          <LiveMetric label="P95 延迟" value={fmtMs(stats.p95)} />
          <LiveMetric label="抖动 σ" value={fmtMs(stats.stddev)} />
          <LiveMetric
            label="成功率"
            value={`${Math.round(successRate * 100)}%`}
            valueColor={successRateColor}
          />
          <LiveMetric label="样本数" value={`${samples.length}`} />

          <div className="mt-auto pt-4 border-t border-fs-1">
            <div className="text-[10px] text-ff-4 uppercase tracking-wider mb-1.5">当前等级</div>
            <div className="text-3xl font-mono font-bold" style={{ color: gradeColor }}>
              {liveGrade}
            </div>
            <div className="text-[10px] font-mono mt-1 text-ff-4">
              {liveScore > 0 ? liveScore.toLocaleString() + ' pts' : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveMetric({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] text-ff-4 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-mono font-semibold" style={{ color: valueColor ?? '#242424' }}>
        {value}
      </div>
    </div>
  );
}
