'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    type SupabaseUser = {
        id: string;
        email?: string | null;
        user_metadata?: { name?: string };
    };

    const syncUser = useCallback(async (supabaseUser: SupabaseUser | null) => {
        if (!supabaseUser) return null;
        try {
            const { data: profile } = await supabase!
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .maybeSingle();
            const name = profile?.full_name || profile?.name || supabaseUser.user_metadata?.name || 'Usuario';
            return { id: supabaseUser.id, email: supabaseUser.email || '', name };
        } catch {
            // Fallback to auth data if profile fetch fails
            return { id: supabaseUser.id, email: supabaseUser.email || '', name: supabaseUser.user_metadata?.name || 'Usuario' };
        }
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            if (!supabase) {
                setIsLoading(false);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const u = await syncUser(session.user);
                if (u) setUser(u);
            }
            setIsLoading(false);
        };
        checkSession();

        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                    const u = await syncUser(session.user);
                    if (u) setUser(u);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            });
            return () => subscription.unsubscribe();
        }
    }, [syncUser]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        if (!supabase) throw new Error('Error de conexión');
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });
            if (error) throw new Error('Email o contraseña incorrectos');
            if (data.user) {
                const u = await syncUser(data.user);
                if (u) setUser(u);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        if (!supabase) throw new Error('Error de conexión');
        const cleanEmail = email.trim().toLowerCase();
        try {
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: { data: { name } }
            });
            if (error) throw new Error(error.message);
            if (data.user) {
                try {
                    await supabase.from('users').insert({
                        id: data.user.id,
                        full_name: name,
                        email: cleanEmail,
                    });
                } catch {
                    // Ignore duplicate or policy issues so registration does not block auth.
                }
                setUser({ id: data.user.id, name, email: cleanEmail });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (supabase) await supabase.auth.signOut();
        } finally {
            try {
                localStorage.removeItem('cart_guest');
                localStorage.removeItem('wayku_favorites_guest');
            } catch {
                // Ignore storage cleanup failures on logout.
            }
            setUser(null);
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth missing');
    return context;
}
