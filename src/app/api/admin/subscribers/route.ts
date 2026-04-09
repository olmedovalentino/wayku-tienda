import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidAdminSessionToken } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function ensureAdminSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    return isValidAdminSessionToken(session);
}

export async function GET() {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await getSupabaseAdmin()
            .from('subscribers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to fetch subscribers';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

        const { error } = await getSupabaseAdmin()
            .from('subscribers')
            .delete()
            .eq('email', email);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to delete subscriber';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
