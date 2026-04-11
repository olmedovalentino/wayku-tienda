/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Update Nami
    const { data: nami, error: err1 } = await supabase
        .from('products')
        .update({ description: 'Lámpara de mesa con diseño curvo inspirado en la naturaleza. Sus líneas orgánicas aportan fluidez y calidez a cualquier ambiente, perfecta para ser la protagonista de escritorios o mesas de luz.' })
        .ilike('name', 'nami%')
        .select();
        
    console.log('Nami updated:', nami?.length ? 'Success' : 'Failed', err1);

    // Update Ara
    const { data: ara, error: err2 } = await supabase
        .from('products')
        .update({ description: 'Lámpara colgante de diseño compacto y elegante que resalta la belleza natural de la madera. Su iluminación suave y direccional crea espacios íntimos y acogedores, ideal para sumar calidez a cualquier rincón.' })
        .ilike('name', 'ar%')
        .select();

    console.log('Ara updated:', ara?.length ? 'Success' : 'Failed', err2);
}
run();
