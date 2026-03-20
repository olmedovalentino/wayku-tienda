'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/products';
import { useAuth } from './AuthContext';

type FavoritesContextType = {
    favorites: Product[];
    isOpen: boolean;
    openFavorites: () => void;
    closeFavorites: () => void;
    toggleFavorite: (product: Product) => void;
    isFavorite: (productId: string) => boolean;
    removeFavorite: (productId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Load from local storage on mount or when user changes
    useEffect(() => {
        setIsMounted(true);
        const favKey = user ? `wayku_favorites_user_${user.id}` : 'wayku_favorites_guest';
        const saved = localStorage.getItem(favKey);
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse favorites', e);
                setFavorites([]);
            }
        } else {
            setFavorites([]);
        }
    }, [user]);

    // Save to local storage on change
    useEffect(() => {
        if (isMounted) {
            const favKey = user ? `wayku_favorites_user_${user.id}` : 'wayku_favorites_guest';
            localStorage.setItem(favKey, JSON.stringify(favorites));
        }
    }, [favorites, isMounted, user]);

    const openFavorites = () => setIsOpen(true);
    const closeFavorites = () => setIsOpen(false);

    const toggleFavorite = (product: Product) => {
        setFavorites(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (exists) {
                return prev.filter(p => p.id !== product.id);
            } else {
                return [...prev, product];
            }
        });
    };

    const removeFavorite = (productId: string) => {
        setFavorites(prev => prev.filter(p => p.id !== productId));
    };

    const isFavorite = (productId: string) => favorites.some(p => p.id === productId);

    return (
        <FavoritesContext.Provider value={{
            favorites,
            isOpen,
            openFavorites,
            closeFavorites,
            toggleFavorite,
            isFavorite,
            removeFavorite
        }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
