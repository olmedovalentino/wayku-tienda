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
        } = body as {
            items: CheckoutItemInput[];
            payer: Record<string, string>;
            shippingMethod: 'shipping' | 'pickup';
            paymentMethod: 'card' | 'transfer';
            shippingCost?: number;
            couponCode?: string;
            notes?: string;
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
        const orderId = `ORD-${Date.now()}`;

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
            details: validatedDetails.map(({ productId, ...detail }) => detail),
        };

        const { error: orderError } = await admin.from('orders').insert(orderToInsert);
        if (orderError) {
            return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 });
        }

        // Reserve stock server-side.
        for (const detail of validatedDetails) {
            const product = productMap.get(detail.productId);
            if (!product || typeof product.stockCount !== 'number') continue;
            const newStock = Math.max(0, product.stockCount - detail.quantity);
            const { error: stockError } = await admin
                .from('products')
                .update({ stockCount: newStock, inStock: newStock > 0 })
                .eq('id', detail.productId);
            if (stockError) {
                console.error('Stock update failed for', detail.productId, stockError);
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
