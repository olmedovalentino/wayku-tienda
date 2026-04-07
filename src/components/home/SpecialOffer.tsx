'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export function SpecialOffer() {
    const { user } = useAuth();
    return (
        <section className="relative h-[500px] w-full overflow-hidden">
            <Image
                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2532&auto=format&fit=crop"
                alt="Oferta especial living"
                fill
                className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/60" />

            <div className="absolute inset-0 flex items-center justify-end px-4 sm:px-6 lg:px-16">
                <div className="max-w-lg text-right text-white">
                    <h2 className="text-3xl font-normal tracking-tight text-white sm:text-4xl mb-4">Oferta Especial</h2>
                    
                    {!user ? (
                        <>
                            <p className="text-base mb-8 text-white">Regístrate ahora y obtén 5% de descuento en tu primera compra.</p>
                            <Link href="/registro">
                                <Button
                                    size="md"
                                    className="bg-[#5E6F5E] hover:bg-[#4a584a] text-white"
                                >
                                    Obtener Código
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-base mb-8 text-white">Obtén 10% de descuento usando el código <strong className="bg-[#5E6F5E] px-2 py-1 rounded">PRIMERACOMPRA10</strong></p>
                            <Link href="/productos">
                                <Button
                                    size="md"
                                    className="bg-[#5E6F5E] hover:bg-[#4a584a] text-white"
                                >
                                    Ver Tienda
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
