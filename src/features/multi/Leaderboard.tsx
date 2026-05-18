import { AnimatePresence, motion } from 'framer-motion';
import type { BenchResult } from '../../types';
import { GRADE_COLORS } from '../../types';
import { GradeBadge } from '../../components/shared/GradeBadge';

interface LeaderboardProps {
  results: BenchResult[];
  currentProxy: string;
  pendingProxies: string[];
}

export function Leaderboard({ results, currentProxy, pendingProxies }: LeaderboardProps) {
  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {results.map((r, idx) => {
          const color = GRADE_COLORS[r.score.grade];
          return (
            <motion.div
              key={r.proxyName}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-4 px-4 py-3 rounded-xl border"
              style={{ background: `${color}08`, borderColor: `${color}25` }}
            >
              <div className="text-2xl font-mono font-bold text-white/20 w-8 text-right">{idx + 1}</div>
              <GradeBadge grade={r.score.grade} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono text-white truncate">{r.proxyName}</div>
                <div className="text-xs text-white/30 font-mono">{r.proxyType}</div>
              </div>
              <div className="text-xl font-mono font-bold" style={{ color }}>
                {r.score.total.toLocaleString()}
              </div>
            </motion.div>
          );
        })}

        {currentProxy && (
          <motion.div
            key={`running-${currentProxy}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5"
          >
            <div className="text-2xl font-mono font-bold text-white/20 w-8 text-right">
              {results.length + 1}
            </div>
            <div className="w-10 h-10 rounded-full border border-cyan-500/40 flex items-center justify-center">
              <motion.div
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-mono text-cyan-400 truncate">{currentProxy}</div>
              <div className="text-xs text-cyan-400/40 font-mono">测试中...</div>
            </div>
            <div className="text-xl font-mono text-cyan-400/40">—</div>
          </motion.div>
        )}

        {pendingProxies.map(name => (
          <motion.div
            key={`pending-${name}`}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/5"
          >
            <div className="w-8" />
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-mono text-white/40 truncate">{name}</div>
            </div>
            <div className="text-sm font-mono text-white/20">待测</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
