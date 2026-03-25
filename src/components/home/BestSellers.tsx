'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';

export function BestSellers() {
    const { products } = useApp();
    const featured = [...products]
        .sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1))
        .slice(0, 3);


    return (
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-center">

                    {/* Products Slider/Grid - Left Side */}
                    <div className="lg:col-span-8 w-full">
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 sm:grid sm:grid-cols-3 sm:gap-6 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {featured.map((product) => (
                                <Link key={product.id} href={`/products/${product.id}`} className="group block min-w-[70vw] sm:min-w-0 snap-center shrink-0">
                                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F9F5F0]">
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="bg-[#F9F5F0] p-4 text-center">
                                        <h3 className="text-lg font-medium text-stone-900">{product.name}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Text Content - Right Side */}
                    <div className="lg:col-span-4 flex flex-col justify-start">
                        <h2 className="text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">Más Vendidos</h2>
                        <p className="mt-20 text-base text-stone-600">
                            Nuestras lámparas más vendidas combinan diseño moderno, materiales nobles y una esencia cálida que transforma cualquier espacio.
                        </p>
                        <div className="mt-10">
                            <Link href="/products">
                                <Button variant="outline" size="md" className="rounded-full gap-2 hover:bg-[#5E6F5E] hover:text-white hover:border-[#5E6F5E]">
                                    Ver más
                                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
