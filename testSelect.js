const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_SERVICE_ROLE_KEY = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log("Fetching all queries...");
    const { data, error } = await supabase.from('queries').select('*');
    console.log("Error:", error);
    console.log("Found:", data ? data.length : 0, "queries");
    if (data && data.length > 0) {
        console.log("Last 2 queries:", data.slice(-2));
        console.log("Type of ID:", typeof data[data.length-1].id);
    }
}
test();
