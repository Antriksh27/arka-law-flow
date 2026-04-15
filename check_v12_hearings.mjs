
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hpcnipcbymruvsnqrmjx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY25pcGNieW1ydXZzbnFybWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIzNTMsImV4cCI6MjA2MDgzODM1M30.d65xnv4f9JyaRlrBHaCPl_W4_EiQaYIs97Eph_MEJtY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHearings() {
    const caseId = 'bd648976-44f3-4616-8974-bd3d87c5121b';
    console.log(`Checking hearings for case ID: ${caseId}`);

    const { data, error } = await supabase
        .from('case_hearings')
        .select('*')
        .eq('case_id', caseId)
        .order('hearing_date', { ascending: false });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} hearings.`);
        data.forEach((h, i) => {
            console.log(`\n[${i + 1}] Date: ${h.hearing_date}, Judge: ${h.judge}, Business: ${h.business}, Result: ${h.result}`);
        });
    }
}

checkHearings();
