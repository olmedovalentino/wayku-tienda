

export default function EnviosPage() {
    return (
        <div className="bg-stone-50 py-16 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-10">
                    Envíos y Devoluciones
                </h1>
                
                <div className="rounded-2xl bg-white p-8 shadow-sm border border-stone-100 space-y-12">
                    <div>
                        <h3 className="text-xl font-semibold text-stone-900 mb-4">Política de Envíos</h3>
                        <div className="space-y-4 text-stone-600">
                            <p className="text-sm leading-relaxed">
                                Procesamos los pedidos dentro de las 24-48 horas hábiles posteriores a la confirmación del pago.
                                Un diseño artesanal lleva tiempo y dedicación.
                            </p>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    <span><strong>CABA y GBA:</strong> 2 a 3 días hábiles.</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    <span><strong>Interior del país:</strong> 3 a 7 días hábiles.</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    <span><strong>Envío Gratis:</strong> En compras superiores a $250.000.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-semibold text-stone-900 mb-4">Cambios y Devoluciones</h3>
                        <div className="space-y-4 text-stone-600">
                            <p className="text-sm leading-relaxed">
                                Queremos que estés feliz con tu compra. Si no estás satisfecho, puedes realizar el cambio o devolución dentro de los 30 días corridos.
                            </p>
                            <p className="text-sm leading-relaxed">
                                El producto debe estar sin uso, en perfectas condiciones y en su embalaje original.
                            </p>
                            <div className="mt-6 p-4 bg-stone-50 rounded-lg">
                                <p className="text-sm">
                                    Para gestionar un cambio, escríbenos a:
                                    <br />
                                    <a href="mailto:waykuargentina@gmail.com" className="font-semibold text-primary hover:underline">waykuargentina@gmail.com</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
