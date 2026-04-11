import crypto from 'crypto';

function getCheckoutReleaseSecret(): string {
    return process.env.CHECKOUT_RELEASE_SECRET || process.env.ADMIN_SESSION_SECRET || '';
}

export function createCheckoutReleaseToken(orderId: string): string {
    const secret = getCheckoutReleaseSecret();
    if (!secret) {
        throw new Error('Missing CHECKOUT_RELEASE_SECRET or ADMIN_SESSION_SECRET');
    }

    return crypto
        .createHmac('sha256', secret)
        .update(orderId)
        .digest('base64url');
}

export function isValidCheckoutReleaseToken(orderId: string, token?: string | null): boolean {
    if (!token) return false;

    const secret = getCheckoutReleaseSecret();
    if (!secret) return false;

    const expected = crypto
        .createHmac('sha256', secret)
        .update(orderId)
        .digest('base64url');

    const providedBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expected);

    if (providedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
