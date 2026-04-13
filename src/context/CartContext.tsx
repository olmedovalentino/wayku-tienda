'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Product } from '@/lib/products';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/user-profile';

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
    updateItemQuantity: (index: number, quantity: number) => void;
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
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevUserRef = useRef<string | null>(null);

    // Load cart on auth change
    useEffect(() => {
        if (isAuthLoading) return;

        const loadCart = async () => {
            // If user changed, reset first
            const currentUserId = user?.id ?? null;
            if (prevUserRef.current !== currentUserId) {
                setItems([]);
                setIsLoaded(false);
                prevUserRef.current = currentUserId;
            }

            const readStoredItems = (key: string): CartItem[] => {
                try {
                    const saved = localStorage.getItem(key);
                    return saved ? JSON.parse(saved) : [];
                } catch {
                    return [];
                }
            };

            if (!user) {
                // Guest: load from localStorage
                setItems(readStoredItems('cart_guest'));
                setIsLoaded(true);
                return;
            }

            const userSaved = readStoredItems(`cart_user_${user.id}`);
            const guestSaved = readStoredItems('cart_guest');

            // Logged-in user: try Supabase first
            if (supabase) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('cart')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (!error && data && Array.isArray(data.cart)) {
                        if (data.cart.length > 0) {
                            setItems(data.cart);
                            setIsLoaded(true);
                            return;
                        }

                        const localItems = userSaved.length > 0 ? userSaved : guestSaved;
                        if (localItems.length > 0) {
                            setItems(localItems);
                            localStorage.removeItem('cart_guest');
                            setIsLoaded(true);
                            return;
                        }

                        setItems([]);
                        setIsLoaded(true);
                        return;
                    }
                } catch {
                    console.warn('Cart: could not load from Supabase, falling back to localStorage');
                }
            }

            // Fallback: localStorage (merge guest cart if exists)
            if (userSaved.length > 0) {
                setItems(userSaved);
            } else if (guestSaved.length > 0) {
                setItems(guestSaved);
                localStorage.removeItem('cart_guest');
            } else if (supabase) {
                try {
                    await ensureUserProfile({ id: user.id, email: user.email }, { cart: [] });
                } catch {
                    console.warn('Cart: could not initialize user profile');
                }
            }
            setIsLoaded(true);
        };

        loadCart();
    }, [user, isAuthLoading]);

    // Save cart whenever items change (debounced)
    useEffect(() => {
        if (!isLoaded) return;

        // Save to localStorage immediately
        const cartKey = user ? `cart_user_${user.id}` : 'cart_guest';
        try {
            localStorage.setItem(cartKey, JSON.stringify(items));
        } catch {
        }

        // Debounce Supabase save to avoid too many requests
        if (user && supabase) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    await ensureUserProfile({ id: user.id, email: user.email }, { cart: items });
                } catch {
                    console.warn('Cart: could not sync to Supabase');
                }
            }, 600);
        }
    }, [items, user, isLoaded]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const addItem = (
        p: Product,
        m: CartItem['selectedMaterial'],
        s?: CartItem['selectedSize'],
        shade?: CartItem['shadeType'],
        cable?: CartItem['cableColor'],
        canopy?: CartItem['canopyColor']
    ) => {
        let maxStock = typeof p.stockCount === 'number' ? p.stockCount : Infinity;
        if (p.variants && p.variants.length > 0) {
            const variant = p.variants.find(v => v.material === m && v.size === s);
            if (variant && typeof variant.stock === 'number') maxStock = variant.stock;
            else if (!s) {
                const variantNoSize = p.variants.find(v => v.material === m);
                if (variantNoSize && typeof variantNoSize.stock === 'number') maxStock = variantNoSize.stock;
            }
        }

        let limitReached = false;

        setItems(prev => {
            const exists = prev.find(i =>
                i.id === p.id &&
                i.selectedMaterial === m &&
                i.selectedSize === s &&
                i.shadeType === shade &&
                i.cableColor === cable &&
                i.canopyColor === canopy
            );
            if (exists) {
                if (exists.quantity >= maxStock) {
                    limitReached = true;
                    return prev;
                }
                return prev.map(i => i === exists ? { ...i, quantity: exists.quantity + 1 } : i);
            }
            if (1 > maxStock) {
                limitReached = true;
                return prev;
            }
            return [...prev, { ...p, quantity: 1, selectedMaterial: m, selectedSize: s, shadeType: shade, cableColor: cable, canopyColor: canopy }];
        });
        
        setTimeout(() => {
            if (limitReached) {
                setToastMessage(`Stock máximo alcanzado para ${p.name}`);
            } else {
                setToastMessage(`Agregado al carrito`);
            }
            setTimeout(() => setToastMessage(null), 3000);
        }, 0);
    };

    return (
        <CartContext.Provider value={{
            items, isOpen,
            openCart: () => setIsOpen(true),
            closeCart: () => setIsOpen(false),
            addItem,
            removeItem: (idx) => setItems(prev => prev.filter((_, i) => i !== idx)),
            updateItemQuantity: (idx, quantity) => setItems(prev => prev.map((item, i) => {
                if (i !== idx) return item;
                let maxStock = typeof item.stockCount === 'number' ? item.stockCount : Infinity;
                if (item.variants && item.variants.length > 0) {
                    const variant = item.variants.find(v => v.material === item.selectedMaterial && v.size === item.selectedSize);
                    if (variant && typeof variant.stock === 'number') maxStock = variant.stock;
                    else if (!item.selectedSize) {
                        const variantNoSize = item.variants.find(v => v.material === item.selectedMaterial);
                        if (variantNoSize && typeof variantNoSize.stock === 'number') maxStock = variantNoSize.stock;
                    }
                }
                return { ...item, quantity: Math.min(Math.max(1, quantity), maxStock) };
            })),
            clearCart: () => setItems([]),
            subtotal: items.reduce((t, i) => t + (i.price * i.quantity), 0),
            isInitialized: isLoaded,
            toastMessage, setToastMessage
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
