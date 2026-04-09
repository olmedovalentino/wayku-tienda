import crypto from 'crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
    u: string;
    exp: number;
};

function getSecret(): string {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        throw new Error('Missing ADMIN_SESSION_SECRET');
    }
    return secret;
}

function base64UrlEncode(input: string): string {
    return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
    return Buffer.from(input, 'base64url').toString('utf8');
}

function signPayload(encodedPayload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

export function createAdminSessionToken(username: string): string {
    const secret = getSecret();
    const payload: SessionPayload = {
        u: username,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = signPayload(encodedPayload, secret);
    return `${encodedPayload}.${signature}`;
}

export function isValidAdminSessionToken(token?: string | null): boolean {
    if (!token) return false;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) return false;

    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return false;

    const expected = signPayload(encodedPayload, secret);
    const provided = Buffer.from(signature);
    const required = Buffer.from(expected);

    if (provided.length !== required.length) return false;
    if (!crypto.timingSafeEqual(provided, required)) return false;

    try {
        const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
        return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}
