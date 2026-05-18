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
    <div className="flex flex-col gap-1.5">
      <AnimatePresence mode="popLayout">
        {results.map((r, idx) => {
          const color = GRADE_COLORS[r.score.grade];
          return (
            <motion.div
              key={r.proxyName}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="flex items-center gap-4 px-4 py-3 rounded-lg border border-fs-1 bg-fn-1 shadow-f2"
            >
              <div className="text-sm font-mono text-ff-4 w-6 text-right">{idx + 1}</div>
              <GradeBadge grade={r.score.grade} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ff-1 truncate font-medium">{r.proxyName}</div>
                <div className="text-xs text-ff-4 font-mono">{r.proxyType}</div>
              </div>
              <div className="text-lg font-mono font-semibold" style={{ color }}>
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
            className="flex items-center gap-4 px-4 py-3 rounded-lg border border-brand/25 bg-brand/5"
          >
            <div className="text-sm font-mono text-ff-4 w-6 text-right">{results.length + 1}</div>
            <div className="w-10 h-10 rounded border border-brand/30 flex items-center justify-center flex-shrink-0">
              <motion.div
                className="w-2 h-2 rounded-sm bg-brand"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-brand font-medium truncate">{currentProxy}</div>
              <div className="text-xs text-brand/50">测试中…</div>
            </div>
            <div className="text-lg font-mono text-brand/40">—</div>
          </motion.div>
        )}

        {pendingProxies.map(name => (
          <motion.div
            key={`pending-${name}`}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="flex items-center gap-4 px-4 py-3 rounded-lg border border-fs-1"
          >
            <div className="w-6" />
            <div className="w-10 h-10 rounded border border-fs-1 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-sm bg-fs-2" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ff-3 truncate">{name}</div>
            </div>
            <div className="text-xs text-ff-4">待测</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
