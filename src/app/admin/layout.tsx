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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────
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
const HREFS  = { order: '/admin/orders', query: '/admin/queries', subscriber: '/admin/subscribers', user: '/admin/users' };

// ─── Toast ─────────────────────────────────────────────────────────────────────
function NotifToast({ notif, onDismiss }: { notif: Notif; onDismiss: () => void }) {
    const Icon = ICONS[notif.type];
    const color = COLORS[notif.type];

    useEffect(() => {
        const t = setTimeout(onDismiss, 6000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <Link
            href={notif.href}
            onClick={onDismiss}
            className="flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 w-80 animate-in slide-in-from-right-4 fade-in duration-300 hover:border-stone-300 transition-colors group"
        >
            <div className={`${color} rounded-xl p-2 flex-shrink-0`}>
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
                onClick={(e) => { e.preventDefault(); onDismiss(); }}
                className="text-stone-300 hover:text-stone-500 flex-shrink-0 mt-0.5"
            >
                <X size={14} />
            </button>
        </Link>
    );
}

// ─── Bell Dropdown ──────────────────────────────────────────────────────────────
function BellDropdown({ notifs, onDismiss, onClearAll }: {
    notifs: Notif[];
    onDismiss: (id: string) => void;
    onClearAll: () => void;
}) {
    if (notifs.length === 0) {
        return (
            <div className="absolute top-10 right-0 w-72 bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-4 z-50">
                <p className="text-xs text-stone-400 text-center py-2">Sin notificaciones nuevas</p>
            </div>
        );
    }

    return (
        <div className="absolute top-10 right-0 w-80 bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">Notificaciones</span>
                <button onClick={onClearAll} className="text-[10px] text-stone-400 hover:text-white transition-colors">
                    Limpiar todo
                </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-stone-700/50">
                {[...notifs].reverse().map(n => {
                    const Icon = ICONS[n.type];
                    const color = COLORS[n.type];
                    return (
                        <Link
                            key={n.id}
                            href={n.href}
                            onClick={() => onDismiss(n.id)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-stone-700/50 transition-colors"
                        >
                            <div className={`${color} rounded-lg p-1.5 flex-shrink-0 mt-0.5`}>
                                <Icon size={12} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white">{n.title}</p>
                                <p className="text-[10px] text-stone-400 truncate">{n.description}</p>
                            </div>
                            <ChevronRight size={12} className="text-stone-500 flex-shrink-0 mt-1" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Admin Layout ───────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifs, setNotifs] = useState<Notif[]>([]);
    const [showBell, setShowBell] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const seenIds = useRef<Set<string>>(new Set());
    const bellRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setIsAuthorized(true); }, []);

    // Close bell dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setShowBell(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const addNotif = useCallback((notif: Omit<Notif, 'id' | 'time'>) => {
        const id = Math.random().toString(36).slice(2);
        setNotifs(prev => [...prev, { ...notif, id, time: new Date() }]);
    }, []);

    const dismiss = useCallback((id: string) => {
        setNotifs(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifs([]);
        setShowBell(false);
    }, []);

    const unread = notifs.length;

    // ─ Supabase Realtime ────────────────────────────────────────────────────────
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
                    href: HREFS.order,
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
                    href: HREFS.query,
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
                    href: HREFS.subscriber,
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
                    href: HREFS.user,
                });
            })
            .subscribe();

        return () => { supabase?.removeChannel(channel); };
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
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="h-16 flex items-center justify-between px-5 border-b border-stone-800">
                        <span className="font-serif text-base tracking-wider uppercase whitespace-nowrap">Waykú Admin</span>

                        {/* Bell */}
                        <div ref={bellRef} className="relative">
                            <button
                                onClick={() => setShowBell(v => !v)}
                                className="relative p-1.5 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-stone-800"
                            >
                                <Bell size={17} />
                                {unread > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </button>
                            {showBell && (
                                <BellDropdown notifs={notifs} onDismiss={dismiss} onClearAll={clearAll} />
                            )}
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

            {/* Toast Stack — bottom-right (clickable) */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {notifs.slice(-4).map(n => (
                    <div key={n.id} className="pointer-events-auto">
                        <NotifToast notif={n} onDismiss={() => dismiss(n.id)} />
                    </div>
                ))}
            </div>
        </div>
    );
}
