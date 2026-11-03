// Fixed-size sliding window per key, held in this server process only. It bounds accidental or abusive cost per user
// on one instance; it is not a substitute for a provider-side spending cap, and it resets when the server restarts.
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return function check(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const t = now();
    const recent = (hits.get(key) ?? []).filter(x => t - x < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - t) / 1000)) };
    }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(x => t - x < windowMs)) hits.delete(k);
    return { allowed: true, retryAfterSeconds: 0 };
  };
}
