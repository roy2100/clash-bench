import { motion } from 'framer-motion';
import type { Grade } from '../../types';
import { GRADE_COLORS, GRADE_LABELS } from '../../types';

interface GradeBadgeProps {
  grade: Grade;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'text-2xl w-10 h-10',
  md: 'text-4xl w-16 h-16',
  lg: 'text-6xl w-24 h-24',
};

export function GradeBadge({ grade, animate = false, size = 'md' }: GradeBadgeProps) {
  const color = GRADE_COLORS[grade];
  const label = GRADE_LABELS[grade];

  const badge = (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full font-mono font-bold border-2 relative`}
      style={{
        color,
        borderColor: color,
        boxShadow: `0 0 20px ${color}40, inset 0 0 20px ${color}10`,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
      }}
      title={label}
    >
      {grade}
    </div>
  );

  if (!animate) return badge;

  return (
    <motion.div
      initial={{ scale: 0.3, rotate: 15, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.6, 1] }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {badge}
      </motion.div>
    </motion.div>
  );
}
