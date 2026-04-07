import { NextResponse } from 'next/server';

// ============================================================
// TABLA DE ENVÍOS POR ZONA Y PESO VOLUMÉTRICO — Waykú
// Cálculo exacto usando las dimensiones reales de las cajas
// ============================================================

const ZONAS: { label: string; desde: number; hasta: number; base_precio: number; dias: string }[] = [
    // CÓRDOBA Y OTRAS CERCANAS
    { label: 'Córdoba Capital y Gran Córdoba', desde: 5000, hasta: 5009, base_precio: 9000, dias: '1-2 días hábiles' },
    { label: 'Córdoba Provincia (Interior)', desde: 5100, hasta: 5999, base_precio: 12000, dias: '2-3 días hábiles' },

    // BUENOS AIRES
    { label: 'CABA', desde: 1000, hasta: 1499, base_precio: 22000, dias: '3-4 días hábiles' },
    { label: 'GBA (Gran Buenos Aires)', desde: 1500, hasta: 1999, base_precio: 24000, dias: '3-5 días hábiles' },
    { label: 'Buenos Aires (Interior)', desde: 6000, hasta: 8999, base_precio: 26000, dias: '4-6 días hábiles' },

    // CENTRO
    { label: 'Santa Fe Capital y Rosario', desde: 2000, hasta: 2009, base_precio: 20000, dias: '2-4 días hábiles' },
    { label: 'Santa Fe Provincia', desde: 2010, hasta: 2999, base_precio: 22000, dias: '3-5 días hábiles' },
    { label: 'Entre Ríos', desde: 3100, hasta: 3299, base_precio: 22000, dias: '3-5 días hábiles' },
    { label: 'San Luis / La Rioja / San Juan', desde: 5300, hasta: 5799, base_precio: 24000, dias: '3-6 días hábiles' },
    { label: 'Mendoza', desde: 5500, hasta: 5599, base_precio: 24000, dias: '4-6 días hábiles' },

    // NOA Y NEA
    { label: 'Santiago del Estero / Tucumán / Catamarca', desde: 4000, hasta: 4299, base_precio: 28000, dias: '4-6 días hábiles' },
    { label: 'Catamarca', desde: 4700, hasta: 4799, base_precio: 28000, dias: '4-6 días hábiles' },
    { label: 'Salta / Jujuy', desde: 4400, hasta: 4699, base_precio: 28000, dias: '5-7 días hábiles' },
    { label: 'Misiones / Corrientes / Chaco / Formosa', desde: 3300, hasta: 3699, base_precio: 30000, dias: '5-8 días hábiles' },

    // PATAGONIA
    { label: 'La Pampa', desde: 6300, hasta: 6399, base_precio: 26000, dias: '4-6 días hábiles' },
    { label: 'Neuquén / Río Negro', desde: 8300, hasta: 8499, base_precio: 32000, dias: '6-8 días hábiles' },
    { label: 'Chubut', desde: 9000, hasta: 9099, base_precio: 38000, dias: '6-9 días hábiles' },
    { label: 'Santa Cruz', desde: 9200, hasta: 9299, base_precio: 44000, dias: '7-10 días hábiles' },
    { label: 'Tierra del Fuego', desde: 9410, hasta: 9499, base_precio: 52000, dias: '8-12 días hábiles' },
];

// El precio base incluye hasta 3kg. Cada kg extra sale esto:
const COSTO_POR_KG_EXTRA = 3500;

function getZona(cp: number) {
    return ZONAS.find(z => cp >= z.desde && cp <= z.hasta);
}

// Calcula el peso a tarifar (el mayor entre peso real y peso volumétrico A x B x C / 4000)
function calcularPesoTarifable(items: any[]) {
    let pesoTotal = 0;
    
    items.forEach(item => {
        const nombre = item.name.toLowerCase();
        let pesoReal = 3;
        let volumenCm3 = 15000; // default

        if (nombre.includes('amaí') || nombre.includes('amai')) {
            pesoReal = 3;
            volumenCm3 = 25 * 40 * 25; // 25000
        } else if (nombre.includes('nami')) {
            pesoReal = 3;
            volumenCm3 = 25 * 30 * 30; // 22500
        } else if (nombre.includes('ará') || nombre.includes('ara')) {
            pesoReal = 2;
            volumenCm3 = 15 * 30 * 20; // 9000
        } else {
            pesoReal = 3;
            volumenCm3 = 20000;
        }

        // Peso volumétrico = Volumen(cm3) / 4000 (fórmula estándar couriers argentinos)
        const pesoVolumetrico = volumenCm3 / 4000;
        
        // Se cobra el mayor
        const pesoCobrado = Math.max(pesoReal, pesoVolumetrico);
        
        pesoTotal += pesoCobrado * item.quantity;
    });

    return Math.ceil(pesoTotal); // Redondeamos para arriba al kg entero más cercano
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { postalCode, items } = body;

        if (!postalCode) {
            return NextResponse.json({ error: 'Falta el código postal' }, { status: 400 });
        }

        const cp = parseInt(postalCode.replace(/\D/g, ''), 10);

        if (isNaN(cp) || postalCode.length < 4) {
            return NextResponse.json({ error: 'Código postal inválido. Ingresá al menos 4 dígitos.' }, { status: 400 });
        }

        const zona = getZona(cp);
        const pesoTotalKg = calcularPesoTarifable(items);
        const kgExtras = Math.max(0, pesoTotalKg - 3); // Base incluye 3kg
        
        const recargoPorPeso = kgExtras * COSTO_POR_KG_EXTRA;

        if (!zona) {
            // Fallback
            return NextResponse.json({
                success: true,
                cost: 45000 + recargoPorPeso,
                zona: 'Patagonia / Localidad Alejada',
                estimatedDays: '8-12 días hábiles',
                note: 'Precio estimado basado en volumen.'
            });
        }

        const finalCost = zona.base_precio + recargoPorPeso;

        // Pequeño delay
        await new Promise(resolve => setTimeout(resolve, 600));

        return NextResponse.json({
            success: true,
            cost: finalCost,
            zona: zona.label,
            estimatedDays: zona.dias,
        });

    } catch (error) {
        console.error('Error quoting shipping:', error);
        return NextResponse.json({ error: 'Error al calcular el costo de envío. Intenta de nuevo.' }, { status: 500 });
    }
}
