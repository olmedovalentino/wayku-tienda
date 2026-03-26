'use client';

'use client';

import { usePathname } from 'next/navigation';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from '@/components/cart/CartDrawer';
import { FavoritesDrawer } from '@/components/favorites/FavoritesDrawer';

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { CheckCircle, Heart } from "lucide-react";

export function ConditionalWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { toastMessage: cartToast, setToastMessage: setCartToast } = useCart();
    const { toastMessage: favToast, setToastMessage: setFavToast } = useFavorites();
    const isAdminRoute = pathname?.startsWith('/admin');

    if (isAdminRoute) {
        return <>{children}</>;
    }

    return (
        <>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <CartDrawer />
            <FavoritesDrawer />
            {/* Beautiful Toast Overlay */}
            {(cartToast || favToast) && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-stone-900 text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-xl shadow-stone-900/20">
                        {cartToast ? <CheckCircle className="text-green-400" size={18} /> : <Heart className="text-red-400 fill-current" size={18} />}
                        <p className="text-sm font-medium">{cartToast || favToast}</p>
                        <button onClick={() => { setCartToast(null); setFavToast(null); }} className="ml-2 text-stone-400 hover:text-white">✕</button>
                    </div>
                </div>
            )}
        </>
    );
}
