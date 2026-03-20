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
    const { updateProduct, products } = useApp();
    const [isProcessed, setIsProcessed] = useState(false);
    const searchParams = useSearchParams();



    const method = searchParams.get('method');
    const name = searchParams.get('name') || '';
    const total = searchParams.get('total') || '';

    useEffect(() => {
        if (!isProcessed && items.length > 0) {
            // Discount stock
            items.forEach((item: any) => {
                const currentProduct = products.find((p: any) => p.id === item.id);
                if (currentProduct && currentProduct.stockCount !== undefined) {
                    const newStock = Math.max(0, currentProduct.stockCount - item.quantity);
                    updateProduct(item.id, {
                        stockCount: newStock,
                        inStock: newStock > 0
                    });
                }
            });

            clearCart();
            setIsProcessed(true);
        }
    }, [items, products, updateProduct, clearCart, isProcessed]);

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
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 mb-12 text-left w-full max-w-2xl animate-in zoom-in-95 duration-500">
                    <h3 className="text-xl font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">Instrucciones de Pago</h3>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-stone-500 italic">Monto a transferir:</span>
                            <span className="text-primary font-bold text-lg">${Number(total).toLocaleString()}</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-stone-100 space-y-2">
                            <div className="grid grid-cols-2 text-sm">
                                <span className="text-stone-500">Alias:</span>
                                <span className="font-mono font-bold text-stone-900">WAYKU.LAMP.PAGO</span>
                                <span className="text-stone-500">CBU:</span>
                                <span className="font-mono font-bold text-stone-900">0720000000000000000000</span>
                                <span className="text-stone-500">Titular:</span>
                                <span className="font-bold text-stone-900">Waykú Lamps S.R.L</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-start">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-stone-900 text-sm mb-1">Guía para envío de comprobante:</p>
                            <ol className="text-xs text-stone-600 list-decimal ml-4 space-y-1">
                                <li>Realizá la transferencia por el total indicado.</li>
                                <li>Sacá una captura o descargá el comprobante.</li>
                                <li>Enviá el comprobante por WhatsApp al <strong className="text-stone-900">35138444333</strong> indicando tu nombre.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                {method === 'transfer' ? (
                    <a
                        href={`https://wa.me/5435138444333?text=Hola,%20envio%20el%20comprobante%20de%20mi%20pedido%20a%20nombre%20de%20${encodeURIComponent(name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 flex items-center gap-2">
                            <MessageCircle size={20} />
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

