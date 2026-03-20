'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simple mock login logic
        const users = JSON.parse(localStorage.getItem('wayku_registered_users') || '[]');
        const foundUser = users.find((u: any) => u.email === email && u.password === password);

        if (foundUser) {
            const userData = { id: foundUser.id, email: foundUser.email, name: foundUser.name };
            setUser(userData);
            localStorage.setItem('wayku_user', JSON.stringify(userData));
        } else {
            throw new Error('Email o contraseña incorrectos');
        }
    };

    const register = async (name: string, email: string, password: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const users = JSON.parse(localStorage.getItem('wayku_registered_users') || '[]');
        if (users.find((u: any) => u.email === email)) {
            throw new Error('El email ya está registrado');
        }

        const newUser = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            email,
            password
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem('wayku_registered_users', JSON.stringify(updatedUsers));

        const userData = { id: newUser.id, name: newUser.name, email: newUser.email };
        setUser(userData);
        localStorage.setItem('wayku_user', JSON.stringify(userData));

        // Add user to admin's list in AppContext (conceptually)
        // This will be handled by AppContext if we link them
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
