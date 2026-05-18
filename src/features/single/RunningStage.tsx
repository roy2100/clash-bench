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

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-[#050810]">
      {/* Animated background grid */}
      <PulseGrid grade={liveGrade} active />

      {/* Radial glow behind score */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 45% at 55% 45%, ${gradeColor}12 0%, transparent 70%)`,
          transition: 'background 1s ease',
        }}
      />

      <div className="relative z-10 flex w-full h-full">
        {/* ── Left panel ── */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-5 p-6 border-r border-white/[0.04] bg-[#050810]/60 backdrop-blur-sm">
          <div>
            <div className="text-[10px] text-white/25 font-mono uppercase tracking-widest mb-1">节点</div>
            <div className="text-sm font-mono text-white/70 truncate" title={proxyName}>{proxyName}</div>
          </div>

          <PhaseList
            currentPhase={currentPhase}
            phaseProgress={phaseProgress}
            throughputEnabled={config.throughputEnabled}
          />

          <div className="mt-auto space-y-4">
            {/* Overall progress */}
            <div>
              <div className="flex justify-between text-[10px] font-mono mb-1.5">
                <span className="text-white/25">总进度</span>
                <span className="text-white/50">{overallPct}%</span>
              </div>
              <div className="h-0.5 bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: gradeColor }}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            <button
              onClick={onAbort}
              className="w-full py-2 text-[11px] font-mono text-red-400/50 hover:text-red-400 border border-red-400/15 hover:border-red-400/35 rounded-lg transition-all duration-200"
            >
              中止测试
            </button>
          </div>
        </div>

        {/* ── Center: hero score + waveform ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8 min-w-0">
          {/* Live score */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <div
              className="text-[10px] font-mono uppercase tracking-[0.3em]"
              style={{ color: `${gradeColor}70` }}
            >
              实时得分
            </div>
            <ScoreDisplay score={liveScore} grade={liveGrade} size="hero" animated />
          </motion.div>

          {/* Waveform */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-xl"
          >
            <div
              className="text-[10px] font-mono uppercase tracking-widest mb-2"
              style={{ color: `${gradeColor}50` }}
            >
              延迟波形
            </div>
            <div
              className="h-36 rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid ${gradeColor}18`,
                boxShadow: `0 0 20px ${gradeColor}08`,
              }}
            >
              <LatencyWaveform samples={samples} />
            </div>
          </motion.div>

          {/* Sample ticker */}
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: gradeColor }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-[10px] font-mono text-white/25">
              {samples.length} 个样本 · 当前阶段{' '}
              <span style={{ color: gradeColor }}>
                {currentPhase === 'burst' ? 'LATENCY BURST' : currentPhase === 'hold' ? 'STABILITY HOLD' : currentPhase === 'throughput' ? 'THROUGHPUT' : '—'}
              </span>
            </span>
          </div>
        </div>

        {/* ── Right panel: live metrics ── */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-4 p-6 border-l border-white/[0.04] bg-[#050810]/60 backdrop-blur-sm">
          <div
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: `${gradeColor}60` }}
          >
            实时指标
          </div>

          <LiveMetric label="平均延迟" value={fmtMs(stats.avg)} />
          <LiveMetric label="P95 延迟" value={fmtMs(stats.p95)} />
          <LiveMetric label="抖动 σ" value={fmtMs(stats.stddev)} />
          <LiveMetric
            label="成功率"
            value={`${Math.round(successRate * 100)}%`}
            valueColor={successRate < 0.8 ? '#ff4444' : successRate < 0.95 ? '#ffd740' : '#00e676'}
          />
          <LiveMetric label="样本数" value={`${samples.length}`} />

          {/* Grade preview */}
          <div className="mt-auto pt-4 border-t border-white/[0.04]">
            <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-2">当前等级</div>
            <div
              className="text-3xl font-mono font-bold"
              style={{
                color: gradeColor,
                textShadow: `0 0 20px ${gradeColor}60`,
              }}
            >
              {liveGrade}
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: `${gradeColor}60` }}>
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
      <div className="text-[10px] text-white/25 font-mono uppercase tracking-wider">{label}</div>
      <div
        className="text-base font-mono font-semibold"
        style={{ color: valueColor ?? 'rgba(255,255,255,0.75)' }}
      >
        {value}
      </div>
    </div>
  );
}
