'use client';

import { X, Trash2 } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { useEffect } from 'react';
import Link from 'next/link';

export function FavoritesDrawer() {
    const { favorites, isOpen, closeFavorites, removeFavorite } = useFavorites();

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={closeFavorites}
            />

            {/* Drawer */}
            <div className="relative h-full w-full max-w-md bg-white shadow-xl animate-in slide-in-from-right duration-300">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4 sm:px-6">
                        <h2 className="text-lg font-medium text-stone-900">Favoritos</h2>
                        <button
                            onClick={closeFavorites}
                            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        {favorites.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <p className="text-stone-500">No tienes favoritos aún</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={closeFavorites}
                                >
                                    Explorar productos
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {favorites.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <Link
                                            href={`/products/${item.id}`}
                                            onClick={closeFavorites}
                                            className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-stone-200 hover:opacity-75 transition-opacity"
                                        >
                                            <Image
                                                src={item.images[0]}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </Link>

                                        <div className="flex flex-1 flex-col">
                                            <div>
                                                <div className="flex justify-between text-base font-medium text-stone-900">
                                                    <Link
                                                        href={`/products/${item.id}`}
                                                        onClick={closeFavorites}
                                                        className="hover:text-primary transition-colors"
                                                    >
                                                        <h3>{item.name}</h3>
                                                    </Link>
                                                    <p className="ml-4">${item.price.toLocaleString()}</p>
                                                </div>
                                                <p className="mt-1 text-sm text-stone-500">{item.category === 'pendant' ? 'Lámpara Colgante' : item.category === 'table' ? 'Lámpara de Mesa' : 'Lámpara de Pie'}</p>
                                            </div>
                                            <div className="flex flex-1 items-end justify-between text-sm">
                                                <Link
                                                    href={`/products/${item.id}`}
                                                    onClick={closeFavorites}
                                                >
                                                    <Button variant="outline" size="sm">
                                                        Ver producto
                                                    </Button>
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFavorite(item.id)}
                                                    className="flex items-center gap-1 font-medium text-red-600 hover:text-red-500"
                                                >
                                                    <Trash2 size={14} /> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {favorites.length > 0 && (
                        <div className="border-t border-stone-100 px-4 py-6 sm:px-6">
                            <div className="flex justify-between text-base font-medium text-stone-900 mb-4">
                                <p>Total de favoritos</p>
                                <p>{favorites.length}</p>
                            </div>
                            <div className="flex justify-center text-center text-sm text-stone-500">
                                <button
                                    type="button"
                                    className="font-medium text-primary hover:text-primary/80"
                                    onClick={closeFavorites}
                                >
                                    Continuar explorando
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
