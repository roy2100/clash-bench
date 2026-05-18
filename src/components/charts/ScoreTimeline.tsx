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
  { y: 8000, label: 'S', color: '#00b4d8' },
  { y: 5000, label: 'A', color: '#38b000' },
  { y: 3000, label: 'B', color: '#85bb00' },
  { y: 1500, label: 'C', color: '#f5a623' },
  { y: 500,  label: 'D', color: '#f76707' },
];

export function ScoreTimeline({ points }: ScoreTimelineProps) {
  const data = points.map((p, i) => ({ idx: i + 1, score: p.score }));
  const scores = data.map(d => d.score);
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 1000;

  const padding = Math.max((maxScore - minScore) * 0.4, 200);
  const yMin = Math.max(0, Math.floor((minScore - padding) / 100) * 100);
  const yMax = Math.min(12000, Math.ceil((maxScore + padding) / 100) * 100);

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const lineColor = GRADE_COLORS[getGrade(Math.round(avgScore))];

  const visibleGradeLines = GRADE_LINES.filter(g => g.y >= yMin && g.y <= yMax);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <XAxis
          dataKey="idx"
          tick={{ fill: '#898989', fontSize: 10, fontFamily: 'Consolas, monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#e0e0e0' }}
          label={{ value: '轮次', fill: '#898989', fontSize: 10, position: 'insideBottomRight', offset: -4 }}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fill: '#898989', fontSize: 10, fontFamily: 'Consolas, monospace' }}
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
              <div className="bg-fn-1 border border-fs-1 rounded px-3 py-1.5 text-xs font-mono shadow-f4">
                <span style={{ color }}>{grade}</span>
                <span className="text-ff-3 ml-2">{score.toLocaleString()} pts</span>
              </div>
            );
          }}
        />

        {visibleGradeLines.map(g => (
          <ReferenceLine
            key={g.label}
            y={g.y}
            stroke={`${g.color}28`}
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
          activeDot={{ r: 4, fill: lineColor, stroke: `${lineColor}30`, strokeWidth: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
