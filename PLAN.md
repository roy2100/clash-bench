# Clash Bench — Claude Code 实施计划

> 产品定位：**Cinebench for Clash nodes**。给任意 Clash/mihomo 代理节点跑一个标准化基准测试，得出一个可比较的「跑分」。

---

## 产品概述

**项目名**:clash-bench

**核心价值主张**:用户面对几十上百个机场节点时,不需要再看一堆原始延迟/丢包数据自己脑补谁好谁坏——按一下 Run,60 秒后得到一个 1500–12000 区间的分数,越高越好。

**关键设计原则**(从 Cinebench 借鉴):

1. **单一指标至上**——hero score 是产品门面,所有细节让位于这个数字
2. **跑测过程视觉化**——测试中要有「正在工作」的实时反馈,不是静态进度条
3. **可复现的标准化负载**——同一个节点不同时间跑,分数应该可比较
4. **天梯图(leaderboard)思维**——分数本身没意义,对比才有意义

**部署方式**:

1. 本地开发:`pnpm dev`
2. HTTPS 公网托管(推荐):Cloudflare Pages / Vercel
3. 本地静态:`pnpm build` 后 `file://` 打开

详见「浏览器安全策略与 CORS 配置」章节。

---

## 评分模型(核心算法)

### 测试流程(Single Run,约 60 秒)

| 阶段 | 时长 | 内容 |
|------|------|------|
| **Phase 1: Latency Burst** | 10s | 20 轮快速 delay 测试,间隔 500ms |
| **Phase 2: Stability Hold** | 30s | 30 轮慢速 delay 测试,间隔 1000ms |
| **Phase 3: Throughput** *(可选)* | 20s | 下载固定大小文件,要求用户预先切换出口节点 |

Phase 1 测**瞬时性能**(节点的「峰值频率」),Phase 2 测**持续稳定性**(节点的「降频表现」),Phase 3 是 bonus(默认关闭,因为浏览器无法自动切换出口,需要用户手动操作)。

### 评分公式

```typescript
// lib/scoring.ts

export interface ScoreInput {
  avgLatency: number;        // ms, Phase 1+2 合并均值
  p95Latency: number;        // ms, Phase 1+2 合并 p95
  jitter: number;            // ms, 标准差
  successRate: number;       // 0..1
  throughputMbps?: number;   // 可选
}

export interface ScoreOutput {
  total: number;             // 最终分数
  subscores: {
    latency: number;         // 延迟原始分
    stabilityFactor: number; // 稳定性系数
    jitterFactor: number;    // 抖动系数
    throughputBonus: number; // 吞吐加成系数
  };
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export function computeScore(input: ScoreInput): ScoreOutput {
  // 1. 延迟原始分:50ms = 10000 分,反比例
  //    使用 avg 和 p95 的加权平均(70/30)作为有效延迟
  const effectiveLatency = input.avgLatency * 0.7 + input.p95Latency * 0.3;
  const latencyScore = Math.min(12000, 10000 * (50 / effectiveLatency));

  // 2. 稳定性系数:成功率的平方,指数惩罚丢包
  const stabilityFactor = Math.pow(input.successRate, 2);

  // 3. 抖动系数:σ < 20ms 接近 1.0,σ 越大越接近 0
  const jitterFactor = 1 / (1 + input.jitter / 100);

  // 4. 吞吐加成:100 Mbps 给 1.2x,封顶 1.5x
  const throughputBonus = input.throughputMbps
    ? 1 + Math.min(0.5, input.throughputMbps / 250)
    : 1.0;

  const total = Math.round(
    latencyScore * stabilityFactor * jitterFactor * throughputBonus
  );

  return {
    total,
    subscores: {
      latency: Math.round(latencyScore),
      stabilityFactor: Number(stabilityFactor.toFixed(3)),
      jitterFactor: Number(jitterFactor.toFixed(3)),
      throughputBonus: Number(throughputBonus.toFixed(3)),
    },
    grade: getGrade(total),
  };
}

function getGrade(score: number): ScoreOutput['grade'] {
  if (score >= 8000) return 'S';
  if (score >= 5000) return 'A';
  if (score >= 3000) return 'B';
  if (score >= 1500) return 'C';
  if (score >= 500)  return 'D';
  return 'F';
}
```

### 等级与配色

| 等级 | 分数 | 颜色 token | 描述 |
|------|------|-----------|------|
| **S** | 8000+ | `--s-color: #00d4ff` | 旗舰节点 / 4K 串流无压力 |
| **A** | 5000+ | `--a-color: #00e676` | 优秀 / 日常完美 |
| **B** | 3000+ | `--b-color: #a0e02c` | 良好 / 1080p 视频可用 |
| **C** | 1500+ | `--c-color: #ffd740` | 一般 / 偶有卡顿 |
| **D** | 500+ | `--d-color: #ff9800` | 较差 / 仅适合文字 |
| **F** | <500 | `--f-color: #ff4444` | 不可用 |

---

## 三种使用模式

### Mode 1: Single Run(跑分模式 / 默认)

**目标用户**:「这个新节点到底行不行?」

**流程**:

1. 用户从下拉框选择 1 个节点
2. 点击巨型 RUN 按钮
3. 屏幕进入「跑分中」全屏状态:
   - 中央动态显示当前累计分数(数字滚动效果)
   - 左侧 Phase 1/2/3 状态列表,当前阶段高亮
   - 底部实时折线图显示当前节点的延迟波动
   - 右侧实时子分数(延迟分、稳定性、抖动)
4. 60 秒后定格在最终分数页:
   - 巨大的总分 + 等级徽章
   - 子分数明细
   - 「保存到历史」「分享」「再来一次」按钮

**视觉参考**:Cinebench R23 跑分时左下角累计像素 / 中央渲染预览。

### Mode 2: Multi Run(天梯榜模式)

**目标用户**:「我有 50 个节点,哪些值得用?」

**流程**:

1. 用户多选 N 个节点(左侧列表勾选)
2. 设置每节点测试时长(默认 30 秒,比 Single Run 短,避免太慢)
3. 点击 Start Benchmark
4. 顶部显示总进度(节点 i/N + 当前节点剩余秒数)
5. 中央显示**实时排行榜**,每个节点跑完一个就插入对应位置,带分数和等级
6. 全部完成后导出 CSV / 截图

**关键 UX**:当前正在测的节点用脉冲动画高亮,已完成的节点按分数排序(从高到低),未测的节点灰色占位。

### Mode 3: Stress Test(拷机模式)

**目标用户**:「这个节点白天好用,晚上 22:00 之后还能用吗?」

**流程**:

1. 用户选 1 个节点
2. 设置时长(10 分钟 / 30 分钟 / 1 小时 / 无限)
3. 启动后每 60 秒生成一次「迷你跑分」(不完整 Phase 1/2/3,只做简化版 Phase 2)
4. 显示分数随时间的变化曲线
5. 输出:
   - 平均分、最低分、最高分
   - 稳定性评级(基于分数标准差)
   - 高峰期衰减百分比(前 10% 时段均值 vs 后 10% 时段均值)

---

## 技术栈

- **构建**:Vite + React 18 + TypeScript(`strict: true`)
- **样式**:Tailwind CSS + CSS Variables
- **状态**:Zustand
- **图表**:Recharts
- **动画**:Framer Motion(hero number rolling、phase 切换、徽章入场)
- **持久化**:localStorage(配置 + 分数历史)
- **包管理**:pnpm

新增依赖(相对于上一版 plan):`framer-motion`。

---

## 目录结构

```
clash-bench/
├── src/
│   ├── api/
│   │   └── clash.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # API 配置 + 连接状态
│   │   │   └── ModeSwitcher.tsx    # Single / Multi / Stress 三态切换
│   │   ├── shared/
│   │   │   ├── ProxyPicker.tsx     # 节点选择器(单选/多选适配)
│   │   │   ├── ScoreDigit.tsx      # 数字滚动动画组件
│   │   │   ├── GradeBadge.tsx      # S/A/B/C/D/F 徽章
│   │   │   ├── PhaseList.tsx       # 测试阶段进度列表
│   │   │   └── PulseGrid.tsx       # 跑测时的背景动画
│   │   └── charts/
│   │       ├── LatencyWaveform.tsx # 实时延迟波形
│   │       └── ScoreTimeline.tsx   # 拷机模式的分数曲线
│   ├── features/
│   │   ├── single/
│   │   │   ├── SingleRunView.tsx
│   │   │   ├── RunningStage.tsx    # 跑分中全屏页
│   │   │   ├── ResultStage.tsx     # 结果页
│   │   │   └── useSingleBench.ts
│   │   ├── multi/
│   │   │   ├── MultiRunView.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── useMultiBench.ts
│   │   ├── stress/
│   │   │   ├── StressView.tsx
│   │   │   └── useStressBench.ts
│   │   └── history/
│   │       ├── HistoryView.tsx     # 历史跑分记录
│   │       └── historyStore.ts
│   ├── store/
│   │   ├── connectionStore.ts
│   │   └── modeStore.ts            # 当前模式 + 配置
│   ├── lib/
│   │   ├── scoring.ts              # 核心评分算法
│   │   ├── bench.ts                # 跑分引擎(运行 Phase 1/2/3)
│   │   ├── stats.ts                # avg, p95, stddev
│   │   ├── format.ts
│   │   └── export.ts               # CSV / 图片导出
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 核心数据模型

```typescript
// types/index.ts

export interface Proxy {
  name: string;
  type: string;
}

export interface DelaySample {
  timestamp: number;
  delay: number | null;     // null = 超时
  phase: 'burst' | 'hold' | 'throughput';
}

export interface BenchResult {
  proxyName: string;
  proxyType: string;
  startedAt: number;
  durationMs: number;
  samples: DelaySample[];
  throughputMbps?: number;
  score: ScoreOutput;       // 见 scoring.ts
}

export interface BenchConfig {
  testUrl: string;          // default: http://www.gstatic.com/generate_204
  timeoutMs: number;        // default: 5000
  phase1Rounds: number;     // default: 20
  phase1IntervalMs: number; // default: 500
  phase2Rounds: number;     // default: 30
  phase2IntervalMs: number; // default: 1000
  throughputEnabled: boolean;
  throughputUrl?: string;
}

export type AppMode = 'single' | 'multi' | 'stress';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
```

---

## 跑分引擎(关键实现)

```typescript
// lib/bench.ts

import { ClashAPI } from '../api/clash';
import { computeScore } from './scoring';
import { calcStats } from './stats';

export interface BenchEvents {
  onPhaseStart: (phase: 'burst' | 'hold' | 'throughput') => void;
  onSample: (sample: DelaySample) => void;
  onProgress: (progress: { phase: string; current: number; total: number }) => void;
  onComplete: (result: BenchResult) => void;
}

export class BenchRunner {
  private aborted = false;

  constructor(
    private api: ClashAPI,
    private proxyName: string,
    private proxyType: string,
    private config: BenchConfig,
    private events: Partial<BenchEvents> = {}
  ) {}

  abort() { this.aborted = true; }

  async run(): Promise<BenchResult> {
    const samples: DelaySample[] = [];
    const startedAt = Date.now();

    // Phase 1: Burst
    this.events.onPhaseStart?.('burst');
    for (let i = 0; i < this.config.phase1Rounds; i++) {
      if (this.aborted) break;
      const delay = await this.api.testDelay(
        this.proxyName, this.config.testUrl, this.config.timeoutMs
      );
      const sample: DelaySample = { timestamp: Date.now(), delay, phase: 'burst' };
      samples.push(sample);
      this.events.onSample?.(sample);
      this.events.onProgress?.({ phase: 'burst', current: i + 1, total: this.config.phase1Rounds });
      if (i < this.config.phase1Rounds - 1) await sleep(this.config.phase1IntervalMs);
    }

    // Phase 2: Hold
    this.events.onPhaseStart?.('hold');
    for (let i = 0; i < this.config.phase2Rounds; i++) {
      if (this.aborted) break;
      const delay = await this.api.testDelay(
        this.proxyName, this.config.testUrl, this.config.timeoutMs
      );
      const sample: DelaySample = { timestamp: Date.now(), delay, phase: 'hold' };
      samples.push(sample);
      this.events.onSample?.(sample);
      this.events.onProgress?.({ phase: 'hold', current: i + 1, total: this.config.phase2Rounds });
      if (i < this.config.phase2Rounds - 1) await sleep(this.config.phase2IntervalMs);
    }

    // Phase 3: Throughput (optional)
    let throughputMbps: number | undefined;
    if (this.config.throughputEnabled && this.config.throughputUrl && !this.aborted) {
      this.events.onPhaseStart?.('throughput');
      throughputMbps = await this.measureThroughput(this.config.throughputUrl);
    }

    // Compute score
    const delays = samples.map(s => s.delay).filter((d): d is number => d !== null);
    const stats = calcStats(delays);
    const successRate = delays.length / samples.length;

    const score = computeScore({
      avgLatency: stats.avg ?? 9999,
      p95Latency: stats.p95 ?? 9999,
      jitter: stats.stddev ?? 9999,
      successRate,
      throughputMbps,
    });

    const result: BenchResult = {
      proxyName: this.proxyName,
      proxyType: this.proxyType,
      startedAt,
      durationMs: Date.now() - startedAt,
      samples,
      throughputMbps,
      score,
    };

    this.events.onComplete?.(result);
    return result;
  }

  private async measureThroughput(url: string): Promise<number> {
    // fetch + ReadableStream,返回 Mbps
    const t0 = performance.now();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return 0;
    const reader = res.body!.getReader();
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
    }
    const elapsed = (performance.now() - t0) / 1000;
    return (received * 8) / elapsed / 1e6;
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
```

---

## UI 设计原则(Cinebench 美学)

### 配色

- 深空背景:`#050810` 主背景,`#0a0f1a` 次级
- 等级色作为强调色(S 青、A 绿、B 黄绿、C 黄、D 橙、F 红)
- 网格线和分隔线极淡:`rgba(255,255,255,0.04)`

### 字体

- **大数字(hero score)**:`Space Mono` 或 `JetBrains Mono` 700 weight,字号 96–144px
- **正文**:`IBM Plex Sans`
- **标签 / 等级**:等宽字体大写,字间距 0.1em

### 动画(Framer Motion)

- **数字滚动**:跑分中分数从 0 滚动到当前累计值,使用 `animate` + spring
- **Phase 切换**:当前 phase 高亮带 layout animation,过渡时背景脉冲一次
- **Grade Badge 入场**:结果定格时徽章从中央放大 + 旋转 15° → 0°,带光晕扩散
- **Leaderboard 排序动画**:Multi Run 模式新节点完成后,列表用 `AnimatePresence` 重新排序

### 背景动效

`PulseGrid` 组件:跑分中显示一个柔和的呼吸网格背景,颜色根据实时分数变化(低分偏红,高分偏青)。Canvas 实现或 CSS animation。

---

## 状态管理

### `connectionStore`

```typescript
interface ConnectionStore {
  apiBase: string;
  apiSecret: string;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  proxies: Proxy[];
  api: ClashAPI | null;
  setConfig(base: string, secret: string): void;
  connect(): Promise<void>;
}
```

### `modeStore`

```typescript
interface ModeStore {
  mode: AppMode;
  config: BenchConfig;
  setMode(mode: AppMode): void;
  updateConfig(patch: Partial<BenchConfig>): void;
}
```

### `historyStore`

```typescript
interface HistoryStore {
  records: BenchResult[];           // 最多保留 100 条
  add(result: BenchResult): void;
  remove(index: number): void;
  clear(): void;
  exportCSV(): string;
}
```

所有 store 通过 Zustand 的 `persist` middleware 写入 localStorage。

---

## 浏览器安全策略与 CORS 配置

本工具通过 fetch 调用 `http://127.0.0.1:9090`,涉及三层策略:

### 1. Mixed Content(HTTPS → HTTP)

W3C Secure Contexts 规范将 `127.0.0.0/8`、`::1/128`、`localhost`、`file://` 视为 potentially trustworthy origin。HTTPS 页面访问这些地址不算混合内容,浏览器放行。Chrome 67+、Firefox 84+、Safari 已稳定实施。

### 2. CORS

mihomo 默认对外部控制器响应 `Access-Control-Allow-Origin: *`。如需精确控制:

```yaml
external-controller-cors:
  allow-origins:
    - 'https://your-deployed-domain.pages.dev'
  allow-private-network: true
```

### 3. Private Network Access(PNA)

Chrome 94+ 对 public → private 请求要求 preflight 响应带 `Access-Control-Allow-Private-Network: true`。mihomo 的 `allow-private-network: true` 启用此响应头。

### 故障排查清单(写入 README)

| 报错 | 原因 | 解决方案 |
|------|------|---------|
| `Mixed Content` | 浏览器过旧 | 升级到 Chrome 67+ / Firefox 84+ |
| `CORS` | mihomo 未启动 / 配置不匹配 | 检查进程和端口 |
| `private network access` | Chrome PNA | mihomo 加 `allow-private-network: true` |
| `ERR_CONNECTION_REFUSED` | mihomo 未启动 / 防火墙 | 启动 mihomo / 检查防火墙 |

---

## 实施步骤

### Phase A: 地基(步骤 1–4)

1. **脚手架**:`pnpm create vite clash-bench --template react-ts`,装 `zustand recharts framer-motion`,配置 Tailwind。
2. **API + 类型**:实现 `api/clash.ts` 和 `types/index.ts`,最小 demo 验证 Clash API 连通。
3. **Store**:`connectionStore` + `modeStore` + `historyStore`,含 localStorage 持久化。
4. **静态布局**:Header(连接配置)+ ModeSwitcher(三态切换 tab)+ 空主区。先把节点列表加载和搜索做出来。

### Phase B: 核心算法(步骤 5–6)

5. **评分引擎**:实现 `lib/scoring.ts` 和 `lib/stats.ts`,写至少 10 个单测覆盖各种边界(全失败、单样本、超长延迟等)。
6. **跑分引擎**:实现 `lib/bench.ts` 的 `BenchRunner`,先不接 UI,用 `console.log` 验证三个 Phase 都跑完且能得分。

### Phase C: Single Run(步骤 7–9)

7. **静态结果页**:先把 `ResultStage` 做好(hero score + grade badge + 子分数面板)。用 mock 数据驱动。
8. **跑分中页面**:`RunningStage` 接入 `BenchRunner` 的事件流,实时更新分数、波形、phase 列表。这一步要打磨好,是产品的灵魂场景。
9. **数字滚动 + 徽章动画**:用 Framer Motion 打磨 hero score 的滚动效果和结果定格的徽章入场。

### Phase D: 扩展(步骤 10–12)

10. **Multi Run + Leaderboard**:复用 `BenchRunner`,串行跑多节点,实时排行榜插入排序。
11. **Stress Test**:长时间跑分,结果展示分数时间序列 + 衰减分析。
12. **History + Export**:跑分记录列表,支持删除、CSV 导出、单条详情查看。

### Phase E: 打磨(步骤 13–14)

13. **错误处理 + 空态**:连接断开、节点不存在、所有样本超时等异常路径。
14. **可选部署**:`pnpm build` → Cloudflare Pages。README 写好首次使用指引(含 mihomo CORS 配置示例)。

---

## 验收标准

### 功能

- Single Run:选 1 个节点,60 秒内完成测试,得出 0–12000 区间合理分数。
- Multi Run:选 10 个节点,串行跑分,实时排行榜正确排序,最后能导出 CSV。
- Stress Test:跑 10 分钟,分数曲线无内存泄漏,能算出衰减百分比。
- History:跑分记录持久化到 localStorage,刷新页面后还在;最多 100 条,超出自动淘汰最旧的。

### 视觉

- 跑分中页面**全屏沉浸感**——hero score 字号 ≥ 120px,背景脉冲动画顺滑。
- Grade Badge 等级颜色和分数严格对应,不能错位。
- 数字滚动动画流畅,无掉帧(60fps)。
- 桌面 1280×800 + 移动 375×667 都正常。

### 工程

- TypeScript `strict: true` 全绿,无 any。
- `lib/scoring.ts` 和 `lib/stats.ts` 单测覆盖率 ≥ 80%。
- Lighthouse Performance ≥ 90(静态资源体积合理)。

---

## 注意事项与已知限制

写进 README:

- **不支持 ICMP / MTR**:浏览器无原始套接字权限。如需丢包逐跳分析,用命令行工具。
- **吞吐量测试需手动切换出口**:浏览器走系统代理。默认关闭 Phase 3。
- **分数不是绝对真理**:网络环境波动大,同一节点同一时间不同设备跑可能差几百分。Stress Test 才是判断稳定性的金标准。
- **HTTPS 部署需 mihomo 配合**:见「浏览器安全策略与 CORS 配置」章节。

---

## 启动命令

把本文件保存为项目根目录的 `PLAN.md`,对 Claude Code 说:

> 按 `PLAN.md` 的 Phase A → E 顺序实施。每完成一个 Phase 暂停,给我看运行截图再继续。重点打磨 Phase C 的 Single Run 跑分中页面——那是产品门面。