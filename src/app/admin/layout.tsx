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
    Rss
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Notification toast component ────────────────────────────────────────────
interface Notif {
    id: string;
    type: 'order' | 'query' | 'subscriber' | 'user';
    title: string;
    description: string;
    time: Date;
}

const ICONS = {
    order: ShoppingCart,
    query: Mail,
    subscriber: Rss,
    user: Users,
};

const COLORS = {
    order:      'bg-blue-500',
    query:      'bg-violet-500',
    subscriber: 'bg-emerald-500',
    user:       'bg-amber-500',
};

function NotifToast({ notif, onDismiss }: { notif: Notif; onDismiss: () => void }) {
    const Icon = ICONS[notif.type];
    const color = COLORS[notif.type];

    useEffect(() => {
        const t = setTimeout(onDismiss, 6000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div className="flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 w-80 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className={`${color} rounded-xl p-2 flex-shrink-0`}>
                <Icon size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-900">{notif.title}</p>
                <p className="text-xs text-stone-500 truncate">{notif.description}</p>
            </div>
            <button onClick={onDismiss} className="text-stone-300 hover:text-stone-500 flex-shrink-0 mt-0.5">
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifs, setNotifs] = useState<Notif[]>([]);
    const [unread, setUnread] = useState(0);
    const router = useRouter();
    const pathname = usePathname();
    const seenIds = useRef<Set<string>>(new Set());

    useEffect(() => { setIsAuthorized(true); }, []);

    const addNotif = useCallback((notif: Omit<Notif, 'id' | 'time'>) => {
        const id = Math.random().toString(36).slice(2);
        setNotifs(prev => [...prev, { ...notif, id, time: new Date() }]);
        setUnread(n => n + 1);
    }, []);

    const dismiss = useCallback((id: string) => {
        setNotifs(prev => prev.filter(n => n.id !== id));
    }, []);

    // — Supabase Realtime subscriptions ————————————————————————
    useEffect(() => {
        if (!supabase || pathname === '/admin/login') return;

        const channel = supabase
            .channel('admin-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                const row = payload.new as any;
                if (seenIds.current.has(`order-${row.id}`)) return;
                seenIds.current.add(`order-${row.id}`);
                addNotif({
                    type: 'order',
                    title: '🛒 Nuevo Pedido',
                    description: `${row.customer || row.email || 'Cliente'} — $${Number(row.total || 0).toLocaleString()}`,
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'queries' }, (payload) => {
                const row = payload.new as any;
                if (seenIds.current.has(`query-${row.id}`)) return;
                seenIds.current.add(`query-${row.id}`);
                addNotif({
                    type: 'query',
                    title: '✉️ Nueva Consulta',
                    description: `${row.name || 'Visitante'}: ${row.subject || ''}`,
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'subscribers' }, (payload) => {
                const row = payload.new as any;
                if (seenIds.current.has(`sub-${row.id || row.email}`)) return;
                seenIds.current.add(`sub-${row.id || row.email}`);
                addNotif({
                    type: 'subscriber',
                    title: '📬 Nueva Suscripción',
                    description: row.email || 'Email desconocido',
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
                const row = payload.new as any;
                if (seenIds.current.has(`user-${row.id}`)) return;
                seenIds.current.add(`user-${row.id}`);
                addNotif({
                    type: 'user',
                    title: '👤 Nuevo Usuario',
                    description: `${row.full_name || row.name || 'Sin nombre'} — ${row.email || ''}`,
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [addNotif, pathname]);

    const handleLogout = async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        router.push('/admin/login');
        router.refresh();
    };

    if (pathname === '/admin/login') return <>{children}</>;
    if (!isAuthorized) return null;

    const navigation = [
        { name: 'Dashboard',     href: '/admin/dashboard',   icon: LayoutDashboard },
        { name: 'Productos',     href: '/admin/products',    icon: Package },
        { name: 'Pedidos',       href: '/admin/orders',      icon: ShoppingBag },
        { name: 'Consultas',     href: '/admin/queries',     icon: MessageSquare },
        { name: 'Suscripciones', href: '/admin/subscribers', icon: Users },
        { name: 'Usuarios',      href: '/admin/users',       icon: Users },
    ];

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="h-16 flex items-center justify-between px-6 border-b border-stone-800">
                        <span className="font-serif text-2xl tracking-widest uppercase">Waykú Admin</span>
                        {/* Bell icon with unread count */}
                        <button
                            onClick={() => setUnread(0)}
                            className="relative text-stone-400 hover:text-white transition-colors"
                            title="Notificaciones"
                        >
                            <Bell size={18} />
                            {unread > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white animate-bounce">
                                    {unread > 9 ? '9+' : unread}
                                </span>
                            )}
                        </button>
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
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:pl-64">
                <header className="h-16 bg-white border-b border-stone-100 flex items-center justify-between px-4 lg:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <span className="font-serif text-xl tracking-widest uppercase">Waykú</span>
                    <div className="w-10" />
                </header>

                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>

            {/* Toast Notification Stack — bottom-right */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {notifs.map(n => (
                    <div key={n.id} className="pointer-events-auto">
                        <NotifToast notif={n} onDismiss={() => dismiss(n.id)} />
                    </div>
                ))}
            </div>
        </div>
    );
}
