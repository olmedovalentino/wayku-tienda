import { describe, expect, it, beforeEach } from 'vitest';
import { createAdminSessionToken, isValidAdminSessionToken } from '@/lib/admin-session';

describe('admin session token', () => {
    beforeEach(() => {
        process.env.ADMIN_SESSION_SECRET = 'test-secret-123456789';
    });

    it('creates and validates token', () => {
        const token = createAdminSessionToken('admin');
        expect(typeof token).toBe('string');
        expect(isValidAdminSessionToken(token)).toBe(true);
    });

    it('rejects malformed token', () => {
        expect(isValidAdminSessionToken('invalid.token')).toBe(false);
    });
});
