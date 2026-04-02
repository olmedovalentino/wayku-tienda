'use client';

import { useState, useEffect, useCallback } from 'react';
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
    Printer,
    RefreshCw
} from 'lucide-react';
import { getTimeAgo } from '@/lib/time';

function escapeHtml(unsafe: string | null | undefined): string {
    if (!unsafe) return '';
    return unsafe.toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export default function AdminOrdersPage() {
    const { orders: contextOrders, updateOrderStatus } = useApp();
    const [orders, setOrders] = useState<Order[]>(contextOrders);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Keep in sync with context on mount
    useEffect(() => { setOrders(contextOrders); }, [contextOrders]);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/data');
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch (e) {
            console.error('Error fetching orders:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Orders sorted newest-first
    const sortedOrders = [...orders].sort((a, b) => {
        let timeA = 0; let timeB = 0;
        if (a.created_at) timeA = new Date(a.created_at).getTime();
        if (b.created_at) timeB = new Date(b.created_at).getTime();
        
        if (timeA === 0 && a.id && a.id.startsWith('ORD-') && a.id.length > 10) {
            const ts = Number(a.id.replace('ORD-', ''));
            if (!isNaN(ts) && ts > 1000000000) timeA = ts;
        }
        if (timeB === 0 && b.id && b.id.startsWith('ORD-') && b.id.length > 10) {
            const ts = Number(b.id.replace('ORD-', ''));
            if (!isNaN(ts) && ts > 1000000000) timeB = ts;
        }
        
        if (timeA !== 0 && timeB !== 0 && timeA !== timeB) {
            return timeB - timeA;
        }
        
        // Fallback to numeric ID sort
        const numA = Number(String(a.id).replace('ORD-', ''));
        const numB = Number(String(b.id).replace('ORD-', ''));
        if (!isNaN(numA) && !isNaN(numB)) {
             return numB - numA;
        }
        
        return String(b.id).localeCompare(String(a.id));
    });

    const filteredOrders = sortedOrders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (order.total?.toString() || '').includes(searchTerm.toLowerCase());
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
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
                    <p className="text-stone-500">Gestiona las ventas y el estado de los envíos.</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 text-sm text-stone-500 hover:text-primary transition-colors border border-stone-200 rounded-lg px-3 py-2"
                    title="Actualizar pedidos"
                >
                    <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    Actualizar
                </button>
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
                                    <td className="px-6 py-4 font-medium text-stone-900">${(order.total || 0).toLocaleString()}</td>
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
                                <span className="font-bold text-stone-900">${(order.total || 0).toLocaleString()}</span>
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
                                            <p className="text-sm"><strong>Dirección:</strong> {selectedOrder.address}, {selectedOrder.city}{selectedOrder.province ? `, ${selectedOrder.province}` : ''} ({selectedOrder.postalCode})</p>
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
                                                <span>${(selectedOrder.total || 0).toLocaleString()}</span>
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

                        <div className="p-6 border-t border-stone-100 flex flex-col sm:flex-row gap-4">
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
        <strong>Fecha:</strong> ${escapeHtml(selectedOrder.date)}<br>
        <strong>Cliente:</strong> ${escapeHtml(selectedOrder.customer)}<br>
        <strong>Email:</strong> ${escapeHtml(selectedOrder.email)}<br>
        <strong>Teléfono:</strong> ${escapeHtml(selectedOrder.phone) || 'No provisto'}<br>
        <strong>Método Entrega:</strong> ${selectedOrder.shippingMethod === 'pickup' ? 'Retiro en tienda' : 'Envío a Domicilio'}<br>
        ${selectedOrder.shippingMethod === 'shipping' ? `<strong>Dirección:</strong> ${escapeHtml(selectedOrder.address)}, ${escapeHtml(selectedOrder.city)}${selectedOrder.province ? `, ${escapeHtml(selectedOrder.province)}` : ''} (${escapeHtml(selectedOrder.postalCode)})<br>` : ''}
        <strong>Método Pago:</strong> ${selectedOrder.paymentMethod === 'card' ? 'Mercado Pago / Tarjetas' : 'Transferencia Bancaria'}<br>
        <strong>Estado:</strong> ${escapeHtml(selectedOrder.status)}
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
                        <div style="font-weight: bold;">${escapeHtml(item.name)}</div>
                        <div style="font-size: 11px; color: #666; margin-top: 4px;">
                            ${item.material ? `Madera: ${escapeHtml(item.material)} / ` : ''}
                            ${item.size ? `Medida: ${escapeHtml(item.size)} / ` : ''}
                            ${item.shade ? `Pantalla: ${escapeHtml(item.shade)} / ` : ''}
                            ${item.cable ? `Cable: ${escapeHtml(item.cable)} / ` : ''}
                            ${item.canopy ? `Florón: ${escapeHtml(item.canopy)}` : ''}
                        </div>
                    </td>
                    <td>${item.quantity}</td>
                    <td style="text-align: right;">$${item.price.toLocaleString()}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="total">
        TOTAL: $${(selectedOrder.total || 0).toLocaleString()}
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

                            {selectedOrder.shippingMethod === 'shipping' && (
                                <Button
                                    className="flex-1 gap-2 border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200"
                                    onClick={() => {
                                        const printLabel = `
<html>
<head>
    <title>Etiqueta de Envío ${selectedOrder.id}</title>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; background: #f5f5f0; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 32px; }
        .label { width: 148mm; background: #fff; border: 1.5px solid #1a1a1a; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
        .label-header { background: #1a1a1a; color: #fff; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; }
        .brand-name { font-size: 18px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; color: #fff; }
        .brand-sub  { font-size: 9px; letter-spacing: 0.2em; color: #aaa; text-transform: uppercase; margin-top: 1px; }
        .order-badge { font-size: 10px; font-weight: 700; background: #fff; color: #1a1a1a; padding: 4px 10px; border-radius: 2px; letter-spacing: 0.05em; }
        .label-body { padding: 16px 18px; }
        .section-label { font-size: 8px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #999; margin-bottom: 6px; }
        .sender-block { font-size: 10px; line-height: 1.7; color: #555; border-bottom: 1px dashed #ddd; padding-bottom: 12px; margin-bottom: 14px; }
        .sender-block strong { color: #1a1a1a; font-size: 11px; font-weight: 700; display: block; margin-bottom: 2px; }
        .divider-arrow { text-align: center; font-size: 14px; color: #ccc; margin-bottom: 12px; letter-spacing: 4px; }
        .recipient-block { margin-bottom: 14px; }
        .recipient-name { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; color: #1a1a1a; line-height: 1.2; margin-bottom: 6px; }
        .recipient-address { font-size: 12px; line-height: 1.8; color: #333; }
        .recipient-phone { font-size: 11px; color: #666; margin-top: 4px; }
        .label-footer { background: #f7f7f5; border-top: 1px solid #eee; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; }
        .cp-box { font-size: 13px; font-weight: 900; letter-spacing: 0.08em; color: #1a1a1a; border: 2px solid #1a1a1a; padding: 4px 12px; border-radius: 2px; }
        .powered { font-size: 8px; color: #bbb; text-transform: uppercase; letter-spacing: 0.15em; }
        .stickers-row { display: flex; gap: 16px; }
        .sticker-fragil { width: 80mm; background: #fff; border: 2px solid #e85d04; border-radius: 4px; overflow: hidden; }
        .sticker-fragil-header { background: #e85d04; padding: 8px 14px; }
        .sticker-fragil-header span { font-size: 20px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #fff; }
        .sticker-fragil-body { padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
        .fragil-icon { font-size: 26px; }
        .fragil-text { font-size: 10px; line-height: 1.5; color: #666; }
        .fragil-text strong { color: #e85d04; font-size: 11px; display: block; }
        .sticker-wayku { width: 80mm; background: #1a1a1a; border-radius: 4px; padding: 16px 20px; text-align: center; }
        .sticker-wayku-name { font-size: 26px; font-weight: 900; letter-spacing: 0.35em; text-transform: uppercase; color: #fff; }
        .sticker-wayku-sub { font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: #888; margin-top: 4px; }
        .sticker-wayku-line { height: 1px; background: #444; margin: 12px 0; }
        .sticker-wayku-tagline { font-size: 9px; color: #aaa; letter-spacing: 0.12em; text-transform: uppercase; }
        @media print { body { background: #fff; padding: 8mm; gap: 10mm; } .label, .sticker-fragil, .sticker-wayku { box-shadow: none; } }
    </style>
</head>
<body>

<div class="label">
    <div class="label-header">
        <div>
            <div class="brand-name">Waykú</div>
            <div class="brand-sub">Iluminación Artesanal</div>
        </div>
        <div class="order-badge">Pedido #${selectedOrder.id}</div>
    </div>
    <div class="label-body">
        <div class="section-label">Remitente</div>
        <div class="sender-block">
            <strong>Waykú Iluminación</strong>
            Villa Allende, Córdoba, Argentina<br>
            Tel: 3513844333 &nbsp;·&nbsp; waykuargentina@gmail.com<br>
            IG: @waykuarg
        </div>
        <div class="divider-arrow">▼ &nbsp; ▼ &nbsp; ▼</div>
        <div class="section-label">Destinatario</div>
        <div class="recipient-block">
            <div class="recipient-name">${escapeHtml(selectedOrder.customer)}</div>
            <div class="recipient-address">
                ${escapeHtml(selectedOrder.address)}<br>
                ${escapeHtml(selectedOrder.city)}${selectedOrder.province ? `, ${escapeHtml(selectedOrder.province)}` : ''}, Argentina
            </div>
            ${selectedOrder.phone ? '<div class="recipient-phone">Tel: ' + escapeHtml(selectedOrder.phone) + '</div>' : ''}
        </div>
    </div>
    <div class="label-footer">
        <div class="cp-box">CP ${escapeHtml(selectedOrder.postalCode)}</div>
        <div class="powered">wayku-tienda.vercel.app</div>
    </div>
</div>

<div class="stickers-row">
    <div class="sticker-fragil">
        <div class="sticker-fragil-header"><span>⚠ Frágil</span></div>
        <div class="sticker-fragil-body">
            <div class="fragil-icon">🫙</div>
            <div class="fragil-text">
                <strong>Manipular con cuidado</strong>
                Contenido delicado. No arrojar.<br>No apilar más de 3 cajas.
            </div>
        </div>
    </div>
    <div class="sticker-wayku">
        <div class="sticker-wayku-name">Waykú</div>
        <div class="sticker-wayku-sub">Iluminación Artesanal</div>
        <div class="sticker-wayku-line"></div>
        <div class="sticker-wayku-tagline">Córdoba · Argentina · @waykuarg</div>
    </div>
</div>

<script>window.print();</script>
</body>
</html>
                                        `;
                                        const win = window.open('', '_blank');
                                        win?.document.write(printLabel);
                                        win?.document.close();
                                    }}
                                >
                                    <Package size={18} />
                                    Etiqueta de Envío
                                </Button>
                            )}

                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
