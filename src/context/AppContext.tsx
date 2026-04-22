'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, products as initialProducts } from '@/lib/products';
import { sortAdminOrders } from '@/lib/admin-orders';
import { supabase } from '@/lib/supabase';

export interface Order {
    id: string;
    customer: string;
    email: string;
    date: string;
    total: number;
    status: 'Pedido recibido' | 'Pago acreditado' | 'En preparación' | 'Embalado' | 'Despachado' | 'Entregado' | 'Devolución' | 'Cancelado';
    items: number;
    shippingMethod: 'shipping' | 'pickup';
    paymentMethod: 'card' | 'transfer';
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    phone?: string;
    items_details?: {
        name: string;
        price: number;
        quantity: number;
        material?: string;
        size?: string;
        shade?: string;
        cable?: string;
        canopy?: string;
    }[];
    created_at?: string;
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
    id: string | number;
    name: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    read: boolean;
    replied?: boolean;
    created_at?: string;
}

export interface Review {
    id: string;
    productId: string;
    userName: string;
    rating: number;
    comment: string;
    image?: string;
    date: string;
    created_at?: string;
}

interface AppContextType {
    products: Product[];
    orders: Order[];
    queries: Query[];
    reviews: Review[];
    refreshAdminData: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => Promise<{ error: Error | null }>;
    updateProduct: (id: string, product: Partial<Product>) => Promise<{ error: Error | null }>;
    deleteProduct: (id: string) => Promise<{ error: Error | null }>;
    updateOrderStatus: (id: string, status: Order['status']) => void;
    addQuery: (query: Omit<Query, 'id' | 'date' | 'read'>) => void;
    markQueryAsRead: (id: number) => void;
    replyToQuery: (id: number, response: string) => void;
    subscribeToNewsletter: (email: string) => void;
    addReview: (review: Omit<Review, 'id' | 'date'>) => void;
    addOrder: (order: Omit<Order, 'date' | 'status'> | Omit<Order, 'id' | 'date' | 'status'> & { id?: string }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [queries, setQueries] = useState<Query[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    const refreshAdminData = useCallback(async () => {
        try {
            const adminRes = await fetch('/api/admin/data', { cache: 'no-store' });
            if (!adminRes.ok) return;
            const adminData = await adminRes.json();
            if (adminData.orders) setOrders(sortAdminOrders(adminData.orders));
            if (adminData.queries) setQueries(adminData.queries);
        } catch {
            // Silent fail for non-admin users or transient errors.
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            const mappedInitial = initialProducts.map(p => ({ ...p, isVisible: true, stockCount: p.stockCount || 0 }));
            if (supabase) {
                try {
                    // Cargar productos y reviews (públicos)
                    try {
                        const { data: pData, error: pErr } = await supabase.from('products').select('*');
                        if (pErr) console.error("SUPABASE PRODUCTS ERROR:", pErr);
                        
                        if (pData && pData.length > 0) {
                            setProducts(pData);
                        } else {
                            setProducts(mappedInitial);
                        }
                        
                        const { data: rData } = await supabase.from('reviews').select('*');
                        if (rData) setReviews(rData);
                    } catch {
                         setProducts(mappedInitial);
                    }

                    // Intentar cargar datos sensibles mediante API administrativa
                    // Si falla silenciosamente (401), es un usuario normal.
                    await refreshAdminData();

                } catch (err) {
                    console.error("Critical Admin Load error:", err);
                    setProducts(mappedInitial);
                }
            } else {
                setProducts(mappedInitial);
            }
        };
        loadInitialData();
    }, [refreshAdminData]);

    const addProduct = async (p: Omit<Product, 'id'>) => {
        const newP = { ...p, id: Math.random().toString(36).substr(2, 9) };
        setProducts(prev => [newP, ...prev]);
        if (supabase) {
            const { error } = await supabase.from('products').insert(newP);
            if (error) {
                setProducts(prev => prev.filter(product => product.id !== newP.id));
                return { error };
            }
        }
        return { error: null };
    };

    const updateProduct = async (id: string, fields: Partial<Product>) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
        if (supabase) {
            const { error } = await supabase.from('products').update(fields).eq('id', id);
            return { error };
        }
        return { error: null };
    };

    const deleteProduct = async (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        if (supabase) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            return { error };
        }
        return { error: null };
    };

    return (
        <AppContext.Provider value={{
            products, orders, queries, reviews,
            refreshAdminData,
            addProduct, updateProduct, deleteProduct,
            updateOrderStatus: (id, status) => {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
                fetch('/api/admin/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table: 'orders', action: 'update', data: { status }, match: { id } })
                }).catch(console.error);
            },
            addReview: async (review) => {
                const tempId = Math.random().toString(36).substr(2, 9);
                const newR: Review = { ...review, id: tempId, date: new Date().toLocaleDateString() };
                setReviews(prev => [newR, ...prev]);
                if (supabase) {
                    const dbReview = Object.fromEntries(
                        Object.entries(newR).filter(([key]) => key !== 'id')
                    ) as Omit<Review, 'id'>;
                    const { data, error } = await supabase.from('reviews').insert(dbReview).select().single();
                    if (error) {
                        console.error("Review Insert Error:", error);
                    } else if (data) {
                        setReviews(prev => prev.map(r => r.id === tempId ? data : r));
                    }
                }
            },
            addOrder: async (order) => {
                const tempId = Math.random().toString(36).substr(2, 9);
                const newO: Order = { ...order, id: order.id || tempId, date: new Date().toLocaleDateString(), status: 'Pedido recibido' };
                setOrders(prev => [newO, ...prev]);
                if (supabase) {
                    try {
                        const dbOrder = Object.fromEntries(
                            Object.entries(newO).filter(([key]) => key !== 'shippingCost')
                        ) as typeof newO;
                        const { error } = await supabase.from('orders').insert(dbOrder);
                        if (error) console.error('Supabase DB error', error);
                    } catch {
                        // Silent fail
                    }
                }
            },
            addQuery: async (q) => {
                const newQ = { ...q, date: new Date().toLocaleDateString(), read: false };
                // Add an optimistic ID for UI so we don't need to select it back 
                // (RLS blocks selecting queries for security)
                setQueries(prev => [{ ...newQ, id: crypto.randomUUID() } as Query, ...prev]);
                if (supabase) {
                    const { error } = await supabase.from('queries').insert(newQ);
                    if (error) console.error("Error inserting query:", error);
                }
            },
            markQueryAsRead: (id) => {
                setQueries(prev => prev.map(q => q.id === id ? { ...q, read: true } : q));
                fetch('/api/admin/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table: 'queries', action: 'update', data: { read: true }, match: { id } })
                }).catch(console.error);
            },
            replyToQuery: (id) => {
                setQueries(prev => prev.map(q => q.id === id ? { ...q, replied: true } : q));
                fetch('/api/admin/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table: 'queries', action: 'update', data: { replied: true }, match: { id } })
                }).catch(console.error);
            },
            subscribeToNewsletter: async (email) => {
                if (supabase) {
                    supabase.from('subscribers').insert({ email }).then();
                }
                try {
                    await fetch('/api/newsletter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                } catch (error) {
                    console.error("Error calling newsletter API", error);
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
