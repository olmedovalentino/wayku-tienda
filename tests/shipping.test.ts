import { describe, expect, it } from 'vitest';
import { quoteShipping } from '@/lib/shipping';

describe('quoteShipping', () => {
    it('returns free shipping above threshold', () => {
        const quote = quoteShipping({
            postalCode: '5000',
            items: [{ name: 'Amai', quantity: 1 }],
            subtotal: 300000,
        });

        expect(quote.cost).toBe(0);
        expect(quote.freeShipping).toBe(true);
    });

    it('calculates a zone-based quote below threshold', () => {
        const quote = quoteShipping({
            postalCode: '5000',
            items: [{ name: 'Amai', quantity: 1 }],
            subtotal: 100000,
        });

        expect(quote.cost).toBeGreaterThan(0);
        expect(quote.zona).toContain('Cordoba');
        expect(quote.freeShipping).toBe(false);
    });

    it('rejects invalid postal codes', () => {
        expect(() =>
            quoteShipping({
                postalCode: '12',
                items: [{ name: 'Amai', quantity: 1 }],
                subtotal: 100000,
            })
        ).toThrow(/Codigo postal invalido/i);
    });
});
