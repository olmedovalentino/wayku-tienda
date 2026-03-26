'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/products';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

type FavoritesContextType = {
    favorites: Product[];
    isOpen: boolean;
    openFavorites: () => void;
    closeFavorites: () => void;
    toggleFavorite: (product: Product) => void;
    isFavorite: (productId: string) => boolean;
    removeFavorite: (productId: string) => void;
    toastMessage: string | null;
    setToastMessage: (msg: string | null) => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Load from local storage or DB on mount or when user changes
    useEffect(() => {
        setIsMounted(true);
        setIsLoaded(false);
        const favKey = user ? `wayku_favorites_user_${user.id}` : 'wayku_favorites_guest';
        
        const loadFavs = async () => {
            if (user && supabase) {
                try {
                    const { data, error } = await supabase.from('users').select('favorites').eq('id', user.id).single();
                    if (!error && data && data.favorites) {
                        setFavorites(data.favorites);
                        setIsLoaded(true);
                        return;
                    }
                } catch (e) {
                    // Ignore
                }
            }

            const saved = localStorage.getItem(favKey);
            if (saved) {
                try {
                    setFavorites(JSON.parse(saved));
                } catch (e) {
                    setFavorites([]);
                }
            } else {
                setFavorites([]);
            }
            setIsLoaded(true);
        };

        loadFavs();
    }, [user]);

    // Save strictly to local storage
    useEffect(() => {
        if (isLoaded) {
            const favKey = user ? `wayku_favorites_user_${user.id}` : 'wayku_favorites_guest';
            localStorage.setItem(favKey, JSON.stringify(favorites));
        }
    }, [favorites, isLoaded, user]);

    const openFavorites = () => setIsOpen(true);
    const closeFavorites = () => setIsOpen(false);

    const toggleFavorite = (product: Product) => {
        setFavorites(prev => {
            const exists = prev.find(p => p.id === product.id);
            let newFavs;
            if (exists) {
                newFavs = prev.filter(p => p.id !== product.id);
                setToastMessage(`Se quitó de favoritos`);
            } else {
                newFavs = [...prev, product];
                setToastMessage(`Agregado a tus favoritos`);
            }
            
            if (user && supabase) {
                // @ts-ignore
                supabase.from('users').update({ favorites: newFavs }).eq('id', user.id).then().catch(() => {});
            }
            
            setTimeout(() => setToastMessage(null), 3000);
            return newFavs;
        });
    };

    const removeFavorite = (productId: string) => {
        setFavorites(prev => {
            const newFavs = prev.filter(p => p.id !== productId);
             if (user && supabase) {
                // @ts-ignore
                supabase.from('users').update({ favorites: newFavs }).eq('id', user.id).then().catch(() => {});
            }
            return newFavs;
        });
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
            removeFavorite,
            toastMessage,
            setToastMessage
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
