'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, products as initialProducts } from '@/lib/products';
import { supabase } from '@/lib/supabase';

export interface Order {
    id: string;
    customer: string;
    email: string;
    date: string;
    total: string;
    status: 'Pendiente' | 'A Verificar' | 'Confirmado' | 'Procesando' | 'Enviado' | 'Entregado' | 'Cancelado';
    items: number;
    shippingMethod: 'shipping' | 'pickup';
    paymentMethod: 'card' | 'transfer';
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    details?: {
        name: string;
        price: number;
        quantity: number;
        material?: string;
        size?: string;
        shade?: string;
        cable?: string;
        canopy?: string;
    }[];
}

export interface Query {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    read: boolean;
    replied?: boolean;
}

export interface Review {
    id: string;
    productId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
}

interface AppContextType {
    products: Product[];
    orders: Order[];
    queries: Query[];
    reviews: Review[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    updateOrderStatus: (id: string, status: Order['status']) => void;
    addQuery: (query: Omit<Query, 'id' | 'date' | 'read'>) => void;
    markQueryAsRead: (id: number) => void;
    replyToQuery: (id: number, response: string) => void;
    subscribeToNewsletter: (email: string) => void;
    addReview: (review: Omit<Review, 'id' | 'date'>) => void;
    addOrder: (order: Omit<Order, 'date' | 'status'> | Omit<Order, 'id' | 'date' | 'status'> & { id?: string }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [queries, setQueries] = useState<Query[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [subscribers, setSubscribers] = useState<string[]>([]);

    useEffect(() => {
        const loadInitialData = async () => {
            const mappedInitial = initialProducts.map(p => ({ ...p, isVisible: true, stockCount: p.stockCount || 0 }));
            if (supabase) {
                try {
                    const { data: pData } = await supabase.from('products').select('*');
                    if (pData && pData.length > 0) {
                        setProducts(pData);
                    } else {
                        setProducts(mappedInitial);
                    }

                    try {
                        const { data: oData } = await supabase.from('orders').select('*').order('id', { ascending: false });
                        if (oData) setOrders(oData);
                    } catch (e) {}

                    try {
                        const { data: qData } = await supabase.from('queries').select('*').order('id', { ascending: false });
                        if (qData) setQueries(qData);
                    } catch (e) {}

                    try {
                        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
                        if (oData) setOrders(oData);

                        const { data: qData } = await supabase.from('queries').select('*').order('created_at', { ascending: false });
                        if (qData) setQueries(qData);

                        const { data: sData } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
                        if (sData) setSubscribers(sData.map(s => s.email));
                    } catch (e) {}
                } catch (err) {
                    console.error("Critical Admin Load error:", err);
                    setProducts(mappedInitial);
                }
            } else {
                setProducts(mappedInitial);
            }
        };
        loadInitialData();
    }, []);

    const addProduct = async (p: any) => {
        const newP = { ...p, id: Math.random().toString(36).substr(2, 9) };
        setProducts(prev => [newP, ...prev]);
        if (supabase) await supabase.from('products').insert(newP);
    };

    const updateProduct = async (id: string, fields: any) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
        if (supabase) await supabase.from('products').update(fields).eq('id', id);
    };

    const deleteProduct = async (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        if (supabase) await supabase.from('products').delete().eq('id', id);
    };

    return (
        <AppContext.Provider value={{
            products, orders, queries, reviews,
            addProduct, updateProduct, deleteProduct,
            updateOrderStatus: (id, status) => {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
                if (supabase) supabase.from('orders').update({ status }).eq('id', id).then();
            },
            addReview: (review) => {
                const newR = { ...review, id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString() };
                setReviews(prev => [newR as any, ...prev]);
                if (supabase) supabase.from('reviews').insert(newR).then();
            },
            addOrder: (order) => {
                const newO = { ...order, date: new Date().toLocaleDateString(), status: 'Pendiente' };
                setOrders(prev => [newO as any, ...prev]);
                if (supabase) supabase.from('orders').insert(newO).then();
            },
            addQuery: async (q) => {
                const newQ = { ...q, date: new Date().toLocaleDateString(), read: false };
                if (supabase) {
                    const { data } = await supabase.from('queries').insert(newQ).select().single();
                    if (data) setQueries(prev => [data, ...prev]);
                }
            },
            markQueryAsRead: (id) => {
                setQueries(prev => prev.map(q => q.id === id ? { ...q, read: true } : q));
                if (supabase) supabase.from('queries').update({ read: true }).eq('id', id).then();
            },
            replyToQuery: (id) => {
                setQueries(prev => prev.map(q => q.id === id ? { ...q, replied: true } : q));
                if (supabase) supabase.from('queries').update({ replied: true }).eq('id', id).then();
            },
            subscribeToNewsletter: (email) => {
                if (supabase) {
                    supabase.from('subscribers').insert({ email }).then();
                }
            }
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp missing');
    return context;
};
