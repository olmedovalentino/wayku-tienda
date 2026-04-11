import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function CheckoutPendingPage() {
    return (
        <div className="min-h-screen py-20 px-4 bg-stone-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm border border-stone-100">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock size={32} className="text-yellow-600" />
                </div>
                <h1 className="text-2xl font-serif tracking-widest text-stone-900 mb-4">PAGO PENDIENTE</h1>
                <p className="text-stone-500 mb-8">
                    Tu pago esta siendo procesado por Mercado Pago.
                    Te enviaremos un email en cuanto se confirme la acreditacion.
                    No es necesario que vuelvas a intentar si pagaste en efectivo.
                </p>
                <Link
                    href="/"
                    className="inline-block w-full bg-stone-900 text-white px-8 py-4 text-sm tracking-widest uppercase hover:bg-stone-800 transition-colors"
                >
                    Volver a la tienda
                </Link>
            </div>
        </div>
    );
}
