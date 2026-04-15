const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const fs = require('fs');
const supabase = createClient(supabaseUrl, supabaseKey);

function log(msg) {
    const str = typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg);
    console.log(str);
    fs.appendFileSync('inspection_results.txt', str + '\n');
}

async function inspectLatestGHC() {
    if (fs.existsSync('inspection_results.txt')) fs.unlinkSync('inspection_results.txt');
    log('--- GHC DATA INSPECTION ---');
    const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, court_type, fetched_data, updated_at')
        .not('fetched_data', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        log('Error fetching data: ' + JSON.stringify(error, null, 2));
        return;
    }

    log('Case ID: ' + data.id);
    log('Case Number: ' + data.case_number);
    log('Court Type: ' + data.court_type);
    log('--- ROOT FETCHED DATA ---');
    log('success @ root: ' + data.fetched_data?.success);
    log('message @ root: ' + data.fetched_data?.message);
    log('status @ root: ' + data.fetched_data?.status);
    log('Root keys: ' + JSON.stringify(Object.keys(data.fetched_data || {})));

    // Handle nested "API Details" wrapper
    let rd = data.fetched_data?.['API Details'] ?? data.fetched_data?.data ?? data.fetched_data ?? {};
    if (Array.isArray(rd)) rd = rd[0] || {};

    log('Top Level Keys in rd: ' + JSON.stringify(Object.keys(rd)));

    const orders = rd['Available Orders'] || rd.order_details || rd.orders;
    if (orders) {
        log('Found Orders (' + orders.length + '):');
        log('Order #1 (Raw): ' + JSON.stringify(orders[0], null, 2));
        log('Order #2 (Raw): ' + JSON.stringify(orders[1], null, 2));
    } else {
        log('Orders NOT FOUND');
    }

    const hearings = rd['Court Proceedings'] || rd.history_of_case_hearing || rd.case_history || rd.hearings;
    if (hearings) {
        log('Found Hearings (' + hearings.length + '):');
        log('Hearing #1 (Raw): ' + JSON.stringify(hearings[0], null, 2));
    } else {
        console.log('Hearings NOT FOUND');
    }

    if (rd.case_info) {
        console.log('Case Info Sample:', JSON.stringify(rd.case_info, null, 2));
    }

    console.log('--- RELATIONAL DATA IN DB ---');
    const { data: hearingsDB, error: hError } = await supabase
        .from('case_hearings')
        .select('*')
        .eq('case_id', data.id);

    if (hError) console.error('Hearings DB Error:', hError);
    else {
        console.log(`Hearings in DB: ${hearingsDB.length}`);
        if (hearingsDB.length > 0) console.log('Sample Hearing from DB:', JSON.stringify(hearingsDB[0], null, 2));
    }

    const { data: ordersDB, error: oError } = await supabase
        .from('case_orders')
        .select('*')
        .eq('case_id', data.id);

    if (oError) console.error('Orders DB Error:', oError);
    else {
        console.log(`Orders in DB: ${ordersDB.length}`);
        if (ordersDB.length > 0) {
            console.log('Order #1 from DB:', JSON.stringify(ordersDB[0], null, 2));
            console.log('Order #2 from DB:', JSON.stringify(ordersDB[1], null, 2));
        }
    }
}

inspectLatestGHC();
