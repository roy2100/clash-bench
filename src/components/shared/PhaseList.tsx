import { motion } from 'framer-motion';

export type PhaseKey = 'burst' | 'hold' | 'throughput';

interface Phase {
  key: PhaseKey;
  label: string;
  desc: string;
}

interface PhaseListProps {
  currentPhase: PhaseKey | null;
  phaseProgress: Partial<Record<PhaseKey, { current: number; total: number }>>;
  throughputEnabled?: boolean;
}

const PHASES: Phase[] = [
  { key: 'burst',      label: 'Phase 1', desc: 'Latency Burst'   },
  { key: 'hold',       label: 'Phase 2', desc: 'Stability Hold'  },
  { key: 'throughput', label: 'Phase 3', desc: 'Throughput'      },
];

export function PhaseList({ currentPhase, phaseProgress, throughputEnabled = false }: PhaseListProps) {
  const visiblePhases = throughputEnabled ? PHASES : PHASES.slice(0, 2);

  return (
    <div className="flex flex-col gap-2">
      {visiblePhases.map((phase) => {
        const isActive = currentPhase === phase.key;
        const progress = phaseProgress[phase.key];
        const isDone = progress && progress.current >= progress.total;
        const isPending = !isActive && !isDone;

        return (
          <div
            key={phase.key}
            className={`flex items-center gap-3 rounded px-3 py-2.5 border transition-colors ${
              isActive  ? 'border-brand/30 bg-brand/5'
            : isDone   ? 'border-fs-1 bg-fn-2'
            :             'border-transparent opacity-40'
            }`}
          >
            {/* Status dot */}
            <div className="flex-shrink-0 relative w-2 h-2">
              {isActive ? (
                <>
                  <div className="absolute inset-0 rounded-full bg-brand" />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-brand"
                    animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </>
              ) : isDone ? (
                <div className="w-2 h-2 rounded-full bg-green-600" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-fs-2" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${
                  isActive ? 'text-brand' : isPending ? 'text-ff-4' : 'text-ff-3'
                }`}>
                  {phase.label}
                </span>
                {progress && (
                  <span className="text-xs font-mono text-ff-4">
                    {progress.current}/{progress.total}
                  </span>
                )}
              </div>
              <div className={`text-xs mt-0.5 ${isActive ? 'text-ff-2' : 'text-ff-4'}`}>
                {phase.desc}
              </div>
              {progress && (
                <div className="mt-1.5 h-0.5 bg-fn-3 rounded-sm overflow-hidden">
                  <motion.div
                    className="h-full bg-brand rounded-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
