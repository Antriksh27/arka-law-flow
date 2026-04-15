
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking all potential log tables...");

    // Check searches
    const { data: sData, error: sErr, count: sCount } = await supabase
        .from('legalkart_case_searches')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(3);

    if (sErr) console.error("Error querying searches:", sErr);
    else console.log(`Searches total count: ${sCount}, Sample:`, JSON.stringify(sData, null, 2));

    // Check cases for recent updates
    const { data: cData, error: cErr } = await supabase
        .from('cases')
        .select('id, cnr_number, fetch_status, fetch_message, last_fetched_at')
        .not('last_fetched_at', 'is', null)
        .order('last_fetched_at', { ascending: false })
        .limit(3);

    if (cErr) console.error("Error querying cases:", cErr);
    else console.log(`Recently updated cases:`, JSON.stringify(cData, null, 2));

    // Check if there are any errors in a hypothetical error_logs table if it exists
    const { data: eData, error: eErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(3);

    if (!eErr) console.log("Recent audit logs:", JSON.stringify(eData, null, 2));
}

check();
