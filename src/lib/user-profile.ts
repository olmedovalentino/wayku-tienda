import { supabase } from './supabase';

type AuthLikeUser = {
    id: string;
    email?: string | null;
    user_metadata?: {
        name?: string;
    };
};

type EnsureProfileOptions = {
    name?: string;
    cart?: unknown[];
    favorites?: unknown[];
};

export async function ensureUserProfile(
    authUser: AuthLikeUser,
    options: EnsureProfileOptions = {}
) {
    if (!supabase) return null;

    const payload: Record<string, unknown> = {
        id: authUser.id,
        email: authUser.email?.trim().toLowerCase() || null,
    };

    const displayName = options.name ?? authUser.user_metadata?.name;
    if (displayName) {
        payload.full_name = displayName;
    }

    if (options.cart !== undefined) {
        payload.cart = options.cart;
    }

    if (options.favorites !== undefined) {
        payload.favorites = options.favorites;
    }

    const { data, error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();

    if (error) {
        throw error;
    }

    return data;
}
