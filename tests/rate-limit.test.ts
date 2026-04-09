import { describe, expect, it } from 'vitest';
import { enforceRateLimit } from '@/lib/rate-limit';

describe('rate limit fallback', () => {
    it('blocks when limit exceeded in window', async () => {
        const key = `test-${Date.now()}`;
        const first = await enforceRateLimit(key, 1, 10_000);
        const second = await enforceRateLimit(key, 1, 10_000);

        expect(first.allowed).toBe(true);
        expect(second.allowed).toBe(false);
        expect(second.retryAfterSeconds).toBeGreaterThan(0);
    });
});
