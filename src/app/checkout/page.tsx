'use client';

import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
    const { items, subtotal, clearCart, isInitialized } = useCart();
    const { updateProduct, products, addOrder, orders } = useApp();
    const { user } = useAuth();

    const [isProcessing, setIsProcessing] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0); // Percentage
    const [couponError, setCouponError] = useState('');

    const [formData, setFormData] = useState({
        email: user?.email || '',
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ')[1] || '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        notes: ''
    });

    const [shippingMethod, setShippingMethod] = useState<'shipping' | 'pickup'>('shipping');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');

    const router = useRouter();

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ')[1] || ''
            }));
            
            // Check if it's their first order
            const hasPastOrders = orders.some(o => o.email?.toLowerCase() === user.email?.toLowerCase());
            
            if (!hasPastOrders && appliedDiscount === 0) {
                setAppliedDiscount(5);
                setCouponCode('PRIMERACOMPRA5');
            }
        }
    }, [user, orders, appliedDiscount]);

    const discountAmount = useMemo(() => {
        return subtotal * (appliedDiscount / 100);
    }, [subtotal, appliedDiscount]);

    const total = subtotal - discountAmount;

    if (!isInitialized) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
                <h1 className="text-2xl font-bold text-stone-900">Tu carrito está vacío</h1>
                <Link href="/products" className="mt-4 text-primary hover:underline">
                    Volver a la tienda
                </Link>
            </div>
        );
    }

    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Ingresa un código');
            setAppliedDiscount(0);
            return;
        }

        // Special hardcoded fallback or from DB
        if (couponCode.toUpperCase() === 'PRIMERACOMPRA5') {
            const hasPastOrders = orders.some(o => o.email?.toLowerCase() === formData.email?.toLowerCase());
            if (hasPastOrders) {
                setCouponError('Este cupón es solo para tu primera compra.');
                setAppliedDiscount(0);
            } else {
                setAppliedDiscount(5);
                setCouponError('');
            }
            return;
        }

        try {
            // Import supabase dynamically if not in component scope, wait we can just import it at the top
            // assuming it's available via context or we can use fetch
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

            const { data, error } = await supabase
                .from('coupons')
                .select('discount_percentage, is_active')
                .eq('code', couponCode.toUpperCase())
                .single();

            if (error || !data) {
                setCouponError('Código inválido o no encontrado');
                setAppliedDiscount(0);
            } else if (!data.is_active) {
                setCouponError('El cupón ha expirado o está desactivado');
                setAppliedDiscount(0);
            } else {
                setAppliedDiscount(data.discount_percentage);
                setCouponError('');
            }
        } catch (e) {
            setCouponError('Error al validar el cupón');
            setAppliedDiscount(0);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        const orderId = `ORD-${Date.now()}`;

        // Create the order object to be saved in state
        const orderData = {
            id: orderId,
            customer: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            total: total,
            items: items.reduce((acc, item) => acc + item.quantity, 0),
            shippingMethod,
            paymentMethod,
            phone: formData.phone,
            address: shippingMethod === 'shipping' ? (formData.notes ? `${formData.address} | Notas: ${formData.notes}` : formData.address) : undefined,
            city: shippingMethod === 'shipping' ? `${formData.city}, ${formData.province}` : undefined,
            postalCode: shippingMethod === 'shipping' ? formData.postalCode : undefined,
            details: items.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                material: item.selectedMaterial,
                size: item.selectedSize,
                shade: item.shadeType,
                cable: item.cableColor,
                canopy: item.canopyColor
            }))
        };

        if (paymentMethod === 'transfer') {
            // Descontar inventario antes de redirigir (reserva de stock)
            await Promise.all(items.map(async (item) => {
                const currentProduct = products.find((p: any) => p.id === item.id);
                if (currentProduct && currentProduct.stockCount !== undefined) {
                    const newStock = Math.max(0, currentProduct.stockCount - item.quantity);
                    await updateProduct(item.id, {
                        stockCount: newStock,
                        inStock: newStock > 0
                    });
                }
            }));
            
            addOrder(orderData);

            // Send confirmation email
            fetch('/api/checkout/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            }).catch(console.error);

            // For transfer, we just go to success page with a flag
            clearCart();
            router.push(`/checkout/success?method=transfer&name=${formData.firstName}&total=${total}&order_id=${orderId}`);
            return;
        }

        setIsProcessing(true);

        try {
            // Descontar inventario antes de redirigir (reserva de stock)
            await Promise.all(items.map(async (item) => {
                const currentProduct = products.find((p: any) => p.id === item.id);
                if (currentProduct && currentProduct.stockCount !== undefined) {
                    const newStock = Math.max(0, currentProduct.stockCount - item.quantity);
                    await updateProduct(item.id, {
                        stockCount: newStock,
                        inStock: newStock > 0
                    });
                }
            }));

            // Save order to state even for Card (it will be "Pendiente")
            addOrder(orderData);

            // Send confirmation email
            fetch('/api/checkout/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            }).catch(console.error);

            const response = await fetch('/api/checkout/preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    payer: formData,
                    couponDiscount: appliedDiscount,
                    orderId: orderId
                })
            });

            const data = await response.json();

            if (data.init_point) {
                clearCart();
                window.location.href = data.init_point;
            } else {
                throw new Error(data.error || 'Error al crear la preferencia de pago');
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Error al procesar el pago');
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="bg-stone-50 min-h-screen py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">

                    <section className="order-2 lg:order-1 lg:col-span-7">
                        <form onSubmit={handlePayment} className="space-y-8">
                            {/* Shipping Method Selection */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-medium text-stone-900 mb-6 border-b border-stone-100 pb-4">Método de entrega</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div
                                        onClick={() => setShippingMethod('shipping')}
                                        className={`cursor-pointer p-4 border rounded-xl transition-all ${shippingMethod === 'shipping' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-stone-200 hover:border-stone-300'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-stone-900 text-sm">Envío a domicilio</span>
                                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${shippingMethod === 'shipping' ? 'border-primary' : 'border-stone-300'}`}>
                                                {shippingMethod === 'shipping' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-stone-500">Recibí tu pedido en la puerta de tu casa.</p>
                                    </div>
                                    <div
                                        onClick={() => setShippingMethod('pickup')}
                                        className={`cursor-pointer p-4 border rounded-xl transition-all ${shippingMethod === 'pickup' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-stone-200 hover:border-stone-300'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-stone-900 text-sm">Retiro en tienda</span>
                                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${shippingMethod === 'pickup' ? 'border-primary' : 'border-stone-300'}`}>
                                                {shippingMethod === 'pickup' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-stone-500">Retirá gratis por nuestro showroom.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-medium text-stone-900 mb-6 border-b border-stone-100 pb-4">Información de contacto</h2>
                                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-stone-700">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-stone-700">Nombre</label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            required
                                            className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-stone-700">Apellido</label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            required
                                            className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="phone" className="block text-sm font-medium text-stone-700">Teléfono</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            required
                                            placeholder="Ej: 35138444333"
                                            className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {shippingMethod === 'shipping' && (
                                <div className="bg-white rounded-xl shadow-sm p-6 transition-all">
                                    <h2 className="text-xl font-medium text-stone-900 mb-6 border-b border-stone-100 pb-4">Dirección de envío</h2>
                                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                                        <div className="sm:col-span-2">
                                            <label htmlFor="address" className="block text-sm font-medium text-stone-700">Dirección</label>
                                            <input
                                                type="text"
                                                id="address"
                                                required={shippingMethod === 'shipping'}
                                                className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="city" className="block text-sm font-medium text-stone-700">Ciudad</label>
                                            <input
                                                type="text"
                                                id="city"
                                                required={shippingMethod === 'shipping'}
                                                className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="province" className="block text-sm font-medium text-stone-700">Provincia</label>
                                            <input
                                                type="text"
                                                id="province"
                                                required={shippingMethod === 'shipping'}
                                                className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors"
                                                value={formData.province}
                                                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="postalCode" className="block text-sm font-medium text-stone-700">Código Postal</label>
                                            <input
                                                type="text"
                                                id="postalCode"
                                                required={shippingMethod === 'shipping'}
                                                className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors"
                                                value={formData.postalCode}
                                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="notes" className="block text-sm font-medium text-stone-700">Notas para el envío (Opcional)</label>
                                            <textarea
                                                id="notes"
                                                rows={2}
                                                placeholder="Instrucciones especiales, entre calles, timbre..."
                                                className="mt-1 block w-full rounded-md border-stone-200 shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border transition-colors resize-none"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method Selection */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-medium text-stone-900 mb-6 border-b border-stone-100 pb-4">Método de pago</h2>
                                <div className="space-y-4">
                                    <div
                                        onClick={() => setPaymentMethod('card')}
                                        className={`cursor-pointer p-4 border rounded-xl transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-stone-200 hover:border-stone-300'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                                </div>
                                                <span className="font-bold text-stone-900 text-sm">Tarjetas (crédito/débito) o saldo en Mercado Pago</span>
                                            </div>
                                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-primary' : 'border-stone-300'}`}>
                                                {paymentMethod === 'card' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setPaymentMethod('transfer')}
                                        className={`cursor-pointer p-4 border rounded-xl transition-all ${paymentMethod === 'transfer' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-stone-200 hover:border-stone-300'}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
                                                </div>
                                                <span className="font-bold text-stone-900 text-sm">Transferencia Bancaria</span>
                                            </div>
                                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${paymentMethod === 'transfer' ? 'border-primary' : 'border-stone-300'}`}>
                                                {paymentMethod === 'transfer' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                            </div>
                                                                       {paymentMethod === 'transfer' && (
                                            <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Datos para la transferencia:</p>
                                                <div className="grid grid-cols-12 gap-y-2 gap-x-2 text-sm">
                                                    <span className="col-span-3 text-stone-500">Alias:</span>
                                                    <div className="col-span-9 flex items-center justify-between">
                                                        <span className="text-stone-900 font-medium font-mono text-xs">waykuargentina</span>
                                                        <button type="button" onClick={() => {navigator.clipboard.writeText('waykuargentina'); alert('Alias copiado')}} className="text-[10px] text-primary underline">Copiar</button>
                                                    </div>
                                                    
                                                    <span className="col-span-3 text-stone-500">CVU:</span>
                                                    <div className="col-span-9 flex items-center justify-between">
                                                        <span className="text-stone-900 font-medium font-mono text-xs">0000003100043743912911</span>
                                                        <button type="button" onClick={() => {navigator.clipboard.writeText('0000003100043743912911'); alert('CVU copiado')}} className="text-[10px] text-primary underline">Copiar</button>
                                                    </div>

                                                    <span className="col-span-3 text-stone-500">Titular:</span>
                                                    <span className="col-span-9 text-stone-900 font-medium">Valentino Mateo Olmedo</span>
                                                    
                                                    <span className="col-span-3 text-stone-500">CUIT:</span>
                                                    <span className="col-span-9 text-stone-900 font-medium text-xs">20-47304165-1</span>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-stone-200">
                                                    <p className="text-xs text-stone-600 italic">
                                                        Una vez realizada la transferencia, deberás enviar el comprobante por WhatsApp al <strong>3513844333</strong>.
                                                    </p>
                                                </div>
                                            </div>
                                        )}              </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full py-6 text-lg font-bold bg-primary text-white hover:bg-primary/90"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Procesando...' : 'Finalizar Pedido'}
                                </Button>
                                <p className="mt-4 text-center text-sm text-stone-500">
                                    {paymentMethod === 'card'
                                        ? 'Serás redirigido a Mercado Pago para completar tu compra de forma segura.'
                                        : 'Al finalizar, verás las instrucciones para enviar tu comprobante.'}
                                </p>
                            </div>
                        </form>
                    </section>


                    {/* Order Summary (Right on Desktop, Top on Mobile) */}
                    <section className="order-1 lg:order-2 mb-8 lg:mb-0 lg:col-span-5 bg-white rounded-xl shadow-sm p-6 border border-stone-100 lg:sticky lg:top-24">
                        <h2 className="text-lg font-medium text-stone-900 border-b border-stone-100 pb-4">Resumen del pedido</h2>
                        <div className="mt-6 flow-root overflow-y-auto max-h-[400px] pr-2">
                            <ul className="-my-6 divide-y divide-stone-100">
                                {items.map((item) => (
                                    <li key={item.id} className="flex py-6">
                                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-stone-200">
                                            <Image
                                                src={item.images[0]}
                                                alt={item.name}
                                                width={80}
                                                height={80}
                                                className="h-full w-full object-cover object-center"
                                            />
                                        </div>
                                        <div className="ml-4 flex flex-1 flex-col">
                                            <div>
                                                <div className="flex justify-between text-base font-medium text-stone-900">
                                                    <h3>{item.name}</h3>
                                                    <p className="ml-4">${(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                                <p className="mt-1 text-sm text-stone-500 line-clamp-1">{item.selectedMaterial}</p>
                                            </div>
                                            <div className="flex flex-1 items-end justify-between text-sm">
                                                <p className="text-stone-500">Cant: {item.quantity}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-6 pt-6 border-t border-stone-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Código de descuento"
                                    className="flex-1 rounded-md border border-stone-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                />
                                <Button variant="outline" size="sm" type="button" onClick={applyCoupon}>
                                    Aplicar
                                </Button>
                            </div>
                            {couponError && <p className="mt-2 text-xs text-red-500">{couponError}</p>}
                            {appliedDiscount > 0 && <p className="mt-2 text-xs text-green-600">¡Descuento aplicado!</p>}
                        </div>

                        <dl className="mt-6 space-y-4 text-sm font-medium text-stone-500">
                            <div className="flex justify-between">
                                <dt>Subtotal</dt>
                                <dd className="text-stone-900">${subtotal.toLocaleString()}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt>Envío</dt>
                                <dd className="text-stone-900">Gratis</dd>
                            </div>
                            {appliedDiscount > 0 && (
                                <div className="flex justify-between text-green-600 font-bold uppercase tracking-wider text-xs">
                                    <dt>Descuento (5%)</dt>
                                    <dd>-${discountAmount.toLocaleString()}</dd>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-stone-100 pt-6 text-base text-stone-900">
                                <dt className="text-lg">Total</dt>
                                <dd className="text-2xl font-bold text-primary">${total.toLocaleString()}</dd>
                            </div>
                        </dl>
                    </section>

                </div>
            </div>
        </div>
    );
}
