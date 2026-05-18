import { useHistoryStore } from './historyStore';
import { GradeBadge } from '../../components/shared/GradeBadge';
import { fmtDate, fmtDuration, fmtMs } from '../../lib/format';
import { calcStats } from '../../lib/stats';
import { GRADE_COLORS } from '../../types';

export function HistoryView() {
  const { records, remove, clear, exportAndDownload } = useHistoryStore();

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <div className="text-white/20 font-mono text-sm">暂无历史记录</div>
        <div className="text-white/10 text-xs font-sans">完成跑分后自动保存</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-white/30">
          {records.length} 条记录（最多保留 100 条）
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportAndDownload}
            className="px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded transition-colors"
          >
            导出 CSV
          </button>
          <button
            onClick={clear}
            className="px-3 py-1.5 text-xs font-mono text-red-400/50 hover:text-red-400 border border-red-400/10 hover:border-red-400/30 rounded transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {records.map((r, i) => {
          const valid = r.samples.map(s => s.delay).filter((d): d is number => d !== null);
          const stats = calcStats(valid);
          const color = GRADE_COLORS[r.score.grade];

          return (
            <div
              key={`${r.startedAt}-${i}`}
              className="flex items-center gap-4 px-4 py-3 rounded-xl border"
              style={{ background: `${color}06`, borderColor: `${color}15` }}
            >
              <GradeBadge grade={r.score.grade} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-white truncate">{r.proxyName}</span>
                  <span className="text-xs text-white/30 font-mono">{r.proxyType}</span>
                </div>
                <div className="text-xs text-white/30 font-mono mt-0.5">
                  {fmtDate(r.startedAt)} · {fmtDuration(r.durationMs)} · avg {fmtMs(stats.avg)}
                </div>
              </div>

              <div className="text-xl font-mono font-bold" style={{ color }}>
                {r.score.total.toLocaleString()}
              </div>

              <button
                onClick={() => remove(i)}
                className="text-white/20 hover:text-red-400/60 text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
