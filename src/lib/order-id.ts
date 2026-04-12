import { createHash } from 'crypto';

function toStableNumericSuffix(input: string): string {
    const hash = createHash('sha256').update(input).digest('hex').slice(0, 12);
    return BigInt(`0x${hash}`).toString().slice(0, 10).padStart(10, '0');
}

export function createStableOrderId(checkoutToken: string): string {
    return `ORD-${toStableNumericSuffix(checkoutToken)}`;
}

export function formatOrderDisplayId(orderId: string): string {
    const normalized = String(orderId || '').trim();
    if (!normalized) return normalized;

    if (/^ORD-\d{6,}$/.test(normalized)) {
        return normalized;
    }

    if (normalized.startsWith('ORD-')) {
        return `ORD-${toStableNumericSuffix(normalized)}`;
    }

    return normalized;
}
