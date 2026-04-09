type Bucket = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return 'unknown';
}

export function enforceRateLimit(
    key: string,
    limit: number,
    windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
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
