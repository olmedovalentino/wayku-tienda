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
        const savedUser = localStorage.getItem('wayku_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        if (!supabase) throw new Error('Error de conexión con la base de datos');
        try {
            const { data: users, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password);
            
            if (error) throw error;
            
            if (users && users.length > 0) {
                const foundUser = users[0];
                const userData = { id: foundUser.id, email: foundUser.email, name: foundUser.name };
                setUser(userData);
                localStorage.setItem('wayku_user', JSON.stringify(userData));
            } else {
                throw new Error('Email o contraseña incorrectos');
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
        try {
            // Check if email exists
            const { data: existingUsers } = await supabase.from('users').select('email').eq('email', email);
            if (existingUsers && existingUsers.length > 0) {
                throw new Error('El email ya está registrado');
            }

            const newUser = {
                id: Math.random().toString(36).substr(2, 9),
                name,
                email,
                password
            };

            const { error } = await supabase.from('users').insert(newUser);
            if (error) throw error;

            const userData = { id: newUser.id, name: newUser.name, email: newUser.email };
            setUser(userData);
            localStorage.setItem('wayku_user', JSON.stringify(userData));
        } catch (error: any) {
            console.error(error);
            throw new Error(error.message || 'Error al registrar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('wayku_user');
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
