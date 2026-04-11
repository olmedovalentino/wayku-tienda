import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const rate = await enforceRateLimit(`newsletter:${ip}`, 5, 60_000);
        if (!rate.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Retry in ${rate.retryAfterSeconds}s.` },
                { status: 429 }
            );
        }

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Faltan credenciales EMAIL_USER y EMAIL_PASS para enviar el newsletter a', email);
            return NextResponse.json({ success: true, notice: 'Not sending email; no generic SMTP settings found in env' }, { status: 200 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAFAF9; padding: 40px; border-radius: 12px; border: 1px solid #E5E5E5;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #5E6F5E; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Wayku</h1>
            </div>
            
            <h2 style="color: #1c1917; font-size: 20px; font-weight: normal; margin-bottom: 20px;">Bienvenido/a a nuestro newsletter</h2>
            
            <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                Muchas gracias por suscribirte. A partir de ahora formas parte de la comunidad Wayku.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                Seras de las primeras personas en enterarte sobre nuestros proximos lanzamientos de lamparas hechas a mano, descuentos exclusivos para suscriptores y novedades sobre iluminacion en maderas naturales.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                Preparate, cosas buenas iluminaran tus espacios.
            </p>
            
            <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wayku.ar'}/productos" style="background-color: #5E6F5E; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Visitar el catalogo</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #E5E5E5; margin-top: 40px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #a8a29e; text-align: center; line-height: 1.5;">
                Disenio artesanal sostenible.<br>Fabricado a mano en Cordoba, Argentina.
            </p>
        </div>
        `;

        await transporter.sendMail({
            from: `"Wayku Iluminacion" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Gracias por suscribirte a Wayku',
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true, message: 'Newsletter email sent successfully' });
    } catch (error: unknown) {
        console.error('Error enviando el email del newsletter:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
