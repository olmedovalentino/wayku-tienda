'use client';

import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { Mail, MapPin, MessageCircle, Send, ChevronDown, Instagram } from 'lucide-react';
import { useState, FormEvent } from 'react';

export default function ContactPage() {
    const { addQuery } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const subject = formData.get('subject') as string;
        const message = formData.get('message') as string;

        // Add to our global state
        addQuery({ name, email, subject, message });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitting(false);
        setIsSuccess(true);
    };


    const faqs = [
        {
            question: '¿Cuánto tiempo tarda la fabricación de una lámpara?',
            answer: 'Cada lámpara es hecha a mano, por lo que el tiempo de fabricación es de aproximadamente 2-3 semanas. Para pedidos personalizados, el tiempo puede variar según la complejidad del diseño.'
        },
        {
            question: '¿Hacen envíos a todo el país?',
            answer: 'Sí, realizamos envíos a toda Argentina. El tiempo de entrega varía según la ubicación, generalmente entre 3-7 días hábiles una vez finalizada la fabricación.'
        },
        {
            question: '¿Puedo personalizar el diseño de una lámpara?',
            answer: 'Por supuesto. Ofrecemos opciones de personalización en tamaño, tipo de madera y acabado. Contáctanos para discutir tu proyecto personalizado.'
        },
        {
            question: '¿Qué tipo de madera utilizan?',
            answer: 'Trabajamos principalmente con maderas nobles como roble, nogal y cedro. Todas nuestras maderas provienen de fuentes sustentables y son tratadas con productos ecológicos.'
        },
        {
            question: '¿Las lámparas incluyen la bombilla?',
            answer: 'Sí, todas nuestras lámparas incluyen una bombilla LED de bajo consumo. También ofrecemos opciones de bombillas con diferentes temperaturas de color.'
        },
        {
            question: '¿Tienen garantía?',
            answer: 'Todas nuestras lámparas cuentan con 1 año de garantía contra defectos de fabricación. La garantía cubre el sistema eléctrico y la estructura de madera.'
        }
    ];

    return (
        <div className="bg-stone-50 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

                    {/* Contact Info */}
                    <div>
                        <h1 className="text-3xl font-normal tracking-tight text-stone-900">
                            Contáctanos
                        </h1>
                        <p className="mt-4 text-base text-stone-600">
                            ¿Tienes alguna pregunta sobre nuestras lámparas o un pedido personalizado?
                            Estamos aquí para ayudarte.
                        </p>

                        <div className="mt-10 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-stone-900">Email</h3>
                                    <div className="flex items-center gap-2 group">
                                        <a href="mailto:waykuargentina@gmail.com" className="text-stone-600 hover:text-primary transition-colors font-medium">
                                            waykuargentina@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-white p-3 shadow-sm border border-stone-100">
                                    <MessageCircle className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-stone-900">WhatsApp</h3>
                                    <a href="https://wa.me/5493513844333" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-[#25D366] transition-colors">
                                        +54 9 351 3844333
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="rounded-lg bg-white p-3 shadow-sm border border-stone-100">
                                    <Instagram className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-stone-900">Instagram</h3>
                                    <a href="https://instagram.com/waykuarg" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-[#E1306C] transition-colors">
                                        @waykuarg
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm">
                        {isSuccess ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <div className="rounded-full bg-green-100 p-4">
                                    <Send className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="mt-4 text-xl font-bold text-stone-900">¡Mensaje Enviado!</h3>
                                <p className="mt-2 text-stone-600">
                                    Gracias por contactarnos. Te responderemos a la brevedad.
                                </p>
                                <Button
                                    className="mt-6"
                                    variant="outline"
                                    onClick={() => setIsSuccess(false)}
                                >
                                    Enviar otro mensaje
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
                                            Nombre
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-stone-700">
                                        Asunto
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        required
                                        className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-stone-700">
                                        Mensaje
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={4}
                                        required
                                        className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-20">
                    <h2 id="faqs" className="text-3xl font-normal tracking-tight text-stone-900 text-center scroll-mt-20">
                        Preguntas Frecuentes
                    </h2>
                    <div className="mt-10 max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="rounded-lg bg-white shadow-sm overflow-hidden border border-stone-100">
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-stone-50 transition-colors"
                                >
                                    <span className="font-medium text-stone-900">{faq.question}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-stone-500 transition-transform ${openFaq === index ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-4 text-stone-600 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shipping Section */}
                <div className="mt-20 pt-10 border-t border-stone-200">
                    <h2 id="shipping" className="text-3xl font-normal tracking-tight text-stone-900 text-center scroll-mt-20">
                        Envíos y Devoluciones
                    </h2>
                    <div className="mt-10 max-w-3xl mx-auto">
                        <div className="rounded-2xl bg-white p-8 shadow-sm border border-stone-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
                                                <span><strong>Envío Gratis:</strong> En compras superiores a $100.000.</span>
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
                </div>
            </div>
        </div>
    );
}
