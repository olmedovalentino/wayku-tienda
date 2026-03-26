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
                const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                if (profile) {
                    setUser({ id: profile.id, email: profile.email, name: profile.name || profile.full_name || 'Usuario' });
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
                         setUser({ id: profile.id, email: profile.email, name: profile.name || profile.full_name || 'Usuario' });
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            });
            return () => subscription.unsubscribe();
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        if (!supabase) throw new Error('Error de conexión con la base de datos');
        
        const cleanEmail = email.trim().toLowerCase();

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: password
            });
            
            if (error) throw new Error('Email o contraseña incorrectos');
            
            if (data.user) {
                const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
                if (profile) {
                    setUser({ id: profile.id, email: profile.email, name: profile.name || profile.full_name || 'Usuario' });
                } else {
                    setUser({ id: data.user.id, email: cleanEmail, name: data.user.user_metadata?.name || 'Usuario' });
                }
            }
        } catch (error: any) {
            console.error(error);
            throw new Error('Email o contraseña incorrectos');
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        if (!supabase) throw new Error('Error de conexión con la base de datos');
        
        const cleanEmail = email.trim().toLowerCase();

        try {
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    data: { name }
                }
            });
            
            if (error) throw new Error(error.message);

            if (data.user) {
                const newUser = {
                    id: data.user.id,
                    name,
                    full_name: name,
                    email: cleanEmail,
                    cart: [],
                    favorites: []
                };

                const { error: insertError } = await supabase.from('users').upsert(newUser, { onConflict: 'id' });
                if (insertError) console.error("Sync error:", insertError);

                setUser({ id: newUser.id, name: newUser.name, email: newUser.email });
            }
        } catch (error: any) {
            console.error(error);
            throw new Error(error.message || 'Error al registrar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
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
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
