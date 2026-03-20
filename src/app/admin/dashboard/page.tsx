'use client';

import {
    ShoppingBag,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    MessageSquare,
    Package
} from 'lucide-react';
import Link from 'next/link';


import { useApp } from '@/context/AppContext';

export default function AdminDashboardPage() {
    const { products, orders, queries } = useApp();

    const stats = [
        {
            name: 'Ventas Totales',
            value: `$${orders.reduce((acc, o) => acc + (parseFloat(o.total.replace('$', '').replace('.', '')) || 0), 0).toLocaleString()}`,
            change: '+12%',
            trendingUp: true,
            icon: DollarSign,
            color: 'bg-blue-50 text-blue-600'
        },
        {
            name: 'Nuevos Pedidos',
            value: orders.length.toString(),
            change: '+5%',
            trendingUp: true,
            icon: ShoppingBag,
            color: 'bg-orange-50 text-orange-600'
        },
        {
            name: 'Consultas',
            value: queries.filter(q => !q.read).length.toString(),
            change: '-2%',
            trendingUp: false,
            icon: MessageSquare,
            color: 'bg-purple-50 text-purple-600'
        },
        {
            name: 'Productos Activos',
            value: products.length.toString(),
            change: '0%',
            trendingUp: true,
            icon: Package,
            color: 'bg-green-50 text-green-600'
        },
    ];

    const recentOrders = orders.slice(0, 4);


    return (
        <div className="space-y-8">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-stone-900">Bienvenido de nuevo, Valen</h1>
                <p className="text-stone-500 mt-2">Aquí tienes un resumen de lo que está pasando en Waykú.</p>
            </div>


            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Tables / Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                        <h3 className="font-bold text-stone-900">Pedidos Recientes</h3>
                        <button className="text-primary text-sm font-medium hover:underline">Ver todos</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Pedido</th>
                                    <th className="px-6 py-3 font-medium">Cliente</th>
                                    <th className="px-6 py-3 font-medium">Fecha</th>
                                    <th className="px-6 py-3 font-medium">Total</th>
                                    <th className="px-6 py-3 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 italic font-light not-italic text-sm">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-stone-900">{order.id}</td>
                                        <td className="px-6 py-4 text-stone-600">{order.customer}</td>
                                        <td className="px-6 py-4 text-stone-500">{order.date}</td>
                                        <td className="px-6 py-4 text-stone-900 font-medium">{order.total}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Entregado' ? 'bg-green-100 text-green-700' :
                                                order.status === 'Procesando' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-stone-100 text-stone-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions / Other Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-6">
                    <h3 className="font-bold text-stone-900">Acciones Rápidas</h3>
                    <div className="space-y-3">
                        <Link href="/admin/products" className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-primary hover:bg-stone-50 transition-all text-left">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-900">Agregar Producto</p>
                                    <p className="text-xs text-stone-500">Subir nueva lámpara</p>
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
                                    <p className="text-sm font-medium text-stone-900">Ver Consultas</p>
                                    <p className="text-xs text-stone-500">{queries.filter(q => !q.read).length} mensajes sin leer</p>
                                </div>
                            </div>
                            <ArrowUpRight size={16} className="text-stone-400" />
                        </Link>
                    </div>


                    <div className="pt-6 border-t border-stone-100">
                        <h4 className="text-sm font-medium text-stone-900 mb-4">Sin Stock</h4>
                        <div className="space-y-4">
                            {products.filter(p => !p.inStock).slice(0, 3).map(p => (
                                <div key={p.id} className="flex items-center justify-between">
                                    <span className="text-sm text-stone-600 italic">{p.name}</span>
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Agotado</span>
                                </div>
                            ))}
                            {products.filter(p => !p.inStock).length === 0 && (
                                <p className="text-sm text-stone-500 italic">Todo el inventario al día.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
