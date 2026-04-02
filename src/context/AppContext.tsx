'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, products as initialProducts } from '@/lib/products';
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
    postalCode?: string;
    phone?: string;
    items_details?: any[];
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
    id: number;
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
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (id: string, product: Partial<Product>) => Promise<{ error: any }>;
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
                    // Helper para parsear fechas
                    const parseDate = (dateStr: string) => {
                        if (!dateStr) return 0;
                        const months: Record<string, number> = { 'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11 };
                        const parts = dateStr.toLowerCase().split(' ').filter(p => p !== 'de' && p !== 'del' && p !== '');
                        if (parts.length >= 3) {
                            const day = parseInt(parts[0], 10);
                            const monthStr = parts[1].replace('.', '').substring(0, 3);
                            const year = parseInt(parts[2], 10);
                            if (!isNaN(day) && !isNaN(year) && typeof months[monthStr] !== 'undefined') {
                                return new Date(year, months[monthStr], day).getTime();
                            }
                        }
                        const ts = Date.parse(dateStr);
                        return isNaN(ts) ? 0 : ts;
                    };

                    const sortOrders = (ordersList: any[]) => {
                        return [...ordersList].sort((a, b) => {
                            let timeA = 0; let timeB = 0;
                            if (a.created_at) timeA = new Date(a.created_at).getTime();
                            if (b.created_at) timeB = new Date(b.created_at).getTime();
                            if (timeA === 0 && a.id && a.id.startsWith('ORD-') && a.id.length > 10) {
                                const ts = parseInt(a.id.replace('ORD-', ''), 10);
                                if (!isNaN(ts) && ts > 1000000000) timeA = ts;
                            }
                            if (timeB === 0 && b.id && b.id.startsWith('ORD-') && b.id.length > 10) {
                                const ts = parseInt(b.id.replace('ORD-', ''), 10);
                                if (!isNaN(ts) && ts > 1000000000) timeB = ts;
                            }
                            if (timeA === 0) timeA = parseDate(a.date);
                            if (timeB === 0) timeB = parseDate(b.date);
                            if (timeA === timeB) return b.id.localeCompare(a.id);
                            return timeB - timeA;
                        });
                    };

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
                    } catch (e) {
                         setProducts(mappedInitial);
                    }

                    // Intentar cargar datos sensibles mediante API administrativa
                    // Si falla silenciosamente (401), es un usuario normal.
                    try {
                        const adminRes = await fetch('/api/admin/data');
                        if (adminRes.ok) {
                            const adminData = await adminRes.json();
                            if (adminData.orders) setOrders(sortOrders(adminData.orders));
                            if (adminData.queries) setQueries(adminData.queries);
                            if (adminData.subscribers) setSubscribers(adminData.subscribers);
                        }
                    } catch (e) {
                        // Silent fail
                    }

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
        if (supabase) {
            const { error } = await supabase.from('products').update(fields).eq('id', id);
            return { error };
        }
        return { error: null };
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
                fetch('/api/admin/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table: 'orders', action: 'update', data: { status }, match: { id } })
                }).catch(console.error);
            },
            addReview: async (review) => {
                const tempId = Math.random().toString(36).substr(2, 9);
                const newR = { ...review, id: tempId, date: new Date().toLocaleDateString() };
                setReviews(prev => [newR as any, ...prev]);
                if (supabase) {
                    const { id, ...dbReview } = newR;
                    const { data, error } = await supabase.from('reviews').insert(dbReview).select().single();
                    if (error) {
                        console.error("Review Insert Error:", error);
                    } else if (data) {
                        setReviews(prev => prev.map(r => r.id === tempId ? data : r));
                    }
                }
            },
            addOrder: (order) => {
                const newO = { ...order, date: new Date().toLocaleDateString(), status: 'Pedido recibido' };
                setOrders(prev => [newO as any, ...prev]);
                if (supabase) supabase.from('orders').insert(newO).then();
            },
            addQuery: async (q) => {
                const newQ = { ...q, date: new Date().toLocaleDateString(), read: false };
                // Add an optimistic ID for UI so we don't need to select it back 
                // (RLS blocks selecting queries for security)
                setQueries(prev => [{ ...newQ, id: 9999999 + Math.floor(Math.random() * 1000) } as any, ...prev]);
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
