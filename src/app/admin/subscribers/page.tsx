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
    Check,
    Send,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface Subscriber {
    id?: string;
    email: string;
    created_at?: string;
}

export default function AdminSubscribersPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignSubject, setCampaignSubject] = useState('');
    const [campaignMessage, setCampaignMessage] = useState('');
    const [isSendingCampaign, setIsSendingCampaign] = useState(false);

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

    const handleSendCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campaignSubject || !campaignMessage) return;

        setIsSendingCampaign(true);
        try {
            const res = await fetch('/api/campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: campaignSubject, message: campaignMessage })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Campaña enviada con éxito a ${data.sentCount} suscriptores.`);
                setIsCampaignModalOpen(false);
                setCampaignSubject('');
                setCampaignMessage('');
            } else {
                toast.error(`Error al enviar la campaña: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            toast.error('Error al conectar con el servidor.');
        } finally {
            setIsSendingCampaign(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Suscripciones al Newsletter</h1>
                    <p className="text-stone-500">Gestiona las personas interesadas en recibir tus correos.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsCampaignModalOpen(true)} className="flex items-center gap-2">
                        <Mail size={18} />
                        Crear Campaña
                    </Button>
                    <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                        <Download size={18} />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-6">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <Mail size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Total de suscripciones</h3>
                    <p className="text-3xl font-bold text-stone-900">{subscribers.length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
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

            {/* Subscribers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {filteredSubscribers.map((subscriber, index) => (
                    <div
                        key={index}
                        className="group bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col gap-3 hover:border-primary/30 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/5 text-primary flex-shrink-0">
                                <Mail size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-stone-600 leading-relaxed">
                                    <span className="font-bold text-stone-900">{subscriber.email}</span> se suscribió al newsletter.
                                </p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-stone-100 flex justify-between items-center text-xs mt-auto">
                            <div className="text-stone-400 flex items-center gap-1 font-medium">
                                <Calendar size={12} />
                                {subscriber.created_at ? new Date(subscriber.created_at).toLocaleDateString() : '—'}
                            </div>
                            <button 
                                onClick={() => handleDelete(subscriber.email)}
                                className="text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider"
                            >
                                <Trash2 size={14} />
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}

                {filteredSubscribers.length === 0 && !isLoading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-stone-100">
                        <Mail className="h-12 w-12 text-stone-200 mb-4" />
                        <h3 className="text-lg font-medium text-stone-900">No hay suscripciones</h3>
                        <p className="text-stone-500">Prueba con otro término de búsqueda.</p>
                    </div>
                )}
            </div>

            {/* Campaign Modal */}
            {isCampaignModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-stone-100">
                            <div>
                                <h2 className="text-xl font-bold text-stone-900">Nueva Campaña de Email</h2>
                                <p className="text-sm text-stone-500">Se enviará un correo a las {subscribers.length} suscripciones activas.</p>
                            </div>
                            <button onClick={() => setIsCampaignModalOpen(false)} className="text-stone-400 hover:text-stone-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSendCampaign} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-700">Asunto del correo</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: ¡Llegó la nueva colección de lámparas!"
                                        className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary"
                                        value={campaignSubject}
                                        onChange={(e) => setCampaignSubject(e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-700">Mensaje</label>
                                    <textarea
                                        rows={8}
                                        required
                                        placeholder="Escribe el contenido de la campaña aquí..."
                                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-primary focus:border-primary resize-none"
                                        value={campaignMessage}
                                        onChange={(e) => setCampaignMessage(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-stone-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsCampaignModalOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 gap-2" disabled={isSendingCampaign || subscribers.length === 0}>
                                    {isSendingCampaign ? 'Enviando...' : (
                                        <>
                                            <Send size={18} />
                                            Enviar Campaña
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
