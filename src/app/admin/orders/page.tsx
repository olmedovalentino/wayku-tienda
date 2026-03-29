'use client';

import { useState } from 'react';
import { useApp, Order } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import {
    Search,
    Filter,
    MoreVertical,
    X,
    Package,
    CheckCircle2,
    Clock,
    Truck,
    HelpCircle,
    Printer
} from 'lucide-react';
import { getTimeAgo } from '@/lib/time';


export default function AdminOrdersPage() {
    const { orders, updateOrderStatus } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Orders are now correctly fetched and sorted newest-first in AppContext
    const sortedOrders = [...orders];

    const filteredOrders = sortedOrders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              order.total.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Entregado': return 'bg-green-100 text-green-700';
            case 'Pedido recibido': return 'bg-yellow-100 text-yellow-700 font-medium';
            case 'Pago acreditado': return 'bg-emerald-100 text-emerald-700';
            case 'En preparación': return 'bg-blue-100 text-blue-700';
            case 'Embalado': return 'bg-indigo-100 text-indigo-700';
            case 'Despachado': return 'bg-purple-100 text-purple-700';
            case 'Devolución': return 'bg-orange-100 text-orange-700';
            case 'Cancelado': return 'bg-red-100 text-red-700';
            default: return 'bg-stone-100 text-stone-700';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
                <p className="text-stone-500">Gestiona las ventas y el estado de los envíos.</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por ID, cliente o total..."
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
                    <option value="Todos">Todos los Estados</option>
                    <option value="Pedido recibido">Pedido recibido</option>
                    <option value="Pago acreditado">Pago acreditado</option>
                    <option value="En preparación">En preparación</option>
                    <option value="Embalado">Embalado</option>
                    <option value="Despachado">Despachado</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Devolución">Devolución</option>
                    <option value="Cancelado">Cancelado</option>
                </select>
            </div>

            {/* Orders Table (Desktop) */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">ID Pedido</th>
                                <th className="px-6 py-4 font-medium">Cliente</th>
                                <th className="px-6 py-4 font-medium">Fecha</th>
                                <th className="px-6 py-4 font-medium">Items</th>
                                <th className="px-6 py-4 font-medium">Total</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                    <td
                                        onClick={() => setSelectedOrder(order)}
                                        className="px-6 py-4 font-medium text-stone-900 underline decoration-stone-200 underline-offset-4 cursor-pointer hover:text-primary transition-colors"
                                    >
                                        {order.id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-stone-900">{order.customer}</p>
                                            <p className="text-xs text-stone-500">{order.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-stone-500">
                                        <div className="flex flex-col">
                                            <span>{order.date}</span>
                                            {order.created_at && <span className="text-[10px] text-primary/70 italic mt-0.5">{getTimeAgo(order.created_at)}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-stone-600">{order.items} {order.items === 1 ? 'item' : 'items'}</td>
                                    <td className="px-6 py-4 font-medium text-stone-900">{order.total}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium border-none focus:ring-0 cursor-pointer ${getStatusStyles(order.status)}`}
                                        >
                                            <option value="Pedido recibido">Pedido recibido</option>
                                            <option value="Pago acreditado">Pago acreditado</option>
                                            <option value="En preparación">En preparación</option>
                                            <option value="Embalado">Embalado</option>
                                            <option value="Despachado">Despachado</option>
                                            <option value="Entregado">Entregado</option>
                                            <option value="Devolución">Devolución</option>
                                            <option value="Cancelado">Cancelado</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Orders List (Mobile) */}
            <div className="lg:hidden space-y-4">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col gap-3 relative">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 flex-shrink-0">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p
                                        onClick={() => setSelectedOrder(order)}
                                        className="font-bold text-stone-900 underline decoration-stone-200 underline-offset-4 cursor-pointer active:text-primary transition-colors"
                                    >
                                        {order.id}
                                    </p>
                                    <div className="flex flex-col">
                                        <p className="text-xs text-stone-500 capitalize">{order.date}</p>
                                        {order.created_at && <span className="text-[10px] text-primary/70 italic mt-0.5">{getTimeAgo(order.created_at)}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-1.5 text-stone-400 active:bg-stone-100 rounded-lg transition-colors"
                                    title="Ver detalle"
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm py-2 border-y border-stone-100">
                            <div>
                                <span className="text-stone-500 block text-xs">Total</span>
                                <span className="font-bold text-stone-900">{order.total}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-stone-500 block text-xs">Cliente</span>
                                <span className="font-bold text-stone-900">{order.customer}</span>
                            </div>
                        </div>

                        <div className="flex justify-between gap-2 items-center">
                            <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                className={`flex-1 flex justify-center items-center px-2 py-1.5 rounded-lg text-xs font-medium border-none focus:ring-0 text-center uppercase tracking-wider ${getStatusStyles(order.status)}`}
                            >
                                <option value="Pedido recibido">Recibido</option>
                                <option value="Pago acreditado">Pagado</option>
                                <option value="En preparación">En preparación</option>
                                <option value="Embalado">Embalado</option>
                                <option value="Despachado">Despachado</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Devolución">Devolución</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                            <span className="flex-1 flex justify-center items-center bg-stone-50 rounded-lg border border-stone-100 py-1.5 text-xs font-medium text-stone-500">
                                {order.items} {order.items === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-stone-100">
                            <div>
                                <h2 className="text-xl font-bold text-stone-900">Detalle de Pedido {selectedOrder.id}</h2>
                                <p className="text-sm text-stone-500">{selectedOrder.date}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Status Steps */}
                            <div className="flex justify-between items-start">
                                {[
                                    { label: 'Pedido recibido', icon: Clock },
                                    { label: 'Pago acreditado', icon: CheckCircle2 },
                                    { label: 'En preparación', icon: Package },
                                    { label: 'Despachado', icon: Truck },
                                    { label: 'Entregado', icon: CheckCircle2 }
                                ].map((step, idx, arr) => {
                                    const isActive = selectedOrder.status === step.label;
                                    const isPast = arr.findIndex(s => s.label === selectedOrder.status) > idx;

                                    return (
                                        <div key={step.label} className="flex flex-col items-center flex-1 relative">
                                            <div className={`z-10 p-2 rounded-full mb-2 ${isActive ? 'bg-primary text-white' :
                                                isPast ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400'
                                                }`}>
                                                <step.icon size={20} />
                                            </div>
                                            <span className={`text-xs font-medium text-center ${isActive || isPast ? 'text-stone-900' : 'text-stone-400'}`}>
                                                {step.label}
                                            </span>
                                            {idx < arr.length - 1 && (
                                                <div className={`hidden sm:block absolute top-4 left-1/2 w-full h-[2px] ${isPast ? 'bg-green-200' : 'bg-stone-100'}`}></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-stone-900 flex items-center gap-2">
                                        <Package size={18} className="text-primary" />
                                        Información del Cliente
                                    </h3>
                                    <div className="bg-stone-50 p-4 rounded-xl space-y-2">
                                        <p className="text-sm"><strong>Nombre:</strong> {selectedOrder.customer}</p>
                                        <p className="text-sm"><strong>Email:</strong> {selectedOrder.email}</p>
                                        {selectedOrder.phone && <p className="text-sm"><strong>Teléfono:</strong> {selectedOrder.phone}</p>}
                                        <p className="text-sm"><strong>Entrega:</strong> {selectedOrder.shippingMethod === 'pickup' ? 'Retiro en tienda' : 'Envío a domicilio'}</p>
                                        {selectedOrder.shippingMethod === 'shipping' && (
                                            <p className="text-sm"><strong>Dirección:</strong> {selectedOrder.address}, {selectedOrder.city} ({selectedOrder.postalCode})</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold text-stone-900 flex items-center gap-2">
                                        <HelpCircle size={18} className="text-primary" />
                                        Resumen de Pago
                                    </h3>
                                    <div className="bg-stone-50 p-4 rounded-xl space-y-2">
                                        <p className="text-sm"><strong>Método:</strong> {selectedOrder.paymentMethod === 'card' ? 'Tarjeta (Mercado Pago)' : 'Transferencia Bancaria'}</p>
                                        <p className="text-sm"><strong>Estado Pago:</strong> {['Pago acreditado', 'En preparación', 'Embalado', 'Despachado', 'Entregado'].includes(selectedOrder.status) ? 'Acreditado' : (selectedOrder.status === 'Pedido recibido' ? 'Pendiente' : (selectedOrder.status === 'Cancelado' ? 'Cancelado' : 'Pendiente'))}</p>
                                        <div className="pt-2 border-t border-stone-200 mt-2">
                                            <p className="text-lg font-bold text-stone-900 flex justify-between">
                                                <span>Total:</span>
                                                <span>{selectedOrder.total}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-stone-900">Productos</h3>
                                <div className="border border-stone-100 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-stone-50 text-stone-500 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Producto</th>
                                                <th className="px-4 py-3 text-center">Cantidad</th>
                                                <th className="px-4 py-3 text-right">Precio</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {selectedOrder.details?.map((item, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-stone-900">{item.name}</div>
                                                        <div className="text-[10px] text-stone-500 flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                                            {item.material && <span className="bg-stone-100 px-1.5 py-0.5 rounded">Madera: {item.material}</span>}
                                                            {item.size && <span className="bg-stone-100 px-1.5 py-0.5 rounded">Medida: {item.size}</span>}
                                                            {item.shade && <span className="bg-stone-100 px-1.5 py-0.5 rounded">Pantalla: {item.shade}</span>}
                                                            {item.cable && <span className="bg-stone-100 px-1.5 py-0.5 rounded">Cable: {item.cable}</span>}
                                                            {item.canopy && <span className="bg-stone-100 px-1.5 py-0.5 rounded">Florón: {item.canopy}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">${item.price.toLocaleString()}</td>
                                                </tr>
                                            ))}

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-stone-100 flex gap-4">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedOrder(null)}>
                                Cerrar
                            </Button>
                            {(selectedOrder.status === 'Pedido recibido' || selectedOrder.status === 'Pago acreditado' || selectedOrder.status === 'En preparación' || selectedOrder.status === 'Embalado') && (
                                <Button
                                    variant="outline"
                                    className="flex-1 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                    onClick={() => {
                                        if (confirm('¿Estás seguro de cancelar este pedido?')) {
                                            updateOrderStatus(selectedOrder.id, 'Cancelado');
                                            setSelectedOrder({ ...selectedOrder, status: 'Cancelado' });
                                        }
                                    }}
                                >
                                    Cancelar Pedido
                                </Button>
                            )}
                            {(selectedOrder.status === 'Despachado' || selectedOrder.status === 'Entregado') && (
                                <Button
                                    variant="outline"
                                    className="flex-1 text-orange-600 border-orange-100 hover:bg-orange-50"
                                    onClick={() => {
                                        updateOrderStatus(selectedOrder.id, 'Devolución');
                                        setSelectedOrder({ ...selectedOrder, status: 'Devolución' });
                                    }}
                                >
                                    Marcar Devolución
                                </Button>
                            )}
                            <Button
                                className="flex-1 gap-2"
                                onClick={() => {
                                    const printContent = `
<html>
<head>
    <title>Comprobante de Pedido ${selectedOrder.id}</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .brand { font-size: 24px; font-weight: bold; letter-spacing: 4px; }
        .details { margin-bottom: 30px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 50px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">WAYKÚ</div>
        <div>Lámparas de autor · Hechas a mano</div>
        <div style="margin-top: 10px;">Comprobante de Pedido: ${selectedOrder.id}</div>
    </div>
    
    <div class="details">
        <strong>Fecha:</strong> ${selectedOrder.date}<br>
        <strong>Cliente:</strong> ${selectedOrder.customer}<br>
        <strong>Email:</strong> ${selectedOrder.email}<br>
        <strong>Teléfono:</strong> ${selectedOrder.phone || 'No provisto'}<br>
        <strong>Método Entrega:</strong> ${selectedOrder.shippingMethod === 'pickup' ? 'Retiro en tienda' : 'Envío a Domicilio'}<br>
        ${selectedOrder.shippingMethod === 'shipping' ? `<strong>Dirección:</strong> ${selectedOrder.address}, ${selectedOrder.city} (${selectedOrder.postalCode})<br>` : ''}
        <strong>Método Pago:</strong> ${selectedOrder.paymentMethod === 'card' ? 'Mercado Pago / Tarjetas' : 'Transferencia Bancaria'}<br>
        <strong>Estado:</strong> ${selectedOrder.status}
    </div>
    
    <table class="table">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th style="text-align: right;">Precio</th>
            </tr>
        </thead>
        <tbody>
            ${(selectedOrder.details || []).map(item => `
                <tr>
                    <td>
                        <div style="font-weight: bold;">${item.name}</div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">
                            ${item.material ? `Madera: ${item.material} / ` : ''}
                            ${item.size ? `Medida: ${item.size} / ` : ''}
                            ${item.shade ? `Pantalla: ${item.shade} / ` : ''}
                            ${item.cable ? `Cable: ${item.cable} / ` : ''}
                            ${item.canopy ? `Florón: ${item.canopy}` : ''}
                        </div>
                    </td>
                    <td>${item.quantity}</td>
                    <td style="text-align: right;">$${item.price.toLocaleString()}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="total">
        TOTAL: ${selectedOrder.total}
    </div>
    
    <div class="footer">
        Gracias por elegir Waykú. Tu pedido está siendo procesado con amor y cuidado.<br>
        www.wayku.com · Instagram: @waykuarg
    </div>
</body>
</html>
                                    `;
                                    const win = window.open('', '_blank');
                                    win?.document.write(printContent);
                                    win?.document.close();
                                    win?.print();
                                }}
                            >
                                <Printer size={18} />
                                Imprimir Comprobante
                            </Button>

                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
