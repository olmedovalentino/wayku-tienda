import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminSessionToken } from '@/lib/admin-session';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (!adminUser || !adminPass) {
            return NextResponse.json({ success: false, error: 'Configuración de servidor incompleta (Variables de Entorno faltantes)' }, { status: 500 });
        }
        if (!process.env.ADMIN_SESSION_SECRET) {
            return NextResponse.json({ success: false, error: 'Falta ADMIN_SESSION_SECRET' }, { status: 500 });
        }

        if (username === adminUser && password === adminPass) {
            // Set an HttpOnly cookie
            const cookieStore = await cookies();
            cookieStore.set('admin_session', createAdminSessionToken(username), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Error en el servidor' }, { status: 500 });
    }
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return NextResponse.json({ success: true });
}
