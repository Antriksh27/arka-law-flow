
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    console.log("Checking latest search logs for raw_request_body...");
    try {
        const { data, error } = await supabase
            .from('legalkart_case_searches')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Error reading logs:", error);
            return;
        }

        if (!data || data.length === 0) {
            console.log("No logs found.");
            return;
        }

        data.forEach(log => {
            console.log(`\nID: ${log.id}`);
            console.log(`Created: ${log.created_at}`);
            console.log(`Status: ${log.status}`);
            console.log(`Error: ${log.error_message}`);
            // Check if raw_request_body exists in request_data
            const reqData = log.request_data || {};
            if (reqData.raw_request_body) {
                console.log(`✅ FOUND raw_request_body:`);
                console.log(reqData.raw_request_body);
            } else {
                console.log(`❌ No raw_request_body in this log entry.`);
            }
        });
    } catch (error) {
        console.error("Script error:", error);
    }
}

checkLogs();
