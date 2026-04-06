'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push('/cuenta');
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-stone-50">
            <div className="w-full max-w-md space-y-8 bg-white p-10 shadow-sm rounded-xl">
                <div className="text-center">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-stone-900">
                        Iniciar Sesión
                    </h2>
                    <p className="mt-2 text-sm text-stone-600">
                        ¿No tienes cuenta?{' '}
                        <Link href="/cuenta/register" className="font-medium text-primary hover:text-primary/80 hover:underline">
                            Regístrate gratis
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-stone-700">
                                Email
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-md border text-stone-900 border-stone-300 px-3 py-2 placeholder-stone-400 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm mt-1"
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-md border text-stone-900 border-stone-300 px-3 py-2 placeholder-stone-400 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm mt-1"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-stone-900">
                                Recordarme
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#" className="font-medium text-primary hover:text-primary/80 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className="w-full bg-[#5E6F5E] hover:bg-[#4a584a] text-white py-3"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
