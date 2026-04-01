'use client';

import { useEffect, useState, Suspense } from 'react';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { CheckCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
    const { clearCart, items } = useCart();
    const { updateProduct, products, updateOrderStatus } = useApp();
    const [isProcessed, setIsProcessed] = useState(false);
    const searchParams = useSearchParams();

    const method = searchParams.get('method');
    const name = searchParams.get('name') || '';
    const total = searchParams.get('total') || '';
    
    // Mercado Pago params
    const status = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');
    const externalReference = searchParams.get('external_reference');
    const orderIdParam = searchParams.get('order_id');

    useEffect(() => {
        const orderId = externalReference || orderIdParam;
        
        if (!isProcessed && (status === 'approved' || method === 'transfer')) {
            // Marcar pedido como pagado/procesando si viene de MercadoPago (Card)
            // Ya no dependemos de que hayan items en el cart, para soportar reloads.
            if (status === 'approved' && orderId) {
                updateOrderStatus(orderId, 'Pago acreditado');
                console.log("Order checked out successfully:", orderId);
            } else if (method === 'transfer' && orderId) {
                updateOrderStatus(orderId, 'Pedido recibido');
            }
            
            // clearCart ya se llamó en checkout/page.tsx, pero lo llamamos por las dudas
            clearCart();
            setIsProcessed(true);
        }
    }, [isProcessed, status, method, externalReference, orderIdParam, updateOrderStatus, clearCart]);

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12 text-center max-w-4xl mx-auto">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-8 ${method === 'transfer' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                <CheckCircle size={48} />
            </div>

            <h1 className="text-4xl font-serif text-stone-900 mb-4">
                {method === 'transfer' ? '¡Pedido recibido!' : '¡Gracias por tu compra!'}
            </h1>

            <p className="text-lg text-stone-600 max-w-md mx-auto mb-8">
                {method === 'transfer'
                    ? `Hola ${name}, hemos registrado tu pedido. Para finalizar el proceso, por favor seguí las instrucciones de pago.`
                    : 'Tu pedido ha sido procesado con éxito. Pronto recibirás un correo electrónico con los detalles de tu compra.'}
            </p>

            {method === 'transfer' && (
                <div className="bg-stone-50 border border-stone-200 rounded-3xl p-8 mb-12 text-left w-full max-w-2xl shadow-sm animate-in zoom-in-95 duration-500">
                    <h3 className="text-xl font-bold text-stone-900 mb-6 border-b border-stone-200 pb-3 font-serif">Instrucciones de Pago</h3>

                    <div className="space-y-6 mb-8">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                            <span className="text-stone-500 font-bold text-xs uppercase tracking-widest italic">Total a transferir</span>
                            <span className="text-primary font-bold text-2xl">${Number(total).toLocaleString()}</span>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-5">
                            <div className="flex items-center justify-between group">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Alias</span>
                                    <span className="text-stone-900 font-bold text-lg font-mono">waykuargentina</span>
                                </div>
                                <Button 
                                    variant="outline" size="sm" className="h-8 px-4 rounded-xl border-stone-200 hover:border-primary hover:text-primary transition-all"
                                    onClick={() => {navigator.clipboard.writeText('waykuargentina'); alert('Alias copiado')}}
                                >Copiar</Button>
                            </div>

                            <div className="flex items-center justify-between group">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">CVU</span>
                                    <span className="text-stone-900 font-bold text-lg font-mono">0000003100043743912911</span>
                                </div>
                                <Button 
                                    variant="outline" size="sm" className="h-8 px-4 rounded-xl border-stone-200 hover:border-primary hover:text-primary transition-all"
                                    onClick={() => {navigator.clipboard.writeText('0000003100043743912911'); alert('CVU copiado')}}
                                >Copiar</Button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 border-t border-stone-100 pt-5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Titular</span>
                                    <span className="text-stone-900 font-bold text-sm">Valentino Mateo Olmedo</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">CUIT/CUIL</span>
                                    <span className="text-stone-900 font-bold text-sm">20-47304165-1</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex gap-4 items-start">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-green-900 text-sm mb-1">¡Siguiente Paso!</p>
                            <p className="text-xs text-green-700 leading-relaxed mb-1">
                                Para que despachemos tu lámpara, enviá el comprobante por WhatsApp al <strong className="text-green-900">3513844333</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
                {method === 'transfer' ? (
                    <a
                        href={`https://wa.me/543513844333?text=Hola,%20envio%20el%20comprobante%20de%20mi%20pedido%20a%20nombre%20de%20${encodeURIComponent(name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto"
                    >
                        <Button className="w-full sm:w-auto px-10 py-7 rounded-2xl text-lg bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-200 transition-all font-bold">
                            <MessageCircle size={22} />
                            Enviar Comprobante
                        </Button>
                    </a>
                ) : (
                    <Link href="/products">
                        <Button className="px-8 py-6 text-lg">Seguir comprando</Button>
                    </Link>
                )}
                <Link href="/">
                    <Button variant="outline" className="px-8 py-6 text-lg">Volver al inicio</Button>
                </Link>
            </div>


        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <SuccessContent />
        </Suspense>
    );
}

