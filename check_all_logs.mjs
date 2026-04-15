
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllLogs() {
    console.log("Checking all search logs...");
    try {
        const { data, error } = await supabase
            .from('legalkart_case_searches')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error("Error reading count:", error);
            return;
        }

        console.log(`Total logs in table: ${data[0]?.count || 0}`);

        if (data[0]?.count > 0) {
            const { data: logs } = await supabase
                .from('legalkart_case_searches')
                .select('id, created_at, status')
                .limit(5);
            console.log("Sample logs:", JSON.stringify(logs, null, 2));
        }
    } catch (error) {
        console.error("Script error:", error);
    }
}

checkAllLogs();
