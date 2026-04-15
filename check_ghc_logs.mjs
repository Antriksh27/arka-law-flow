
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    console.log("Checking all recent search logs...");
    try {
        const { data, error } = await supabase
            .from('legalkart_case_searches')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error reading logs:", error);
            return;
        }

        if (!data || data.length === 0) {
            console.log("No recent GHC search logs found.");
            return;
        }

        data.forEach(log => {
            console.log(`\nID: ${log.id}`);
            console.log(`Time: ${log.created_at}`);
            console.log(`CNR: ${log.cnr_number}`);
            console.log(`Type: ${log.search_type}`);
            console.log(`Request CaseMode: ${log.request_data?.caseMode}`);
            console.log(`Status: ${log.status}`);
            console.log(`Error: ${log.error_message}`);
        });
    } catch (error) {
        console.error("Script error:", error);
    }
}

checkLogs();
