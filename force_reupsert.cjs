const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function main() {
    const CASE_ID = '388c16a4-e9c2-429f-a4e1-ce1f4f67b40e';

    console.log('Fetching case data...');
    const { data: caseRow, error: caseErr } = await supabase
        .from('cases')
        .select('id, firm_id, fetched_data, case_number')
        .eq('id', CASE_ID)
        .single();

    if (caseErr || !caseRow) {
        console.error('Error fetching case:', caseErr);
        return;
    }

    console.log('Case:', caseRow.case_number);
    console.log('Has fetched_data:', !!caseRow.fetched_data);
    console.log('Firm ID:', caseRow.firm_id);

    console.log('\nInvoking upsert_from_json...');
    const { data, error } = await supabase.functions.invoke('legalkart-api', {
        body: {
            action: 'upsert_from_json',
            caseId: CASE_ID,
            firmId: caseRow.firm_id,
            rawData: caseRow.fetched_data,
        }
    });

    if (error) {
        console.error('Edge Function Error:', error);
        return;
    }

    console.log('Result:', JSON.stringify(data, null, 2));

    // Verify DB state
    const { data: orders } = await supabase.from('case_orders').select('order_date, judge, order_number, order_details').eq('case_id', CASE_ID).limit(5);
    console.log('\nOrders in DB after re-upsert:');
    orders?.forEach((o, i) => console.log(`  #${i + 1}:`, JSON.stringify(o)));

    const { data: hearings } = await supabase.from('case_hearings').select('hearing_date, judge, purpose_of_hearing, bench_type').eq('case_id', CASE_ID).limit(3);
    console.log('\nHearings in DB after re-upsert:');
    hearings?.forEach((h, i) => console.log(`  #${i + 1}:`, JSON.stringify(h)));
}

main().catch(console.error);
