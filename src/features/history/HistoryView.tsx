import { useHistoryStore } from './historyStore';
import { GradeBadge } from '../../components/shared/GradeBadge';
import { fmtDate, fmtDuration, fmtMs } from '../../lib/format';
import { calcStats } from '../../lib/stats';
import { GRADE_COLORS } from '../../types';

export function HistoryView() {
  const { records, remove, clear, exportAndDownload } = useHistoryStore();

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <div className="text-ff-3 text-sm font-semibold">暂无历史记录</div>
        <div className="text-ff-4 text-xs">完成跑分后自动保存</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-ff-3">
          {records.length} 条记录（最多保留 100 条）
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportAndDownload}
            className="px-3 py-1.5 text-xs text-ff-3 hover:text-ff-1 border border-fs-1 hover:border-fs-2 rounded transition-colors"
          >
            导出 CSV
          </button>
          <button
            onClick={clear}
            className="px-3 py-1.5 text-xs text-red-500/60 hover:text-red-600 border border-red-400/20 hover:border-red-400/40 rounded transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5">
        {records.map((r, i) => {
          const valid = r.samples.map(s => s.delay).filter((d): d is number => d !== null);
          const stats = calcStats(valid);
          const color = GRADE_COLORS[r.score.grade];

          return (
            <div
              key={`${r.startedAt}-${i}`}
              className="flex items-center gap-4 px-4 py-3 rounded-lg border border-fs-1 bg-fn-1 shadow-f2"
            >
              <GradeBadge grade={r.score.grade} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ff-1 font-medium truncate">{r.proxyName}</span>
                  <span className="text-xs text-ff-4 font-mono flex-shrink-0">{r.proxyType}</span>
                  {r.configLabel && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/8 text-brand border border-brand/20 flex-shrink-0">
                      {r.configLabel}
                    </span>
                  )}
                </div>
                <div className="text-xs text-ff-4 mt-0.5">
                  {fmtDate(r.startedAt)} · {fmtDuration(r.durationMs)} · avg {fmtMs(stats.avg)}
                </div>
              </div>

              <div className="text-lg font-mono font-semibold" style={{ color }}>
                {r.score.total.toLocaleString()}
              </div>

              <button
                onClick={() => remove(i)}
                className="text-ff-4 hover:text-red-500 text-xs transition-colors px-1"
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
