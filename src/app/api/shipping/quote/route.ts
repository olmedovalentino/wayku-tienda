import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { postalCode, items } = body;

        if (!postalCode) {
            return NextResponse.json({ error: 'Falta el código postal' }, { status: 400 });
        }

        // --- ANDREANI CREDENTIALS (for future use) ---
        const ANDREANI_USER = process.env.ANDREANI_USER;
        const ANDREANI_PASS = process.env.ANDREANI_PASS;
        const ANDREANI_CLIENTE = process.env.ANDREANI_CLIENTE;
        const ANDREANI_CONTRATO = process.env.ANDREANI_CONTRATO;

        let totalVolume = 0;
        let totalWeight = 0;

        // Calculate total volume and weight
        items.forEach((item: any) => {
            const name = item.name.toLowerCase();
            let vol = 0; 
            let weight = 0;
            
            if (name.includes('amai')) {
                vol = 25000; // 25x40x25
                weight = 3;
            } else if (name.includes('nami')) {
                vol = 22500; // 25x30x30
                weight = 3;
            } else if (name.includes('ará')) {
                vol = 9000;  // 15x30x20
                weight = 2;
            } else {
                // Default fallback
                vol = 15000;
                weight = 2;
            }

            totalVolume += vol * item.quantity;
            totalWeight += weight * item.quantity;
        });

        // SIMULATION MODE
        // If keys are not present, fallback to a smart mockup cost based on weight/postal code roughly
        if (!ANDREANI_USER || !ANDREANI_CLIENTE) {
            // Simulated cost calculation based on weight and distance via postal code string hash just to make it vary
            const base = 4000;
            const weightPenalty = totalWeight * 500;
            const distancePenalty = parseInt(postalCode.substring(0, 2) || '0') * 50; 
            
            const simulationCost = base + weightPenalty + distancePenalty;
            
            // Artificial delay to simulate network request
            await new Promise(resolve => setTimeout(resolve, 800));

            return NextResponse.json({
                success: true,
                cost: simulationCost,
                provider: 'andreani',
                estimatedDays: 3,
                simulated: true // FLAG indicating this is a fake cost
            });
        }

        // REAL ANDREANI OAUTH & REQUEST LOGIC HERE
        // 1. Fetch token: https://api.andreani.com/login (Basic Auth)
        // 2. GET https://api.andreani.com/v1/tarifas?bultos[0][kilos]=...&bultos[0][volumen]=...
        // ... (this will be filled when credentials are ready) ...

        return NextResponse.json({ error: 'Integración real en construcción' }, { status: 501 });
        
    } catch (error) {
        console.error('Error quoting shipping:', error);
        return NextResponse.json({ error: 'Error interno del servidor al calcular el envío' }, { status: 500 });
    }
}
