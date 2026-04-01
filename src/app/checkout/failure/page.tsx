import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CheckoutFailurePage() {
    return (
        <div className="min-h-screen py-20 px-4 bg-stone-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm border border-stone-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={32} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-serif tracking-widest text-stone-900 mb-4">PAGO RECHAZADO</h1>
                <p className="text-stone-500 mb-8">
                    Lo sentimos, tu pago no pudo ser procesado o fue rechazado por Mercado Pago. 
                    Por favor, intenta nuevamente con otro medio de pago.
                </p>
                <Link
                    href="/checkout"
                    className="inline-block w-full bg-stone-900 text-white px-8 py-4 text-sm tracking-widest uppercase hover:bg-stone-800 transition-colors"
                >
                    Volver al Checkout
                </Link>
            </div>
        </div>
    );
}
