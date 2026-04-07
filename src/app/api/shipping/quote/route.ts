import { NextResponse } from 'next/server';

// ============================================================
// TABLA DE ENVÍOS POR ZONA — Waykú
// Basada en Andreani desde Córdoba capital (CP 5000)
// Valores conservadores para no perder plata — mejor de más que de menos
// Última actualización: Abril 2025
// ============================================================

// Rangos de CP a zona — cuántos dígitos iniciales identifican la zona
const ZONAS: { label: string; desde: number; hasta: number; precio: number; dias: string }[] = [
    // CÓRDOBA CAPITAL Y GRAN CÓRDOBA
    { label: 'Córdoba Capital y Gran Córdoba', desde: 5000, hasta: 5009, precio: 10000, dias: '1-2 días hábiles' },
    { label: 'Córdoba Provincia (Interior)', desde: 5100, hasta: 5999, precio: 17000, dias: '2-3 días hábiles' },

    // BUENOS AIRES — dividida en zonas
    { label: 'CABA', desde: 1000, hasta: 1499, precio: 22000, dias: '3-5 días hábiles' },
    { label: 'GBA (Gran Buenos Aires)', desde: 1500, hasta: 1999, precio: 24000, dias: '3-5 días hábiles' },
    { label: 'Buenos Aires (Interior)', desde: 6000, hasta: 8999, precio: 28000, dias: '4-6 días hábiles' },

    // CENTRO DEL PAÍS
    { label: 'Santa Fe Capital y Rosario', desde: 2000, hasta: 2009, precio: 19000, dias: '2-4 días hábiles' },
    { label: 'Santa Fe Provincia', desde: 2010, hasta: 2999, precio: 22000, dias: '3-5 días hábiles' },
    { label: 'Entre Ríos', desde: 3100, hasta: 3299, precio: 23000, dias: '3-5 días hábiles' },
    { label: 'Mendoza', desde: 5500, hasta: 5599, precio: 26000, dias: '4-6 días hábiles' },
    { label: 'San Luis', desde: 5700, hasta: 5799, precio: 24000, dias: '3-5 días hábiles' },
    { label: 'La Rioja', desde: 5300, hasta: 5399, precio: 25000, dias: '4-6 días hábiles' },
    { label: 'San Juan', desde: 5400, hasta: 5499, precio: 26000, dias: '4-6 días hábiles' },

    // NORTE DEL PAÍS
    { label: 'Tucumán', desde: 4000, hasta: 4099, precio: 28000, dias: '4-6 días hábiles' },
    { label: 'Salta', desde: 4400, hasta: 4499, precio: 30000, dias: '5-7 días hábiles' },
    { label: 'Jujuy', desde: 4600, hasta: 4699, precio: 31000, dias: '5-7 días hábiles' },
    { label: 'Catamarca', desde: 4700, hasta: 4799, precio: 28000, dias: '4-6 días hábiles' },
    { label: 'Misiones', desde: 3300, hasta: 3399, precio: 33000, dias: '5-8 días hábiles' },
    { label: 'Corrientes', desde: 3400, hasta: 3499, precio: 31000, dias: '5-7 días hábiles' },
    { label: 'Chaco', desde: 3500, hasta: 3599, precio: 32000, dias: '5-7 días hábiles' },
    { label: 'Formosa', desde: 3600, hasta: 3699, precio: 34000, dias: '6-8 días hábiles' },
    { label: 'Santiago del Estero', desde: 4200, hasta: 4299, precio: 27000, dias: '4-6 días hábiles' },

    // LITORAL
    { label: 'La Pampa', desde: 6300, hasta: 6399, precio: 27000, dias: '4-6 días hábiles' },
    { label: 'Neuquén', desde: 8300, hasta: 8399, precio: 35000, dias: '6-8 días hábiles' },
    { label: 'Río Negro', desde: 8400, hasta: 8499, precio: 35000, dias: '6-8 días hábiles' },
    { label: 'Chubut', desde: 9000, hasta: 9099, precio: 40000, dias: '6-9 días hábiles' },
    { label: 'Santa Cruz', desde: 9200, hasta: 9299, precio: 48000, dias: '7-10 días hábiles' },
    { label: 'Tierra del Fuego', desde: 9410, hasta: 9499, precio: 58000, dias: '8-12 días hábiles' },
];

// Precio por bulto adicional (si el pedido tiene más de 1 unidad, el volumen se duplica)
// Lámparas son grandes y frágiles → surcharge por unidad adicional
const SURCHARGE_POR_UNIDAD_EXTRA = 8000;

function getZona(cp: number) {
    return ZONAS.find(z => cp >= z.desde && cp <= z.hasta);
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

        if (!zona) {
            // Si no encontramos la zona, devolvemos el precio máximo como fallback seguro
            const totalItems = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
            const surcharge = Math.max(0, totalItems - 1) * SURCHARGE_POR_UNIDAD_EXTRA;
            return NextResponse.json({
                success: true,
                cost: 45000 + surcharge,
                zona: 'Patagonia / Zona no identificada',
                estimatedDays: '8-12 días hábiles',
                note: 'Precio estimado. Para zonas alejadas o localidades pequeñas el costo podría ajustarse.'
            });
        }

        // Calcular total de unidades para aplicar surcharge
        const totalItems = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        const surcharge = Math.max(0, totalItems - 1) * SURCHARGE_POR_UNIDAD_EXTRA;

        const finalCost = zona.precio + surcharge;

        // Pequeño delay para que parezca que "está calculando" — mejor UX
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
