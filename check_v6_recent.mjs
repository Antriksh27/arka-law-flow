
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

    console.log(`Checking for updates since ${tenMinsAgo}...`);

    const { data: cases, error } = await supabase
        .from('cases')
        .select('*')
        .gt('last_fetched_at', tenMinsAgo)
        .order('last_fetched_at', { ascending: false });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${cases.length} updated cases:`, JSON.stringify(cases, null, 2));
    }

    const { data: searches, error: sErr } = await supabase
        .from('legalkart_case_searches')
        .select('*')
        .gt('created_at', tenMinsAgo);

    if (sErr) {
        console.error("Search Error:", sErr);
    } else {
        console.log(`Found ${searches.length} recent searches:`, JSON.stringify(searches, null, 2));
    }
}

check();
