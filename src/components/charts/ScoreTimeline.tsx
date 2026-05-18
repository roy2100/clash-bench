import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { getGrade } from '../../lib/scoring';
import { GRADE_COLORS } from '../../types';

interface ScorePoint {
  time: number;
  score: number;
}

interface ScoreTimelineProps {
  points: ScorePoint[];
}

const GRADE_LINES = [
  { y: 8000, label: 'S', color: '#00d4ff' },
  { y: 5000, label: 'A', color: '#00e676' },
  { y: 3000, label: 'B', color: '#a0e02c' },
  { y: 1500, label: 'C', color: '#ffd740' },
  { y: 500,  label: 'D', color: '#ff9800' },
];

export function ScoreTimeline({ points }: ScoreTimelineProps) {
  const data = points.map((p, i) => ({ idx: i + 1, score: p.score }));
  const scores = data.map(d => d.score);
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 1000;

  // Smart Y domain: show at least ±20% of data range, min floor 0
  const padding = Math.max((maxScore - minScore) * 0.4, 200);
  const yMin = Math.max(0, Math.floor((minScore - padding) / 100) * 100);
  const yMax = Math.min(12000, Math.ceil((maxScore + padding) / 100) * 100);

  // Color the line by average grade
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const lineColor = GRADE_COLORS[getGrade(Math.round(avgScore))];

  // Only show reference lines within the Y domain
  const visibleGradeLines = GRADE_LINES.filter(g => g.y >= yMin && g.y <= yMax);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <XAxis
          dataKey="idx"
          tick={{ fill: 'rgba(28,35,51,0.55)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(28,35,51,0.1)' }}
          label={{ value: '轮次', fill: 'rgba(28,35,51,0.3)', fontSize: 10, position: 'insideBottomRight', offset: -4 }}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fill: 'rgba(28,35,51,0.55)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          width={46}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v)}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const score = payload[0].value as number;
            const grade = getGrade(score);
            const color = GRADE_COLORS[grade];
            return (
              <div className="bg-white border border-gray-200 rounded px-3 py-1.5 text-xs font-mono shadow-sm">
                <span style={{ color }}>{grade}</span>
                <span className="text-gray-500 ml-2">{score.toLocaleString()} pts</span>
              </div>
            );
          }}
        />

        {/* Grade reference lines — only those in viewport */}
        {visibleGradeLines.map(g => (
          <ReferenceLine
            key={g.label}
            y={g.y}
            stroke={`${g.color}30`}
            strokeDasharray="4 4"
            label={{ value: g.label, fill: g.color, fontSize: 10, position: 'insideTopRight' }}
          />
        ))}

        <Line
          type="monotone"
          dataKey="score"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: lineColor, stroke: `${lineColor}40`, strokeWidth: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
