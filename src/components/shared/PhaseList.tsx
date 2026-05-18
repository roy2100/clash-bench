import { motion } from 'framer-motion';

export type PhaseKey = 'burst' | 'hold' | 'throughput';

interface Phase {
  key: PhaseKey;
  label: string;
  desc: string;
  rounds: number;
}

interface PhaseListProps {
  currentPhase: PhaseKey | null;
  phaseProgress: Partial<Record<PhaseKey, { current: number; total: number }>>;
  throughputEnabled?: boolean;
}

const PHASES: Phase[] = [
  { key: 'burst', label: 'Phase 1', desc: 'Latency Burst', rounds: 20 },
  { key: 'hold', label: 'Phase 2', desc: 'Stability Hold', rounds: 30 },
  { key: 'throughput', label: 'Phase 3', desc: 'Throughput', rounds: 1 },
];

export function PhaseList({ currentPhase, phaseProgress, throughputEnabled = false }: PhaseListProps) {
  const visiblePhases = throughputEnabled ? PHASES : PHASES.slice(0, 2);

  return (
    <div className="flex flex-col gap-3">
      {visiblePhases.map((phase) => {
        const isActive = currentPhase === phase.key;
        const progress = phaseProgress[phase.key];
        const isDone = progress && progress.current >= progress.total;
        const isPending = !isActive && !isDone;

        return (
          <motion.div
            key={phase.key}
            layout
            className={`relative flex items-center gap-3 rounded-lg px-4 py-3 border transition-all duration-300 ${
              isActive
                ? 'border-gray-400 bg-gray-100'
                : isDone
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-200 bg-transparent opacity-40'
            }`}
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-lg opacity-20"
                style={{ background: 'linear-gradient(90deg, #00d4ff20, transparent)' }}
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isActive ? 'bg-cyan-500 shadow-[0_0_8px_#00b4d8]' :
              isDone ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {isActive && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-cyan-500"
                  animate={{ scale: [1, 1.8, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-mono uppercase tracking-wider ${
                  isActive ? 'text-cyan-700' : isPending ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  {phase.label}
                </span>
                {progress && (
                  <span className="text-xs font-mono text-gray-500">
                    {progress.current}/{progress.total}
                  </span>
                )}
              </div>
              <div className={`text-sm font-sans ${isActive ? 'text-gray-700' : 'text-gray-500'}`}>
                {phase.desc}
              </div>
              {progress && (
                <div className="mt-1.5 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
