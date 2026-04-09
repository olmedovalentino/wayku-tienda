type Bucket = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, Bucket>();
let upstashLimiter: any = null;
let upstashInitAttempted = false;

export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return 'unknown';
}

async function getUpstashLimiter(limit: number, windowMs: number) {
    if (upstashLimiter) return upstashLimiter;
    if (upstashInitAttempted) return null;
    upstashInitAttempted = true;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    try {
        const { Redis } = await import('@upstash/redis');
        const { Ratelimit } = await import('@upstash/ratelimit');
        const redis = new Redis({ url, token });
        upstashLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
            analytics: false,
            timeout: 1000,
        });
        return upstashLimiter;
    } catch {
        return null;
    }
}

export async function enforceRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
    const limiter = await getUpstashLimiter(limit, windowMs);
    if (limiter) {
        try {
            const result = await limiter.limit(key);
            if (!result.success) {
                return {
                    allowed: false,
                    retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
                };
            }
            return { allowed: true, retryAfterSeconds: 0 };
        } catch {
            // Fall through to in-memory limiter.
        }
    }

    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
    }

    if (current.count >= limit) {
        return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
        };
    }

    current.count += 1;
    buckets.set(key, current);
    return { allowed: true, retryAfterSeconds: 0 };
}
