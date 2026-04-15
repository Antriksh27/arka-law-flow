const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMapper() {
    const targetCnr = 'GJHC240042732023';
    
    try {
        const { data, error } = await supabase
            .from('cases')
            .select('fetched_data, id')
            .eq('cnr_number', targetCnr)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const apiResponse = data[0].fetched_data;
            const caseId = data[0].id;

            // Simulate extractPetitioners
            const cc = apiResponse?.data?.courtCaseData ?? {};
            const petitioners = cc.petitioners ?? [];
            const advocates = cc.petitionerAdvocates ?? [];

            const extractedPets = petitioners.map((name, idx) => ({
                case_id: caseId,
                petitioner_name: name,
                advocate_name: advocates[idx] ?? advocates[0] ?? null,
            })).filter(p => p.petitioner_name);

            console.log("\n--- EXTRACTED PETITIONERS ---");
            console.log(JSON.stringify(extractedPets, null, 2));

            // Simulate extractRespondents
            const respondents = cc.respondents ?? [];
            const resAdvocates = cc.respondentAdvocates ?? [];
            const extractedResps = respondents.map((name, idx) => ({
                case_id: caseId,
                respondent_name: name,
                advocate_name: resAdvocates[idx] ?? resAdvocates[0] ?? null,
            })).filter(r => r.respondent_name);

            console.log("\n--- EXTRACTED RESPONDENTS ---");
            console.log(JSON.stringify(extractedResps, null, 2));

            // Explain order array
            const orders = (cc.judgmentOrders || []).concat(cc.interimOrders || []);
            const extractedOrders = orders.map(o => ({
                case_id: caseId,
                judge: o.judge ?? (o.judges ?? []).join(', ') ?? null,
                hearing_date: o.hearingDate ?? o.date,
                order_date: o.orderDate ?? o.date,
                order_link: o.orderUrl ?? null,
            }));
            
            console.log("\n--- EXTRACTED ORDERS SAMPLE ---");
            console.log(JSON.stringify(extractedOrders.slice(0, 2), null, 2));

        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

testMapper();
