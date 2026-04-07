import { NextResponse } from 'next/server';

// ============================================================
// TABLA DE ENVÍOS POR ZONA — Waykú
// Calculada con peso volumétrico real de cada producto
// Divisor Andreani: 4000
//
// Productos:
//   Amaí  → 40x25x25 cm = 25.000 cm³ → 6,25 kg volumétrico (3 kg real)
//   Nami  → 30x30x25 cm = 22.500 cm³ → 5,63 kg volumétrico (3 kg real)
//   Ará   → 30x20x15 cm =  9.000 cm³ → 2,25 kg volumétrico (2 kg real)
//
// Tier LIVIANO (≤ 3 kg vol): aplica a Ará
// Tier PESADO  (> 3 kg vol): aplica a Amaí y Nami
//
// Margen de seguridad ~25-30% sobre costo real de Andreani desde Córdoba
// Actualización: Abril 2025
// ============================================================

interface Zona {
    label: string;
    desde: number;
    hasta: number;
    precioLiviano: number;   // Ará-sized (~2.25 kg vol)
    precioPesado: number;    // Amaí/Nami-sized (~6 kg vol)
    dias: string;
}

const ZONAS: Zona[] = [
    // CÓRDOBA
    { label: 'Córdoba Capital y Gran Córdoba',  desde: 5000, hasta: 5009, precioLiviano: 10000, precioPesado: 15000, dias: '1-2 días hábiles' },
    { label: 'Córdoba Provincia (Interior)',    desde: 5100, hasta: 5999, precioLiviano: 15000, precioPesado: 22000, dias: '2-3 días hábiles' },

    // BUENOS AIRES
    { label: 'CABA',                            desde: 1000, hasta: 1499, precioLiviano: 20000, precioPesado: 29000, dias: '3-5 días hábiles' },
    { label: 'Gran Buenos Aires',               desde: 1500, hasta: 1999, precioLiviano: 22000, precioPesado: 31000, dias: '3-5 días hábiles' },
    { label: 'Buenos Aires Interior',           desde: 6000, hasta: 8999, precioLiviano: 26000, precioPesado: 36000, dias: '4-6 días hábiles' },

    // CENTRO
    { label: 'Santa Fe Capital y Rosario',     desde: 2000, hasta: 2009, precioLiviano: 18000, precioPesado: 25000, dias: '2-4 días hábiles' },
    { label: 'Santa Fe Provincia',             desde: 2010, hasta: 2999, precioLiviano: 20000, precioPesado: 27000, dias: '3-5 días hábiles' },
    { label: 'Entre Ríos',                     desde: 3100, hasta: 3299, precioLiviano: 21000, precioPesado: 28000, dias: '3-5 días hábiles' },
    { label: 'Mendoza',                        desde: 5500, hasta: 5599, precioLiviano: 23000, precioPesado: 32000, dias: '4-6 días hábiles' },
    { label: 'San Luis',                       desde: 5700, hasta: 5799, precioLiviano: 21000, precioPesado: 29000, dias: '3-5 días hábiles' },
    { label: 'La Rioja',                       desde: 5300, hasta: 5399, precioLiviano: 22000, precioPesado: 30000, dias: '4-6 días hábiles' },
    { label: 'San Juan',                       desde: 5400, hasta: 5499, precioLiviano: 23000, precioPesado: 31000, dias: '4-6 días hábiles' },

    // NORTE
    { label: 'Tucumán',                        desde: 4000, hasta: 4099, precioLiviano: 24000, precioPesado: 33000, dias: '4-6 días hábiles' },
    { label: 'Salta',                          desde: 4400, hasta: 4499, precioLiviano: 26000, precioPesado: 36000, dias: '5-7 días hábiles' },
    { label: 'Jujuy',                          desde: 4600, hasta: 4699, precioLiviano: 27000, precioPesado: 37000, dias: '5-7 días hábiles' },
    { label: 'Catamarca',                      desde: 4700, hasta: 4799, precioLiviano: 24000, precioPesado: 33000, dias: '4-6 días hábiles' },
    { label: 'Santiago del Estero',            desde: 4200, hasta: 4299, precioLiviano: 23000, precioPesado: 32000, dias: '4-6 días hábiles' },
    { label: 'Misiones',                       desde: 3300, hasta: 3399, precioLiviano: 29000, precioPesado: 40000, dias: '5-8 días hábiles' },
    { label: 'Corrientes',                     desde: 3400, hasta: 3499, precioLiviano: 27000, precioPesado: 37000, dias: '5-7 días hábiles' },
    { label: 'Chaco',                          desde: 3500, hasta: 3599, precioLiviano: 28000, precioPesado: 38000, dias: '5-7 días hábiles' },
    { label: 'Formosa',                        desde: 3600, hasta: 3699, precioLiviano: 30000, precioPesado: 42000, dias: '6-8 días hábiles' },

    // LA PAMPA + PATAGONIA
    { label: 'La Pampa',                       desde: 6300, hasta: 6399, precioLiviano: 24000, precioPesado: 33000, dias: '4-6 días hábiles' },
    { label: 'Neuquén',                        desde: 8300, hasta: 8399, precioLiviano: 31000, precioPesado: 43000, dias: '6-8 días hábiles' },
    { label: 'Río Negro',                      desde: 8400, hasta: 8499, precioLiviano: 31000, precioPesado: 43000, dias: '6-8 días hábiles' },
    { label: 'Chubut',                         desde: 9000, hasta: 9099, precioLiviano: 38000, precioPesado: 53000, dias: '6-9 días hábiles' },
    { label: 'Santa Cruz',                     desde: 9200, hasta: 9299, precioLiviano: 45000, precioPesado: 63000, dias: '7-10 días hábiles' },
    { label: 'Tierra del Fuego',               desde: 9410, hasta: 9499, precioLiviano: 55000, precioPesado: 76000, dias: '8-12 días hábiles' },
];

// Dimensiones conocidas de cada producto para calcular peso volumétrico
// Divisor Andreani = 4000
const PRODUCT_VOL_WEIGHTS: Record<string, number> = {
    'amai':  (40 * 25 * 25) / 4000,  // 6.25 kg
    'nami':  (30 * 30 * 25) / 4000,  // 5.63 kg
    'ara':   (30 * 20 * 15) / 4000,  // 2.25 kg
    'ará':   (30 * 20 * 15) / 4000,
};

const FALLBACK_VOL_WEIGHT = 6.25; // Si no conocemos el producto, asumimos el peor caso
const SURCHARGE_POR_UNIDAD_EXTRA = 10000; // Por cada lámpara adicional en el pedido

function getZona(cp: number) {
    return ZONAS.find(z => cp >= z.desde && cp <= z.hasta);
}

function getVolWeight(name: string): number {
    const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [product, vol] of Object.entries(PRODUCT_VOL_WEIGHTS)) {
        if (key.includes(product)) return vol;
    }
    return FALLBACK_VOL_WEIGHT;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { postalCode, items } = body;

        if (!postalCode) {
            return NextResponse.json({ error: 'Falta el código postal' }, { status: 400 });
        }

        const cp = parseInt(postalCode.replace(/\D/g, ''), 10);

        if (isNaN(cp) || postalCode.replace(/\D/g, '').length < 4) {
            return NextResponse.json({ error: 'Código postal inválido. Ingresá al menos 4 dígitos.' }, { status: 400 });
        }

        // Calcular el peso volumétrico máximo entre los productos del carrito
        // (el más pesado domina el precio del envío)
        let maxVolWeight = 0;
        let totalUnits = 0;

        if (items && items.length > 0) {
            for (const item of items) {
                const vol = getVolWeight(item.name);
                if (vol > maxVolWeight) maxVolWeight = vol;
                totalUnits += item.quantity;
            }
        } else {
            maxVolWeight = FALLBACK_VOL_WEIGHT;
            totalUnits = 1;
        }

        const isPesado = maxVolWeight > 3; // Umbral: Ará ≤ 3kg vol, Amaí/Nami > 3kg vol
        const surcharge = Math.max(0, totalUnits - 1) * SURCHARGE_POR_UNIDAD_EXTRA;

        const zona = getZona(cp);

        if (!zona) {
            // CP no identificado → precio máximo para no perder plata
            const basePrice = isPesado ? 70000 : 50000;
            await new Promise(resolve => setTimeout(resolve, 600));
            return NextResponse.json({
                success: true,
                cost: basePrice + surcharge,
                zona: 'Zona alejada o no identificada',
                estimatedDays: '8-14 días hábiles',
                note: 'Precio estimado. Para localidades pequeñas o zonas rurales el costo podría ajustarse.'
            });
        }

        const basePrice = isPesado ? zona.precioPesado : zona.precioLiviano;
        const finalCost = basePrice + surcharge;

        await new Promise(resolve => setTimeout(resolve, 600));

        return NextResponse.json({
            success: true,
            cost: finalCost,
            zona: zona.label,
            estimatedDays: zona.dias,
            debug: {
                maxVolWeight: `${maxVolWeight.toFixed(2)} kg volumétrico`,
                tier: isPesado ? 'Pesado (Amaí/Nami)' : 'Liviano (Ará)',
                totalUnits,
                surcharge
            }
        });

    } catch (error) {
        console.error('Error quoting shipping:', error);
        return NextResponse.json({ error: 'Error al calcular el costo de envío. Intenta de nuevo.' }, { status: 500 });
    }
}
