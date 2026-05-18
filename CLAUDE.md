# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev       # Vite dev server on :5173

# Type checking
npx tsc -p tsconfig.app.json --noEmit

# Tests (vitest, node env, src/**/*.test.ts)
npm test                                          # watch mode
npx vitest run --config vitest.config.ts          # single run
npx vitest run --config vitest.config.ts src/lib/scoring.test.ts  # single file

# Production build (output → dist/)
npm run build
```

## Architecture

**Data flow**: `ClashAPI` (HTTP) → `BenchRunner` (event emitter) → feature hook → React state → UI.

### Core engine (`src/lib/`)

| File | Role |
|------|------|
| `scoring.ts` | `computeScore()` — deterministic formula, no side effects. Single source of truth for grades. |
| `stats.ts` | `calcStats()` — avg, p95, stddev over `number[]`. |
| `bench.ts` | `BenchRunner` class — runs Phase 1 (burst) + Phase 2 (hold) + optional Phase 3 (throughput), fires `BenchEvents` callbacks, supports `abort()`. |

**Scoring formula** (caps at 12000):
```
effectiveLatency = avg×0.7 + p95×0.3
latencyScore     = min(12000, 10000 × 50/effectiveLatency)
total            = min(12000, latencyScore × successRate² × 1/(1+jitter/100) × throughputBonus)
```
Grade thresholds: S≥8000, A≥5000, B≥3000, C≥1500, D≥500, F<500.

### State (`src/store/`)

Three Zustand stores, all persisted to localStorage:
- `connectionStore` — API URL, secret, connection status, proxy list, live `ClashAPI` instance.
- `modeStore` — current mode (`single|multi|stress`) and `BenchConfig`.
- `historyStore` — `BenchResult[]`, max 100, FIFO eviction.

### Feature modules (`src/features/`)

Each mode is self-contained: a `use*Bench` hook owns all async logic and state machine, the `*View` component is a thin shell.

- **single/**: `useSingleBench` manages `idle → running → result` state machine. `RunningStage` receives `LiveData` (live score, samples, phase progress) as props. `ResultStage` is pure display.
- **multi/**: `useMultiBench` serialises `BenchRunner` calls across selected proxies, keeps sorted `BenchResult[]`. Uses a shorter `MINI_CONFIG` (10+10 rounds).
- **stress/**: `useStressBench` loops `BenchRunner` with `MINI_CONFIG` (phase1Rounds=0, 10×hold) every ~12s, accumulates `StressPoint[]` for decay analysis.
- **history/**: `historyStore` doubles as the persistence layer; `HistoryView` reads directly from it.

### Key shared components (`src/components/`)

- `PulseGrid` — Canvas animation, color-keyed to current `Grade`, runs `requestAnimationFrame` loop. Re-mounts on grade change (keyed by `grade` in `useEffect` deps).
- `ScoreDisplay` — Framer Motion spring animation from previous score to new score. Uses `useSpring` + `useTransform`.
- `GradeBadge` — Animated entry when `animate` prop is true (scale + rotate spring).
- `ScoreTimeline` — Recharts `LineChart` with **dynamic Y domain** derived from data range (±40% padding, min 0, max 12000). Auto-hides grade reference lines outside the viewport.

### API client (`src/api/clash.ts`)

`ClashAPI` wraps mihomo External Controller REST API. `getProxies()` filters out non-proxy types: `Selector, URLTest, Fallback, LoadBalance, Relay, GLOBAL, DIRECT, REJECT, RejectDrop, Compatible, Pass`.

### Type system (`src/types/index.ts`)

`GRADE_COLORS` and `GRADE_LABELS` are the canonical maps — always derive colour from these, never hardcode.
