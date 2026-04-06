'use client';

import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { useEffect } from 'react';

export function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, updateItemQuantity, subtotal } = useCart();

    // Prevent scrolling when cart is open
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
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="relative h-full w-full max-w-md bg-white shadow-xl animate-in slide-in-from-right duration-300">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4 sm:px-6">
                        <h2 className="text-lg font-medium text-stone-900">Carrito de compras</h2>
                        <button
                            onClick={closeCart}
                            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        {items.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <p className="text-stone-500">Tu carrito está vacío</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={closeCart}
                                >
                                    Continuar comprando
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {items.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="flex gap-4">
                                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-stone-200">
                                            <Image
                                                src={item.images[0]}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex flex-1 flex-col">
                                            <div>
                                                <div className="flex justify-between text-base font-medium text-stone-900">
                                                    <h3>{item.name}</h3>
                                                    <p className="ml-4">${(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                                <p className="mt-1 text-sm text-stone-500 capitalize">{item.selectedMaterial}</p>
                                                {item.selectedSize && (
                                                    <p className="text-sm text-stone-500">{item.selectedSize}</p>
                                                )}
                                                {item.shadeType && (
                                                    <p className="text-sm text-stone-500">Pantalla: {item.shadeType === 'blanco-calido' ? 'Blanco Cálido' : item.shadeType === 'blanco-frio' ? 'Blanco Frío' : 'Lino'}</p>
                                                )}
                                                {item.cableColor && (
                                                    <p className="text-sm text-stone-500">Cable: {item.cableColor}</p>
                                                )}
                                                {item.canopyColor && (
                                                    <p className="text-sm text-stone-500">Florón: {item.canopyColor}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-1 items-end justify-between text-sm">
                                                <div className="flex items-center gap-3 rounded-md border border-stone-200 px-2 py-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                                                        className="text-stone-500 hover:text-stone-900 focus:outline-none disabled:opacity-30"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-4 text-center font-medium text-stone-900">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                                                        className="text-stone-500 hover:text-stone-900 focus:outline-none"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
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
                    {items.length > 0 && (
                        <div className="border-t border-stone-100 px-4 py-6 sm:px-6">
                            <div className="flex justify-between text-base font-medium text-stone-900">
                                <p>Subtotal</p>
                                <p>${subtotal.toLocaleString()}</p>
                            </div>
                            <p className="mt-0.5 text-sm text-stone-500">
                                Envío calculado en el checkout.
                            </p>
                            <div className="mt-6">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={() => {
                                        closeCart();
                                        window.location.href = '/finalizar-compra';
                                    }}
                                >
                                    Finalizar compra
                                </Button>
                            </div>
                            <div className="mt-6 flex justify-center text-center text-sm text-stone-500">
                                <p>
                                    o{' '}
                                    <button
                                        type="button"
                                        className="font-medium text-primary hover:text-primary/80"
                                        onClick={closeCart}
                                    >
                                        Continuar comprando
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
