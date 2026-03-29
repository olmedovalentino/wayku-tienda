import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to handle both GET (verification) and POST (webhooks) from MP
export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        
        // MercadoPago send topic/type and id in query params or body
        const topic = url.searchParams.get('topic') || url.searchParams.get('type');
        const id = url.searchParams.get('data.id') || url.searchParams.get('id');

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
                    const { error } = await supabase!
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
