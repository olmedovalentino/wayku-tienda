/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: ara, error: err2 } = await supabase
        .from('products')
        .update({ description: 'L�mpara de dise�o compacto y elegante que resalta la belleza natural de la madera. Su iluminaci�n suave y direccional crea espacios �ntimos y acogedores, ideal para sumar calidez a cualquier rinc�n.' })
        .ilike('name', 'ar%')
        .select();

    console.log('Ara updated:', ara, err2);
}
run();
