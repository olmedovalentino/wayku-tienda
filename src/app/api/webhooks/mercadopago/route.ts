import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function parseSignature(signature: string) {
    const parts = signature.split(',');
    let ts = '';
    let hash = '';
    for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 'ts') ts = value;
        if (key === 'v1') hash = value;
    }
    return { ts, hash };
}

function signatureMatches(manifest: string, providedHash: string, secret: string) {
    if (!providedHash) return false;
    const generatedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    const providedBuffer = Buffer.from(providedHash, 'hex');
    const generatedBuffer = Buffer.from(generatedHash, 'hex');
    if (providedBuffer.length !== generatedBuffer.length) return false;
    return crypto.timingSafeEqual(providedBuffer, generatedBuffer);
}

// Helper to handle both GET (verification) and POST (webhooks) from MP
export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        
        // MercadoPago send topic/type and id in query params or body
        const topic = url.searchParams.get('topic') || url.searchParams.get('type');
        const id = url.searchParams.get('data.id') || url.searchParams.get('id');

        // Signature Verification
        const xSignature = request.headers.get('x-signature');
        const xRequestId = request.headers.get('x-request-id');
        const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

        if (!secret || !xSignature || !xRequestId || !id) {
            return new NextResponse('Missing webhook signature data', { status: 401 });
        }

        const { ts, hash } = parseSignature(xSignature);
        const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
        if (!signatureMatches(manifest, hash, secret)) {
            console.error('Webhook signature verification failed');
            return new NextResponse('Invalid signature', { status: 403 });
        }

        if (topic === 'payment' && id) {
            // Verify payment status with MP API
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
                }
            });

            if (mpResponse.ok) {
                const paymentInfo = await mpResponse.json();
                
                // Standard MP structure has external_reference with our orderId
                const orderId = paymentInfo.external_reference;
                const status = paymentInfo.status; // 'approved', 'pending', 'rejected', etc.
                const amount = Number(paymentInfo.transaction_amount || 0);
                const currency = String(paymentInfo.currency_id || '');

                if (orderId) {
                    const admin = getSupabaseAdmin();
                    const { data: order } = await admin
                        .from('orders')
                        .select('id, total, status')
                        .eq('id', orderId)
                        .single();
                    if (!order) return new NextResponse('OK', { status: 200 });

                    if (status === 'approved') {
                        if (currency !== 'ARS' || Math.abs(Number(order.total || 0) - amount) > 1) {
                            console.error('Payment amount mismatch for order', orderId, { amount, currency, expected: order.total });
                            return new NextResponse('Amount mismatch', { status: 422 });
                        }
                        const { data: updatedOrder, error } = await admin
                            .from('orders')
                            .update({ status: 'Pago acreditado' })
                            .eq('id', orderId)
                            .neq('status', 'Cancelado')
                            .select('id')
                            .maybeSingle();
                        if (error) {
                            console.error('Error updating order status in DB:', error);
                        } else if (!updatedOrder) {
                            console.warn(`Skipped approved transition for ${orderId}; order state changed concurrently`);
                        } else {
                            console.log(`Successfully updated order ${orderId} to Pago acreditado`);
                        }
                    }

                    if (status === 'rejected' || status === 'cancelled') {
                        const { data: fullOrder } = await admin
                            .from('orders')
                            .select('status, details')
                            .eq('id', orderId)
                            .single();
                        if (fullOrder && fullOrder.status !== 'Cancelado' && fullOrder.status !== 'Pago acreditado') {
                            const { data: cancelledOrder, error: cancelError } = await admin
                                .from('orders')
                                .update({ status: 'Cancelado' })
                                .eq('id', orderId)
                                .eq('status', fullOrder.status)
                                .select('id')
                                .maybeSingle();
                            if (cancelError) {
                                console.error('Error cancelling order before stock release:', cancelError);
                                return new NextResponse('Internal Error', { status: 500 });
                            }
                            if (!cancelledOrder) {
                                return new NextResponse('OK', { status: 200 });
                            }

                            const details = Array.isArray(fullOrder.details) ? fullOrder.details : [];
                            for (const detail of details) {
                                if (!detail?.productId || !detail?.quantity) continue;
                                const { data: p } = await admin
                                    .from('products')
                                    .select('stockCount')
                                    .eq('id', detail.productId)
                                    .single();
                                if (p && typeof p.stockCount === 'number') {
                                    const restored = p.stockCount + Number(detail.quantity || 0);
                                    await admin
                                        .from('products')
                                        .update({ stockCount: restored, inStock: restored > 0 })
                                        .eq('id', detail.productId);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Always return 200 OK so MP knows we received it
        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
