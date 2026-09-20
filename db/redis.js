/**
 * Universal Upstash Redis REST Client (CommonJS)
 * Compatible with Express server.js & Vercel Serverless Functions
 */

class UpstashRedisRest {
  constructor(url, token) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  async execute(command) {
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) return null;
      const json = await res.json();
      return json.result;
    } catch (_) {
      return null;
    }
  }

  async get(key) {
    const raw = await this.execute(['GET', key]);
    if (!raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return raw;
    }
  }

  async set(key, value, ttlSeconds = 60) {
    const valStr = typeof value === 'string' ? value : JSON.stringify(value);
    const cmd = ttlSeconds > 0 ? ['SET', key, valStr, 'EX', ttlSeconds] : ['SET', key, valStr];
    const res = await this.execute(cmd);
    return res === 'OK';
  }

  async del(key) {
    const res = await this.execute(['DEL', key]);
    return Number(res) > 0;
  }

  async checkRateLimit(identifier, maxRequests = 20, windowSeconds = 60) {
    const key = `bourse:ratelimit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const current = Number((await this.execute(['INCR', key])) || 1);

    if (current === 1) {
      await this.execute(['EXPIRE', key, windowSeconds]);
    }

    const ttl = Number((await this.execute(['TTL', key])) || windowSeconds);
    const resetAt = now + (ttl > 0 ? ttl : windowSeconds);
    const allowed = current <= maxRequests;
    const remaining = Math.max(0, maxRequests - current);

    return { allowed, remaining, resetAt };
  }
}

class MemoryRedisFallback {
  constructor() {
    this.store = new Map();
    this.rateLimits = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlSeconds = 60) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiry });
    return true;
  }

  async del(key) {
    return this.store.delete(key);
  }

  async checkRateLimit(identifier, maxRequests = 20, windowSeconds = 60) {
    const now = Date.now();
    const entry = this.rateLimits.get(identifier);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowSeconds * 1000;
      this.rateLimits.set(identifier, { count: 1, resetAt });
      return { allowed: true, remaining: maxRequests - 1, resetAt: Math.floor(resetAt / 1000) };
    }

    entry.count += 1;
    const allowed = entry.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - entry.count);
    return { allowed, remaining, resetAt: Math.floor(entry.resetAt / 1000) };
  }
}

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new UpstashRedisRest(url, token);
  }

  return new MemoryRedisFallback();
}

module.exports = {
  getRedisClient,
  redis: getRedisClient(),
};
