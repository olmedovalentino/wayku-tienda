'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface RegisteredUser {
    id: string;
    name: string;
    email: string;
    role?: string;
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<RegisteredUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!supabase) return;
        const { data } = await supabase.from('users').select('*');
        if (data) {
            setUsers(data);
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50 text-stone-500 text-xs font-medium uppercase tracking-wider">
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                                        No se encontraron usuarios registrados
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-stone-900">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-stone-600">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                                                {user.role || 'Cliente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
