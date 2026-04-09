import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const rate = await enforceRateLimit(`coupon-validate:${ip}`, 40, 60_000);
        if (!rate.allowed) {
            return NextResponse.json(
                { valid: false, error: `Too many requests. Retry in ${rate.retryAfterSeconds}s.` },
                { status: 429 }
            );
        }

        const { code, email } = await req.json();
        const normalizedCode = String(code || '').trim().toUpperCase();
        if (!normalizedCode) {
            return NextResponse.json({ valid: false, error: 'Ingresa un código' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const { data, error } = await admin
            .from('coupons')
            .select('code, discount_percentage, is_active, expires_at')
            .eq('code', normalizedCode)
            .single();

        if (error || !data) {
            return NextResponse.json({ valid: false, error: 'Código inválido o no encontrado' }, { status: 404 });
        }
        if (!data.is_active) {
            return NextResponse.json({ valid: false, error: 'El cupón está desactivado' }, { status: 400 });
        }
        if (data.expires_at && new Date(data.expires_at) <= new Date()) {
            return NextResponse.json({ valid: false, error: 'Este cupón ya venció' }, { status: 400 });
        }

        if (normalizedCode === 'PRIMERACOMPRA10') {
            const normalizedEmail = String(email || '').trim().toLowerCase();
            if (!normalizedEmail) {
                return NextResponse.json({ valid: false, error: 'Debes iniciar sesión para usar este cupón.' }, { status: 400 });
            }

            const { count, error: countError } = await admin
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .ilike('email', normalizedEmail);

            if (countError) {
                return NextResponse.json({ valid: false, error: 'No se pudo validar primera compra' }, { status: 500 });
            }
            if ((count || 0) > 0) {
                return NextResponse.json({ valid: false, error: 'Este cupón es exclusivo para tu primera compra (ya registramos pedidos anteriores con tu email).' }, { status: 400 });
            }
        }

        return NextResponse.json({
            valid: true,
            code: data.code,
            discountPercentage: data.discount_percentage,
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error al validar el cupón';
        return NextResponse.json({ valid: false, error: message }, { status: 500 });
    }
}
