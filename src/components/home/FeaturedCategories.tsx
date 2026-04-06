import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const categories = [
    {
        name: 'Colgantes',
        href: '/productos/pendant',
        image: 'https://images.unsplash.com/photo-1540932296481-d448663801e1?q=80&w=2670&auto=format&fit=crop',
        description: 'Elegancia suspendida en el aire'
    },
    {
        name: 'De Mesa',
        href: '/productos/table',
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed05e54765?q=80&w=2574&auto=format&fit=crop',
        description: 'Luz puntual para tus momentos'
    },
    {
        name: 'De Pie',
        href: '/productos/floor',
        image: 'https://images.unsplash.com/photo-1513506003011-3b03c8a35918?q=80&w=2574&auto=format&fit=crop',
        description: 'Presencia y calidez en cada rincón'
    }
];

export function FeaturedCategories() {
    return (
        <section className="py-24 bg-stone-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                        Nuestras Colecciones
                    </h2>
                    <p className="mt-4 text-lg text-stone-600">
                        Descubre piezas únicas diseñadas para cada tipo de espacio
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {categories.map((category) => (
                        <Link
                            key={category.name}
                            href={category.href}
                            className="group relative h-[400px] overflow-hidden rounded-2xl bg-stone-200"
                        >
                            <div className="absolute inset-0">
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
                            </div>

                            <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                                <h3 className="text-2xl font-bold">{category.name}</h3>
                                <p className="mb-4 text-stone-200">{category.description}</p>
                                <div className="flex items-center gap-2 text-sm font-medium opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100">
                                    Explorar <ArrowRight size={16} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
