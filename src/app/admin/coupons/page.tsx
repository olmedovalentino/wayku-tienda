'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Ticket, Plus, Trash2, Power, Percent } from 'lucide-react';

interface Coupon {
    id: string;
    code: string;
    discount_percentage: number;
    is_active: boolean;
    created_at: string;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState<number>(10);

    const loadCoupons = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error loading coupons:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode.trim() || !supabase) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('coupons')
                .insert([
                    {
                        code: newCode.toUpperCase().replace(/\s+/g, ''),
                        discount_percentage: newDiscount,
                        is_active: true
                    }
                ]);

            if (error) {
                if (error.code === '23505') {
                    alert('Este código de cupón ya existe.');
                } else {
                    throw error;
                }
            } else {
                setNewCode('');
                setNewDiscount(10);
                loadCoupons();
            }
        } catch (error) {
            console.error('Error creating coupon:', error);
            alert('Error al crear el cupón.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!supabase) return;
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
        } catch (error) {
            console.error('Error toggling coupon status:', error);
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar este cupón?')) return;
        if (!supabase) return;
        
        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting coupon:', error);
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Gestión de Cupones</h1>
                <p className="mt-1 text-sm text-stone-500">Crea cupones de descuento especiales para fechas limitadas.</p>
            </div>

            {/* Crear nuevo cupón */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
                <h2 className="text-base font-semibold text-stone-900 mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-primary" /> Nuevo Cupón
                </h2>
                <form onSubmit={handleCreateCoupon} className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-stone-700 mb-1">Código (Ej: HOTSALE25)</label>
                        <input
                            type="text"
                            required
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            placeholder="WAYKU15"
                            className="w-full rounded-lg border-stone-200 px-4 py-2 bg-stone-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                    <div className="w-full sm:w-32">
                        <label className="block text-sm font-medium text-stone-700 mb-1">Descuento (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                required
                                value={newDiscount}
                                onChange={(e) => setNewDiscount(Number(e.target.value))}
                                className="w-full rounded-lg border-stone-200 pl-4 py-2 pr-8 bg-stone-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-right font-medium"
                            />
                            <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-10 px-6 font-medium">
                        {isSubmitting ? 'Creando...' : 'Crear'}
                    </Button>
                </form>
            </div>

            {/* Listado de cupones */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-100">
                        <thead className="bg-stone-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                    Descuento
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-stone-500 text-sm">
                                        No hay cupones creados aún.
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-stone-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Ticket size={16} className={coupon.is_active ? 'text-primary' : 'text-stone-300'} />
                                                <span className="font-bold text-stone-900 tracking-wider">
                                                    {coupon.code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                {coupon.discount_percentage}% OFF
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {coupon.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse relative top-px"></span>
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-stone-300 relative top-px"></span>
                                                    Apagado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                                                    className={`p-1.5 rounded-md hover:bg-stone-200 transition-colors ${coupon.is_active ? 'text-orange-600' : 'text-primary'}`}
                                                    title={coupon.is_active ? "Apagar cupón" : "Activar cupón"}
                                                >
                                                    <Power size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteCoupon(coupon.id)}
                                                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Eliminar permanentemente"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
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
