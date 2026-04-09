import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { cookies } from 'next/headers';
import { isValidAdminSessionToken } from '@/lib/admin-session';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session')?.value;
        if (!isValidAdminSessionToken(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ip = getClientIp(req);
        const rate = await enforceRateLimit(`reply:${ip}`, 30, 60_000);
        if (!rate.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Retry in ${rate.retryAfterSeconds}s.` },
                { status: 429 }
            );
        }

        const { email, subject, message, name, originalMessage } = await req.json();

        if (!email || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return NextResponse.json({ error: 'Mail config missing in env' }, { status: 500 });
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
                <h1 style="color: #5E6F5E; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Waykú</h1>
            </div>
            
            <p style="font-size: 15px; color: #57534e;">Hola ${name || 'Cliente'},</p>
            
            <div style="font-size: 15px; line-height: 1.6; color: #57534e; white-space: pre-wrap;">${message}</div>
            
            <hr style="border: none; border-top: 1px dashed #E5E5E5; margin-top: 40px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #a8a29e; margin-bottom: 5px;"><strong>Tu consulta:</strong></p>
            <blockquote style="margin: 0; padding-left: 10px; border-left: 3px solid #E5E5E5; font-size: 13px; color: #78716c; font-style: italic;">
                "${originalMessage || ''}"
            </blockquote>
            
            <hr style="border: none; border-top: 1px solid #E5E5E5; margin-top: 40px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #a8a29e; text-align: center; line-height: 1.5;">
                Waykú | Diseño artesanal sostenible.<br>Fabricado a mano en Córdoba, Argentina.
            </p>
        </div>
        `;

        await transporter.sendMail({
            from: `"Waykú Iluminación" <${process.env.EMAIL_USER}>`,
            to: email, 
            subject: `Re: ${subject} - Waykú`,
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error enviando la respuesta:', error);
        return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
    }
}
