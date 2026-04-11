import Link from 'next/link';
import { Button } from '@/components/ui/Button';


export function Hero() {
    return (
        <section className="relative h-[85vh] w-full overflow-hidden bg-stone-900">
            {/* Background Image Overlay */}
            <div
                className="absolute inset-0 z-0 opacity-60"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=2670&auto=format&fit=crop")',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative z-20 flex h-full items-center justify-center px-4 text-center sm:px-6 lg:px-8">
                <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                        Ilumina tu espacio con <span className="text-secondary">esencia natural</span>
                    </h1>
                    <p className="mx-auto max-w-xl text-lg text-stone-200 sm:text-xl">
                        Lámparas artesanales diseñadas para crear atmósferas cálidas y acogedoras.
                        Hechas a mano con maderas nobles y materiales sostenibles.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/historia">
                            <Button variant="outline" size="lg" className="min-w-[200px] border-white text-white hover:bg-white hover:text-stone-900">
                                Conocénos
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
