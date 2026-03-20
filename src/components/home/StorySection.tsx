import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function StorySection() {
    return (
        <section className="py-24 bg-white">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-24 lg:px-8">
                <div className="relative h-[400px] overflow-hidden rounded-2xl bg-stone-100 lg:h-auto">
                    <Image
                        src="https://images.unsplash.com/photo-1617103996702-96ff29b1c467?q=80&w=2532&auto=format&fit=crop"
                        alt="Artesano trabajando madera"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                </div>

                <div className="flex flex-col justify-center">
                    <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                        Artesanía con alma
                    </h2>
                    <div className="mt-6 space-y-6 text-lg text-stone-600">
                        <p>
                            En Waykú, creemos que la iluminación es más que solo luz; es atmósfera, es calidez, es hogar.
                            Cada una de nuestras lámparas es tallada a mano por artesanos locales, utilizando maderas
                            recuperadas y sostenibles.
                        </p>
                        <p>
                            No producimos en masa. Creamos piezas únicas que cuentan una historia, respetando las vetas
                            naturales de la madera y celebrando sus imperfecciones perfectas.
                        </p>
                    </div>
                    <div className="mt-10">
                        <Link href="/story">
                            <Button variant="outline">Conoce Más Sobre Nosotros</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
