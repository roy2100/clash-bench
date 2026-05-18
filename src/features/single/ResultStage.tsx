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
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-fn-2">
      <PulseGrid grade={score.grade} active={false} />

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 max-w-2xl w-full">
        {/* Node name */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center"
        >
          <div className="text-ff-2 text-sm font-semibold">{proxyName}</div>
          <div className="text-ff-4 text-xs font-mono mt-0.5">{proxyType}</div>
        </motion.div>

        {/* Hero: badge + score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="flex items-center gap-8"
        >
          <GradeBadge grade={score.grade} animate size="lg" />

          <div className="flex flex-col items-start gap-1.5">
            <ScoreDisplay score={score.total} grade={score.grade} size="hero" animated={false} />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm font-semibold"
              style={{ color }}
            >
              {GRADE_LABELS[score.grade]}
            </motion.div>
          </div>
        </motion.div>

        {/* Sub-score cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full grid grid-cols-4 gap-2"
        >
          <SubScoreCard label="延迟原始分" value={score.subscores.latency.toLocaleString()} unit="pts" />
          <SubScoreCard label="稳定系数" value={(score.subscores.stabilityFactor * 100).toFixed(1)} unit="%" />
          <SubScoreCard label="抖动系数" value={(score.subscores.jitterFactor * 100).toFixed(1)} unit="%" />
          <SubScoreCard label="吞吐加成" value={`×${score.subscores.throughputBonus.toFixed(2)}`} unit="" />
        </motion.div>

        {/* Raw stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-fn-1 border border-fs-1 rounded-xl p-4 grid grid-cols-4 gap-4 shadow-f2"
        >
          <StatItem label="平均延迟" value={fmtMs(stats.avg)} />
          <StatItem label="P95 延迟" value={fmtMs(stats.p95)} />
          <StatItem label="抖动 σ" value={fmtMs(stats.stddev)} />
          <StatItem label="成功率" value={fmtPercent(successRate)} />
        </motion.div>

        {isAllTimeout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs font-mono text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2"
          >
            ⚠ 全部样本超时——请检查节点是否可用，或增大超时阈值
          </motion.div>
        )}

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-ff-4 font-mono"
        >
          {samples.length} 样本 · {fmtDuration(result.durationMs)} · {new Date(result.startedAt).toLocaleString()}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex gap-2"
        >
          <button
            onClick={onRunAgain}
            className="px-6 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded transition-colors"
          >
            再来一次
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 text-sm text-ff-3 hover:text-ff-1 border border-fs-1 hover:border-fs-2 rounded transition-colors"
          >
            返回首页
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function SubScoreCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-fn-1 border border-fs-1 rounded-lg p-3 flex flex-col gap-1 shadow-f2">
      <div className="text-[10px] text-ff-4 uppercase tracking-wider">{label}</div>
      <div className="text-base font-mono font-semibold text-ff-1">
        {value}
        {unit && <span className="text-xs text-ff-4 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] text-ff-4 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-mono text-ff-2">{value}</div>
    </div>
  );
}
