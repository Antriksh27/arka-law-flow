
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatest() {
    console.log("Reading latest error from cases table...");
    const { data, error } = await supabase
        .from('cases')
        .select('id, cnr_number, fetch_status, fetch_message, last_fetched_at')
        .eq('id', 'bd648976-44f3-4616-8974-bd3d87c5121b')
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`\nCNR: ${data.cnr_number}`);
        console.log(`FETCHED AT: ${data.last_fetched_at}`);
        console.log(`MESSAGE: ${data.fetch_message}`);
    }
}

checkLatest();
