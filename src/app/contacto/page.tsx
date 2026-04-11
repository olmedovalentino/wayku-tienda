'use client';

import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { Mail, MessageCircle, Send, Instagram } from 'lucide-react';
import { useState, FormEvent } from 'react';

export default function ContactPage() {
    const { addQuery } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

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
                            <a href="mailto:waykuargentina@gmail.com" className="flex items-start gap-4 group cursor-pointer">
                                <div className="rounded-lg bg-white p-3 shadow-sm border border-stone-100 group-hover:border-primary/50 transition-colors">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-stone-900 group-hover:text-primary transition-colors">Email</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-stone-600 group-hover:text-primary transition-colors font-medium">
                                            waykuargentina@gmail.com
                                        </span>
                                    </div>
                                </div>
                            </a>

                            <a href="https://wa.me/5493513844333" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group cursor-pointer">
                                <div className="rounded-lg bg-white p-3 shadow-sm border border-stone-100 group-hover:border-[#25D366]/50 transition-colors">
                                    <MessageCircle className="h-6 w-6 text-primary group-hover:text-[#25D366] transition-colors" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-stone-900 group-hover:text-[#25D366] transition-colors">WhatsApp</h3>
                                    <span className="text-stone-600 group-hover:text-[#25D366] transition-colors font-medium">
                                        +54 9 351 3844333
                                    </span>
                                </div>
                            </a>

                            <a href="https://instagram.com/waykuarg" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group cursor-pointer">
                                <div className="rounded-lg bg-white p-3 shadow-sm border border-stone-100 group-hover:border-[#E1306C]/50 transition-colors">
                                    <Instagram className="h-6 w-6 text-primary group-hover:text-[#E1306C] transition-colors" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-stone-900 group-hover:text-[#E1306C] transition-colors">Instagram</h3>
                                    <span className="text-stone-600 group-hover:text-[#E1306C] transition-colors font-medium">
                                        @waykuarg
                                    </span>
                                </div>
                            </a>
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

            </div>
        </div>
    );
}
