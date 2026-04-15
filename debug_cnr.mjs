import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLatest() {
    console.log(`Looking up most recent search attempt...`);
    try {
        const { data, error } = await supabase
            .from('legalkart_case_searches')
            .select('cnr_number, response_data, status, error_message, created_at')
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) {
            console.error("Error fetching from DB:", error);
            return;
        }

        if (data && data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                console.log(`\n--- SEARCH RESULT ${i + 1} ---`);
                console.log(`CNR: ${data[i].cnr_number}`);
                console.log(`Status: ${data[i].status}`);
                console.log(`Created At: ${data[i].created_at}`);
                console.log(`Error (if any): ${data[i].error_message}`);
                console.log(`Response length: ${JSON.stringify(data[i].response_data)?.length || 0} chars`);
                if (data[i].status === 'success' || data[i].response_data) {
                    console.log("\nRaw Response Data:");
                    console.log(JSON.stringify(data[i].response_data, null, 2).substring(0, 500) + '... (truncated)');
                }
            }
        } else {
            console.log("No search logs found in the database at all.");
        }
    } catch (error) {
        console.error("Script exception:", error);
    }
}

inspectLatest();
