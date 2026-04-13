'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Product } from '@/lib/products';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/user-profile';

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
    const { user, isLoading: isAuthLoading } = useAuth();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevUserRef = useRef<string | null>(null);

    // Load favorites on auth change
    useEffect(() => {
        if (isAuthLoading) return;

        const loadFavs = async () => {
            const currentUserId = user?.id ?? null;
            // Reset on user change
            if (prevUserRef.current !== currentUserId) {
                setFavorites([]);
                setIsLoaded(false);
                prevUserRef.current = currentUserId;
            }

            const readStoredFavorites = (key: string): Product[] => {
                try {
                    const saved = localStorage.getItem(key);
                    return saved ? JSON.parse(saved) : [];
                } catch {
                    return [];
                }
            };

            const userFavKey = user ? `wayku_favorites_user_${user.id}` : 'wayku_favorites_guest';
            const userSaved = readStoredFavorites(userFavKey);
            const guestSaved = readStoredFavorites('wayku_favorites_guest');

            if (user && supabase) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('favorites')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (!error && data && Array.isArray(data.favorites)) {
                        if (data.favorites.length > 0) {
                            setFavorites(data.favorites);
                            setIsLoaded(true);
                            return;
                        }

                        const localFavorites = userSaved.length > 0 ? userSaved : guestSaved;
                        if (localFavorites.length > 0) {
                            setFavorites(localFavorites);
                            localStorage.removeItem('wayku_favorites_guest');
                            setIsLoaded(true);
                            return;
                        }

                        setFavorites([]);
                        setIsLoaded(true);
                        return;
                    }
                } catch {
                    console.warn('Favorites: could not load from Supabase');
                }
            }

            // Fallback: localStorage
            if (userSaved.length > 0) {
                setFavorites(userSaved);
            } else if (user && guestSaved.length > 0) {
                setFavorites(guestSaved);
                localStorage.removeItem('wayku_favorites_guest');
            } else if (user && supabase) {
                try {
                    await ensureUserProfile({ id: user.id, email: user.email }, { favorites: [] });
                } catch {
                    console.warn('Favorites: could not initialize user profile');
                }
            }
            setIsLoaded(true);
        };

        loadFavs();
    }, [user, isAuthLoading]);

    // Save whenever favorites change (debounced for Supabase)
    useEffect(() => {
        if (!isLoaded) return;

        const favKey = user ? `wayku_favorites_user_${user.id}` : 'wayku_favorites_guest';
        try {
            localStorage.setItem(favKey, JSON.stringify(favorites));
        } catch {
        }

        if (user && supabase) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    await ensureUserProfile({ id: user.id, email: user.email }, { favorites });
                } catch {
                    console.warn('Favorites: could not sync to Supabase');
                }
            }, 600);
        }
    }, [favorites, user, isLoaded]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const openFavorites = () => setIsOpen(true);
    const closeFavorites = () => setIsOpen(false);

    const toggleFavorite = (product: Product) => {
        setFavorites(prev => {
            const exists = prev.find(p => p.id === product.id);
            let newFavs: Product[];
            if (exists) {
                newFavs = prev.filter(p => p.id !== product.id);
                setToastMessage(`Se quitó de favoritos`);
            } else {
                newFavs = [...prev, product];
                setToastMessage(`Agregado a tus favoritos`);
            }
            setTimeout(() => setToastMessage(null), 3000);
            return newFavs;
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
