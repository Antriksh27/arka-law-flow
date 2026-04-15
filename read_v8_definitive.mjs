
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDefinitiveLogs() {
    console.log("Reading definitive error logs from cases table...");
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('id, cnr_number, fetch_status, fetch_message, last_fetched_at')
            .eq('fetch_status', 'failed')
            .order('last_fetched_at', { ascending: false })
            .limit(3);

        if (error) {
            console.error("Error reading cases:", error);
            return;
        }

        if (!data || data.length === 0) {
            console.log("No failed cases found recently.");
            return;
        }

        data.forEach(c => {
            console.log(`\n==================================================`);
            console.log(`CASE ID: ${c.id}`);
            console.log(`CNR: ${c.cnr_number}`);
            console.log(`FETCHED AT: ${c.last_fetched_at}`);
            console.log(`ERROR MESSAGE:`);
            console.log(c.fetch_message);
            console.log(`==================================================`);
        });
    } catch (error) {
        console.error("Script error:", error);
    }
}

checkDefinitiveLogs();
