import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

type DetailRow = {
    productId?: string;
    quantity?: number;
};

export async function POST(request: Request) {
    try {
        const ip = getClientIp(request);
        const rate = enforceRateLimit(`checkout-release-stock:${ip}`, 20, 60_000);
        if (!rate.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Retry in ${rate.retryAfterSeconds}s.` },
                { status: 429 }
            );
        }

        const { orderId } = await request.json();
        const normalizedOrderId = String(orderId || '').trim();
        if (!normalizedOrderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const { data: order, error } = await admin
            .from('orders')
            .select('id, status, details')
            .eq('id', normalizedOrderId)
            .single();
        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Idempotent release guard.
        if (order.status === 'Cancelado') {
            return NextResponse.json({ success: true, released: false, reason: 'already_cancelled' });
        }
        if (order.status === 'Pago acreditado') {
            return NextResponse.json({ success: true, released: false, reason: 'already_paid' });
        }

        const details = Array.isArray(order.details) ? (order.details as DetailRow[]) : [];
        for (const detail of details) {
            if (!detail.productId || !detail.quantity || detail.quantity <= 0) continue;
            const { data: product } = await admin
                .from('products')
                .select('stockCount')
                .eq('id', detail.productId)
                .single();
            if (!product || typeof product.stockCount !== 'number') continue;
            const restored = product.stockCount + detail.quantity;
            await admin
                .from('products')
                .update({ stockCount: restored, inStock: restored > 0 })
                .eq('id', detail.productId);
        }

        await admin.from('orders').update({ status: 'Cancelado' }).eq('id', normalizedOrderId);
        return NextResponse.json({ success: true, released: true });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Release stock failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
