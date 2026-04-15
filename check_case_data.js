
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env file
try {
    const envPath = path.resolve(__dirname, '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value;
        }
    });
} catch (error) {
    console.error('Error reading .env file:', error);
}

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: valid SUPABASE_URL and SUPABASE_KEY must be set in .env');
    console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchCaseData(caseId) {
    console.log(`Fetching data for case: ${caseId}`);

    const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, cnr_number, court_type, firm_id')
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
