import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isValidAdminSessionToken } from '@/lib/admin-session';

function getAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

async function ensureAdminSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    return isValidAdminSessionToken(session);
}

// GET /api/admin/users — list users for admin panel
export async function GET() {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await getAdmin()
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to fetch users';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/admin/users?id=xxx — deletes from auth.users AND public.users
export async function DELETE(req: Request) {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const admin = getAdmin();

        // 1. Delete from Supabase Auth (this is what prevents re-registration)
        const { error: authError } = await admin.auth.admin.deleteUser(id);
        if (authError) {
            console.error('Auth delete error:', authError);
            // Don't fail hard — still try to clean up the profile table
        }

        // 2. Delete from public users table (in case cascade didn't handle it)
        const { error: dbError } = await admin.from('users').delete().eq('id', id);
        if (dbError) console.error('DB delete error:', dbError);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
