'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

    useEffect(() => {
        const checkSession = async () => {
            if (!supabase) {
                setIsLoading(false);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Fetch from users table to get name/profile
                const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                if (profile) {
                    setUser({ id: profile.id, email: profile.email, name: profile.full_name || profile.name || 'Usuario' });
                } else {
                    // Fallback to metadata if no profile row
                    setUser({ id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.name || 'Usuario' });
                }
            }
            setIsLoading(false);
        };
        checkSession();

        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const { data: profile } = await supabase!.from('users').select('*').eq('id', session.user.id).single();
                    if (profile) {
                         setUser({ id: profile.id, email: profile.email, name: profile.full_name || profile.name || 'Usuario' });
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            });
            return () => subscription.unsubscribe();
        }
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        if (!supabase) throw new Error('Sin conexión a la base de datos');
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });
            if (error) throw new Error('Email o contraseña incorrectos');
            if (data.user) {
                const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
                setUser({ 
                    id: data.user.id, 
                    email: data.user.email || '', 
                    name: profile?.full_name || profile?.name || data.user.user_metadata?.name || 'Usuario' 
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        if (!supabase) throw new Error('Sin conexión a la base de datos');
        const cleanEmail = email.trim().toLowerCase();
        try {
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: { data: { name } }
            });
            if (error) throw new Error(error.message);

            if (data.user) {
                // Sync to users table IMMEDIATELY
                await supabase.from('users').upsert({
                    id: data.user.id,
                    full_name: name,
                    email: cleanEmail,
                    cart: [],
                    favorites: []
                }, { onConflict: 'id' });

                setUser({ id: data.user.id, name, email: cleanEmail });
            }
        } catch (err: any) {
            throw new Error(err.message || 'Error al registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
