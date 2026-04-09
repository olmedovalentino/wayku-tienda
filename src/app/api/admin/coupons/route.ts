import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidAdminSessionToken } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function ensureAdminSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    return isValidAdminSessionToken(session);
}

// GET /api/admin/coupons — list all
export async function GET() {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data, error } = await getSupabaseAdmin()
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST /api/admin/coupons — create
export async function POST(req: Request) {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await req.json();
        const { data, error } = await getSupabaseAdmin()
            .from('coupons')
            .insert([body])
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        const isDuplicate = e.code === '23505';
        return NextResponse.json(
            { error: isDuplicate ? 'duplicate' : e.message },
            { status: isDuplicate ? 409 : 500 }
        );
    }
}

// PATCH /api/admin/coupons — update one field (toggle status)
export async function PATCH(req: Request) {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id, ...updates } = await req.json();
        const { data, error } = await getSupabaseAdmin()
            .from('coupons')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE /api/admin/coupons?id=xxx
export async function DELETE(req: Request) {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const { error } = await getSupabaseAdmin().from('coupons').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
