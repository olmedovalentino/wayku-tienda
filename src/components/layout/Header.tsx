'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Menu, X, Search, Heart, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { SearchModal } from './SearchModal';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { openCart, items } = useCart();
    const { openFavorites, favorites } = useFavorites();
    const { user, logout } = useAuth();
    const router = useRouter();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            await logout();
            router.push('/');
            router.refresh();
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-stone-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="p-2 text-stone-600 lg:hidden"
                    aria-label="Menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-serif text-xl sm:text-3xl tracking-[0.2em] sm:tracking-widest text-stone-800 uppercase">
                        Waykú
                    </span>
                </Link>

                {/* Desktop Navigation - Centered */}
                <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 hidden -translate-y-1/2 gap-8 lg:flex items-center h-full">
                    <Link
                        href="/"
                        className="text-sm font-medium text-stone-600 transition-colors hover:text-primary"
                    >
                        Inicio
                    </Link>
                    <div className="group relative flex items-center h-full">
                        <Link
                            href="/productos"
                            className="text-sm font-medium text-stone-600 transition-colors group-hover:text-primary"
                        >
                            Catálogo
                        </Link>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-48">
                            <div className="bg-white border border-stone-100 rounded-xl shadow-lg p-2 flex flex-col gap-1">
                                <Link href="/productos" className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary rounded-lg transition-colors">Ver todo</Link>
                                <Link href="/productos?category=pendant" className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary rounded-lg transition-colors">Colgantes</Link>
                                <Link href="/productos?category=table" className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary rounded-lg transition-colors">De Mesa</Link>
                                <Link href="/productos?category=floor" className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary rounded-lg transition-colors">De Pie</Link>
                                <Link href="/productos?category=wall" className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-primary rounded-lg transition-colors">Apliques</Link>
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/historia"
                        className="text-sm font-medium text-stone-600 transition-colors hover:text-primary"
                    >
                        Sobre nosotros
                    </Link>
                    <Link
                        href="/contacto"
                        className="text-sm font-medium text-stone-600 transition-colors hover:text-primary"
                    >
                        Contacto
                    </Link>
                </nav>

                {/* Icons */}
                <div className="flex items-center gap-1 sm:gap-4 text-stone-600">
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-1 sm:p-2 transition-colors hover:text-primary"
                    >
                        <Search size={20} />
                    </button>
                    <button
                        onClick={openFavorites}
                        className="relative p-1 sm:p-2 transition-colors hover:text-primary"
                    >
                        <Heart size={20} />
                        {favorites.length > 0 && (
                            <span className="absolute -right-0 -top-0 sm:-right-1 sm:-top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                                {favorites.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={openCart}
                        className="relative p-1 sm:p-2 transition-colors hover:text-primary"
                    >
                        <ShoppingBag size={20} />
                        {itemCount > 0 && (
                            <span className="absolute -right-0 -top-0 sm:-right-1 sm:-top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                                {itemCount}
                            </span>
                        )}
                    </button>

                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="p-1 sm:p-2 transition-colors hover:text-red-500 group relative flex items-center justify-center"
                            disabled={isLoggingOut}
                            aria-busy={isLoggingOut}
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} className="text-primary group-hover:text-red-500 transition-colors" />
                        </button>
                    ) : (
                        <Link href="/ingresar" className="p-1 sm:p-2 transition-colors hover:text-primary">
                            <UserIcon size={20} />
                        </Link>
                    )}

                </div>
            </div>

            {/* Components */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="border-t border-stone-100 lg:hidden bg-white">
                    <nav className="flex flex-col space-y-4 p-4">
                        <div className="flex flex-col">
                            <button
                                onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                                className="flex justify-between items-center text-base font-medium text-stone-600 hover:text-primary w-full text-left"
                            >
                                Catálogo
                                <ChevronDown size={18} className={`transition-transform duration-200 ${isCatalogOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isCatalogOpen && (
                                <div className="flex flex-col space-y-4 pl-4 pt-4 border-l-2 border-stone-100 ml-2 mt-2 mb-2">
                                    <Link href="/productos" onClick={() => setIsMenuOpen(false)} className="text-stone-500 hover:text-primary text-sm font-medium">Ver Todo</Link>
                                    <Link href="/productos?category=pendant" onClick={() => setIsMenuOpen(false)} className="text-stone-500 hover:text-primary text-sm font-medium">Colgantes</Link>
                                    <Link href="/productos?category=table" onClick={() => setIsMenuOpen(false)} className="text-stone-500 hover:text-primary text-sm font-medium">De Mesa</Link>
                                    <Link href="/productos?category=floor" onClick={() => setIsMenuOpen(false)} className="text-stone-500 hover:text-primary text-sm font-medium">De Pie</Link>
                                    <Link href="/productos?category=wall" onClick={() => setIsMenuOpen(false)} className="text-stone-500 hover:text-primary text-sm font-medium">Apliques</Link>
                                </div>
                            )}
                        </div>
                        <Link
                            href="/historia"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-base font-medium text-stone-600 hover:text-primary"
                        >
                            Sobre nosotros
                        </Link>
                        <Link
                            href="/contacto"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-base font-medium text-stone-600 hover:text-primary"
                        >
                            Contacto
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
