/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: nami, error: err1 } = await supabase
        .from('products')
        .update({ description: 'L�mpara colgante con dise�o curvo inspirado en la naturaleza. Sus l�neas org�nicas aportan fluidez y calidez a cualquier ambiente, perfecta para ser la protagonista del comedor o sal�n.' })
        .ilike('name', 'nami%')
        .select();
        
    console.log('Nami updated:', nami, err1);

    const { data: ara, error: err2 } = await supabase
        .from('products')
        .update({ description: 'L�mpara de dise�o compacto y elegante que resalta la belleza natural de la madera. Su iluminaci�n suave y direccional crea espacios �ntimos y acogedores ideales para mesas o rincones de lectura.' })
        .ilike('name', 'ara%')
        .select();

    console.log('Ara updated:', ara, err2);
}
run();
