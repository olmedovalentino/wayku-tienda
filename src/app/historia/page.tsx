'use client';

import Image from 'next/image';

export default function StoryPage() {
    return (
        <div className="bg-white">
            {/* Block 1 - Landscape */}
            <div className="relative h-[60vh] w-full bg-stone-900">
                <Image
                    src="/about/landscape.jpg"
                    alt="Paisaje del norte argentino"
                    fill
                    className="object-cover opacity-70"
                    priority
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <h1 className="font-serif text-2xl md:text-4xl text-white tracking-wider text-center px-4">
                        La esencia de la madera, la luz de una historia
                    </h1>
                </div>
            </div>

            {/* Block 2 - Lamp */}
            <div className="bg-[#F9F9F7] py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center">
                        <div className="relative h-[500px] w-full overflow-hidden rounded-lg shadow-xl">
                            <Image
                                src="/about/lamp.jpg"
                                alt="Lámpara Waykú"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="font-serif text-3xl text-stone-900 mb-6">Diseñamos con alma, fabricamos con raíz</h3>
                            <p className="text-lg font-light text-stone-600 leading-relaxed">
                                En Waykú, cada lámpara nace del encuentro entre la nobleza de la madera salteña y la precisión del diseño contemporáneo. Fusionamos tradición e innovación para crear piezas que iluminan espacios con identidad, calidez y carácter propio.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Block 3 - Tree */}
            <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
                <div className="flex flex-col lg:flex-row-reverse gap-12 lg:gap-24 items-center">
                    <div className="relative h-[500px] w-full lg:w-1/2 overflow-hidden rounded-lg">
                        <Image
                            src="/about/tree.jpg"
                            alt="Árbol del norte argentino"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="lg:w-1/2">
                        <h2 className="font-serif text-3xl text-stone-900 mb-8">Orígenes del norte, impacto en cada ambiente</h2>
                        <p className="text-lg font-light text-stone-600 leading-relaxed">
                            Trabajamos con madera proveniente de Tartagal, Salta, seleccionada por su textura única y su durabilidad natural. Valoramos el entorno y cada proceso se realiza con respeto por los recursos naturales y la herencia cultural del norte argentino.
                        </p>
                    </div>
                </div>
            </div>

            {/* Block 4 - Workshop */}
            <div className="bg-[#F9F9F7] py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center">
                        <div className="relative h-[500px] w-full overflow-hidden rounded-lg shadow-xl">
                            <Image
                                src="/about/workshop.jpg"
                                alt="Taller de Waykú"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="font-serif text-3xl text-stone-900 mb-6">Desde Córdoba hacia el mundo</h3>
                            <p className="text-lg font-light text-stone-600 leading-relaxed">
                                Desde Villa Allende, Córdoba, diseñamos y producimos cada pieza de manera local. Nuestro taller es el espacio donde la idea se transforma en objeto, buscando siempre autenticidad, equilibrio y una estética atemporal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Block 5 - Wood */}
            <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
                <div className="flex flex-col lg:flex-row-reverse gap-12 lg:gap-24 items-center">
                    <div className="relative h-[500px] w-full lg:w-1/2 overflow-hidden rounded-lg">
                        <Image
                            src="/about/wood.jpg"
                            alt="Textura de madera"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="lg:w-1/2">
                        <h2 className="font-serif text-3xl text-stone-900 mb-8">Lo que nos diferencia</h2>
                        <p className="text-lg font-light text-stone-600 leading-relaxed">
                            En Waykú, cada veta cuenta una historia. Elegimos maderas nobles que no solo destacan por su belleza, sino por su origen sostenible y su valor cultural. No existen dos lámparas iguales: cada una es una pieza única, como los espacios que ilumina.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
