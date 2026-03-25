import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Configuración de Servidor de Correo de Gmail (Reemplaza con configuraciones de entorno)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Faltan credenciales de EMAIL_USER y EMAIL_PASS en las variables de entorno para enviar el newsletter a', email);
            return NextResponse.json({ success: true, notice: 'Not sending email; no generic SMTP settings found in env' }, { status: 200 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Este será el diseño del email que le va a llegar al usuario
        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAFAF9; padding: 40px; border-radius: 12px; border: 1px solid #E5E5E5;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #5E6F5E; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Waykú</h1>
            </div>
            
            <h2 style="color: #1c1917; font-size: 20px; font-weight: normal; margin-bottom: 20px;">¡Bienvenido/a a nuestro Newsletter!</h2>
            
            <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                Muchas gracias por suscribirte. A partir de ahora formas parte de la comunidad Waykú.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                Serás de las primeras personas en enterarte sobre nuestros próximos lanzamientos de lámparas hechas a mano, descuentos exclusivos para suscriptores y novedades sobre iluminación en maderas naturales.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                Prepárate, cosas buenas iluminarán tus espacios ✨
            </p>
            
            <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <a href="${process.env.NEXT_PUBLIC_URL || 'https://wayku.store'}/products" style="background-color: #5E6F5E; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Visitar el Catálogo</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #E5E5E5; margin-top: 40px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #a8a29e; text-align: center; line-height: 1.5;">
                Diseño artesanal sostenible.<br>Fabricado a mano en Córdoba, Argentina.
            </p>
        </div>
        `;

        await transporter.sendMail({
            from: `"Waykú Iluminación" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '¡Gracias por suscribirte a Waykú! 💡',
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true, message: 'Newsletter email sent successfully' });
    } catch (error: any) {
        console.error('Error enviando el email del newsletter:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
