'use client';

import * as React from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';


interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const { products } = useApp();
    const [query, setQuery] = React.useState('');
    const router = useRouter();
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const searchStr = normalizeString(query);

    const filteredProducts = query
        ? products.filter((product) =>
            normalizeString(product.name).includes(searchStr) ||
            normalizeString(product.description).includes(searchStr)
        )
        : [];


    const handleLinkClick = (id: string) => {
        onClose();
        router.push(`/productos/${id}`);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
                <div className="relative border-b border-stone-200">
                    <Search className="absolute left-4 top-4 h-6 w-6 text-stone-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full border-none bg-transparent py-4 pl-14 pr-12 text-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0"
                        placeholder="Buscar lámparas..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Results */}
                {query && (
                    <div className="max-h-[60vh] overflow-y-auto p-4">
                        {filteredProducts.length === 0 ? (
                            <div className="py-8 text-center text-stone-500">
                                No encontramos productos para "{query}"
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleLinkClick(product.id)}
                                        className="flex items-center gap-4 rounded-lg p-2 text-left transition-colors hover:bg-stone-50"
                                    >
                                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-stone-200">
                                            <Image
                                                src={product.images[0]}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-stone-900">{product.name}</h3>
                                            <p className="text-sm text-stone-500 line-clamp-1">{product.description}</p>
                                        </div>
                                        <div className="text-sm font-semibold text-stone-900">
                                            ${product.price}
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-stone-400" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!query && (
                    <div className="p-4 text-center text-sm text-stone-400">
                        Escribe para buscar...
                    </div>
                )}
            </div>
        </div>
    );
}
