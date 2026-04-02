import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        // Use service role key to bypass RLS, fallback to anon if missing
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const [orders, queries, subscribers] = await Promise.all([
            supabaseAdmin.from('orders').select('*'),
            supabaseAdmin.from('queries').select('*').order('id', { ascending: false }),
            supabaseAdmin.from('subscribers').select('*').order('created_at', { ascending: false })
        ]);

        return NextResponse.json({
            orders: orders.data || [],
            queries: queries.data || [],
            subscribers: subscribers.data?.map(s => s.email) || []
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { table, action, match, data } = body;
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        let query: any = supabaseAdmin.from(table);
        
        if (action === 'update') {
            query = query.update(data);
        } else if (action === 'delete') {
            query = query.delete();
        }

        if (match) {
            Object.entries(match).forEach(([k, v]) => {
                query = query.eq(k, v);
            });
        }

        const { data: result, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data: result });
    } catch (e) {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
