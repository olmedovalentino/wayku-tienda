import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidAdminSessionToken } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sortAdminOrders } from '@/lib/admin-orders';

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
        const supabaseAdmin = getSupabaseAdmin();

        const [orders, queries, subscribers] = await Promise.all([
            supabaseAdmin.from('orders').select('*'),
            supabaseAdmin.from('queries').select('*').order('id', { ascending: false }),
            supabaseAdmin.from('subscribers').select('*').order('created_at', { ascending: false })
        ]);

        if (orders.error) {
            throw orders.error;
        }
        if (queries.error) {
            throw queries.error;
        }
        if (subscribers.error) {
            throw subscribers.error;
        }

        return NextResponse.json({
            orders: sortAdminOrders(orders.data || []),
            queries: queries.data || [],
            subscribers: subscribers.data?.map(s => s.email) || []
        });
    } catch (error) {
        console.error('Failed to fetch admin data:', error);
        return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        if (!(await ensureAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await req.json();
        const { table, action, match, data } = body;
        const allowedTables = new Set(['orders', 'queries']);
        const allowedActions = new Set(['update', 'delete']);
        if (!allowedTables.has(table) || !allowedActions.has(action)) {
            return NextResponse.json({ error: 'Invalid admin operation' }, { status: 400 });
        }
        
        const supabaseAdmin = getSupabaseAdmin();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    } catch {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
