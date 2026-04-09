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

                if (orderId && status === 'approved') {
                    // Update in our DB
                    const { error } = await getSupabaseAdmin()
                        .from('orders')
                        .update({ status: 'Pago acreditado' })
                        .eq('id', orderId);

                    if (error) {
                        console.error('Error updating order status in DB:', error);
                    } else {
                        console.log(`Successfully updated order ${orderId} to Pago acreditado`);
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
