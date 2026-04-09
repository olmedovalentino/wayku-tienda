import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function base64UrlToBase64(value: string): string {
    return value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
}

function decodePayload(encodedPayload: string): { exp?: number } | null {
    try {
        const payloadText = atob(base64UrlToBase64(encodedPayload));
        return JSON.parse(payloadText);
    } catch {
        return null;
    }
}

async function verifyTokenSignature(encodedPayload: string, signature: string, secret: string): Promise<boolean> {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );
    return crypto.subtle.verify(
        'HMAC',
        key,
        Uint8Array.from(atob(base64UrlToBase64(signature)), c => c.charCodeAt(0)),
        new TextEncoder().encode(encodedPayload)
    );
}

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get('admin_session')?.value;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!token || !secret) return false;

    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return false;

    const payload = decodePayload(encodedPayload);
    if (!payload?.exp || payload.exp <= Math.floor(Date.now() / 1000)) return false;

    return verifyTokenSignature(encodedPayload, signature, secret);
}

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const isAdminPage = pathname.startsWith('/admin');
    const isAdminApi = pathname.startsWith('/api/admin');
    const isAdminLogin = pathname === '/admin/login';
    const isAuthorized = await hasValidAdminSession(request);

    if (isAdminPage && !isAdminLogin && !isAuthorized) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isAdminApi && !isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
