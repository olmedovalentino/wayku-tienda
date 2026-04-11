import { NextResponse } from 'next/server';
import { client } from '@/lib/mercadopago';
import { Preference } from 'mercadopago';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createCheckoutReleaseToken } from '@/lib/checkout-security';

export async function POST(request: Request) {
    try {
        const ip = getClientIp(request);
        const rate = await enforceRateLimit(`checkout-preference:${ip}`, 20, 60_000);
        if (!rate.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Retry in ${rate.retryAfterSeconds}s.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { orderId } = body;
        if (!orderId) {
            return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const { data: order, error: orderError } = await admin
            .from('orders')
            .select('id, email, customer, details, total')
            .eq('id', orderId)
            .single();
        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const details = Array.isArray(order.details) ? order.details : [];
        if (details.length === 0) {
            return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
        }

        const totalItems = details.map((item, index) => {
            const detail = item as { name?: string; price?: number | string; quantity?: number | string };
            return {
                id: `${order.id}-${index}`,
                title: detail.name || 'Producto',
                unit_price: Number(detail.price ?? 0),
                quantity: Number(detail.quantity ?? 1),
                currency_id: 'ARS',
            };
        });

        // Determine Base URL correctly

        const host = request.headers.get('host');
        const origin = request.headers.get('origin');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';

        // Clean baseUrl: Priority to origin, then host, then env, then fallback.
        let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL || origin || `${protocol}://${host}` || 'http://localhost:3000';

        // Remove trailing slash if present
        baseUrl = baseUrl.replace(/\/$/, '');
        const releaseToken = createCheckoutReleaseToken(order.id);

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: totalItems,
                payer: {
                    email: order.email,
                    name: String(order.customer || '').split(' ')[0] || '',
                    surname: String(order.customer || '').split(' ').slice(1).join(' ') || '',
                },
                back_urls: {
                    success: `${baseUrl}/checkout/success?order_id=${encodeURIComponent(order.id)}`,
                    failure: `${baseUrl}/checkout/failure?order_id=${encodeURIComponent(order.id)}&release_token=${encodeURIComponent(releaseToken)}`,
                    pending: `${baseUrl}/checkout/pending?order_id=${encodeURIComponent(order.id)}`,
                },
                // Only use auto_return if on HTTPS, as Mercado Pago rejects HTTP domains
                auto_return: baseUrl.startsWith('https://') ? 'approved' : undefined,
                binary_mode: true,
                external_reference: order.id,
            }
        });

        if (!result.id || !result.init_point) {
            throw new Error('No se pudo generar el enlace de pago (init_point missing)');
        }

        return NextResponse.json({
            id: result.id,
            init_point: result.init_point
        });


    } catch (error: unknown) {
        console.error('Mercado Pago Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al crear la preferencia de pago';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
