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
    status: 'Pendiente' | 'Procesando' | 'Enviado' | 'Entregado' | 'Cancelado';
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
    addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_ORDERS: Order[] = [];

const MOCK_QUERIES: Query[] = [];

export function AppProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
    const [queries, setQueries] = useState<Query[]>(MOCK_QUERIES);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [subscribers, setSubscribers] = useState<string[]>([]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (supabase) {
                // Fetch from Supabase
                const { data: pData } = await supabase.from('products').select('*');
                if (pData && pData.length > 0) setProducts(pData);
                else setProducts(initialProducts.map(p => ({ ...p, isVisible: true })));

                const { data: oData } = await supabase.from('orders').select('*');
                if (oData) setOrders(oData);

                const { data: qData } = await supabase.from('queries').select('*');
                if (qData) setQueries(qData);

                const { data: rData } = await supabase.from('reviews').select('*');
                if (rData) setReviews(rData);

                const { data: sData } = await supabase.from('subscribers').select('*');
                if (sData) setSubscribers(sData.map(s => s.email));
            } else {
                // LocalStorage Fallback
                const savedProducts = localStorage.getItem('wayku_products');
                if (savedProducts) {
                    setProducts(JSON.parse(savedProducts));
                } else {
                    setProducts(initialProducts.map(p => ({ ...p, isVisible: true })));
                }

                const savedOrders = localStorage.getItem('wayku_orders');
                if (savedOrders) setOrders(JSON.parse(savedOrders));

                const savedQueries = localStorage.getItem('wayku_queries');
                if (savedQueries) setQueries(JSON.parse(savedQueries));

                const savedSubscribers = localStorage.getItem('wayku_subscribers');
                if (savedSubscribers) setSubscribers(JSON.parse(savedSubscribers));

                const savedReviews = localStorage.getItem('wayku_reviews');
                if (savedReviews) setReviews(JSON.parse(savedReviews));
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (!supabase) localStorage.setItem('wayku_products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        if (!supabase) localStorage.setItem('wayku_orders', JSON.stringify(orders));
    }, [orders]);

    useEffect(() => {
        if (!supabase) localStorage.setItem('wayku_queries', JSON.stringify(queries));
    }, [queries]);

    useEffect(() => {
        if (!supabase) localStorage.setItem('wayku_subscribers', JSON.stringify(subscribers));
    }, [subscribers]);

    useEffect(() => {
        if (!supabase) localStorage.setItem('wayku_reviews', JSON.stringify(reviews));
    }, [reviews]);

    const addProduct = async (product: Omit<Product, 'id'>) => {
        const newProduct = {
            ...product,
            id: Math.random().toString(36).substr(2, 9),
            isVisible: true,
            stockCount: product.stockCount ?? 0,
            inStock: (product.stockCount ?? 0) > 0,
        };
        setProducts(prev => [newProduct as any, ...prev]);
        if (supabase) await supabase.from('products').insert({ ...newProduct, details: undefined }); // Prevent JSON mismatch
    };

    const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
        if (supabase) await supabase.from('products').update(updatedFields).eq('id', id);
    };

    const deleteProduct = async (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        if (supabase) await supabase.from('products').delete().eq('id', id);
    };

    const updateOrderStatus = async (id: string, status: Order['status']) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        if (supabase) await supabase.from('orders').update({ status }).eq('id', id);
    };

    const addReview = async (review: Omit<Review, 'id' | 'date'>) => {
        const newReview: Review = {
            ...review,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
        };
        setReviews(prev => [newReview, ...prev]);
        if (supabase) await supabase.from('reviews').insert(newReview);
    };

    const addOrder = async (order: Omit<Order, 'id' | 'date' | 'status'>) => {
        const newOrder: Order = {
            ...order,
            id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: 'Pendiente'
        };
        setOrders(prev => [newOrder, ...prev]);
        if (supabase) await supabase.from('orders').insert(newOrder);
    };

    return (
        <AppContext.Provider value={{
            products,
            orders,
            queries,
            reviews,
            addProduct,
            updateProduct,
            deleteProduct,
            updateOrderStatus,
            addReview,
            addOrder,
            addQuery: async (q) => {
                const tempId = Date.now();
                const newQuery = { ...q, id: tempId, date: 'Recién', read: false };
                setQueries(prev => [newQuery, ...prev]);
                if (supabase) {
                    const { id, ...insertData } = newQuery;
                    const { data, error } = await supabase.from('queries').insert(insertData).select().single();
                    if (data) {
                        setQueries(prev => prev.map(qry => qry.id === tempId ? { ...qry, id: data.id } : qry));
                    }
                }
            },
            markQueryAsRead: async (id) => {
                setQueries(prev => prev.map(q => q.id === id ? { ...q, read: true } : q));
                if (supabase) await supabase.from('queries').update({ read: true }).eq('id', id);
            },
            replyToQuery: async (id) => {
                setQueries(prev => prev.map(q => q.id === id ? { ...q, replied: true } : q));
                if (supabase) await supabase.from('queries').update({ replied: true }).eq('id', id);
            },
            subscribeToNewsletter: async (email) => {
                if (!subscribers.includes(email)) {
                    setSubscribers(prev => [...prev, email]);
                    if (supabase) await supabase.from('subscribers').insert({ email });
                }
            }
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
