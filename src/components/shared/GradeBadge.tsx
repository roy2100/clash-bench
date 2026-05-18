import { motion } from 'framer-motion';
import type { Grade } from '../../types';
import { GRADE_COLORS, GRADE_LABELS } from '../../types';

interface GradeBadgeProps {
  grade: Grade;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { outer: 'w-10 h-10', text: 'text-xl' },
  md: { outer: 'w-16 h-16', text: 'text-3xl' },
  lg: { outer: 'w-24 h-24', text: 'text-5xl' },
};

export function GradeBadge({ grade, animate = false, size = 'md' }: GradeBadgeProps) {
  const color = GRADE_COLORS[grade];
  const label = GRADE_LABELS[grade];
  const { outer, text } = sizes[size];

  const badge = (
    <div
      className={`${outer} flex items-center justify-center font-mono font-bold border-2`}
      style={{
        color,
        borderColor: `${color}80`,
        background: `${color}12`,
        borderRadius: 6,
      }}
      title={label}
    >
      <span className={text}>{grade}</span>
    </div>
  );

  if (!animate) return badge;

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.08 }}
    >
      {badge}
    </motion.div>
  );
}
