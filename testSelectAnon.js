const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_ANON_KEY = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log("Fetching all queries with ANON KEY...");
    const { data, error } = await supabase.from('queries').select('*');
    console.log("Error:", error);
    console.log("Found:", data ? data.length : 0, "queries");
}
test();
