require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: nami, error: err1 } = await supabase
        .from('products')
        .update({ description: 'Lámpara colgante con diseño curvo inspirado en la naturaleza. Sus líneas orgánicas aportan fluidez y calidez a cualquier ambiente, perfecta para ser la protagonista del comedor o salón.' })
        .ilike('name', 'nami%')
        .select();
        
    console.log('Nami updated:', nami, err1);

    const { data: ara, error: err2 } = await supabase
        .from('products')
        .update({ description: 'Lámpara de diseño compacto y elegante que resalta la belleza natural de la madera. Su iluminación suave y direccional crea espacios íntimos y acogedores ideales para mesas o rincones de lectura.' })
        .ilike('name', 'ara%')
        .select();

    console.log('Ara updated:', ara, err2);
}
run();
