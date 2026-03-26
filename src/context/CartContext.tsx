'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '@/lib/products';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

export interface CartItem extends Product {
    quantity: number;
    selectedMaterial: 'guayubira' | 'roble' | 'palo-santo';
    selectedSize?: '1m' | '1.5m' | '2m';
    shadeType?: 'lino' | 'blanco-calido' | 'blanco-frio';
    cableColor?: 'blanco' | 'negro';
    canopyColor?: 'blanco' | 'negro';
}

interface CartContextType {
    items: CartItem[];
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addItem: (p: Product, m: 'guayubira' | 'roble' | 'palo-santo', s?: '1m' | '1.5m' | '2m', shade?: 'lino' | 'blanco-calido' | 'blanco-frio', cable?: 'blanco' | 'negro', canopy?: 'blanco' | 'negro') => void;
    removeItem: (index: number) => void;
    clearCart: () => void;
    subtotal: number;
    isInitialized: boolean;
    toastMessage: string | null;
    setToastMessage: (msg: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
        const loadInitial = async () => {
            // Wait for auth to settle
            if (isAuthLoading) return;

            if (!user) {
                const savedGuest = localStorage.getItem('cart_guest');
                if (savedGuest) setItems(JSON.parse(savedGuest));
                setIsLoaded(true);
                return;
            }

            // Forced delay for cloud sync stability on mobile
            await new Promise(r => setTimeout(r, 800));

            if (supabase) {
                try {
                    const { data } = await supabase.from('users').select('cart').eq('id', user.id).single();
                    if (data && Array.isArray(data.cart)) {
                        setItems(data.cart);
                    } else {
                        const guestLocal = localStorage.getItem('cart_guest');
                        if (guestLocal) {
                            setItems(JSON.parse(guestLocal));
                            localStorage.removeItem('cart_guest');
                        }
                    }
                } catch (e) {}
            }
            setIsLoaded(true);
        };
        loadInitial();
    }, [user, isAuthLoading]);

    useEffect(() => {
        if (isLoaded && isMounted) {
            const cartKey = user ? `cart_user_${user.id}` : 'cart_guest';
            localStorage.setItem(cartKey, JSON.stringify(items));
            if (user && supabase) {
                void supabase.from('users').update({ cart: items }).eq('id', user.id);
            }
        }
    }, [items, user, isLoaded, isMounted]);

    const addItem = (p: any, m: any, s: any, shade: any, cable: any, canopy: any) => {
        setItems(prev => {
            const exists = prev.find(i => i.id === p.id && i.selectedMaterial === m && i.selectedSize === s && i.shadeType === shade && i.cableColor === cable && i.canopyColor === canopy);
            if (exists) return prev.map(i => i === exists ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...p, quantity: 1, selectedMaterial: m, selectedSize: s, shadeType: shade, cableColor: cable, canopyColor: canopy }];
        });
        setToastMessage(`Agregado al carrito`);
        setTimeout(() => setToastMessage(null), 3000);
    };

    return (
        <CartContext.Provider value={{
            items, isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
            addItem, removeItem: (idx) => setItems(prev => prev.filter((_, i) => i !== idx)),
            clearCart: () => setItems([]),
            subtotal: items.reduce((t, i) => t + (i.price * i.quantity), 0),
            isInitialized: isMounted, toastMessage, setToastMessage
        }}>
            {children}
        </CartContext.Provider>
    );
}
export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart missing');
    return context;
}
