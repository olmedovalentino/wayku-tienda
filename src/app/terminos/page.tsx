export default function TermsPage() {
    return (
        <div className="bg-white px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-8">
                    Términos y Condiciones
                </h1>
                
                <div className="prose prose-stone max-w-none text-stone-600 space-y-6">
                    <p>Última actualización: {new Date().toLocaleDateString('es-AR')}</p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">1. Introducción</h2>
                    <p>
                        Bienvenido a Waykú. Al acceder y utilizar nuestro sitio web (wayku.ar), 
                        aceptas cumplir y estar sujeto a los siguientes términos y condiciones de uso.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">2. Productos y Artesanía</h2>
                    <p>
                        En Waykú nos dedicamos a la fabricación artesanal de lámparas de madera de diseño. Debido a la naturaleza natural 
                        de la madera (Roble, Guayubira, Palo Santo) y al proceso hecho a mano, cada producto es único. Las vetas, 
                        tonalidades y texturas pueden variar ligeramente con respecto a las fotografías del sitio web, lo que no se 
                        considera un defecto sino un sello de autenticidad.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">3. Tiempos de Fabricación</h2>
                    <p>
                        Nuestras piezas se fabrican a pedido y con dedicación. El tiempo estimado de producción es de 2 a 3 semanas 
                        hábiles. Una vez finalizada la pieza, se coordinará el envío.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">4. Política de Precios y Pagos</h2>
                    <p>
                        Todos los precios están expresados en Pesos Argentinos (ARS) y representan el valor final del producto. Nos reservamos el derecho de modificar 
                        los precios en cualquier momento. Los pagos se procesan de forma segura a través de Mercado Pago o mediante 
                        Transferencia Bancaria directa.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">5. Cambios y Devoluciones</h2>
                    <p>
                        Aceptamos cambios o devoluciones dentro de los 30 días corridos desde la recepción del producto, siempre y cuando 
                        la lámpara no haya sido utilizada, instalada, y se devuelva en su embalaje original. Los costos de envío por 
                        cambios o devoluciones corren por cuenta del cliente, salvo que se trate de un defecto de fabricación.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">6. Propiedad Intelectual</h2>
                    <p>
                        Todo el contenido de este sitio web, incluyendo diseños de lámparas, fotografías, textos y logotipos son 
                        propiedad exclusiva de Waykú y están protegidos por las leyes de propiedad intelectual de la República Argentina.
                    </p>

                    <h2 className="text-xl font-semibold text-stone-900 mt-8">7. Contacto</h2>
                    <p>
                        Para cualquier consulta legal sobre estos términos, por favor escríbenos a: <strong><a href="mailto:waykuargentina@gmail.com" className="text-primary hover:underline">waykuargentina@gmail.com</a></strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
