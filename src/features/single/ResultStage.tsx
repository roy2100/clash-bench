import { motion } from 'framer-motion';
import type { BenchResult } from '../../types';
import { GRADE_COLORS, GRADE_LABELS } from '../../types';
import { GradeBadge } from '../../components/shared/GradeBadge';
import { ScoreDisplay } from '../../components/shared/ScoreDigit';
import { PulseGrid } from '../../components/shared/PulseGrid';
import { fmtMs, fmtPercent, fmtDuration } from '../../lib/format';
import { calcStats } from '../../lib/stats';

interface ResultStageProps {
  result: BenchResult;
  onRunAgain: () => void;
  onSaveToHistory: () => void;
}

export function ResultStage({ result, onRunAgain }: ResultStageProps) {
  const { score, samples, proxyName, proxyType } = result;
  const color = GRADE_COLORS[score.grade];
  const valid = samples.map(s => s.delay).filter((d): d is number => d !== null);
  const stats = calcStats(valid);
  const successRate = samples.length > 0 ? valid.length / samples.length : 0;
  const isAllTimeout = samples.length > 0 && valid.length === 0;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#f5f7fa]">
      <PulseGrid grade={score.grade} active={false} />

      {/* Central radial burst on entry */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{
          background: `radial-gradient(ellipse 50% 50% at 50% 45%, ${color}30 0%, transparent 65%)`,
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${color}10 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 max-w-2xl w-full">
        {/* Node name */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center"
        >
          <div className="text-gray-500 text-sm font-mono">{proxyName}</div>
          <div className="text-gray-400 text-xs font-mono">{proxyType}</div>
        </motion.div>

        {/* Hero: badge + score */}
        <div className="flex items-center gap-10">
          <GradeBadge grade={score.grade} animate size="lg" />

          <div className="flex flex-col items-start gap-2">
            <ScoreDisplay score={score.total} grade={score.grade} size="hero" animated={false} />
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm font-sans"
              style={{ color: `${color}99` }}
            >
              {GRADE_LABELS[score.grade]}
            </motion.div>
          </div>
        </div>

        {/* Sub-score cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full grid grid-cols-4 gap-3"
        >
          <SubScoreCard label="延迟原始分" value={score.subscores.latency.toLocaleString()} unit="pts" color={color} />
          <SubScoreCard label="稳定系数" value={(score.subscores.stabilityFactor * 100).toFixed(1)} unit="%" color={color} />
          <SubScoreCard label="抖动系数" value={(score.subscores.jitterFactor * 100).toFixed(1)} unit="%" color={color} />
          <SubScoreCard label="吞吐加成" value={`×${score.subscores.throughputBonus.toFixed(2)}`} unit="" color={color} />
        </motion.div>

        {/* Raw stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full rounded-xl p-4 grid grid-cols-4 gap-4"
          style={{ background: `${color}06`, border: `1px solid ${color}18` }}
        >
          <StatItem label="平均延迟" value={fmtMs(stats.avg)} />
          <StatItem label="P95 延迟" value={fmtMs(stats.p95)} />
          <StatItem label="抖动 σ" value={fmtMs(stats.stddev)} />
          <StatItem label="成功率" value={fmtPercent(successRate)} />
        </motion.div>

        {/* All timeout warning */}
        {isAllTimeout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs font-mono text-red-400/70 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2"
          >
            ⚠ 全部样本超时——请检查节点是否可用，或增大超时阈值
          </motion.div>
        )}

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-[10px] text-gray-400 font-mono"
        >
          {samples.length} 样本 · {fmtDuration(result.durationMs)} · {new Date(result.startedAt).toLocaleString()}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex gap-3"
        >
          <button
            onClick={onRunAgain}
            className="px-8 py-3 font-mono text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${color}28, ${color}12)`,
              border: `1px solid ${color}50`,
              color,
              boxShadow: `0 0 24px ${color}20, inset 0 0 12px ${color}08`,
            }}
          >
            再来一次
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 font-mono text-sm text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200"
          >
            返回首页
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function SubScoreCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1"
      style={{ background: `${color}08`, border: `1px solid ${color}18` }}
    >
      <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{label}</div>
      <div className="text-lg font-mono font-bold text-gray-900">
        {value}
        {unit && <span className="text-xs text-gray-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{label}</div>
      <div className="text-sm font-mono text-gray-700">{value}</div>
    </div>
  );
}
