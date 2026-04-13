'use client';

import {
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    MessageSquare,
    Package,
    PlusCircle,
    MinusCircle,
    RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatOrderDisplayId } from '@/lib/order-id';

export default function AdminDashboardPage() {
    const { products, orders, queries, updateProduct, refreshAdminData } = useApp();
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadFreshData = async () => {
            setIsRefreshing(true);
            try {
                await refreshAdminData();
            } finally {
                if (isMounted) {
                    setIsRefreshing(false);
                }
            }
        };

        loadFreshData();

        return () => {
            isMounted = false;
        };
    }, [refreshAdminData]);

    const stats = [
        {
            name: 'Ventas totales',
            value: `$${orders.reduce((acc, order) => acc + (order.total || 0), 0).toLocaleString()}`,
            change: '+12%',
            trendingUp: true,
            icon: DollarSign,
            color: 'bg-blue-50 text-blue-600',
        },
        {
            name: 'Nuevos pedidos',
            value: orders.length.toString(),
            change: '+5%',
            trendingUp: true,
            icon: ShoppingBag,
            color: 'bg-orange-50 text-orange-600',
        },
        {
            name: 'Consultas',
            value: queries.filter((query) => !query.read).length.toString(),
            change: '-2%',
            trendingUp: false,
            icon: MessageSquare,
            color: 'bg-purple-50 text-purple-600',
        },
        {
            name: 'Productos activos',
            value: products.length.toString(),
            change: '0%',
            trendingUp: true,
            icon: Package,
            color: 'bg-green-50 text-green-600',
        },
    ];

    const recentOrders = orders.slice(0, 4);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Entregado': return 'bg-green-100 text-green-700';
            case 'Pedido recibido': return 'bg-yellow-100 text-yellow-700';
            case 'Pago acreditado': return 'bg-emerald-100 text-emerald-700';
            case 'En preparacion': return 'bg-blue-100 text-blue-700';
            case 'En preparación': return 'bg-blue-100 text-blue-700';
            case 'Embalado': return 'bg-indigo-100 text-indigo-700';
            case 'Despachado': return 'bg-purple-100 text-purple-700';
            case 'Devolucion': return 'bg-orange-100 text-orange-700';
            case 'Devolución': return 'bg-orange-100 text-orange-700';
            case 'Cancelado': return 'bg-red-100 text-red-700';
            default: return 'bg-stone-100 text-stone-700';
        }
    };

    const refreshDashboard = async () => {
        setIsRefreshing(true);
        try {
            await refreshAdminData();
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Bienvenido de nuevo, Valen</h1>
                    <p className="text-stone-500 mt-2">Aqui tienes un resumen de lo que esta pasando en Wayku.</p>
                </div>
                <button
                    onClick={refreshDashboard}
                    className="flex items-center gap-2 text-sm text-stone-500 hover:text-primary transition-colors border border-stone-200 rounded-lg px-3 py-2"
                    title="Actualizar dashboard"
                >
                    <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendingUp ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change}
                                {stat.trendingUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            </div>
                        </div>
                        <h3 className="text-stone-500 text-sm font-medium">{stat.name}</h3>
                        <p className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                        <h3 className="font-bold text-stone-900">Pedidos recientes</h3>
                        <Link href="/admin/orders" className="text-primary text-sm font-medium hover:underline">Ver todos</Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left hidden lg:table">
                            <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Pedido</th>
                                    <th className="px-6 py-3 font-medium">Cliente</th>
                                    <th className="px-6 py-3 font-medium">Fecha</th>
                                    <th className="px-6 py-3 font-medium">Total</th>
                                    <th className="px-6 py-3 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-sm">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-stone-900">{formatOrderDisplayId(order.id)}</td>
                                        <td className="px-6 py-4 text-stone-600">{order.customer}</td>
                                        <td className="px-6 py-4 text-stone-500">{order.date}</td>
                                        <td className="px-6 py-4 text-stone-900 font-medium">${(order.total || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="lg:hidden flex flex-col divide-y divide-stone-100">
                            {recentOrders.length === 0 ? (
                                <div className="p-8 text-center text-stone-500">No hay pedidos recientes</div>
                            ) : (
                                recentOrders.map((order) => (
                                    <div key={order.id} className="p-4 flex flex-col gap-3 bg-white hover:bg-stone-50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-stone-900 text-sm">{formatOrderDisplayId(order.id)}</h3>
                                                <p className="text-xs text-stone-500 mt-1">{order.date}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 border-t border-stone-50 pt-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-500">Cliente:</span>
                                                <span className="font-medium text-stone-900 line-clamp-1">{order.customer}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-500">Total:</span>
                                                <span className="font-bold text-primary">${(order.total || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
                    <h3 className="font-bold text-stone-900">Acciones rapidas</h3>
                    <div className="space-y-3">
                        <Link href="/admin/products" className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-primary hover:bg-stone-50 transition-all text-left">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-900">Agregar producto</p>
                                    <p className="text-xs text-stone-500">Subir nueva lampara</p>
                                </div>
                            </div>
                            <ArrowUpRight size={16} className="text-stone-400" />
                        </Link>
                        <Link href="/admin/queries" className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-primary hover:bg-stone-50 transition-all text-left">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-900">Ver consultas</p>
                                    <p className="text-xs text-stone-500">{queries.filter((query) => !query.read).length} mensajes sin leer</p>
                                </div>
                            </div>
                            <ArrowUpRight size={16} className="text-stone-400" />
                        </Link>
                    </div>

                    <div className="pt-6 border-t border-stone-100">
                        <h4 className="text-sm font-medium text-stone-900 mb-4">Stock rapido (global)</h4>
                        <div className="space-y-4">
                            {products.map((product) => (
                                <div key={product.id} className="flex items-center justify-between">
                                    <span className="text-sm text-stone-600 font-medium line-clamp-1 flex-1">{product.name}</span>
                                    <div className="flex items-center gap-3 bg-stone-50 rounded-lg p-1 border border-stone-100">
                                        <button
                                            onClick={() => updateProduct(product.id, { stockCount: Math.max(0, (product.stockCount || 0) - 1), inStock: Math.max(0, (product.stockCount || 0) - 1) > 0 })}
                                            className="text-stone-400 hover:text-red-500 transition-colors"
                                        >
                                            <MinusCircle size={18} />
                                        </button>
                                        <span className="text-sm font-bold text-stone-900 w-4 text-center">{product.stockCount || 0}</span>
                                        <button
                                            onClick={() => updateProduct(product.id, { stockCount: (product.stockCount || 0) + 1, inStock: true })}
                                            className="text-stone-400 hover:text-green-500 transition-colors"
                                        >
                                            <PlusCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
