
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env or environment variables.');
    // process.exit(1); // Don't exit, try to continue if user has set them in shell
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchLatestCase() {
    console.log('Fetching latest updated case with fetched_data...');

    const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, cnr_number, court_type, fetched_data, updated_at')
        .not('fetched_data', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching case:', error);
        return;
    }

    console.log('Latest Case ID:', data.id);
    console.log('Case Number:', data.case_number);
    console.log('CNR Number:', data.cnr_number);
    console.log('JSON Data Structure Keys:', Object.keys(data.fetched_data || {}));
    console.log('Raw JSON Data:', JSON.stringify(data.fetched_data, null, 2));
}

fetchLatestCase();
