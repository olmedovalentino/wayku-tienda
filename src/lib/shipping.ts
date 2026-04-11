export type ShippingItem = {
    name: string;
    quantity: number;
};

type ShippingZone = {
    label: string;
    desde: number;
    hasta: number;
    basePrecio: number;
    dias: string;
};

const FREE_SHIPPING_THRESHOLD = 250000;
const EXTRA_KG_COST = 3500;

const ZONES: ShippingZone[] = [
    { label: 'Cordoba Capital y Gran Cordoba', desde: 5000, hasta: 5009, basePrecio: 9000, dias: '1-2 dias habiles' },
    { label: 'Cordoba Provincia (Interior)', desde: 5100, hasta: 5999, basePrecio: 12000, dias: '2-3 dias habiles' },
    { label: 'CABA', desde: 1000, hasta: 1499, basePrecio: 22000, dias: '3-4 dias habiles' },
    { label: 'GBA (Gran Buenos Aires)', desde: 1500, hasta: 1999, basePrecio: 24000, dias: '3-5 dias habiles' },
    { label: 'Buenos Aires (Interior)', desde: 6000, hasta: 8999, basePrecio: 26000, dias: '4-6 dias habiles' },
    { label: 'Santa Fe Capital y Rosario', desde: 2000, hasta: 2009, basePrecio: 20000, dias: '2-4 dias habiles' },
    { label: 'Santa Fe Provincia', desde: 2010, hasta: 2999, basePrecio: 22000, dias: '3-5 dias habiles' },
    { label: 'Entre Rios', desde: 3100, hasta: 3299, basePrecio: 22000, dias: '3-5 dias habiles' },
    { label: 'San Luis / La Rioja / San Juan', desde: 5300, hasta: 5799, basePrecio: 24000, dias: '3-6 dias habiles' },
    { label: 'Mendoza', desde: 5500, hasta: 5599, basePrecio: 24000, dias: '4-6 dias habiles' },
    { label: 'Santiago del Estero / Tucuman / Catamarca', desde: 4000, hasta: 4299, basePrecio: 28000, dias: '4-6 dias habiles' },
    { label: 'Catamarca', desde: 4700, hasta: 4799, basePrecio: 28000, dias: '4-6 dias habiles' },
    { label: 'Salta / Jujuy', desde: 4400, hasta: 4699, basePrecio: 28000, dias: '5-7 dias habiles' },
    { label: 'Misiones / Corrientes / Chaco / Formosa', desde: 3300, hasta: 3699, basePrecio: 30000, dias: '5-8 dias habiles' },
    { label: 'La Pampa', desde: 6300, hasta: 6399, basePrecio: 26000, dias: '4-6 dias habiles' },
    { label: 'Neuquen / Rio Negro', desde: 8300, hasta: 8499, basePrecio: 32000, dias: '6-8 dias habiles' },
    { label: 'Chubut', desde: 9000, hasta: 9099, basePrecio: 38000, dias: '6-9 dias habiles' },
    { label: 'Santa Cruz', desde: 9200, hasta: 9299, basePrecio: 44000, dias: '7-10 dias habiles' },
    { label: 'Tierra del Fuego', desde: 9410, hasta: 9499, basePrecio: 52000, dias: '8-12 dias habiles' },
];

function getZone(postalCode: number): ShippingZone | undefined {
    return ZONES.find((zone) => postalCode >= zone.desde && postalCode <= zone.hasta);
}

function getBillableWeight(items: ShippingItem[]): number {
    let totalWeight = 0;

    for (const item of items) {
        const normalizedName = item.name.toLowerCase();
        let realWeight = 3;
        let volumeCm3 = 15000;

        if (normalizedName.includes('amai')) {
            realWeight = 3;
            volumeCm3 = 25 * 40 * 25;
        } else if (normalizedName.includes('nami')) {
            realWeight = 3;
            volumeCm3 = 25 * 30 * 30;
        } else if (normalizedName.includes('ara')) {
            realWeight = 2;
            volumeCm3 = 15 * 30 * 20;
        } else {
            realWeight = 3;
            volumeCm3 = 20000;
        }

        const volumetricWeight = volumeCm3 / 4000;
        const billableWeight = Math.max(realWeight, volumetricWeight);
        totalWeight += billableWeight * item.quantity;
    }

    return Math.ceil(totalWeight);
}

export function quoteShipping(params: {
    postalCode: string;
    items: ShippingItem[];
    subtotal: number;
}) {
    const postalCode = String(params.postalCode || '').trim();
    const normalizedPostalCode = postalCode.replace(/\D/g, '');
    const subtotal = Number(params.subtotal || 0);

    if (!normalizedPostalCode || normalizedPostalCode.length < 4) {
        throw new Error('Codigo postal invalido. Ingresa al menos 4 digitos.');
    }

    if (!Array.isArray(params.items) || params.items.length === 0) {
        throw new Error('No hay productos para cotizar el envio.');
    }

    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        return {
            cost: 0,
            zona: 'Envio gratis',
            estimatedDays: '',
            freeShipping: true,
        };
    }

    const cp = Number.parseInt(normalizedPostalCode, 10);
    if (!Number.isFinite(cp)) {
        throw new Error('Codigo postal invalido. Ingresa al menos 4 digitos.');
    }

    const billableWeight = getBillableWeight(params.items);
    const extraKg = Math.max(0, billableWeight - 3);
    const extraCharge = extraKg * EXTRA_KG_COST;
    const zone = getZone(cp);

    if (!zone) {
        return {
            cost: 45000 + extraCharge,
            zona: 'Patagonia / Localidad alejada',
            estimatedDays: '8-12 dias habiles',
            freeShipping: false,
            note: 'Precio estimado basado en volumen.',
        };
    }

    return {
        cost: zone.basePrecio + extraCharge,
        zona: zone.label,
        estimatedDays: zone.dias,
        freeShipping: false,
    };
}
