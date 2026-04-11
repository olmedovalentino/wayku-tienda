/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
    const { error } = await supabase.from('queries').insert({ name: 'Test', email: 'test@t.com', subject: 'Test', message: 'Test', date: '02/04/2026', read: false });
    console.log(error);
}
test();