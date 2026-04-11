import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { cookies } from 'next/headers';
import { isValidAdminSessionToken } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (!session || !isValidAdminSessionToken(session.value)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subject, message, targetEmails } = await req.json();

        if (!subject || !message) {
            return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return NextResponse.json({ error: 'Mail config missing in env' }, { status: 500 });
        }

        let emails: string[] = [];

        if (targetEmails === 'all') {
            const supabase = getSupabaseAdmin();
            const { data: subscribers, error } = await supabase.from('subscribers').select('email');
            if (error || !subscribers || subscribers.length === 0) {
                return NextResponse.json({ error: 'No subscribers found' }, { status: 400 });
            }
            emails = subscribers.map((subscriber) => subscriber.email);
        } else if (Array.isArray(targetEmails) && targetEmails.length > 0) {
            emails = targetEmails;
        } else {
            return NextResponse.json({ error: 'No target emails specified' }, { status: 400 });
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
            
            <div style="font-size: 15px; line-height: 1.6; color: #57534e; white-space: pre-wrap;">${message}</div>
            
            <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL || 'https://www.wayku.ar'}" style="background-color: #5E6F5E; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Visitar la tienda</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #E5E5E5; margin-top: 40px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #a8a29e; text-align: center; line-height: 1.5;">
                Disenio artesanal sostenible.<br>Fabricado a mano en Cordoba, Argentina.
            </p>
        </div>
        `;

        await transporter.sendMail({
            from: `"Wayku Iluminacion" <${process.env.EMAIL_USER}>`,
            bcc: emails.join(', '),
            subject,
            html: htmlTemplate,
        });

        return NextResponse.json({ success: true, sentCount: emails.length });
    } catch (error: unknown) {
        console.error('Error enviando campania:', error);
        return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 });
    }
}
