import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { BenchResult, Grade } from '../types';

type SqlDB = InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>;

const IDB_NAME = 'clash-bench';
const IDB_STORE = 'sqlite';
const IDB_KEY = 'db';

let _db: SqlDB | null = null;

function getDb(): SqlDB {
  if (!_db) throw new Error('SQLite not ready');
  return _db;
}

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as Uint8Array | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIDB(data: Uint8Array): Promise<void> {
  try {
    const idb = await openIDB();
    await new Promise<void>((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(data, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // best-effort
  }
}

function flush(): void {
  if (!_db) return;
  void saveToIDB(_db.export());
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bench_results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    proxy_name  TEXT    NOT NULL,
    proxy_type  TEXT    NOT NULL,
    config_label TEXT,
    started_at  INTEGER NOT NULL UNIQUE,
    duration_ms INTEGER NOT NULL,
    score_total  REAL   NOT NULL,
    score_grade  TEXT   NOT NULL,
    score_subscores TEXT NOT NULL,
    throughput_mbps REAL,
    samples     TEXT    NOT NULL
  );
`;

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const saved = await loadFromIDB();
  _db = saved ? new SQL.Database(saved) : new SQL.Database();
  _db.run(SCHEMA);
}

export function db_addResult(result: BenchResult): void {
  getDb().run(
    `INSERT OR REPLACE INTO bench_results
       (proxy_name, proxy_type, config_label, started_at, duration_ms,
        score_total, score_grade, score_subscores, throughput_mbps, samples)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.proxyName,
      result.proxyType,
      result.configLabel ?? null,
      result.startedAt,
      result.durationMs,
      result.score.total,
      result.score.grade,
      JSON.stringify(result.score.subscores),
      result.throughputMbps ?? null,
      JSON.stringify(result.samples),
    ],
  );
  flush();
}

export function db_getResults(): BenchResult[] {
  const stmt = getDb().prepare(
    'SELECT * FROM bench_results ORDER BY started_at DESC',
  );
  const rows: BenchResult[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push({
      proxyName: row.proxy_name as string,
      proxyType: row.proxy_type as string,
      configLabel: (row.config_label as string | null) ?? undefined,
      startedAt: row.started_at as number,
      durationMs: row.duration_ms as number,
      score: {
        total: row.score_total as number,
        grade: row.score_grade as Grade,
        subscores: JSON.parse(row.score_subscores as string) as BenchResult['score']['subscores'],
      },
      throughputMbps: (row.throughput_mbps as number | null) ?? undefined,
      samples: JSON.parse(row.samples as string) as BenchResult['samples'],
    });
  }
  stmt.free();
  return rows;
}

export function db_removeResult(startedAt: number): void {
  getDb().run('DELETE FROM bench_results WHERE started_at = ?', [startedAt]);
  flush();
}

export function db_clearResults(): void {
  getDb().run('DELETE FROM bench_results');
  flush();
}
