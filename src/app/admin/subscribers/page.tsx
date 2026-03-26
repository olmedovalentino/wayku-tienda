'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Search,
    Mail,
    Plus,
    Trash2,
    Calendar,
    Download,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Subscriber {
    id?: string;
    email: string;
    created_at?: string;
}

export default function AdminSubscribersPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubscribers = async () => {
            if (supabase) {
                const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
                if (data) setSubscribers(data);
            }
            setIsLoading(false);
        };
        fetchSubscribers();
    }, []);

    const filteredSubscribers = subscribers.filter(s => 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (email: string) => {
        if (confirm(`¿Eliminar a ${email} de la lista?`)) {
            if (supabase) {
                await supabase.from('subscribers').delete().eq('email', email);
                setSubscribers(prev => prev.filter(s => s.email !== email));
            }
        }
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Email,Fecha de suscripcion\n"
            + subscribers.map(s => `${s.email},${s.created_at || 'Desconocida'}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "subscriptores_wayku.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Suscriptores al Newsletter</h1>
                    <p className="text-stone-500">Gestiona la base de datos de correos electrónicos para tus campañas.</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                    <Download size={18} />
                    Exportar CSV
                </Button>
            </div>

            {/* Stats */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-6">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <Mail size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Total de suscriptores</h3>
                    <p className="text-3xl font-bold text-stone-900">{subscribers.length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 italic font-light not-italic">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por email..."
                        className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden italic font-light not-italic">
                <table className="w-full text-left">
                    <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider font-medium">
                        <tr>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Suscrito el</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                        {filteredSubscribers.map((subscriber, index) => (
                            <tr key={index} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-stone-900">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-green-400 rounded-full" />
                                        {subscriber.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-stone-500 italic">
                                    {subscriber.created_at ? new Date(subscriber.created_at).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(subscriber.email)}
                                        className="text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1 justify-end ml-auto"
                                    >
                                        <Trash2 size={16} />
                                        <span className="text-[10px] font-bold uppercase">Eliminar</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredSubscribers.length === 0 && !isLoading && (
                    <div className="p-20 text-center text-stone-400 italic">
                        No se encontraron suscriptores.
                    </div>
                )}
            </div>
        </div>
    );
}
