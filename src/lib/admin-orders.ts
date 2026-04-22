import type { Order } from '@/context/AppContext';
import { parseOrderDate } from '@/lib/order-date';

function getCreatedAtTimestamp(order: Pick<Order, 'created_at'>) {
    const createdAtTime = order.created_at ? new Date(order.created_at).getTime() : 0;
    if (!Number.isNaN(createdAtTime) && createdAtTime > 0) {
        return createdAtTime;
    }
    return 0;
}

function getOrderIdTimestamp(order: Pick<Order, 'id'>) {
    if (order.id?.startsWith('ORD-') && order.id.length > 10) {
        const idTimestamp = Number(order.id.replace('ORD-', ''));
        if (!Number.isNaN(idTimestamp) && idTimestamp > 1000000000) {
            return idTimestamp;
        }
    }
    return 0;
}

export function sortAdminOrders(ordersList: Order[]) {
    return [...ordersList].sort((a, b) => {
        const orderDateA = parseOrderDate(a.date);
        const orderDateB = parseOrderDate(b.date);

        if (orderDateA !== orderDateB) {
            return orderDateB - orderDateA;
        }

        const createdAtA = getCreatedAtTimestamp(a);
        const createdAtB = getCreatedAtTimestamp(b);

        if (createdAtA !== createdAtB) {
            return createdAtB - createdAtA;
        }

        const idTimeA = getOrderIdTimestamp(a);
        const idTimeB = getOrderIdTimestamp(b);

        if (idTimeA !== idTimeB) {
            return idTimeB - idTimeA;
        }

        const numA = Number(String(a.id).replace('ORD-', ''));
        const numB = Number(String(b.id).replace('ORD-', ''));

        if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
            return numB - numA;
        }

        return String(b.id).localeCompare(String(a.id));
    });
}
