import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import type { Grade } from '../../types';
import { GRADE_COLORS } from '../../types';

interface ScoreDisplayProps {
  score: number;
  grade: Grade;
  size?: 'hero' | 'normal';
  animated?: boolean;
}

export function ScoreDisplay({ score, grade, size = 'hero', animated = true }: ScoreDisplayProps) {
  const color = GRADE_COLORS[grade];
  const prevScore = useRef(0);
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  const springValue = useSpring(0, { stiffness: 60, damping: 15 });
  const rounded = useTransform(springValue, v => Math.round(v));

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }
    springValue.set(prevScore.current);
    springValue.set(score);
    prevScore.current = score;

    const unsub = rounded.on('change', v => setDisplayScore(v));
    return unsub;
  }, [score, animated, springValue, rounded]);

  const formattedScore = displayScore.toLocaleString('en-US');
  const fontSize = size === 'hero' ? 'text-[144px] leading-none' : 'text-5xl';

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={`font-mono font-bold tabular-nums ${fontSize} select-none`}
        style={{
          color,
          textShadow: `0 0 30px ${color}90, 0 0 60px ${color}50, 0 0 120px ${color}25`,
          filter: `drop-shadow(0 0 12px ${color}80)`,
        }}
        key={score}
      >
        {formattedScore}
      </motion.div>
      {size === 'hero' && (
        <div
          className="text-xs font-mono uppercase tracking-[0.2em] opacity-50"
          style={{ color }}
        >
          CLASH BENCH SCORE
        </div>
      )}
    </div>
  );
}
