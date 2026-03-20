'use client';

import { usePathname } from 'next/navigation';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from '@/components/cart/CartDrawer';
import { FavoritesDrawer } from '@/components/favorites/FavoritesDrawer';

export function ConditionalWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/admin');

    if (isAdminPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <CartDrawer />
            <FavoritesDrawer />
        </>
    );
}
