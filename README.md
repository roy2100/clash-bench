# Clash Bench

> **Cinebench for Clash nodes** — 给任意 mihomo/Clash 代理节点跑标准化基准测试，得出 0–12000 的可比较分数。

**[在线体验 →](https://roy2100.github.io/clash-bench/)**

## 测试模式

| 模式 | 说明 |
|------|------|
| **Single Run** | 单节点跑分，约 40 秒完成 Phase 1+2，输出总分 + 等级 |
| **Multi Run** | 多选节点串行跑分，实时排行榜，支持导出 CSV |
| **Stress Test** | 长时间拷机，输出分数曲线 + 衰减分析 |

## 评分体系

```
effectiveLatency = avg × 0.7 + p95 × 0.3
latencyScore     = min(12000, 10000 × 50 / effectiveLatency)
total            = min(12000, latencyScore × successRate² × 1/(1+jitter/100))
```

| 等级 | 分数 | 参考 |
|------|------|------|
| S | 8000+ | 旗舰节点，4K 串流无压力 |
| A | 5000+ | 优秀，日常使用完美 |
| B | 3000+ | 良好，1080p 视频可用 |
| C | 1500+ | 一般，偶有卡顿 |
| D | 500+ | 较差，仅适合文字 |
| F | <500 | 不可用 |

## 快速开始

```bash
npm install
npm run dev
# 访问 http://localhost:5173
```

## 连接 mihomo

Clash Bench 通过浏览器直接调用 mihomo External Controller REST API（默认 `http://127.0.0.1:9090`）。

### 最简配置

```yaml
# config.yaml
external-controller: 127.0.0.1:9090
secret: ""          # 留空，或填写后在应用右上角同步
```

### 公网部署（GitHub Pages / Vercel 等）

从 HTTPS 域名访问时，需要在 mihomo 开启 CORS 和 Private Network Access：

```yaml
external-controller: 127.0.0.1:9090
secret: "your-secret"

external-controller-cors:
  allow-origins:
    - "https://roy2100.github.io"
  allow-private-network: true
```

### 常见报错

| 报错 | 原因 | 解决 |
|------|------|------|
| `ERR_CONNECTION_REFUSED` | mihomo 未启动或端口不对 | 确认进程和端口 |
| `CORS error` | 未配置 allow-origins | 添加来源到 mihomo 配置 |
| `Private Network Access` | Chrome PNA 拦截 | 加 `allow-private-network: true` |

## 已知限制

- 延迟通过 Clash API HTTP 请求测量，不是 ICMP，与真实 ping 值有差异
- 分数受测试时段网络波动影响，±200 pts 属正常范围；Stress Test 是判断稳定性的金标准
- 仅支持 mihomo / Clash Meta，不支持旧版 Clash Premium

## 技术栈

Vite · React 18 · TypeScript · Tailwind CSS · Zustand · Recharts · Framer Motion
