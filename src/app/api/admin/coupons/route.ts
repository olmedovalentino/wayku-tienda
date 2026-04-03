import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
}

// GET /api/admin/coupons — list all
export async function GET() {
    try {
        const { data, error } = await getAdmin()
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
        const body = await req.json();
        const { data, error } = await getAdmin()
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
        const { id, ...updates } = await req.json();
        const { data, error } = await getAdmin()
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
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const { error } = await getAdmin().from('coupons').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
