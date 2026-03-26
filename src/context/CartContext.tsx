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
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Initial load when user or mount status changes
    useEffect(() => {
        setIsMounted(true);
        const cartKey = user ? `cart_user_${user.id}` : 'cart_guest';
        
        const loadInitial = async () => {
            const savedLocal = localStorage.getItem(cartKey);
            if (savedLocal) {
                setItems(JSON.parse(savedLocal));
            }

            if (user && supabase) {
                try {
                    const { data } = await supabase.from('users').select('cart').eq('id', user.id).single();
                    if (data && Array.isArray(data.cart) && data.cart.length > 0) {
                        setItems(data.cart);
                    }
                } catch (e) {
                    console.error("Supabase load error: ", e);
                }
            }
            setIsLoaded(true);
        };
        loadInitial();
    }, [user]);

    // Save to LocalStorage immediately on every change
    useEffect(() => {
        if (isLoaded) {
            const cartKey = user ? `cart_user_${user.id}` : 'cart_guest';
            localStorage.setItem(cartKey, JSON.stringify(items));
        }
    }, [items, user, isLoaded]);

    const syncToCloud = async (newItems: CartItem[]) => {
        if (user && supabase) {
            void supabase.from('users').upsert({ id: user.id, email: user.email, cart: newItems }, { onConflict: 'id' });
        }
    };

    const addItem = (p: any, m: any, s: any, shade: any, cable: any, canopy: any) => {
        setItems(prev => {
            const exists = prev.find(i => i.id === p.id && i.selectedMaterial === m && i.selectedSize === s && i.shadeType === shade && i.cableColor === cable && i.canopyColor === canopy);
            let next;
            if (exists) {
                next = prev.map(i => i === exists ? { ...i, quantity: i.quantity + 1 } : i);
            } else {
                next = [...prev, { ...p, quantity: 1, selectedMaterial: m, selectedSize: s, shadeType: shade, cableColor: cable, canopyColor: canopy }];
            }
            syncToCloud(next);
            return next;
        });
        setToastMessage(`Agregado al carrito`);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const removeItem = (idx: number) => {
        setItems(prev => {
            const next = prev.filter((_, i) => i !== idx);
            syncToCloud(next);
            return next;
        });
    };

    return (
        <CartContext.Provider value={{
            items, isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
            addItem, removeItem, clearCart: () => {
                setItems([]);
                syncToCloud([]);
            },
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
