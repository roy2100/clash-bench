import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import type { DelaySample } from '../../types';

interface LatencyWaveformProps {
  samples: DelaySample[];
  maxPoints?: number;
}

interface DataPoint {
  idx: number;
  delay: number | null;
  phase: string;
}

export function LatencyWaveform({ samples, maxPoints = 50 }: LatencyWaveformProps) {
  const recentSamples = samples.slice(-maxPoints);
  const data: DataPoint[] = recentSamples.map((s, i) => ({
    idx: i,
    delay: s.delay,
    phase: s.phase,
  }));

  const validDelays = data.filter(d => d.delay !== null).map(d => d.delay as number);
  const maxDelay = validDelays.length > 0 ? Math.max(...validDelays) : 500;
  const yMax = Math.ceil(Math.max(maxDelay * 1.2, 200) / 100) * 100;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis dataKey="idx" hide />
          <YAxis
            domain={[0, yMax]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickFormatter={v => `${v}`}
            width={36}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const val = payload[0].value;
              return (
                <div className="bg-[#0d1525] border border-white/10 rounded px-2 py-1 text-xs font-mono text-white">
                  {val === null ? 'timeout' : `${val} ms`}
                </div>
              );
            }}
          />
          <ReferenceLine y={200} stroke="rgba(255,215,64,0.15)" strokeDasharray="3 3" />
          <ReferenceLine y={500} stroke="rgba(255,100,100,0.15)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="delay"
            stroke="#00d4ff"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#00d4ff' }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
