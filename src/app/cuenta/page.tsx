'use client';

import { Button } from '@/components/ui/Button';
import { Package, User, Heart, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AccountPage() {
    // Mock user data
    const user = {
        name: 'Valentino Olmedo',
        email: 'valentino@example.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
    };

    // Mock orders
    const orders = [
        { id: '#ORD-7742', date: '10 Dic 2025', status: 'Entregado', total: '$145.00' },
        { id: '#ORD-7811', date: '14 Dic 2025', status: 'En camino', total: '$85.00' }
    ];

    return (
        <div className="min-h-screen bg-[#F9F9F7] py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">

                    {/* Sidebar Navigation */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                            <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-stone-100">
                                <Image
                                    src={user.avatar}
                                    alt={user.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h2 className="font-serif text-xl font-bold text-stone-900">{user.name}</h2>
                            <p className="text-sm text-stone-500 mb-6">{user.email}</p>

                            <nav className="space-y-2 text-left">
                                <button className="flex items-center gap-3 w-full px-4 py-2 rounded-md bg-stone-50 text-primary font-medium">
                                    <User size={18} /> Mi Perfil
                                </button>
                                <button className="flex items-center gap-3 w-full px-4 py-2 rounded-md hover:bg-stone-50 text-stone-600 transition-colors">
                                    <Package size={18} /> Mis Pedidos
                                </button>
                                <button className="flex items-center gap-3 w-full px-4 py-2 rounded-md hover:bg-stone-50 text-stone-600 transition-colors">
                                    <Heart size={18} /> Lista de Deseos
                                </button>
                                <div className="h-px bg-stone-100 my-4"></div>
                                <Link href="/cuenta/login">
                                    <button className="flex items-center gap-3 w-full px-4 py-2 rounded-md text-red-500 hover:bg-red-50 transition-colors">
                                        <LogOut size={18} /> Cerrar Sesión
                                    </button>
                                </Link>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Welcome Banner */}
                        <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-between border-l-4 border-primary">
                            <div>
                                <h1 className="font-serif text-2xl text-stone-900">Hola, Valentino</h1>
                                <p className="text-stone-500 mt-1">Es bueno verte de nuevo.</p>
                            </div>
                            <Link href="/productos">
                                <Button variant="outline">Ir a la tienda</Button>
                            </Link>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                                <h3 className="font-medium text-stone-900">Pedidos Recientes</h3>
                                <button className="text-sm text-primary hover:underline">Ver todos</button>
                            </div>
                            <div className="divide-y divide-stone-100">
                                {orders.map(order => (
                                    <div key={order.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-stone-900">{order.id}</p>
                                            <p className="text-sm text-stone-500">{order.date}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                            <p className="font-medium text-stone-900">{order.total}</p>
                                            <Button variant="outline" size="sm" className="text-xs">Detalles</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
