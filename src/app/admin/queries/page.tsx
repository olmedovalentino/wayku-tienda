'use client';

import { useState } from 'react';
import { useApp, Query } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import {
    Search,
    MoreVertical,
    Mail,
    MessageSquare,
    User,
    Clock,
    X,
    Send,
    Check
} from 'lucide-react';

export default function AdminQueriesPage() {
    const { queries, markQueryAsRead, replyToQuery } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
    const [statusFilter, setStatusFilter] = useState('todas');
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Sort by descending ID: Newest first.
    const sortedQueries = [...queries].sort((a, b) => b.id - a.id);

    const filteredQueries = sortedQueries.filter(query => {
        const matchesSearch = query.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              query.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'todas' || 
                              (statusFilter === 'pendientes' && !query.replied) || 
                              (statusFilter === 'respondidas' && query.replied);
        return matchesSearch && matchesStatus;
    });

    const handleOpenQuery = (query: Query) => {
        setSelectedQuery(query);
        markQueryAsRead(query.id);
        setReplyText('');
    };

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedQuery || !replyText.trim()) return;

        setIsSending(true);
        
        // Update database as replied
        replyToQuery(selectedQuery.id, replyText);

        // Open Gmail Web correctly with prefilled data
        const subject = encodeURIComponent(`Re: ${selectedQuery.subject} - Waykú Lámparas`);
        const body = encodeURIComponent(`${replyText}\n\n---\nMensaje original de ${selectedQuery.name}:\n${selectedQuery.message}`);
        
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedQuery.email}&su=${subject}&body=${body}`, '_blank');

        setIsSending(false);
        setSelectedQuery(null);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Consultas</h1>
                <p className="text-stone-500">Mensajes recibidos a través del formulario de contacto.</p>
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
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary text-sm font-medium text-stone-700"
                >
                    <option value="todas">Todas las consultas</option>
                    <option value="pendientes">Sin Responder</option>
                    <option value="respondidas">Respondidas</option>
                </select>
            </div>

            {/* Queries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 italic font-light not-italic">
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
                                <div className="text-stone-400 text-[10px] flex items-center gap-1">
                                    <Clock size={12} />
                                    {query.date}
                                </div>
                            </div>
                            <p className="text-sm text-stone-600 line-clamp-2 italic">"{query.message}"</p>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <div className="flex gap-2">
                                {!query.read && (
                                    <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">Nuevo</span>
                                )}
                                {query.replied && (
                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        <Check size={10} /> Respondido
                                    </span>
                                )}
                            </div>
                            <button className="text-primary font-bold hover:underline">Ver mensaje</button>
                        </div>
                    </div>
                ))}

                {filteredQueries.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-stone-100">
                        <MessageSquare className="h-12 w-12 text-stone-200 mb-4" />
                        <h3 className="text-lg font-medium text-stone-900">No hay consultas</h3>
                        <p className="text-stone-500">Prueba con otro término de búsqueda.</p>
                    </div>
                )}
            </div>

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
                                    "{selectedQuery.message}"
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-[10px] text-stone-400 font-medium uppercase">
                                    <Clock size={12} />
                                    Enviado hace {selectedQuery.date}
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
                                        disabled={isSending || selectedQuery.replied}
                                    >
                                        {isSending ? 'Enviando...' : (
                                            <>
                                                <Send size={18} />
                                                Enviar Respuesta
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
