'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Trash2, Search, Package, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';

interface RegisteredUser {
    id: string;
    name: string;
    email: string;
    role?: string;
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<RegisteredUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
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
                // Map full_name to name if needed for component consistency
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
            
            const updatedUsers = users.filter(u => u.id !== id);
            setUsers(updatedUsers);
            
            // Si también estaba guardado en localStorage localmente, lo borramos
            const localUsers = JSON.parse(localStorage.getItem('wayku_registered_users') || '[]');
            const updatedLocal = localUsers.filter((u: any) => u.id !== id);
            localStorage.setItem('wayku_registered_users', JSON.stringify(updatedLocal));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-stone-900">Gestión de Usuarios</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {filteredUsers.length === 0 ? (
                        <div className="col-span-full p-8 text-center text-stone-500 bg-white rounded-2xl border border-stone-100">
                            No se encontraron usuarios registrados
                        </div>
                    ) : (
                        filteredUsers.map((user) => {
                            const userOrders = orders.filter(o => o.email.toLowerCase() === user.email.toLowerCase() || o.customer.toLowerCase() === user.name.toLowerCase());
                            const userQueries = queries.filter(q => q.email.toLowerCase() === user.email.toLowerCase());
                            const userReviews = reviews.filter(r => r.userName.toLowerCase() === user.name.toLowerCase());

                            return (
                                <div key={user.id} className="p-4 flex flex-col gap-3 bg-white hover:bg-stone-50 transition-colors rounded-xl border border-stone-100 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                                {(user.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-stone-900">{user.name}</h3>
                                                <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5"><Mail size={12}/> {user.email}</p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700 flex-shrink-0">
                                            {user.role || 'Cliente'}
                                        </span>
                                    </div>

                                    {/* Activity summary */}
                                    <div className="mt-2 pt-3 border-t border-stone-100 flex flex-col gap-2 flex-grow">
                                        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Actividad</h4>
                                        
                                        {userOrders.length > 0 && (
                                            <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg">
                                                <strong className="flex items-center gap-1 text-stone-800 mb-1"><Package size={12}/> Pedidos ({userOrders.length}):</strong>
                                                {userOrders.map(o => <div key={o.id} className="truncate">• {o.id} - <span className="font-semibold text-primary">{o.status}</span></div>)}
                                            </div>
                                        )}
                                        {userQueries.length > 0 && (
                                            <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg">
                                                <strong className="flex items-center gap-1 text-stone-800 mb-1"><MessageSquare size={12}/> Consultas ({userQueries.length}):</strong>
                                                {userQueries.map(q => <div key={q.id} className="truncate">• {q.subject} (<span className="font-semibold text-primary">{q.replied ? 'Respondida' : 'Pendiente'}</span>)</div>)}
                                            </div>
                                        )}
                                        {userReviews.length > 0 && (
                                            <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg">
                                                <strong className="flex items-center gap-1 text-stone-800 mb-1"><Star size={12}/> Reseñas ({userReviews.length}):</strong>
                                                {userReviews.map(r => <div key={r.id} className="truncate">• Producto: "{r.productId}" - {r.rating}★</div>)}
                                            </div>
                                        )}
                                        {userOrders.length === 0 && userQueries.length === 0 && userReviews.length === 0 && (
                                            <span className="text-[10px] text-stone-400 italic block mt-1">Sin actividad registrada en la plataforma.</span>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-2 mt-auto border-t border-stone-50">
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="flex items-center gap-1 p-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg transition-colors hover:bg-red-100"
                                        >
                                            <Trash2 size={14} />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
