import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export function Footer() {
    const { subscribeToNewsletter } = useApp();
    const [subscribed, setSubscribed] = useState(false);

    return (
        <footer className="border-t border-stone-100 bg-stone-50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <span className="text-2xl font-bold tracking-tight text-primary mb-3 block">
                            Waykú
                        </span>
                        <p className="text-sm text-stone-500">
                            Iluminación artesanal que conecta con la naturaleza. Diseños únicos
                            en madera sostenible.
                        </p>
                        <div className="flex space-x-5 mt-4">
                            <a href="https://instagram.com/waykuarg" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-[#E1306C] transition-colors">
                                <Instagram size={22} />
                            </a>
                            <a href="https://wa.me/5493513844333" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-[#25D366] transition-colors">
                                <MessageCircle size={22} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-stone-900">Tienda</h3>
                        <ul className="mt-4 space-y-2">
                            <li>
                                <Link href="/products" className="text-sm text-stone-500 hover:text-primary">
                                    Todas las Lámparas
                                </Link>
                            </li>
                            <li>
                                <Link href="/products?category=pendant" className="text-sm text-stone-500 hover:text-primary">
                                    Colgantes
                                </Link>
                            </li>
                            <li>
                                <Link href="/products?category=table" className="text-sm text-stone-500 hover:text-primary">
                                    De Mesa
                                </Link>
                            </li>
                            <li>
                                <Link href="/products?category=floor" className="text-sm text-stone-500 hover:text-primary">
                                    De Pie
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-stone-900">Soporte</h3>
                        <ul className="mt-4 space-y-2">
                            <li>
                                <Link href="/contact" className="text-sm text-stone-500 hover:text-primary">
                                    Contacto
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact#faqs" className="text-sm text-stone-500 hover:text-primary">
                                    Preguntas Frecuentes
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact#shipping" className="text-sm text-stone-500 hover:text-primary">
                                    Envíos y Devoluciones
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-stone-900">Newsletter</h3>
                        <p className="mt-4 text-sm text-stone-500">
                            Suscríbete para recibir novedades y ofertas exclusivas.
                        </p>
                        <form
                            className="mt-4 flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const email = (e.currentTarget.elements.namedItem('newsletter-email') as HTMLInputElement).value;
                                if (email) {
                                    subscribeToNewsletter(email);
                                    setSubscribed(true);
                                    (e.currentTarget.elements.namedItem('newsletter-email') as HTMLInputElement).value = '';
                                    setTimeout(() => setSubscribed(false), 5000);
                                }
                            }}
                        >
                            <input
                                type="email"
                                name="newsletter-email"
                                id="newsletter-email"
                                required
                                placeholder="Tu email"
                                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm placeholder:text-stone-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                                type="submit"
                                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-700 transition-colors"
                            >
                                {subscribed ? '¡Suscrito!' : 'Suscribirse'}
                            </button>
                        </form>
                        {subscribed && (
                            <p className="mt-2 text-xs text-green-600 font-medium animate-in fade-in slide-in-from-top-1">
                                ¡Gracias por suscribirte! Revisa tu correo pronto.
                            </p>
                        )}
                    </div>

                </div>
                <div className="mt-8 border-t border-stone-100 pt-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                    <p className="text-xs text-stone-400">
                        &copy; {new Date().getFullYear()} Waykú. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-4">
                        <Link href="/terms" className="text-xs text-stone-400 hover:text-primary transition-colors">
                            Términos y Condiciones
                        </Link>
                        <Link href="/privacy" className="text-xs text-stone-400 hover:text-primary transition-colors">
                            Política de Privacidad
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
