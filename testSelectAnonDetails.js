const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_ANON_KEY = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const { data } = await supabase.from('queries').select('*');
    if (data && data.length > 0) {
        console.log("Last 3 queries:");
        console.log(JSON.stringify(data.slice(-3), null, 2));
    }
}
test();
