const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: valid Supabase URL and Key must be set (checked SUPABASE_URL/VITE_SUPABASE_URL).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchCaseData(caseId) {
    console.log(`Fetching data for case: ${caseId}`);

    const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, cnr_number, court_type, firm_id, status, filing_date, registration_date, case_title, petitioner, respondent, next_hearing_date, coram, stage, case_type')
        .eq('id', caseId)
        .single();

    if (error) {
        console.error('Error fetching case:', error);
        return;
    }

    console.log('Case Data:', JSON.stringify(data, null, 2));
}

// Case ID from user logs
const caseId = '22e249f9-0c9a-4efe-9cd4-5482a64a5e83';
fetchCaseData(caseId);
