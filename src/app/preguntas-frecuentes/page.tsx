import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';

export default function FAQPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="mb-10 text-3xl font-bold text-stone-900">Preguntas Frecuentes</h1>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>¿De qué material están hechas las lámparas?</AccordionTrigger>
                    <AccordionContent>
                        Utilizamos principalmente madera recuperada de especies nativas (roble, cedro, petiribí) y materiales complementarios sostenibles como lino, papel de arroz y fibras naturales.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>¿Hacen envíos a todo el país?</AccordionTrigger>
                    <AccordionContent>
                        Sí, realizamos envíos a toda Argentina a través de Andreani. El tiempo de entrega varía según la ubicación, generalmente entre 3 y 7 días hábiles.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>¿Puedo personalizar una lámpara?</AccordionTrigger>
                    <AccordionContent>
                        Sí, ofrecemos un servicio de personalización. Puedes elegir el tipo de madera y, en algunos modelos, las dimensiones. Contáctanos para recibir un presupuesto.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>¿Cómo instalo mi lámpara colgante?</AccordionTrigger>
                    <AccordionContent>
                        Todas nuestras lámparas incluyen un kit de instalación con florón de techo, cable y accesorios. Recomendamos que la instalación sea realizada por un electricista calificado.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>¿Qué tipo de bombilla debo usar?</AccordionTrigger>
                    <AccordionContent>
                        Recomendamos bombillas LED de filamento (E27) para mantener la estética cálida y asegurar la eficiencia energética. Incluimos una con tu compra.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
