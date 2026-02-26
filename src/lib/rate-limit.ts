/**
 * In-memory IP-based rate limiter.
 *
 * Limits each IP to MAX_REQUESTS requests per WINDOW_MS milliseconds.
 * NOTE: This implementation is suitable for single-instance (non-serverless)
 * deployments. For distributed/edge environments, replace the in-process Map
 * with a shared store such as Upstash Redis.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically prune expired entries to avoid unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store.entries())) {
    if (entry.resetAt < now) store.delete(key);
  }
}, WINDOW_MS);

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
  /** Seconds until the window resets (useful for Retry-After header) */
  retryAfterSeconds: number;
}

/**
 * Check / increment the rate-limit counter for the given IP.
 * Call this at the top of any API route handler.
 *
 * @example
 * const result = rateLimit(req.headers.get("x-forwarded-for") ?? "unknown");
 * if (!result.success) {
 *   return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
 * }
 */
export function rateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const existing = store.get(ip);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + WINDOW_MS;
    store.set(ip, { count: 1, resetAt });
    return {
      success: true,
      remaining: MAX_REQUESTS - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: MAX_REQUESTS - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

export { MAX_REQUESTS, WINDOW_MS };
