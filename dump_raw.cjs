const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpApiData() {
    const targetCnr = 'GJHC240042732023';
    
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('fetched_data')
            .eq('cnr_number', targetCnr)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const apiRes = data[0].fetched_data;
            fs.writeFileSync('ecourts_GJHC240042732023.json', JSON.stringify(apiRes, null, 2));
            console.log("Dumped to ecourts_GJHC240042732023.json");
        } else {
            console.log("No data found to dump.");
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

dumpApiData();
