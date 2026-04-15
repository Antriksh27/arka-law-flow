
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCases() {
    console.log("Checking recent GHC cases status...");
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('id, case_number, cnr_number, fetch_status, fetch_message, last_fetched_at')
            .ilike('cnr_number', 'GJHC%')
            .order('last_fetched_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error reading cases:", error);
            return;
        }

        if (!data || data.length === 0) {
            console.log("No GHC cases found.");
            return;
        }

        data.forEach(c => {
            console.log(`\nID: ${c.id}`);
            console.log(`CNR: ${c.cnr_number}`);
            console.log(`Status: ${c.fetch_status}`);
            console.log(`Message: ${c.fetch_message}`);
            console.log(`Last Fetched: ${c.last_fetched_at}`);
        });
    } catch (error) {
        console.error("Script error:", error);
    }
}

checkCases();
