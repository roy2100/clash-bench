import { useEffect, useRef } from 'react';
import type { Grade } from '../../types';
import { GRADE_COLORS } from '../../types';

interface PulseGridProps {
  grade: Grade;
  active?: boolean;
}

export function PulseGrid({ grade, active = true }: PulseGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const baseColor = GRADE_COLORS[grade];
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
    const rgb = hexToRgb(baseColor);

    let lastTime = 0;
    const draw = (timestamp: number) => {
      const dt = timestamp - lastTime;
      lastTime = timestamp;
      if (active) timeRef.current += dt * 0.001;

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const cellSize = 48;
      const cols = Math.ceil(W / cellSize) + 1;
      const rows = Math.ceil(H / cellSize) + 1;
      const t = timeRef.current;

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const x = col * cellSize;
          const y = row * cellSize;
          const wave = Math.sin(col * 0.35 + t * 1.8) * Math.cos(row * 0.28 + t * 1.3)
                     + 0.3 * Math.sin(col * 0.6 - t * 0.9) * Math.cos(row * 0.5 + t * 0.7);
          const norm = (wave / 1.3 + 1) * 0.5;

          const gridAlpha = norm * 0.18;
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${gridAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.rect(x, y, cellSize, cellSize);
          ctx.stroke();

          if (norm > 0.70) {
            const dotAlpha = (norm - 0.70) * 1.2;
            const dotSize = 1.5 + (norm - 0.70) * 5;
            ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.min(dotAlpha, 0.7)})`;
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [grade, active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: active ? 1 : 0.35 }}
    />
  );
}
