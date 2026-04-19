'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Ticket, Plus, Trash2, Power, Percent, CheckCircle, XCircle, Clock, X, AlertTriangle } from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    discount_percentage: number;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
}

type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: string; type: ToastType; message: string; }

const DURATION_OPTIONS = [
    { label: 'Sin expiracion', value: null },
    { label: '1 hora',   value: 1 / 24 },
    { label: '6 horas',  value: 6 / 24 },
    { label: '1 dia',    value: 1 },
    { label: '3 dias',   value: 3 },
    { label: '7 dias',   value: 7 },
    { label: '15 dias',  value: 15 },
    { label: '30 dias',  value: 30 },
];

function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 4000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    const config = {
        success: { icon: CheckCircle,   border: 'border-green-200',  iconColor: 'text-green-500',  bar: 'bg-green-500' },
        error:   { icon: XCircle,       border: 'border-red-200',    iconColor: 'text-red-500',    bar: 'bg-red-500' },
        warning: { icon: AlertTriangle, border: 'border-orange-200', iconColor: 'text-orange-500', bar: 'bg-orange-500' },
    }[toast.type];
    const Icon = config.icon;

    return (
        <div className={`relative flex items-start gap-3 rounded-2xl shadow-xl border ${config.border} bg-white px-4 pt-4 pb-3 w-80 overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300`}>
            <div className={`absolute bottom-0 left-0 h-0.5 w-full ${config.bar} origin-left`}
                style={{ animation: 'shrink 4s linear forwards' }} />
            <Icon size={20} className={`mt-0.5 flex-shrink-0 ${config.iconColor}`} />
            <p className="flex-1 text-sm font-medium text-stone-800">{toast.message}</p>
            <button onClick={onDismiss} className="text-stone-300 hover:text-stone-500 transition-colors mt-0.5">
                <X size={14} />
            </button>
        </div>
    );
}

function getExpiryLabel(expiresAt: string | null): string {
    if (!expiresAt) return 'Sin expiracion';
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expirado';
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffD >= 1) return `Expira en ${diffD}d ${Math.floor((diffMs % 86400000) / 3600000)}h`;
    return `Expira en ${diffH}h`;
}

function isExpired(expiresAt: string | null): boolean {
    return !!expiresAt && new Date(expiresAt) <= new Date();
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState<number>(10);
    const [newDuration, setNewDuration] = useState<number | null>(null);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const loadCoupons = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCoupons(data);
        } catch {
            showToast('error', 'Error al cargar los cupones.');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadCoupons(); }, [loadCoupons]);

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode.trim()) return;
        setIsSubmitting(true);
        try {
            const expires_at = newDuration !== null
                ? new Date(Date.now() + newDuration * 24 * 3600 * 1000).toISOString()
                : null;

            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: newCode.toUpperCase().replace(/\s+/g, ''),
                    discount_percentage: newDiscount,
                    is_active: true,
                    expires_at,
                }),
            });
            const data = await res.json();

            if (res.status === 409) {
                showToast('warning', 'Ese codigo ya existe. Usa otro nombre.');
            } else if (!res.ok) {
                throw new Error(data.error);
            } else {
                showToast('success', `Cupon ${newCode.toUpperCase()} creado con exito.`);
                setNewCode('');
                setNewDiscount(10);
                setNewDuration(null);
                loadCoupons();
            }
        } catch {
            showToast('error', 'Error inesperado al crear el cupon.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: !currentStatus }),
            });
            if (!res.ok) throw new Error();
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
            showToast('success', currentStatus ? 'Cupon apagado.' : 'Cupon activado.');
        } catch {
            showToast('error', 'No se pudo cambiar el estado del cupon.');
        }
    };

    const deleteCoupon = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setCoupons(prev => prev.filter(c => c.id !== id));
            showToast('success', 'Cupon eliminado.');
        } catch {
            showToast('error', 'No se pudo eliminar el cupon.');
        } finally {
            setConfirmDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            {/* Toasts */}
            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastNotification toast={t} onDismiss={() => dismissToast(t.id)} />
                    </div>
                ))}
            </div>

            {/* Delete confirm modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-stone-100 p-8 max-w-sm w-full text-center animate-in zoom-in-95 fade-in duration-200">
                        <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={22} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-900 mb-1">Eliminar cupon?</h3>
                        <p className="text-sm text-stone-500 mb-6">Esta accion es permanente y no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-transparent" onClick={() => deleteCoupon(confirmDelete)}>Eliminar</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Gestion de Cupones</h1>
                    <p className="mt-1 text-sm text-stone-500">Crea cupones de descuento especiales para fechas limitadas.</p>
                </div>

                {/* Crear nuevo cupon */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
                    <h2 className="text-base font-semibold text-stone-900 mb-5 flex items-center gap-2">
                        <Plus size={18} className="text-primary" /> Nuevo Cupon
                    </h2>
                    <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Codigo</label>
                            <input
                                type="text"
                                required
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                placeholder="HOTSALE25"
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 bg-stone-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all font-mono font-bold tracking-widest text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Descuento</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1" max="100"
                                    required
                                    value={newDiscount}
                                    onChange={(e) => setNewDiscount(Number(e.target.value))}
                                    className="w-full rounded-xl border border-stone-200 pl-3 py-2.5 pr-8 bg-stone-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-right font-bold text-sm"
                                />
                                <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Duracion</label>
                            <select
                                value={newDuration === null ? 'null' : String(newDuration)}
                                onChange={(e) => setNewDuration(e.target.value === 'null' ? null : Number(e.target.value))}
                                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 bg-stone-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-sm cursor-pointer"
                            >
                                {DURATION_OPTIONS.map(opt => (
                                    <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="h-[42px] w-full font-medium lg:w-auto">
                            {isSubmitting ? 'Creando...' : 'Crear Cupon'}
                        </Button>
                    </form>
                </div>

                {/* Listado */}
                <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-100">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Codigo</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Descuento</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Duracion</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 bg-white">
                                {coupons.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <p className="text-sm text-stone-400">No hay cupones creados aun.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.map((coupon) => {
                                        const expired = isExpired(coupon.expires_at);
                                        const effectivelyActive = coupon.is_active && !expired;
                                        return (
                                            <tr key={coupon.id} className={`hover:bg-stone-50/50 transition-colors group ${expired ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Ticket size={15} className={effectivelyActive ? 'text-primary' : 'text-stone-300'} />
                                                        <span className="font-bold text-stone-900 tracking-wider font-mono text-sm">{coupon.code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        {coupon.discount_percentage}% OFF
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${expired ? 'text-red-500' : 'text-stone-500'}`}>
                                                        <Clock size={12} /> {getExpiryLabel(coupon.expires_at)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {expired ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-red-400 relative top-px"></span> Expirado
                                                        </span>
                                                    ) : effectivelyActive ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse relative top-px"></span> Activo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-stone-300 relative top-px"></span> Apagado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!expired && (
                                                            <button
                                                                onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                                                                className={`p-1.5 rounded-lg hover:bg-stone-100 transition-colors ${coupon.is_active ? 'text-orange-500' : 'text-primary'}`}
                                                                title={coupon.is_active ? 'Apagar cupon' : 'Activar cupon'}
                                                            >
                                                                <Power size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setConfirmDelete(coupon.id)}
                                                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                            title="Eliminar permanentemente"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
                <div className="lg:hidden space-y-4">
                    {coupons.length === 0 ? (
                        <div className="rounded-2xl border border-stone-100 bg-white px-6 py-14 text-center shadow-sm">
                            <Ticket size={28} className="mx-auto text-stone-200 mb-2" />
                            <p className="text-sm text-stone-400">No hay cupones creados aun.</p>
                        </div>
                    ) : (
                        coupons.map((coupon) => {
                            const expired = isExpired(coupon.expires_at);
                            const effectivelyActive = coupon.is_active && !expired;

                            return (
                                <div key={coupon.id} className={`rounded-2xl border border-stone-100 bg-white p-4 shadow-sm ${expired ? 'opacity-60' : ''}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Ticket size={16} className={effectivelyActive ? 'text-primary' : 'text-stone-300'} />
                                                <span className="truncate font-mono text-sm font-bold tracking-wider text-stone-900">{coupon.code}</span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    {coupon.discount_percentage}% OFF
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${expired ? 'bg-red-50 text-red-500' : effectivelyActive ? 'bg-primary/10 text-primary' : 'bg-stone-100 text-stone-500'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${expired ? 'bg-red-400' : effectivelyActive ? 'bg-primary' : 'bg-stone-400'}`}></span>
                                                    {expired ? 'Expirado' : effectivelyActive ? 'Activo' : 'Apagado'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!expired && (
                                                <button
                                                    onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                                                    className={`p-2 rounded-lg transition-colors ${coupon.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-primary hover:bg-primary/10'}`}
                                                    title={coupon.is_active ? 'Apagar cupon' : 'Activar cupon'}
                                                >
                                                    <Power size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setConfirmDelete(coupon.id)}
                                                className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Eliminar permanentemente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50 px-3 py-3">
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <span className="font-medium text-stone-500">Duracion</span>
                                            <span className={`inline-flex items-center gap-1.5 font-medium ${expired ? 'text-red-500' : 'text-stone-600'}`}>
                                                <Clock size={12} /> {getExpiryLabel(coupon.expires_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            <style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
        </>
    );
}

