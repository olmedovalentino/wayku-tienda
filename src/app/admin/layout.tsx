'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    MessageSquare,
    Users,
    LogOut,
    Menu,
    X,
    Bell,
    ShoppingCart,
    Mail,
    Rss,
    ChevronRight,
    Ticket,
    RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Notif {
    id: string;
    type: 'order' | 'query' | 'subscriber' | 'user';
    title: string;
    description: string;
    href: string;
    time: Date;
}

const ICONS = { order: ShoppingCart, query: Mail, subscriber: Rss, user: Users };
const COLORS = { order: 'bg-blue-500', query: 'bg-violet-500', subscriber: 'bg-emerald-500', user: 'bg-amber-500' };
const HREFS = { order: '/admin/orders', query: '/admin/queries', subscriber: '/admin/subscribers', user: '/admin/users' };

function NotifToast({ notif, onDismiss }: { notif: Notif; onDismiss: () => void }) {
    const Icon = ICONS[notif.type];

    useEffect(() => {
        const timeout = setTimeout(onDismiss, 6000);
        return () => clearTimeout(timeout);
    }, [onDismiss]);

    return (
        <Link
            href={notif.href}
            onClick={onDismiss}
            className="flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 w-80 animate-in slide-in-from-right-4 fade-in duration-300 hover:border-stone-300 transition-colors group"
        >
            <div className={`${COLORS[notif.type]} rounded-xl p-2 flex-shrink-0`}>
                <Icon size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-900">{notif.title}</p>
                <p className="text-xs text-stone-500 truncate">{notif.description}</p>
                <p className="text-[10px] text-primary mt-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver ahora <ChevronRight size={10} />
                </p>
            </div>
            <button
                onClick={(event) => {
                    event.preventDefault();
                    onDismiss();
                }}
                className="text-stone-300 hover:text-stone-500 flex-shrink-0 mt-0.5"
            >
                <X size={14} />
            </button>
        </Link>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [history, setHistory] = useState<Notif[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem('wayku_admin_notifs');
            if (saved) {
                const parsed = JSON.parse(saved) as Notif[];
                return parsed.map((notif) => ({ ...notif, time: new Date(notif.time) }));
            }
        } catch {
            // Ignore invalid localStorage state.
        }
        return [];
    });
    const [toasts, setToasts] = useState<Notif[]>([]);
    const [showBell, setShowBell] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const seenIds = useRef<Set<string>>(new Set());
    const bellRef = useRef<HTMLButtonElement>(null);
    const mobileBellRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const res = await fetch('/api/admin/auth');
                const data = await res.json();
                if (res.ok && data.authenticated) {
                    setIsAuthorized(true);
                } else {
                    router.push('/admin/login');
                }
            } catch {
                router.push('/admin/login');
            }
        };

        if (pathname !== '/admin/login') verifyAuth();
    }, [router, pathname]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            const target = event.target as Node;
            const outsideBell = bellRef.current && !bellRef.current.contains(target);
            const outsideMobileBell = mobileBellRef.current && !mobileBellRef.current.contains(target);
            const outsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
            if (outsideBell && outsideMobileBell && outsideDropdown) setShowBell(false);
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (pathname === '/admin/login') return;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);

    const addNotif = useCallback((notif: Omit<Notif, 'id' | 'time'>) => {
        const id = Math.random().toString(36).slice(2);
        const full: Notif = { ...notif, id, time: new Date() };
        setHistory((prev) => {
            const next = [full, ...prev].slice(0, 50);
            try {
                localStorage.setItem('wayku_admin_notifs', JSON.stringify(next));
            } catch {
                // Ignore localStorage failures.
            }
            return next;
        });
        setToasts((prev) => [...prev, full]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((notif) => notif.id !== id));
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem('wayku_admin_notifs');
        } catch {
            // Ignore localStorage failures.
        }
        setShowBell(false);
    }, []);

    const unread = history.length;

    useEffect(() => {
        if (!supabase || pathname === '/admin/login') return;

        const handleOrderInsert = (payload: { new: Record<string, unknown> }) => {
            const row = payload.new as Record<string, unknown>;
            const rowId = `order-${row.id}`;
            if (seenIds.current.has(rowId)) return;
            seenIds.current.add(rowId);
            addNotif({
                type: 'order',
                title: 'Nuevo pedido',
                description: `${row.customer || row.email || 'Cliente'} - $${Number(row.total || 0).toLocaleString()}`,
                href: HREFS.order,
            });
        };

        const handleQueryInsert = (payload: { new: Record<string, unknown> }) => {
            const row = payload.new as Record<string, unknown>;
            const rowId = `query-${row.id}`;
            if (seenIds.current.has(rowId)) return;
            seenIds.current.add(rowId);
            addNotif({
                type: 'query',
                title: 'Nueva consulta',
                description: `${row.name || 'Visitante'}: ${row.subject || ''}`,
                href: HREFS.query,
            });
        };

        const handleSubscriberInsert = (payload: { new: Record<string, unknown> }) => {
            const row = payload.new as Record<string, unknown>;
            const subId = `sub-${row.id || row.email}`;
            if (seenIds.current.has(subId)) return;
            seenIds.current.add(subId);
            addNotif({
                type: 'subscriber',
                title: 'Nueva suscripcion',
                description: (row.email as string) || 'Email desconocido',
                href: HREFS.subscriber,
            });
        };

        const handleUserInsert = (payload: { new: Record<string, unknown> }) => {
            const row = payload.new as Record<string, unknown>;
            const userId = `user-${row.id}`;
            if (seenIds.current.has(userId)) return;
            seenIds.current.add(userId);
            addNotif({
                type: 'user',
                title: 'Nuevo usuario',
                description: `${row.full_name || row.name || 'Sin nombre'} - ${row.email || ''}`,
                href: HREFS.user,
            });
        };

        const channel = supabase
            .channel('admin-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, handleOrderInsert)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'queries' }, handleQueryInsert)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'subscribers' }, handleSubscriberInsert)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, handleUserInsert)
            .subscribe();

        const cleanupInterval = setInterval(() => {
            if (seenIds.current.size > 100) {
                seenIds.current.clear();
            }
        }, 60000);

        return () => {
            supabase?.removeChannel(channel);
            clearInterval(cleanupInterval);
        };
    }, [addNotif, pathname]);

    const handleLogout = async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        router.push('/admin/login');
        router.refresh();
    };

    const handleGlobalRefresh = () => {
        setShowBell(false);
        setIsRefreshing(true);
        window.location.reload();
    };

    if (pathname === '/admin/login') return <>{children}</>;
    if (!isAuthorized) return null;

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Productos', href: '/admin/products', icon: Package },
        { name: 'Cupones', href: '/admin/coupons', icon: Ticket },
        { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBag },
        { name: 'Consultas', href: '/admin/queries', icon: MessageSquare },
        { name: 'Suscripciones', href: '/admin/subscribers', icon: Users },
        { name: 'Usuarios', href: '/admin/users', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="h-16 flex items-center justify-between px-5 border-b border-stone-800">
                        <span className="font-serif text-base tracking-wider uppercase whitespace-nowrap">Wayku Admin</span>
                        <div className="hidden items-center gap-2 lg:flex">
                            <button
                                onClick={handleGlobalRefresh}
                                className="inline-flex p-1.5 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-stone-800"
                                title="Recargar admin"
                            >
                                <RefreshCw size={17} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                            <button
                                ref={bellRef}
                                onClick={() => setShowBell((value) => !value)}
                                className="relative inline-flex p-1.5 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-stone-800"
                            >
                                <Bell size={17} />
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800'}`}
                                >
                                    <item.icon size={20} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-stone-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg text-sm font-medium transition-colors"
                        >
                            <LogOut size={20} />
                            Cerrar sesion
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex min-h-screen flex-col lg:pl-64">
                <header className="sticky top-0 z-30 h-16 bg-white border-b border-stone-100 flex items-center justify-between px-4 lg:hidden">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg">
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <span className="font-serif text-xl tracking-widest uppercase">Wayku</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleGlobalRefresh}
                            className="inline-flex p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Recargar admin"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button
                            ref={mobileBellRef}
                            onClick={() => setShowBell((value) => !value)}
                            className="relative inline-flex p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            <Bell size={20} />
                            {unread > 0 && (
                                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                                    {unread > 9 ? '9+' : unread}
                                </span>
                            )}
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>

            {showBell && (
                <div
                    ref={dropdownRef}
                    className="fixed top-20 left-4 right-4 z-[200] max-h-[70vh] overflow-hidden rounded-2xl bg-stone-800 border border-stone-700 shadow-2xl sm:left-auto sm:w-80 lg:top-4 lg:left-[148px] lg:right-auto"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700">
                        <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">Notificaciones</span>
                        {history.length > 0 && (
                            <button onClick={clearHistory} className="text-[10px] text-stone-400 hover:text-white transition-colors">
                                Limpiar todo
                            </button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <p className="text-xs text-stone-400 text-center py-5">Sin notificaciones nuevas</p>
                    ) : (
                        <div className="max-h-72 overflow-y-auto divide-y divide-stone-700/50">
                            {history.map((notif) => {
                                const Icon = ICONS[notif.type];
                                return (
                                    <Link
                                        key={notif.id}
                                        href={notif.href}
                                        onClick={() => setShowBell(false)}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-stone-700/50 transition-colors"
                                    >
                                        <div className={`${COLORS[notif.type]} rounded-lg p-1.5 flex-shrink-0 mt-0.5`}>
                                            <Icon size={12} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-white">{notif.title}</p>
                                            <p className="text-[10px] text-stone-400 truncate">{notif.description}</p>
                                        </div>
                                        <ChevronRight size={12} className="text-stone-500 flex-shrink-0 mt-1" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.slice(-4).map((notif) => (
                    <div key={notif.id} className="pointer-events-auto">
                        <NotifToast notif={notif} onDismiss={() => dismissToast(notif.id)} />
                    </div>
                ))}
            </div>
        </div>
    );
}
