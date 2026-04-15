const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const caseId = '7e290ac0-d2e3-43fa-99eb-96de3ee964e3'; // The ID we found earlier
    const payload = [
        {
            case_id: caseId,
            petitioner_name: 'Chandrakantbhai Hirabhai Machhar',
            advocate_name: 'DIPEN DESAI(2481)'
        }
    ];

    console.log("Trying to insert petitioner...");
    const { data, error } = await supabase.from('petitioners').insert(payload).select();
    
    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log("Insert success:", data);
    }
}

testInsert();
