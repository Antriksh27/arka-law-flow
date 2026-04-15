
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Looking for successful GHC searches...");

    // Sometimes GHC is logged as high_court due to the remapping logic being inside performCaseSearch (or not)
    const { data: searches, error } = await supabase
        .from('legalkart_case_searches')
        .select('*')
        .eq('status', 'success')
        .or('search_type.eq.gujarat_high_court,search_type.eq.high_court')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error:", error);
    } else {
        const ghcSearches = searches.filter(s => s.cnr_number?.startsWith('GJHC'));
        console.log(`Found ${ghcSearches.length} successful GHC searches:`);
        ghcSearches.forEach(s => {
            console.log(`\nID: ${s.id}`);
            console.log(`Created: ${s.created_at}`);
            console.log(`Payload:`, JSON.stringify(s.request_data, null, 2));
        });
    }
}

check();
