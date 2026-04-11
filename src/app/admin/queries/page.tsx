'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Search,
    Mail,
    MessageSquare,
    User,
    Clock,
    X,
    Send,
    Check,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Query {
    id: string | number;
    name: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    read: boolean;
    replied?: boolean;
}

export default function AdminQueriesPage() {
    const [queries, setQueries] = useState<Query[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
    const [statusFilter, setStatusFilter] = useState('todas');
    const [sortOrder, setSortOrder] = useState('recent');
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const fetchQueries = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/data');
            const data = await res.json();
            setQueries(data.queries || []);
        } catch (fetchError) {
            console.error('Error fetching queries:', fetchError);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueries();
    }, [fetchQueries]);

    const sortedQueries = [...queries]
        .filter(q => q.name !== 'Sistema Newsletter')
        .sort((a, b) => {
            const aIndex = typeof a.id === 'number' ? a.id : parseInt(a.id, 10) || 0;
            const bIndex = typeof b.id === 'number' ? b.id : parseInt(b.id, 10) || 0;
            return sortOrder === 'recent' ? bIndex - aIndex : aIndex - bIndex;
        });

    const filteredQueries = sortedQueries.filter(query => {
        const matchesSearch = query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              query.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'todas' ||
                              (statusFilter === 'pendientes' && !query.replied) ||
                              (statusFilter === 'respondidas' && query.replied);
        return matchesSearch && matchesStatus;
    });

    const handleOpenQuery = async (query: Query) => {
        setSelectedQuery(query);
        setReplyText('');
        if (!query.read) {
            // Mark as read in Supabase
            await fetch('/api/admin/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table: 'queries', action: 'update', data: { read: true }, match: { id: query.id } })
            });
            setQueries(prev => prev.map(q => q.id === query.id ? { ...q, read: true } : q));
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedQuery || !replyText.trim()) return;

        setIsSending(true);
        try {
            const res = await fetch('/api/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: selectedQuery.email,
                    name: selectedQuery.name,
                    subject: selectedQuery.subject,
                    message: replyText,
                    originalMessage: selectedQuery.message
                })
            });

            const data = await res.json();
            if (data.success) {
                await fetch('/api/admin/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table: 'queries', action: 'update', data: { replied: true }, match: { id: selectedQuery.id } })
                });
                setQueries(prev => prev.map(q => q.id === selectedQuery.id ? { ...q, replied: true } : q));
                toast.success('Respuesta enviada directamente al cliente.');
                setSelectedQuery(null);
            } else {
                toast.error(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error('Error sending reply:', err);
            toast.error('Error enviando la respuesta.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Consultas</h1>
                    <p className="text-stone-500">Mensajes recibidos a través del formulario de contacto.</p>
                </div>
                <button
                    onClick={fetchQueries}
                    className="flex items-center gap-2 text-sm text-stone-500 hover:text-primary transition-colors border border-stone-200 rounded-lg px-3 py-2"
                    title="Actualizar consultas"
                >
                    <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o asunto..."
                        className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 border border-stone-200 text-stone-600 transition-all focus:ring-primary focus:border-primary"
                    >
                        <option value="recent">Más recientes</option>
                        <option value="oldest">Más antiguas</option>
                    </select>
                    {[{v:'todas', label:'Todas'}, {v:'pendientes', label:'Pendientes'}, {v:'respondidas', label:'Respondidas'}].map(opt => (
                        <button
                            key={opt.v}
                            onClick={() => setStatusFilter(opt.v)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                statusFilter === opt.v
                                    ? opt.v === 'pendientes'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : opt.v === 'respondidas'
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : 'bg-primary text-white shadow-sm'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Queries Grid */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-stone-200 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {filteredQueries.map((query) => (
                        <div
                            key={query.id}
                            onClick={() => handleOpenQuery(query)}
                            className={`group bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer hover:border-primary/50 flex flex-col gap-3 ${query.read ? 'border-stone-100' : 'border-primary/20 bg-primary/5 ring-1 ring-primary/10'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${query.read ? 'bg-stone-100 text-stone-500 group-hover:bg-primary group-hover:text-white' : 'bg-primary text-white '}`}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 line-clamp-1 text-sm">{query.name}</h3>
                                        <p className="text-xs text-stone-500">{query.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="py-2 border-y border-stone-100">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-bold text-stone-900">{query.subject}</p>
                                    <div className="text-stone-400 text-[10px] flex flex-col items-end">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>{query.date}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-stone-600 line-clamp-2 italic">&quot;{query.message}&quot;</p>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                                <div className="flex gap-2">

                                    {query.replied ? (
                                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                            <Check size={10} /> Respondido
                                        </span>
                                    ) : (
                                        <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                            <Clock size={10} /> Pendiente
                                        </span>
                                    )}
                                </div>
                                <button className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full transition-colors">Ver mensaje →</button>
                            </div>
                        </div>
                    ))}

                    {filteredQueries.length === 0 && !isLoading && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-stone-100">
                            <MessageSquare className="h-12 w-12 text-stone-200 mb-4" />
                            <h3 className="text-lg font-medium text-stone-900">No hay consultas</h3>
                            <p className="text-stone-500">Aún no hay mensajes, o prueba con otro término.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Query Modal */}
            {selectedQuery && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-stone-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-stone-100 rounded-full text-stone-600">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-stone-900">{selectedQuery.subject}</h2>
                                    <p className="text-sm text-stone-500">{selectedQuery.name} · {selectedQuery.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedQuery(null)} className="text-stone-400 hover:text-stone-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 relative">
                                <div className="absolute -top-3 left-6 px-2 bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                    Mensaje del Cliente
                                </div>
                                <p className="text-stone-800 leading-relaxed italic">
                                    &quot;{selectedQuery.message}&quot;
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-[10px] text-stone-400 font-medium uppercase">
                                    <Clock size={12} />
                                    Enviado el {selectedQuery.date}
                                </div>
                            </div>

                            <form onSubmit={handleSendReply} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-stone-900 flex items-center gap-2">
                                        <Send size={18} className="text-primary" />
                                        Responder
                                    </h3>
                                    {selectedQuery.replied && (
                                        <span className="text-[10px] font-bold text-green-600 uppercase">Ya has respondido este mensaje</span>
                                    )}
                                </div>
                                <textarea
                                    rows={5}
                                    placeholder="Escribe tu respuesta aquí..."
                                    className="w-full px-4 py-3 border border-stone-200 rounded-2xl focus:ring-primary focus:border-primary transition-all resize-none"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    required
                                ></textarea>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setSelectedQuery(null)}
                                    >
                                        Cerrar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 gap-2"
                                        disabled={isSending}
                                    >
                                        {isSending ? 'Enviando...' : (
                                            <>
                                                <Send size={18} />
                                                {selectedQuery.replied ? 'Enviar de Nuevo' : 'Enviar Respuesta'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
