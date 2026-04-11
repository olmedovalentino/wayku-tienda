import { NextResponse } from 'next/server';
import { quoteShipping } from '@/lib/shipping';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const quote = quoteShipping({
            postalCode: body?.postalCode,
            items: body?.items,
            subtotal: Number(body?.subtotal || 0),
        });

        await new Promise((resolve) => setTimeout(resolve, 600));

        return NextResponse.json({
            success: true,
            ...quote,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error al calcular el costo de envio. Intenta de nuevo.';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
