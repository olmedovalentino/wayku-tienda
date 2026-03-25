import { NextResponse } from 'next/server';
import { client } from '@/lib/mercadopago';
import { Preference } from 'mercadopago';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, payer, couponDiscount, orderId } = body;

        // Apply discount if exists
        const totalItems = items.map((item: any) => ({
            id: item.id,
            title: item.name,
            unit_price: Number(item.price) * (1 - (couponDiscount / 100)),
            quantity: Number(item.quantity),
            currency_id: 'ARS'
        }));

        // Determine Base URL correctly

        const host = request.headers.get('host');
        const origin = request.headers.get('origin');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';

        // Clean baseUrl: Priority to origin, then host, then env, then fallback.
        let baseUrl = process.env.NEXT_PUBLIC_URL || origin || `${protocol}://${host}` || 'http://localhost:3000';

        // Remove trailing slash if present
        baseUrl = baseUrl.replace(/\/$/, '');

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: totalItems,
                payer: {
                    email: payer.email,
                    name: payer.firstName,
                    surname: payer.lastName,
                },
                back_urls: {
                    success: `${baseUrl}/checkout/success`,
                    failure: `${baseUrl}/checkout/failure`,
                    pending: `${baseUrl}/checkout/pending`,
                },
                // Only use auto_return if on HTTPS, as Mercado Pago rejects HTTP domains
                auto_return: baseUrl.startsWith('https://') ? 'approved' : undefined,
                binary_mode: true,
                external_reference: orderId || `ORDER-${Date.now()}`,
            }
        });

        if (!result.id || !result.init_point) {
            throw new Error('No se pudo generar el enlace de pago (init_point missing)');
        }

        return NextResponse.json({
            id: result.id,
            init_point: result.init_point,
            debug: { baseUrl }
        });


    } catch (error: any) {
        console.error('Mercado Pago Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
