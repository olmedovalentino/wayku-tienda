export default function PrivacyPage() {
    return (
        <div className="bg-white px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-8">
                    Política de Privacidad
                </h1>
                
                <div className="prose prose-stone max-w-none text-stone-600 space-y-6">
                    <p>Última actualización: {new Date().toLocaleDateString('es-AR')}</p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">1. Manejo de la Información</h2>
                    <p>
                        En Waykú valoramos inmensamente tu privacidad. La información personal que recopilamos (como tu nombre, email, 
                        teléfono y dirección física) se utiliza única y exclusivamente para procesar tus compras, coordinar envíos de 
                        lámparas y brindar servicio de atención al cliente.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">2. Protección de Datos (Ley 25.326)</h2>
                    <p>
                        Cumplimos estrictamente con la Ley de Protección de Datos Personales de la República Argentina. Tus datos 
                        personales están almacenados de forma segura (utilizamos bases de datos encriptadas provistas por Supabase) y 
                        jamás serán vendidos o cedidos a terceros comerciales.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">3. Pagos Seguros</h2>
                    <p>
                        Waykú no almacena en ningún momento los datos de tus tarjetas de crédito o débito. Toda la información 
                        financiera es procesada directamente bajo las estrictas normas de seguridad (PCI compliance) de Mercado Pago.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">4. Comunicaciones (Newsletter)</h2>
                    <p>
                        Si decides suscribirte a nuestro newsletter o creas una cuenta en nuestro sitio, podremos enviarte 
                        ocasionalmente correos con novedades sobre nuevas lámparas o descuentos. Puedes darte de baja de esta lista en 
                        cualquier momento solicitándolo a <strong><a href="mailto:waykuargentina@gmail.com" className="text-primary hover:underline">waykuargentina@gmail.com</a></strong>.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">5. Cookies</h2>
                    <p>
                        Utilizamos cookies indispensables para poder mantener los productos en tu carrito de compras mientras navegas 
                        nuestro sitio y para reconocer si has iniciado sesión. No utilizamos cookies invasivas de rastreo de terceros.
                    </p>
                </div>
            </div>
        </div>
    );
}
