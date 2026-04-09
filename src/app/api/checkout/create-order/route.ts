import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

type CheckoutItemInput = {
    id: string;
    quantity: number;
    selectedMaterial?: string;
    selectedSize?: string;
    shadeType?: string;
    cableColor?: string;
    canopyColor?: string;
};

export async function POST(request: Request) {
    try {
        const ip = getClientIp(request);
        const rate = enforceRateLimit(`checkout-create-order:${ip}`, 12, 60_000);
        if (!rate.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Retry in ${rate.retryAfterSeconds}s.` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const {
            items,
            payer,
            shippingMethod,
            paymentMethod,
            shippingCost,
            couponCode,
            notes,
            checkoutToken,
        } = body as {
            items: CheckoutItemInput[];
            payer: Record<string, string>;
            shippingMethod: 'shipping' | 'pickup';
            paymentMethod: 'card' | 'transfer';
            shippingCost?: number;
            couponCode?: string;
            notes?: string;
            checkoutToken?: string;
        };

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }
        if (!payer?.email || !payer?.firstName || !payer?.lastName || !payer?.phone) {
            return NextResponse.json({ error: 'Missing payer data' }, { status: 400 });
        }
        if (shippingMethod !== 'shipping' && shippingMethod !== 'pickup') {
            return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 });
        }
        if (paymentMethod !== 'card' && paymentMethod !== 'transfer') {
            return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const productIds = [...new Set(items.map(i => i.id))];
        const { data: products, error: productsError } = await admin
            .from('products')
            .select('id, name, price, stockCount, inStock')
            .in('id', productIds);

        if (productsError || !products) {
            return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
        }

        const productMap = new Map(products.map(p => [p.id, p]));
        const validatedDetails: Array<{
            name: string;
            price: number;
            quantity: number;
            material?: string;
            size?: string;
            shade?: string;
            cable?: string;
            canopy?: string;
            productId: string;
        }> = [];

        for (const item of items) {
            const quantity = Number(item.quantity);
            if (!item.id || !Number.isFinite(quantity) || quantity <= 0) {
                return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 });
            }

            const product = productMap.get(item.id);
            if (!product) {
                return NextResponse.json({ error: 'Some products no longer exist' }, { status: 400 });
            }
            if (product.inStock === false) {
                return NextResponse.json({ error: `${product.name} is out of stock` }, { status: 400 });
            }

            if (typeof product.stockCount === 'number' && product.stockCount < quantity) {
                return NextResponse.json(
                    { error: `No hay stock suficiente para ${product.name}` },
                    { status: 400 }
                );
            }

            validatedDetails.push({
                productId: product.id,
                name: product.name,
                price: Number(product.price || 0),
                quantity,
                material: item.selectedMaterial,
                size: item.selectedSize,
                shade: item.shadeType,
                cable: item.cableColor,
                canopy: item.canopyColor,
            });
        }

        const subtotal = validatedDetails.reduce((acc, item) => acc + item.price * item.quantity, 0);
        let discountPercentage = 0;
        const normalizedCoupon = String(couponCode || '').trim().toUpperCase();
        if (normalizedCoupon) {
            const { data: coupon, error: couponError } = await admin
                .from('coupons')
                .select('code, discount_percentage, is_active, expires_at')
                .eq('code', normalizedCoupon)
                .single();

            if (couponError || !coupon) {
                return NextResponse.json({ error: 'Código inválido o no encontrado' }, { status: 400 });
            }
            if (!coupon.is_active) {
                return NextResponse.json({ error: 'El cupón está desactivado' }, { status: 400 });
            }
            if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
                return NextResponse.json({ error: 'Este cupón ya venció' }, { status: 400 });
            }

            if (normalizedCoupon === 'PRIMERACOMPRA10') {
                const email = String(payer.email).trim().toLowerCase();
                const { count, error: countError } = await admin
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .ilike('email', email);
                if (countError) {
                    return NextResponse.json({ error: 'No se pudo validar primera compra' }, { status: 500 });
                }
                if ((count || 0) > 0) {
                    return NextResponse.json({ error: 'Este cupón es solo para tu primera compra.' }, { status: 400 });
                }
            }

            discountPercentage = Number(coupon.discount_percentage || 0);
        }

        const discountAmount = subtotal * (discountPercentage / 100);
        const safeShipping = shippingMethod === 'shipping'
            ? Math.max(0, Number(shippingCost || 0))
            : 0;
        const total = Math.max(0, subtotal - discountAmount + safeShipping);
        const normalizedToken = String(checkoutToken || '')
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .slice(0, 64);
        if (!normalizedToken) {
            return NextResponse.json({ error: 'Missing checkout token' }, { status: 400 });
        }
        const orderId = `ORD-${normalizedToken}`;

        const orderToInsert = {
            id: orderId,
            customer: `${payer.firstName} ${payer.lastName}`.trim(),
            email: String(payer.email).trim().toLowerCase(),
            date: new Date().toLocaleDateString('es-AR'),
            total,
            status: 'Pedido recibido',
            items: validatedDetails.reduce((acc, i) => acc + i.quantity, 0),
            shippingMethod,
            paymentMethod,
            phone: payer.phone,
            address: shippingMethod === 'shipping'
                ? (notes ? `${payer.address} | Notas: ${notes}` : payer.address)
                : null,
            city: shippingMethod === 'shipping' ? `${payer.city}, ${payer.province}` : null,
            postalCode: shippingMethod === 'shipping' ? payer.postalCode : null,
            details: validatedDetails,
        };

        const { error: orderError } = await admin.from('orders').insert(orderToInsert);
        if (orderError) {
            // Idempotency: if order already exists for this token, return it.
            const { data: existing } = await admin.from('orders').select('*').eq('id', orderId).single();
            if (existing) {
                return NextResponse.json({
                    success: true,
                    order: {
                        ...existing,
                        shippingCost: safeShipping,
                        discountPercentage,
                        couponCode: normalizedCoupon || null,
                    },
                });
            }
            return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 });
        }

        // Reserve stock with optimistic compare-and-set retries.
        const reserved: Array<{ productId: string; quantity: number }> = [];
        for (const detail of validatedDetails) {
            let reservedOk = false;
            for (let i = 0; i < 3; i += 1) {
                const { data: latest, error: latestErr } = await admin
                    .from('products')
                    .select('stockCount')
                    .eq('id', detail.productId)
                    .single();
                if (latestErr || !latest || typeof latest.stockCount !== 'number') break;
                if (latest.stockCount < detail.quantity) break;

                const newStock = latest.stockCount - detail.quantity;
                const { data: updated, error: updateErr } = await admin
                    .from('products')
                    .update({ stockCount: newStock, inStock: newStock > 0 })
                    .eq('id', detail.productId)
                    .eq('stockCount', latest.stockCount)
                    .select('id')
                    .maybeSingle();
                if (!updateErr && updated) {
                    reserved.push({ productId: detail.productId, quantity: detail.quantity });
                    reservedOk = true;
                    break;
                }
            }

            if (!reservedOk) {
                // Rollback partial stock reservations and cancel this order.
                for (const rollback of reserved) {
                    const { data: back } = await admin
                        .from('products')
                        .select('stockCount')
                        .eq('id', rollback.productId)
                        .single();
                    if (back && typeof back.stockCount === 'number') {
                        const restored = back.stockCount + rollback.quantity;
                        await admin
                            .from('products')
                            .update({ stockCount: restored, inStock: restored > 0 })
                            .eq('id', rollback.productId);
                    }
                }
                await admin.from('orders').update({ status: 'Cancelado' }).eq('id', orderId);
                return NextResponse.json(
                    { error: `No hay stock suficiente para ${detail.name}` },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            order: {
                ...orderToInsert,
                shippingCost: safeShipping,
                discountPercentage,
                couponCode: normalizedCoupon || null,
            },
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Checkout create order failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
