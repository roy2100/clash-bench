import type { Proxy } from '../types';

export class ClashAPI {
  private base: string;
  private secret: string;

  constructor(base: string, secret: string) {
    this.base = base.replace(/\/$/, '');
    this.secret = secret;
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.secret) h['Authorization'] = `Bearer ${this.secret}`;
    return h;
  }

  async getVersion(): Promise<{ version: string }> {
    const res = await fetch(`${this.base}/version`, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ version: string }>;
  }

  async getProxies(): Promise<Proxy[]> {
    const res = await fetch(`${this.base}/proxies`, { headers: this.headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { proxies: Record<string, { type: string; name?: string }> };
    return Object.entries(data.proxies)
      .filter(([, v]) => !['Selector', 'URLTest', 'Fallback', 'LoadBalance', 'Relay', 'GLOBAL', 'DIRECT', 'REJECT', 'RejectDrop', 'Compatible', 'Pass'].includes(v.type))
      .map(([name, v]) => ({ name, type: v.type }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getGroupNow(groupName: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.base}/proxies/${encodeURIComponent(groupName)}`, { headers: this.headers() });
      if (!res.ok) return null;
      const data = await res.json() as { now?: string };
      return data.now ?? null;
    } catch {
      return null;
    }
  }

  async setGroupProxy(groupName: string, proxyName: string): Promise<void> {
    await fetch(`${this.base}/proxies/${encodeURIComponent(groupName)}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ name: proxyName }),
    });
  }

  async testDelay(proxyName: string, url: string, timeoutMs: number): Promise<number | null> {
    try {
      const params = new URLSearchParams({ url, timeout: String(timeoutMs) });
      const encoded = encodeURIComponent(proxyName);
      const res = await fetch(`${this.base}/proxies/${encoded}/delay?${params}`, {
        headers: this.headers(),
      });
      if (!res.ok) return null;
      const data = await res.json() as { delay?: number };
      return data.delay ?? null;
    } catch {
      return null;
    }
  }
}
