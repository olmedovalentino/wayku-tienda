import { beforeEach, describe, expect, it } from 'vitest';
import { createCheckoutReleaseToken, isValidCheckoutReleaseToken } from '@/lib/checkout-security';

describe('checkout release token', () => {
    beforeEach(() => {
        process.env.CHECKOUT_RELEASE_SECRET = 'checkout-secret-for-tests';
    });

    it('creates a verifiable token for an order', () => {
        const token = createCheckoutReleaseToken('ORD-123');

        expect(token).toBeTruthy();
        expect(isValidCheckoutReleaseToken('ORD-123', token)).toBe(true);
    });

    it('rejects tokens for a different order', () => {
        const token = createCheckoutReleaseToken('ORD-123');

        expect(isValidCheckoutReleaseToken('ORD-999', token)).toBe(false);
    });
});
