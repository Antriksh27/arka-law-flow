const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCnr() {
    const targetCnr = 'GJHC240042732023';
    console.log(`Querying cases table for CNR: ${targetCnr}`);
    
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .eq('cnr_number', targetCnr)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error("DB Error:", error);
            return;
        }

        if (data && data.length > 0) {
            console.log("\n--- FOUND CASE ---");
            const c = data[0];
            console.log("ID:", c.id);
            console.log("Title:", c.case_title);
            console.log("Status:", c.status);
            console.log("Court:", c.court_name);
            console.log("Filing Date:", c.filing_date);
            console.log("Petitioner:", c.petitioner);
            console.log("Respondent:", c.respondent);

            // Fetch related tables
            console.log("\n--- PETITIONERS ---");
            const { data: pets } = await supabase.from('petitioners').select('*').eq('case_id', c.id);
            console.log(JSON.stringify(pets, null, 2));

            console.log("\n--- HEARINGS ---");
            const { data: hearings } = await supabase.from('case_hearings').select('*').eq('case_id', c.id);
            console.log(JSON.stringify(hearings, null, 2));

            console.log("\n--- ORDERS ---");
            const { data: orders } = await supabase.from('case_orders').select('*').eq('case_id', c.id);
            console.log(JSON.stringify(orders, null, 2));

            console.log("\n--- RAW FETCHED DATA KEYS ---");
            const fd = c.fetched_data || {};
            // If the fetched_data has a data wrapper, examine it
            const apiRes = fd.data ? fd.data : fd;
            console.log(Object.keys(apiRes));

        } else {
            console.log("Case not found in the 'cases' table. Did the fetch succeed in the UI?");
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

inspectCnr();
