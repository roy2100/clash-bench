# Clash Bench

> **Cinebench for Clash nodes** — 给任意 Clash/mihomo 代理节点跑标准化基准测试，得出 0–12000 的可比较分数。

## 功能

| 模式 | 说明 |
|------|------|
| **Single Run** | 选 1 个节点，约 40 秒完成 Phase 1+2，输出总分 + 等级 |
| **Multi Run** | 多选节点，串行跑分，实时排行榜，支持导出 CSV |
| **Stress Test** | 长时间拷机，输出分数曲线 + 衰减分析 |

### 评分等级

| 等级 | 分数 | 说明 |
|------|------|------|
| S | 8000+ | 旗舰节点 / 4K 串流无压力 |
| A | 5000+ | 优秀 / 日常完美 |
| B | 3000+ | 良好 / 1080p 视频可用 |
| C | 1500+ | 一般 / 偶有卡顿 |
| D | 500+ | 较差 / 仅适合文字 |
| F | <500 | 不可用 |

## 快速开始

```bash
pnpm install
pnpm dev
# 打开 http://localhost:5173
```

## mihomo 配置

Clash Bench 通过浏览器 fetch 调用 mihomo External Controller（默认 `http://127.0.0.1:9090`）。

### 最简配置

```yaml
# config.yaml
external-controller: 127.0.0.1:9090
secret: ""          # 留空或填写后在应用中同步配置
```

### HTTPS 部署（Cloudflare Pages / Vercel）

部署到公网域名后需要在 mihomo 开启 Private Network Access 和 CORS：

```yaml
external-controller: 127.0.0.1:9090
secret: "your-secret"

external-controller-cors:
  allow-origins:
    - "https://your-domain.pages.dev"
  allow-private-network: true
```

### 故障排查

| 报错 | 原因 | 解决方案 |
|------|------|---------|
| `ERR_CONNECTION_REFUSED` | mihomo 未启动 / 端口不对 | 确认 mihomo 进程和端口 |
| `CORS error` | mihomo 没有允许来源 | 添加 `allow-origins` 配置 |
| `private network access` | Chrome PNA 拦截 | mihomo 加 `allow-private-network: true` |
| `Mixed Content` | 浏览器版本过旧 | 升级到 Chrome 94+ / Firefox 84+ |

## 已知限制

- **不支持 ICMP / MTR**：浏览器无原始套接字权限，延迟测量通过 Clash API HTTP 请求实现
- **吞吐量测试需手动切换出口**：Phase 3 默认关闭
- **分数受网络环境影响**：同一节点不同时间差异可达 ±200 分，Stress Test 才是判断稳定性的金标准
- **仅支持 mihomo/Clash Meta**：不支持旧版 Clash Premium

## 技术栈

Vite · React 18 · TypeScript (strict) · Tailwind CSS · Zustand · Recharts · Framer Motion
