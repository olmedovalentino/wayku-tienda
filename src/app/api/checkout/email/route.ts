import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const rate = enforceRateLimit(`checkout-email:${ip}`, 8, 60_000);
        if (!rate.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Retry in ${rate.retryAfterSeconds}s.` },
                { status: 429 }
            );
        }

        const order = await req.json();
        if (!order?.email || !order?.id || !Array.isArray(order?.details)) {
            return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Mail config missing in env');
            return NextResponse.json({ error: 'Mail config missing' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const itemsHtml = order.details.map((item: any) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>${item.name}</strong><br/>
                    <span style="font-size: 12px; color: #666;">
                        ${item.material ? `Madera: ${item.material} ` : ''}
                        ${item.size ? `Medida: ${item.size} ` : ''}
                    </span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString()}</td>
            </tr>
        `).join('');

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAFAF9; padding: 40px; border-radius: 12px; border: 1px solid #E5E5E5;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #5E6F5E; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Waykú</h1>
                <p style="color: #78716c; font-size: 14px; margin-top: 10px;">¡Gracias por tu compra!</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="font-size: 18px; color: #292524; margin-top: 0;">Resumen de tu pedido (${order.id})</h2>
                <p style="font-size: 14px; color: #57534e;">Hola ${order.customer}, hemos recibido tu pedido y ${order.paymentMethod === 'transfer' ? 'estamos esperando tu comprobante de transferencia' : 'se está procesando'}.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f5f5f4;">
                            <th style="padding: 10px; text-align: left;">Producto</th>
                            <th style="padding: 10px; text-align: center;">Cant.</th>
                            <th style="padding: 10px; text-align: right;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                        ${order.shippingCost && order.shippingMethod === 'shipping' ? `
                        <tr>
                            <td colspan="2" style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>Envío a domicilio:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${order.shippingCost.toLocaleString()}</td>
                        </tr>
                        ` : ''}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total a pagar:</td>
                            <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 16px; color: #5E6F5E;">$${order.total.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div style="font-size: 14px; color: #57534e; text-align: center;">
                ${order.paymentMethod === 'transfer' ? `
                    <p style="margin-bottom: 24px;">Por favor, enviá el comprobante de transferencia haciendo clic a continuación para que procesemos tu pago.</p>
                    <a href="https://wa.me/5493513844333?text=Hola,%20adjunto%20comprobante%20del%20pedido%20${order.id}" style="display: inline-block; background-color: #5E6F5E; color: white; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; margin-right: 12px; border: 1px solid #5E6F5E;">Enviar Comprobante</a>
                ` : ''}
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wayku.ar'}" style="display: inline-block; background-color: transparent; color: #57534E; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #D6D3D1; ${order.paymentMethod === 'transfer' ? 'margin-bottom: 12px;' : 'margin-top: 15px;'}">Volver a la tienda</a>
            </div>
        </div>
        `;

        await transporter.sendMail({
            from: `"Waykú" <${process.env.EMAIL_USER}>`,
            to: order.email,
            subject: `Confirmación de pedido - ${order.id}`,
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending order email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
