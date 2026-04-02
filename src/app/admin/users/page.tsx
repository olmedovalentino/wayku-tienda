'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Trash2, Search, Package, MessageSquare, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';

interface RegisteredUser {
    id: string;
    name: string;
    email: string;
    role?: string;
}

function UserCard({ user, orders, queries, reviews, onDelete, expanded, onToggle }: {
    user: RegisteredUser;
    orders: any[];
    queries: any[];
    reviews: any[];
    onDelete: (id: string) => void;
    expanded: boolean;
    onToggle: () => void;
}) {
    const hasActivity = orders.length > 0 || queries.length > 0 || reviews.length > 0;

    return (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden transition-all duration-200">
            {/* Header siempre visible */}
            <div className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {(user.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900 text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-stone-500 truncate flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {user.role || 'Cliente'}
                    </span>
                    {hasActivity && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold gap-1">
                            {orders.length + queries.length + reviews.length} act.
                        </span>
                    )}
                </div>
            </div>

            {/* Mini stats row */}
            <div className="px-4 pb-3 flex items-center gap-3 text-[11px] text-stone-500">
                <span className={`flex items-center gap-1 ${orders.length > 0 ? 'text-blue-600 font-semibold' : ''}`}>
                    <Package size={12} /> {orders.length} pedidos
                </span>
                <span className={`flex items-center gap-1 ${queries.length > 0 ? 'text-violet-600 font-semibold' : ''}`}>
                    <MessageSquare size={12} /> {queries.length} consultas
                </span>
                <span className={`flex items-center gap-1 ${reviews.length > 0 ? 'text-amber-600 font-semibold' : ''}`}>
                    <Star size={12} /> {reviews.length} reseñas
                </span>
            </div>

            {/* Toggle actividad */}
            <div className="border-t border-stone-100 flex items-center justify-between px-4 py-2">
                <button
                    onClick={() => onDelete(user.id)}
                    className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                    <Trash2 size={13} /> Eliminar
                </button>
                {hasActivity ? (
                    <button
                        onClick={onToggle}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        {expanded ? 'Ocultar' : 'Ver actividad'}
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                ) : (
                    <span className="text-[10px] text-stone-400 italic">Sin actividad</span>
                )}
            </div>

            {/* Detalle expandible */}
            {expanded && hasActivity && (
                <div className="border-t border-stone-100 bg-stone-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {orders.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <Package size={11} /> Pedidos ({orders.length})
                            </h4>
                            <div className="space-y-1">
                                {orders.map(o => (
                                    <div key={o.id} className="text-xs text-stone-600 flex items-center justify-between bg-white border border-stone-100 rounded-lg px-3 py-1.5">
                                        <span className="font-mono text-stone-500 text-[10px]">{o.id}</span>
                                        <span className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                                            o.status === 'Entregado' ? 'bg-green-100 text-green-700' :
                                            o.status === 'Cancelado' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>{o.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {queries.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <MessageSquare size={11} /> Consultas ({queries.length})
                            </h4>
                            <div className="space-y-1">
                                {queries.map(q => (
                                    <div key={q.id} className="text-xs text-stone-600 flex items-center justify-between bg-white border border-stone-100 rounded-lg px-3 py-1.5">
                                        <span className="truncate max-w-[150px]">{q.subject}</span>
                                        <span className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${q.replied ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {q.replied ? 'Respondida' : 'Pendiente'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {reviews.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <Star size={11} /> Reseñas ({reviews.length})
                            </h4>
                            <div className="space-y-1">
                                {reviews.map(r => (
                                    <div key={r.id} className="text-xs text-stone-600 flex items-center justify-between bg-white border border-stone-100 rounded-lg px-3 py-1.5">
                                        <span className="truncate max-w-[150px]">Prod: {r.productId}</span>
                                        <span className="text-amber-500 font-bold">{r.rating}★</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<RegisteredUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const { orders, queries, reviews } = useApp();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase.from('users').select('*');
            if (error) {
                console.error("Error fetching users from Supabase:", error);
                return;
            }
            if (data) {
                const mappedUsers = data.map(u => ({
                    ...u,
                    name: u.full_name || u.name || 'Usuario sin nombre'
                }));
                setUsers(mappedUsers);
            }
        } catch (e) {
            console.error("Critical fetch error:", e);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deleteUser = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            if (!supabase) return;
            await supabase.from('users').delete().eq('id', id);
            setUsers(users.filter(u => u.id !== id));
            const localUsers = JSON.parse(localStorage.getItem('wayku_registered_users') || '[]');
            const updatedLocal = localUsers.filter((u: any) => u.id !== id);
            localStorage.setItem('wayku_registered_users', JSON.stringify(updatedLocal));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Gestión de Usuarios</h1>
                    <p className="text-stone-500 text-sm">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar usuarios..."
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-100">
                        <User className="h-10 w-10 text-stone-200 mx-auto mb-2" />
                        No se encontraron usuarios registrados
                    </div>
                ) : (
                    filteredUsers.map((user) => {
                        const userOrders = orders.filter(o =>
                            o.email?.toLowerCase() === user.email?.toLowerCase() ||
                            o.customer?.toLowerCase() === user.name?.toLowerCase()
                        );
                        const userQueries = queries.filter(q =>
                            q.email?.toLowerCase() === user.email?.toLowerCase()
                        );
                        const userReviews = reviews.filter(r =>
                            r.userName?.toLowerCase() === user.name?.toLowerCase()
                        );

                        return (
                            <UserCard
                                key={user.id}
                                user={user}
                                orders={userOrders}
                                queries={userQueries}
                                reviews={userReviews}
                                onDelete={deleteUser}
                                expanded={expandedUserId === user.id}
                                onToggle={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
