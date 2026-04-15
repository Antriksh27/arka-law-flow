
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking for ANY logs in legalkart_case_searches...");
    const { data, error, count } = await supabase
        .from('legalkart_case_searches')
        .select('*', { count: 'exact' });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Total rows in legalkart_case_searches: ${count}`);
    }

    // Try a test insert with minimal fields to see if it even works
    console.log("Attempting test insert...");
    const { error: insErr } = await supabase
        .from('legalkart_case_searches')
        .insert({
            firm_id: 'bd648976-44f3-4616-8974-bd3d87c5121b', // Valid firm ID from previous check
            cnr_number: 'TEST_AGENT',
            search_type: 'test',
            status: 'failed',
            error_message: 'Test from agent'
        });

    if (insErr) {
        console.error("Test insert FAILED:", insErr);
    } else {
        console.log("Test insert SUCCEEDED.");
    }
}

check();
