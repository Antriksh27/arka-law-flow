const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCnr() {
    const targetCnr = 'GJHC240042732023';
    
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('fetched_data')
            .eq('cnr_number', targetCnr)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const fd = data[0].fetched_data || {};
            const apiRes = fd.data ? fd.data : fd;
            const cc = apiRes.courtCaseData || {};

            console.log("\n--- RAW eCOURTS DATA EXCERPTS ---");
            console.log("\nPetitioners:", cc.petitioners);
            console.log("Petitioner Advocates:", cc.petitionerAdvocates);
            console.log("Respondents:", cc.respondents);
            console.log("Respondent Advocates:", cc.respondentAdvocates);
            
            console.log("\nHearings:", JSON.stringify(cc.hearings || cc.hearingHistory || [], null, 2));
            console.log("\nInterim Orders:", JSON.stringify(cc.interimOrders || [], null, 2));
            console.log("\nJudgment Orders:", JSON.stringify(cc.judgmentOrders || [], null, 2));
            console.log("\nDocuments:", JSON.stringify(cc.documents || [], null, 2));
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

inspectCnr();
