const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_ANON_KEY = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const newQ = { name: 'Test', email: 'test@t.com', subject: 'Test', message: 'Test', date: '02/04/2026', read: false };
    console.log("Inserting:", newQ);
    const { error } = await supabase.from('queries').insert(newQ);
    console.log("Error:", error);
}
test();