import { useState } from 'react';
import { useHistoryStore } from './historyStore';
import { GradeBadge } from '../../components/shared/GradeBadge';
import { fmtDate, fmtDuration, fmtMs } from '../../lib/format';
import { calcStats } from '../../lib/stats';
import { getGrade } from '../../lib/scoring';
import { GRADE_COLORS } from '../../types';
import type { BenchResult } from '../../types';

type HistoryTab = 'detail' | 'aggregate';

interface AggRow {
  key: string;
  proxyName: string;
  proxyType: string;
  configLabel: string;
  count: number;
  meanScore: number;
  meanAvg: number;
}

function buildAggRows(records: BenchResult[]): AggRow[] {
  const map = new Map<string, BenchResult[]>();
  for (const r of records) {
    const key = `${r.configLabel ?? ''}::${r.proxyName}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const rows: AggRow[] = [];
  for (const [key, group] of map) {
    const meanScore = group.reduce((s, r) => s + r.score.total, 0) / group.length;
    const avgs = group.map(r => {
      const valid = r.samples.filter(s => s.phase === 'hold').map(s => s.delay).filter((d): d is number => d !== null);
      return calcStats(valid).avg ?? 9999;
    });
    const meanAvg = avgs.reduce((s, v) => s + v, 0) / avgs.length;
    const first = group[0];
    rows.push({
      key,
      proxyName: first.proxyName,
      proxyType: first.proxyType,
      configLabel: first.configLabel ?? '',
      count: group.length,
      meanScore: Math.round(meanScore),
      meanAvg,
    });
  }

  return rows.sort((a, b) => b.meanScore - a.meanScore);
}

export function HistoryView() {
  const { records, ready, remove, clear, exportAndDownload } = useHistoryStore();
  const [tab, setTab] = useState<HistoryTab>('detail');
  const [configFilter, setConfigFilter] = useState<string | null>(null);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-ff-4 text-xs">加载中…</div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <div className="text-ff-3 text-sm font-semibold">暂无历史记录</div>
        <div className="text-ff-4 text-xs">完成跑分后自动保存</div>
      </div>
    );
  }

  const allConfigs = Array.from(new Set(records.map(r => r.configLabel ?? ''))).sort();
  const filtered = configFilter === null ? records : records.filter(r => (r.configLabel ?? '') === configFilter);
  const aggRows = tab === 'aggregate' ? buildAggRows(filtered) : [];

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-fn-2 border border-fs-1 rounded p-0.5">
          <TabPill label="明细" active={tab === 'detail'} onClick={() => setTab('detail')} />
          <TabPill label="聚合" active={tab === 'aggregate'} onClick={() => setTab('aggregate')} />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-ff-4">
            {tab === 'detail' ? `${filtered.length} 条记录` : `${aggRows.length} 个节点`}
          </span>
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

      {allConfigs.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-ff-4 mr-1">配置</span>
          <FilterChip label="全部" active={configFilter === null} onClick={() => setConfigFilter(null)} />
          {allConfigs.map(c => (
            <FilterChip
              key={c}
              label={c || '（无）'}
              active={configFilter === c}
              onClick={() => setConfigFilter(configFilter === c ? null : c)}
            />
          ))}
        </div>
      )}

      {tab === 'detail' ? (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.map((r) => {
            const valid = r.samples.filter(s => s.phase === 'hold').map(s => s.delay).filter((d): d is number => d !== null);
            const stats = calcStats(valid);
            const color = GRADE_COLORS[r.score.grade];

            return (
              <div
                key={r.startedAt}
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
                  onClick={() => remove(r.startedAt)}
                  className="text-ff-4 hover:text-red-500 text-xs transition-colors px-1"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {aggRows.map((row, i) => {
            const grade = getGrade(row.meanScore);
            const color = GRADE_COLORS[grade];

            return (
              <div
                key={row.key}
                className="flex items-center gap-4 px-4 py-3 rounded-lg border border-fs-1 bg-fn-1 shadow-f2"
              >
                <span className="text-xs text-ff-4 font-mono w-5 text-right flex-shrink-0">{i + 1}</span>

                <GradeBadge grade={grade} size="sm" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ff-1 font-medium truncate">{row.proxyName}</span>
                    <span className="text-xs text-ff-4 font-mono flex-shrink-0">{row.proxyType}</span>
                    {row.configLabel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/8 text-brand border border-brand/20 flex-shrink-0">
                        {row.configLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ff-4 mt-0.5">
                    {row.count} 次跑分 · avg {fmtMs(row.meanAvg)}
                  </div>
                </div>

                <div className="text-lg font-mono font-semibold" style={{ color }}>
                  {row.meanScore.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-colors ${
        active
          ? 'bg-brand text-white border-brand'
          : 'text-ff-3 border-fs-1 hover:border-fs-2 hover:text-ff-1'
      }`}
    >
      {label}
    </button>
  );
}

function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-fn-1 text-ff-1 font-semibold shadow-f2 border border-fs-1'
          : 'text-ff-3 hover:text-ff-1'
      }`}
    >
      {label}
    </button>
  );
}
