'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Mail,
    Trash2,
    Send,
    X,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { getTimeAgo } from '@/lib/time';

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
    const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                const res = await fetch('/api/admin/subscribers');
                const data = await res.json();
                if (res.ok) setSubscribers(data);
            } catch (error) {
                console.error('Error fetching subscribers:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubscribers();
    }, []);

    const filteredSubscribers = subscribers.filter(s => 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (email: string) => {
        if (confirm(`Eliminar a ${email} de la lista?`)) {
            const res = await fetch(`/api/admin/subscribers?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
            if (res.ok) {
                setSubscribers(prev => prev.filter(s => s.email !== email));
            }
        }
    };

    const handleSendCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!campaignSubject || !campaignMessage) return;

        setIsSendingCampaign(true);
        try {
            const res = await fetch('/api/campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    subject: campaignSubject, 
                    message: campaignMessage,
                    targetEmails: targetType === 'all' ? 'all' : selectedEmails
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Campaña enviada con exito a ${data.sentCount} suscriptores.`);
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-stone-900">Suscripciones al Newsletter</h1>
                    <p className="text-stone-500">Gestiona las personas interesadas en recibir tus correos.</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto lg:hidden">
                    <Button onClick={() => setIsCampaignModalOpen(true)} className="flex w-full items-center justify-center gap-2 bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 sm:w-auto">
                        <Mail size={18} />
                        Crear Campaña
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-start lg:gap-4">
                <div className="max-w-sm bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-2xl shadow-sm border border-primary/15 flex items-center gap-4">
                <div className="h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md shadow-primary/30">
                    <Mail size={20} />
                </div>
                <div>
                    <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total de suscripciones</h3>
                    <p className="text-2xl font-bold text-stone-900">{subscribers.length}</p>
                </div>
                </div>
                <Button onClick={() => setIsCampaignModalOpen(true)} className="hidden items-center justify-center gap-2 bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 lg:inline-flex">
                    <Mail size={18} />
                    Crear Campaña
                </Button>
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
                                    <span className="font-bold text-stone-900">{subscriber.email}</span> se suscribio al newsletter.
                                </p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-stone-100 flex justify-between items-center text-xs mt-auto">
                            <div className="text-stone-400 flex flex-col font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {subscriber.created_at ? new Date(subscriber.created_at).toLocaleDateString() : '-'}
                                </span>
                                {subscriber.created_at && (
                                    <span className="text-[10px] text-primary/70 italic mt-0.5 ml-4">{getTimeAgo(subscriber.created_at)}</span>
                                )}
                            </div>
                            <button 
                                onClick={() => handleDelete(subscriber.email)}
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors uppercase tracking-wider"
                            >
                                <Trash2 size={12} />
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}

                {filteredSubscribers.length === 0 && !isLoading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-stone-100">
                        <Mail className="h-12 w-12 text-stone-200 mb-4" />
                        <h3 className="text-lg font-medium text-stone-900">No hay suscripciones</h3>
                        <p className="text-stone-500">Proba con otro termino de busqueda.</p>
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
                                <p className="text-sm text-stone-500">
                                    {targetType === 'all' ? `Se enviara un correo a las ${subscribers.length} suscripciones activas.` : `Se enviara un correo a ${selectedEmails.length} suscripciones seleccionadas.`}
                                </p>
                            </div>
                            <button onClick={() => setIsCampaignModalOpen(false)} className="text-stone-400 hover:text-stone-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSendCampaign} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-stone-700">Destinatarios</label>
                                    <div className="flex gap-4 mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="targetType" checked={targetType === 'all'} onChange={() => setTargetType('all')} />
                                            <span className="text-sm">Todos los suscriptores ({subscribers.length})</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="targetType" checked={targetType === 'selected'} onChange={() => setTargetType('selected')} />
                                            <span className="text-sm">Seleccionar...</span>
                                        </label>
                                    </div>
                                    
                                    {targetType === 'selected' && (
                                        <div className="mt-2 max-h-40 overflow-y-auto border border-stone-200 rounded-xl p-3 space-y-2 bg-stone-50">
                                            {subscribers.map((sub, idx) => (
                                                <label key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-stone-100 p-1 rounded-md transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedEmails.includes(sub.email)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedEmails(prev => [...prev, sub.email]);
                                                            } else {
                                                                setSelectedEmails(prev => prev.filter(email => email !== sub.email));
                                                            }
                                                        }}
                                                        className="rounded text-primary focus:ring-primary"
                                                    />
                                                    <span className="text-sm text-stone-700">{sub.email}</span>
                                                </label>
                                            ))}
                                            {subscribers.length === 0 && <span className="text-sm text-stone-500">No hay suscriptores</span>}
                                        </div>
                                    )}
                                </div>

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


