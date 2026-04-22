import type { Order } from '@/context/AppContext';

function parseOrderDate(dateStr: string) {
    if (!dateStr) return 0;

    const months: Record<string, number> = {
        ene: 0,
        feb: 1,
        mar: 2,
        abr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        ago: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dic: 11,
    };

    const parts = dateStr
        .toLowerCase()
        .split(' ')
        .filter((part) => part !== 'de' && part !== 'del' && part !== '');

    if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1].replace('.', '').substring(0, 3);
        const year = parseInt(parts[2], 10);

        if (!Number.isNaN(day) && !Number.isNaN(year) && typeof months[monthStr] !== 'undefined') {
            return new Date(year, months[monthStr], day).getTime();
        }
    }

    const timestamp = Date.parse(dateStr);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getOrderTimestamp(order: Pick<Order, 'id' | 'date' | 'created_at'>) {
    const createdAtTime = order.created_at ? new Date(order.created_at).getTime() : 0;
    if (!Number.isNaN(createdAtTime) && createdAtTime > 0) {
        return createdAtTime;
    }

    if (order.id?.startsWith('ORD-') && order.id.length > 10) {
        const idTimestamp = Number(order.id.replace('ORD-', ''));
        if (!Number.isNaN(idTimestamp) && idTimestamp > 1000000000) {
            return idTimestamp;
        }
    }

    return parseOrderDate(order.date);
}

export function sortAdminOrders(ordersList: Order[]) {
    return [...ordersList].sort((a, b) => {
        const timeA = getOrderTimestamp(a);
        const timeB = getOrderTimestamp(b);

        if (timeA !== timeB) {
            return timeB - timeA;
        }

        const numA = Number(String(a.id).replace('ORD-', ''));
        const numB = Number(String(b.id).replace('ORD-', ''));

        if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
            return numB - numA;
        }

        return String(b.id).localeCompare(String(a.id));
    });
}
