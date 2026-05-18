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

## Design system

The UI follows **Fluent 2** visual language. When writing or modifying any component, adhere to the rules below.

### Tokens (defined in `tailwind.config.js`)

| Token | Purpose | Value |
|-------|---------|-------|
| `ff-1` | Primary text | `#242424` |
| `ff-2` | Secondary text | `#424242` |
| `ff-3` | Tertiary / label text | `#616161` |
| `ff-4` | Placeholder / caption | `#898989` |
| `fn-1` | Card / surface | `#ffffff` |
| `fn-2` | App background | `#f5f5f5` |
| `fn-3` | Hover fill | `#f0f0f0` |
| `fs-1` | Default border | `#d1d1d1` |
| `fs-2` | Active border | `#c7c7c7` |
| `brand` | Interactive blue | `#0078d4` |
| `brand-hover` | Button hover | `#106ebe` |
| `brand-light` | Tint background | `#eff6fc` |

Shadows: `shadow-f2` (low) → `shadow-f4` → `shadow-f8` → `shadow-f16` (popover). Never use colored or glow shadows.

### Typography

- **Font stack**: `"Segoe UI Variable", "Segoe UI", system-ui` (sans); `"Cascadia Code", Consolas` (mono).
- **Weights**: `font-semibold` for headings, labels, and button text. `font-medium` for emphasis within body. Regular weight for body copy. `font-bold` only for large numeric displays (scores).
- **Monospace** (`font-mono`): data values, proxy names, scores, timestamps. Not for section headings or UI labels.
- **Size scale**: use Tailwind defaults (`text-xs` 12px, `text-sm` 14px, `text-base` 16px). Captions: `text-[10px]` or `text-[11px]`.

### Component rules

**Buttons**
- Primary action: `bg-brand hover:bg-brand-hover text-white rounded` — no gradient, no glow.
- Secondary / ghost: `border border-fs-1 hover:border-fs-2 text-ff-3 hover:text-ff-1 rounded`.
- Destructive: `text-red-500/60 hover:text-red-600 border border-red-400/20 hover:border-red-400/50 rounded`.
- Disabled: `disabled:opacity-30`.

**Inputs**
- `bg-fn-1 border border-fs-1 rounded px-3 py-1.5 text-sm text-ff-1 outline-none focus:border-brand transition-colors`.

**Cards / panels**
- `bg-fn-1 border border-fs-1 rounded-lg shadow-f2`.
- Use `rounded-lg` (6 px) for cards, `rounded` (4 px) for controls, `rounded-xl` (8 px) only for large overlay panels (popovers, modals).

**Navigation (tabs / pivot)**
- Active tab: colored text + 2 px bottom border (`bg-brand h-0.5`). No background fill on the tab itself.
- Inactive: `text-ff-3 hover:text-ff-1`.

**Status indicators**
- Dot indicators: small filled circle, color conveys meaning (brand = running, green-600 = done, red-500 = error).
- Pulse animation on active dots only — no decorative pulsing.

**Animations**
- Motion serves information: progress, state transitions, data updates. No purely decorative motion.
- Entry transitions: `opacity + y` or `opacity + scale`. Duration ≤ 300 ms. Spring for interactive elements, `ease-out` for page-level transitions.
- No `textShadow`, `filter: drop-shadow`, or box-shadow glow on text or icons.

### Grade colors

Grade colors (`grade-S/A/B/C/D/F` in Tailwind, or via `GRADE_COLORS`) are the only intentional departure from neutral Fluent palette — they convey benchmark performance. Always read from `GRADE_COLORS[grade]`, never hardcode hex. Use them for text and thin borders/fills only; do not add glow effects on top.
