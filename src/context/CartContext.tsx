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
    addItem: (
        product: Product,
        selectedMaterial: 'guayubira' | 'roble' | 'palo-santo',
        selectedSize?: '1m' | '1.5m' | '2m',
        shadeType?: 'lino' | 'blanco-calido' | 'blanco-frio',
        cableColor?: 'blanco' | 'negro',
        canopyColor?: 'blanco' | 'negro'
    ) => void;
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
    const [isMounted, setIsMounted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Initial load when user changes
    useEffect(() => {
        setIsMounted(true);
        setIsLoaded(false);
        const cartKey = user ? `cart_user_${user.id}` : 'cart_guest';
        
        const loadCart = async () => {
            if (user && supabase) {
                try {
                    const { data, error } = await supabase.from('users').select('cart').eq('id', user.id).single();
                    if (!error && data && data.cart) {
                        setItems(data.cart);
                        setIsLoaded(true);
                        return;
                    }
                } catch (e) {
                    // Ignore if column doesn't exist
                }
            }
            
            const savedCart = localStorage.getItem(cartKey);
            if (savedCart) {
                setItems(JSON.parse(savedCart));
            } else {
                setItems([]);
            }
            setIsLoaded(true);
        };

        loadCart();
    }, [user]);

    // Save on change
    useEffect(() => {
        if (isLoaded) {
            const cartKey = user ? `cart_user_${user.id}` : 'cart_guest';
            localStorage.setItem(cartKey, JSON.stringify(items));
            
            if (user && supabase) {
                const syncData = async () => {
                    try {
                        await supabase!.from('users').update({ cart: items }).eq('id', user.id);
                    } catch (e) {}
                };
                syncData();
            }
        }
    }, [items, isLoaded, user]);

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    const addItem = (
        product: Product,
        selectedMaterial: 'guayubira' | 'roble' | 'palo-santo',
        selectedSize?: '1m' | '1.5m' | '2m',
        shadeType?: 'lino' | 'blanco-calido' | 'blanco-frio',
        cableColor?: 'blanco' | 'negro',
        canopyColor?: 'blanco' | 'negro'
    ) => {
        setItems((currentItems) => {
            const existingItem = currentItems.find(
                (item) =>
                    item.id === product.id &&
                    item.selectedMaterial === selectedMaterial &&
                    item.selectedSize === selectedSize &&
                    item.shadeType === shadeType &&
                    item.cableColor === cableColor &&
                    item.canopyColor === canopyColor
            );
            if (existingItem) {
                return currentItems.map((item) =>
                    item.id === product.id &&
                        item.selectedMaterial === selectedMaterial &&
                        item.selectedSize === selectedSize &&
                        item.shadeType === shadeType &&
                        item.cableColor === cableColor &&
                        item.canopyColor === canopyColor
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...currentItems, { ...product, quantity: 1, selectedMaterial, selectedSize, shadeType, cableColor, canopyColor }];
        });
        
        // Show Toast instead of forcing sidebar open
        setToastMessage(`Se agregó ${product.name} al carrito con éxito`);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const removeItem = (indexToRemove: number) => {
        setItems((currentItems) => currentItems.filter((_, index) => index !== indexToRemove));
    };

    const clearCart = () => {
        setItems([]);
    };

    const subtotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                items,
                isOpen,
                openCart,
                closeCart,
                addItem,
                removeItem,
                clearCart,
                subtotal,
                isInitialized: isMounted,
                toastMessage,
                setToastMessage
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
